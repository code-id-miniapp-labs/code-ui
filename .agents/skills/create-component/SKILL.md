---
name: create-component
description: Step-by-step guide to creating a new Code UI component (Theme definition in @code-ui/core, optional FSM machine in @code-ui/<name>, and MiniApp runtime component in @code-ui/components with two-tier runtime chunking).
---

# Creating a Code UI Component

Follow this checklist whenever adding a new component `<name>` (e.g., `card`, `chip`, `button`, `stepper`).

---

## Step 1: Decide Component Category & Architecture Tier

`@code-ui` uses a **three-tier runtime architecture** to ensure optimal bundle size and zero runtime bloat in `common.js`:

1. **Tier 1: Presentational / Container** (`card`, `chip`, `badge`, `avatar`, `divider`, `skeleton`, `icon`, `kbd`, `alert`)
   - **No FSM machine needed.**
   - Skip Step 2 and go directly to **Step 3 (Theme Definition)**.
   - In Step 5, import runtime helpers **strictly from `../_shared/base`**:
     ```ts
     import { computedBehavior, createComponentOptions } from "../_shared/base";
     import { resolveSlots } from "../../utils/ui";
     import { tv } from "../../utils/variants";
     import themeConfig from "virtual:cui/theme/<name>";
     ```
   - **Rule**: Never import `../_shared/machine` or `@code-ui/miniapp/behavior` in presentational components.

2. **Tier 2: Interactive / Stateful** (`button`, `drawer`, `pin-input`, `qr-code`, `switch`, `dialog`)
   - Uses an FSM machine in `packages/machines/<name>` (`@code-ui/<name>`).
   - Proceed through **Step 2** to build the machine.
   - In Step 5, import from `../_shared/base` and `../_shared/machine`:
     ```ts
     import { computedBehavior, createComponentOptions } from "../_shared/base";
     import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
     import { resolveSlots } from "../../utils/ui";
     import { tv } from "../../utils/variants";
     import themeConfig from "virtual:cui/theme/<name>";
     ```

3. **Tier 3: Domain Components with Relations / Form Integration** (`checkbox`, `radio`, `stepper`, `form`, `input`, etc.)
   - Same as Tier 2, but requires linking to ancestor/descendant components natively or integrating with form validation.
   - Import domain behavior plugins from dedicated subpaths in `@code-ui/miniapp/behaviors/<domain>`:
     ```ts
     import { withFormField } from "@code-ui/miniapp/behaviors/form";
     import { withStepper, withStepperItem } from "@code-ui/miniapp/behaviors/stepper";
     ```
   - **Rule**: Never import relation behaviors from the root `@code-ui/miniapp` entry. Subpath imports preserve separate chunking and keep domain logic out of `common.js`.

---

## Step 2: (Interactive Only) Create Machine in `packages/machines/<name>`

1. Create directory `packages/machines/<name>/src/`.
2. Create `src/<name>.anatomy.ts` using `createAnatomy("<name>").parts(...)`.
3. Create `src/<name>.types.ts` with `Props`, `Context`, `Event`, `State`, `Schema`, `Service`, and `Api`.
4. Create `src/<name>.props.ts` with `default<Name>Props`.
5. Create `src/<name>.dom.ts` with deterministic element ID helpers (`scope.ids?.<part> ?? ...`).
6. Create `src/<name>.machine.ts` using `createMachine<<Name>Schema>({ ... })`.
7. Create `src/<name>.connect.ts` exporting `connect<Name>(service): <Name>Api`.
   - **Important for WXML**: WeChat MiniProgram WXML cannot evaluate JavaScript method calls like `api.getInputProps(index)` inside `wx:for`. Always pre-compute per-item props in array items on the API snapshot (e.g. `items: [{ index, value, itemProps, ... }]`) while retaining method forms for programmatic/test usage.
8. Export everything from `src/index.ts`.
9. Register path alias in `vitest.config.mts`:
   ```ts
   "@code-ui/<name>": resolve(import.meta.dirname, "packages/machines/<name>/src")
   ```
10. Add unit tests in `packages/machines/<name>/tests/<name>.test.ts`.

---

## Step 3: Create Nuxt UI v4 Theme Definition in `packages/core`

1. Create `packages/core/src/theme/definitions/<name>.ts`:
   ```ts
   import {
     DEFAULT_THEME_COLORS,
     createColorVariants,
     defineTheme,
     type ThemeOptions,
   } from "../../theme";

   export default function <camelName>Theme(options: ThemeOptions = {}) {
     const colors = options.colors ?? DEFAULT_THEME_COLORS;
     return defineTheme({
       slots: {
         root: "relative inline-flex items-center justify-center ...",
       },
       variants: {
         color: createColorVariants(colors),
         size: {
           sm: { root: "text-xs ..." },
           md: { root: "text-sm ..." },
           lg: { root: "text-base ..." },
         },
       },
       compoundVariants: [],
       defaultVariants: {
         color: "primary",
         size: "md",
       },
     });
   }
   ```
   - **Theme Size Optimization**: Avoid duplicating redundant text color or focus ring definitions across multiple variant states. Keep atomic utility class strings concise.
