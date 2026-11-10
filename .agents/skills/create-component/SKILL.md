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
     import {
       createMachineBehavior,
       createProperties,
       getApi,
     } from "../_shared/machine";
     import { resolveSlots } from "../../utils/ui";
     import { tv } from "../../utils/variants";
     import themeConfig from "virtual:cui/theme/<name>";
     ```

3. **Tier 3: Domain Components with Relations / Form Integration** (`checkbox`, `radio`, `stepper`, `form`, `input`, etc.)
   - Same as Tier 2, but requires linking to ancestor/descendant components natively or integrating with form validation.
   - Import domain behavior plugins from dedicated subpaths in `@code-ui/miniapp/behaviors/<domain>`:
     ```ts
     import { withFormField } from "@code-ui/miniapp/behaviors/form";
     import {
       withStepper,
       withStepperItem,
     } from "@code-ui/miniapp/behaviors/stepper";
     ```
   - Pass these plugins into `createMachineBehavior({ plugins: [withFormField(), withStepperItem()] })` (do NOT pass to `createComponentOptions`).
   - **Rule**: Never import relation behaviors from the root `@code-ui/miniapp` entry. Subpath imports preserve separate chunking and keep domain logic out of `common.js`.

---

## Step 2: (Interactive Only) Create Machine in `packages/machines/<name>`

Follow `docs/fsm-machine-guide.md` for context/computed/state/ref ownership and the `watch` policy.

1. Create directory `packages/machines/<name>/src/`.
2. Create `src/<name>.anatomy.ts` using `createAnatomy("<name>").parts(...)`. Export it from `src/index.ts` for tooling/types, but **do not import `parts` into `*.connect.ts`**.
3. Create `src/<name>.types.ts` with `Props`, `Context`, `Event`, `State`, `Schema`, `Service`, and `Api`.
4. Create `src/<name>.props.ts` with `default<Name>Props`.
5. Create `src/<name>.dom.ts` using the shared ID generator from `@code-ui/context`:
   ```ts
   import { createIds, type Scope } from "@code-ui/context";

   export const dom = {
     ...createIds("sl", ["root", "track", "thumb"]), // use 2-3 char prefix
   };
   ```
   - Only emit IDs on parts that strictly require them (e.g. root for relations, inputs for labels/focus).
   - Skip IDs on decorative parts (icons, indicators, separators).
6. Create `src/<name>.machine.ts` using `createMachine<<Name>Schema>({ ... })`.
   - **Context Signals**: Only declare `propBindable` for props that machine transitions or guards read or mutate. Do NOT create mirror signals for pass-through props (`label`, `icon`, `description`, `ui`).
7. Create `src/<name>.connect.ts` exporting `connect<Name>(service): <Name>Api`:
   - **Zero Prop-Echoing (`setData` payload optimization)**:
     - Component properties registered via `createProperties(defaultProps)` already live in `this.data` and are natively accessible in WXML (`{{label}}`, `{{icon}}`, `{{title}}`).
     - Do NOT re-export pass-through props on the API object returned by `connect()`.
     - *Exception*: Context-inherited values that override child defaults (e.g. `effectiveSize`, `effectiveColor`, `disabled` from `<c-form>` or `<c-checkbox-group>`).
     - Return **only**:
       1. FSM state and derived/inherited values (`state`, `checked`, `disabled`, `loading`).
       2. Dynamic interactive arrays with pre-computed item properties (WeChat WXML cannot call JS functions in `wx:for`).
       3. Accessibility descriptors (`rootProps`, `thumbProps`).
       4. Imperative action methods (`toggle()`, `handleTap()`).
   - **Tree-Shaking Rule for Static Anatomy**:
     - Do NOT spread `...parts.<part>.attrs` in `*.connect.ts`.
     - Static `data-scope="<name>"` and `data-part="<part>"` must be declared as static literals in the WXML template.
   - **WeChat ARIA Compliance**:
     - Use `aria-role="..."` (e.g. `'aria-role': 'button'`), NEVER `role="..."`.
     - Do NOT emit or depend on `tabindex` (unsupported in WeChat).
     - Only use WeChat-supported `aria-*` attributes (`aria-disabled`, `aria-checked`, `aria-expanded`, `aria-busy`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`).
     - Move constant `aria-hidden="true"` into static WXML literals on decorative leaf nodes.
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
   - **Prune Dead Slots**: Only define slots that are actually bound in the component's WXML template. Never add unused slots (e.g. don't define `leadingIcon` or `trailingIcon` if WXML only binds `icon`).
   - **Compound Container Rule (Rule 7)**:
     - Parent container themes (`checkbox-group`, `radio-group`, `tabs`, `stepper`, `accordion`) MUST only define container slots (`root`, `fieldset`, `legend`).
     - Child item styling (`item`, `indicator`, `label`, `description`) MUST strictly belong to the child item component theme (`checkbox`, `radio`, `tabs-item`, `stepper-item`, `accordion-item`).
   - **Theme Size Optimization**: Avoid duplicating redundant text color or focus ring definitions across multiple variant states. Keep atomic utility class strings concise.
2. Export `{ default as <camelName> } from "./<name>"` in `packages/core/src/theme/definitions/index.ts`.
3. Export `{ default as <camelName>Theme } from "./theme/definitions/<name>"` in `packages/core/src/index.ts`.
   *(Slots are automatically extracted by `ComponentRegistry` from `defineTheme` via `ExtractSlots` — no manual slot registration needed in `packages/core/src/config.ts`).*

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
   _(This guarantees domain behaviors are split into `behaviors/<name>.js` and never leak into `common.js`)_.

---

## Step 5: Create Runtime Component in `packages/components`

1. Create `packages/components/src/runtime/<name>/index.json`:
   ```json
   {
     "component": true,
     "virtualHost": true,
     "usingComponents": {}
   }
   ```
   *(Note: `"styleIsolation": "apply-shared"` is automatically set in component options by `createComponentOptions` at runtime; omitting it from `index.json` saves dist bytes).*

2. Create `packages/components/src/runtime/<name>/index.wxml`:
   - **Static Literals**: Add static `data-scope="<name>"` and `data-part="<part>"` directly on elements.
   - **WeChat ARIA**: Use `aria-role="..."` (e.g. `aria-role="button"`), never `role="..."`.
   - **Slot Classes**: Bind slot classes using `{{classes.<slot>}}`.
   - **Pass-through Props**: Bind props directly (`{{label}}`, `{{icon}}`, `{{title}}`) instead of fallback expressions (`{{cBtn.label || label}}`).
   - **WeChat Slot Fallbacks**: WeChat `<slot>` does NOT support default fallback markup (e.g. `<slot name="label">fallback</slot>` will discard `fallback`). Always use conditional rendering:
     ```wxml
     <text wx:if="{{label}}">{{label}}</text>
     <slot wx:else name="label" />
     ```
   - **Compound Loops**: Never hardcode generic `<view>` in data loops. Containers must delegate item rendering to their respective child item components in both declarative (`<slot />`) and data-driven (`wx:for="{{items}}"`) modes.