2. Export `{ default as <camelName> } from "./<name>"` in `packages/core/src/theme/definitions/index.ts`.
3. Export `{ default as <camelName>Theme } from "./theme/definitions/<name>"` in `packages/core/src/index.ts`.
4. Add `<camelName>: "root" | ...` to `ComponentRegistry` in `packages/core/src/config.ts`.

---

## Step 4: (Domain Relations Only) Register New Relation Behavior

If your component introduces a new native WeChat parent-child relation (e.g. `accordion`, `tabs`, `menu`):

1. Implement the behavior in `packages/frameworks/miniapp/src/behaviors/<name>.ts`:
   - Keep it self-contained: avoid importing internal cross-behavior shared WeakMaps.
   - Use `typeof Behavior !== "undefined" ? Behavior({ ... }) : {}` for native relation linkage.
2. Register the subpath entry in `packages/frameworks/miniapp/tsdown.config.ts`:
   ```ts
   entry: [ ..., "src/behaviors/<name>.ts" ]
   ```
3. Declare the subpath export in `packages/frameworks/miniapp/package.json`:
   ```json
   "./behaviors/<name>": {
     "types": "./dist/behaviors/<name>.d.ts",
     "import": "./dist/behaviors/<name>.js",
     "require": "./dist/behaviors/<name>.cjs"
   }
   ```
4. Add dedicated Rolldown code-splitting group in `packages/components/weapp-vite.config.ts`:
   ```ts
   {
     name: "behaviors/<name>",
     test: /[\\/]behaviors[\\/]<name>/,
   }
   ```
   *(This guarantees domain behaviors are split into `behaviors/<name>.js` and never leak into `common.js`)*.

---

## Step 5: Create Runtime Component in `packages/components`

1. Create `packages/components/src/runtime/<name>/index.json`:
   ```json
   {
     "component": true,
     "styleIsolation": "apply-shared",
     "virtualHost": true,
     "usingComponents": {}
   }
   ```

2. Create `packages/components/src/runtime/<name>/index.wxml`:
   - Bind slot classes using `{{classes.<slot>}}`.
   - Provide default `<slot />` or named slots `<slot name="..." />` (`"multipleSlots": true` in component options if using named slots).
   - If interactive, bind `data-scope`, `data-part`, `data-state`, `data-disabled`, `bindtap="handleTap"`, etc., mirroring Zag.js anatomy.

3. Create `packages/components/src/runtime/<name>/index.ts`:
   - **Presentational**:
     ```ts
     import { computedBehavior, createComponentOptions } from "../_shared/base";
     import { resolveSlots } from "../../utils/ui";
     import { tv } from "../../utils/variants";
     import themeConfig from "virtual:cui/theme/<name>";

     const <camelName>Theme = tv(themeConfig);

     Component(
       createComponentOptions({
         options: {
           styleIsolation: "apply-shared",
           virtualHost: true,
         },
         behaviors: [computedBehavior],
         properties: {
           class: { type: String, value: "" },
           ui: { type: Object, value: {} },
           // ... props
         },
         computed: {
           classes() {
             return resolveSlots(
               <camelName>Theme({
                 color: this.data.color,
                 size: this.data.size,
               }),
               this.data.ui,
               this.data.class,
             );
           },
         },
       }),
     );
     ```
   - **Interactive (FSM Machine)**:
     ```ts
     import { computedBehavior, createComponentOptions } from "../_shared/base";
     import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
     import { <name>Anatomy } from "@code-ui/<name>";
     import { resolveSlots } from "../../utils/ui";
     import { tv } from "../../utils/variants";
     import themeConfig from "virtual:cui/theme/<name>";

     const <camelName>Theme = tv(themeConfig);

     Component(
       createComponentOptions({
         options: {
           styleIsolation: "apply-shared",
           virtualHost: true,
         },
         behaviors: [computedBehavior],
         properties: {
           class: { type: String, value: "" },
           ui: { type: Object, value: {} },
           ...createProperties(<name>Anatomy),
         },
         machine: createMachineBehavior({
           name: "<name>",
           machine: <camelName>Machine,
           connect: connect<Name>,
           // plugins: [withFormField] // if form-integrated
         }),
         computed: {
           classes() {
             const api = getApi(this, "<name>");
             return resolveSlots(
               <camelName>Theme({
                 color: this.data.color,
                 size: this.data.size,
               }),
               this.data.ui,
               this.data.class,
             );
           },
         },
       }),
     );
     ```

4. Register the component across the library:
   - `packages/components/src/types/virtual.d.ts` (`declare module "virtual:cui/theme/<name>"`).
   - `packages/components/src/app.json` (add `"runtime/<name>/index"` to `"components"`).
   - `packages/components/src/jsx.ts` (declare `c-<name>` and `cui-<name>` in `CuiIntrinsicElements`).
   - `packages/components/src/index.ts` (export runtime path / types).
   - `packages/components/package.json` (add `"./<name>"` and `"./<name>/*"` subpath exports).

---

## Step 6: Verification & Quality Assurance

Run the standard validation suite to ensure full monorepo compliance:

```bash
# 1. Build miniapp and components
pnpm --filter @code-ui/miniapp build
pnpm --filter @code-ui/components build

# 2. Run unit tests
pnpm test

# 3. Typecheck entire monorepo (exactOptionalPropertyTypes: true)
pnpm typecheck

# 4. Lint (forbids non-null assertions and inline type imports)
npx oxlint packages/<name>/src packages/components/src
```