3. Create `packages/components/src/runtime/<name>/index.ts`:

   > [!IMPORTANT]
   > **No `machine` field on `createComponentOptions`**: `createComponentOptions` wraps the native WeChat `Component({...})` options to add fine-grained signal-computed properties. It does **not** accept a `machine` property.
   > Instead, instantiate the machine behavior separately via `createMachineBehavior({ machine, connect, key, plugins, exportApi })` and add it to `behaviors: [<camelName>Behavior, computedBehavior]`.

   - **Tier 1: Presentational**:
     ```ts
     import { computedBehavior, createComponentOptions } from "../_shared/base";
     import { resolveSlots } from "../../utils/ui";
     import { tv } from "../../utils/variants";
     import themeConfig from "virtual:cui/theme/<name>";

     const <camelName>Theme = tv(themeConfig);

     Component(
       createComponentOptions({
         behaviors: [computedBehavior],
         properties: {
           className: { type: String, value: "" },
           ui: { type: Object, value: {} },
           // ... other component props
         },
         computed: {
           classes() {
             const themeFns = <camelName>Theme({
               color: this.data.color,
               size: this.data.size,
             });
             return resolveSlots(themeFns, this.data.ui, this.data.className);
           },
         },
       }),
     );
     ```

   - **Tier 2: Interactive (FSM Machine)**:
     ```ts
     import { computedBehavior, createComponentOptions } from "../_shared/base";
     import {
       createMachineBehavior,
       createProperties,
       getApi,
     } from "../_shared/machine";
     import {
       <camelName>Machine,
       connect<Name>,
       default<Name>Props,
     } from "@code-ui/<name>";
     import { resolveSlots } from "../../utils/ui";
     import { tv } from "../../utils/variants";
     import themeConfig from "virtual:cui/theme/<name>";

     const <camelName>Theme = tv(themeConfig);

     const <camelName>Behavior = createMachineBehavior({
       machine: <camelName>Machine,
       connect: connect<Name>,
       key: "<name>",
       exportApi: true,
     });

     Component(
       createComponentOptions({
         behaviors: [<camelName>Behavior, computedBehavior],
         properties: createProperties(default<Name>Props, {
           className: { type: String, value: "" },
         }),
         computed: {
           classes() {
             const api = this.data.<name>;
             const themeFns = <camelName>Theme({
               variant: this.data.variant,
               color: this.data.color,
               size: this.data.size,
               disabled: Boolean(api?.disabled ?? this.data.disabled),
             });
             return resolveSlots(themeFns, this.data.ui, this.data.className);
           },
         },
         methods: {
           handleTap(e: WechatMiniprogram.TouchEvent) {
             const api = getApi(this, "<name>");
             return api.handleTap?.(e);
           },
         },
       }),
     );
     ```

   - **Tier 3: Domain Components with Relations / Form Integration** (e.g. `checkbox`, `radio`, `stepper`):
     ```ts
     import { computedBehavior, createComponentOptions } from "../_shared/base";
     import {
       createMachineBehavior,
       createProperties,
       getApi,
     } from "../_shared/machine";
     import { withFormField } from "@code-ui/miniapp/behaviors/form";
     import { with<Domain>Item } from "@code-ui/miniapp/behaviors/<domain>";
     import {
       <camelName>Machine,
       connect<Name>,
       default<Name>Props,
     } from "@code-ui/<name>";
     import { resolveSlots } from "../../utils/ui";
     import { tv } from "../../utils/variants";
     import themeConfig from "virtual:cui/theme/<name>";

     const <camelName>Theme = tv(themeConfig);

     // Relations & form-field behaviors are passed into createMachineBehavior's plugins array:
     const <camelName>Behavior = createMachineBehavior({
       machine: <camelName>Machine,
       connect: connect<Name>,
       key: "<name>", // e.g. "cCheckbox", "cRadio", "<name>"
       plugins: [withFormField(), with<Domain>Item()],
       exportApi: true,
     });

     Component(
       createComponentOptions({
         behaviors: [<camelName>Behavior, computedBehavior],
         properties: createProperties(default<Name>Props, {
           className: { type: String, value: "" },
         }),
         computed: {
           classes() {
             const api = this.data.<name>;
             const themeFns = <camelName>Theme({
               variant: api?.variant ?? this.data.variant,
               color: api?.color ?? this.data.color,
               size: api?.size ?? this.data.size,
               disabled: Boolean(api?.disabled ?? this.data.disabled),
               // additional states like checked, indeterminate, invalid
             });
             return resolveSlots(themeFns, this.data.ui, this.data.className);
           },
         },
         methods: {
           handleTap(e: WechatMiniprogram.CustomEvent) {
             const api = getApi(this, "<name>");
             return api.handleTap?.(e);
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
# 1. Build all packages
pnpm build

# 2. Run all unit and integration tests (must pass with 0 failures)
pnpm test

# 3. Typecheck entire monorepo (exactOptionalPropertyTypes: true)
pnpm typecheck

# 4. Check bundle size budgets (reference <= 68.0 KB gz, full dist <= 145.0 KB gz)
pnpm size:check

# 5. Lint touched packages (forbids non-null assertions and inline type imports)
npx oxlint packages/<name>/src packages/components/src
```
