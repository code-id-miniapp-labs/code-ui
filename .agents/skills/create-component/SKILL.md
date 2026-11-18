---
name: create-component
description: Step-by-step guide to creating a new Code UI component (Theme definition in @code-ui/core, optional FSM machine in @code-ui/<name>, compile-time slot manifest in @code-ui/compiler, and MiniApp runtime component in @code-ui/components with three-tier runtime chunking and active slot detection).
---

# Creating a Code UI Component

Follow this checklist whenever adding or updating a component `<name>` (e.g., `card`, `chip`, `button`, `stepper`).

---

## Step 0: Write or Update `<name>.spec.md` (Spec-Driven Development)

Before implementing or modifying a component, create or update its spec at `packages/components/src/runtime/<name>/<name>.spec.md`. This file is the single source of truth for agents and for generating live documentation in `docs/`.

Keep the spec focused on the **public contract** (avoid internal FSM state names or implementation details):
- **Overview & Tier**: Component purpose, architecture tier (Presentational / Interactive / Domain), and related child/parent components (if compound).
- **Props**: Name, type, default value, and description (including `ui` and `class`).
- **Slots**: Named slots and default slot behavior (note any MiniProgram static `<slot>` constraints or conditional fallbacks).
- **Events**: `bind:*` events and their `detail` payloads.
- **Theme**: Available `slots`, `variants`, and `defaultVariants` from `packages/core/src/theme/definitions/<name>.ts`.
- **Examples**: Minimal WXML + TS usage snippets.

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

Follow `agent/.skilss/fsm-machine-guide.md` for context/computed/state/ref ownership and the `watch` policy.

1. Create directory `packages/machines/<name>/src/`.
2. Create `src/<name>.anatomy.ts` using `createAnatomy("<name>").parts(...)`. Export it from `src/index.ts` for tooling/types, but **do not import `parts` into `*.connect.ts`**.
3. Create `src/<name>.types.ts` with `Props`, `Context`, `Event`, `State`, `Schema`, `Service`, and `Api` (and keep visual type aliases such as `<Name>Color`, `<Name>Variant`, `<Name>Size`, `<Name>UI` exported for runtime and JSX consumers).
   - **`<Name>Props` & `<Name>Api` boundary**: Do NOT include pure visual, theme, display, or native pass-through props (`variant`, `color`, `size`, `block`, `highlight`, `title`, `description`, `label`, `icon`, `ui`, etc.) on `<Name>Props`, `<Name>ResolvedProps`, or `<Name>Api`, and do NOT declare unused `data-variant`, `data-color`, or `data-size` attributes on `rootProps`.
4. Create `src/<name>.props.ts` with `default<Name>Props`.
   - Include ONLY behavioral/state prop defaults needed by the machine (`value`, `defaultValue`, `open`, `defaultOpen`, `disabled`, `readOnly`, `required`, `name`, `form`, `rules`, callbacks, or narrow geometry/SVG props such as `orientation` in `slider` or `color` SVG fill in `qr-code`). Register all visual, display, and native pass-through props directly in runtime `createProperties(default<Name>Props, { ... })`.
   - **No manual boolean slot flags**: Do NOT define manual slot visibility props such as `showHeader`, `showFooter`, `customIndicator`, `hasLeadingSlot`, `leading`, or `trailing` in machine props or component properties. Active slot presence is declared on the MiniApp component (`slots: { ... }`) and populated automatically at compile time by `@code-ui/compiler` / `@code-ui/plugin-vite`.
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
   - **Context Signals**: Only declare `propBindable` for props that machine transitions or guards read or mutate. Do NOT create mirror signals for pass-through or visual/theme props (`variant`, `color`, `size`, `block`, `highlight`, `label`, `icon`, `description`, `ui`).
7. Create `src/<name>.connect.ts` exporting `connect<Name>(service): <Name>Api`:
   - **Zero Visual/Pass-Through Prop-Echoing (`setData` payload optimization & `connect()` boundary)**:
     - Component properties registered via runtime `createProperties(defaultProps, { ... })` already live in `this.data` and are consumed directly in WXML, runtime `classes()`, and runtime `computed` formatters (`resolvedBadge`, `resolvedActions`, `resolvedItems`).
     - Parent-to-child visual inheritance (`fieldSize`, `groupSize`, `groupColor`, `groupVariant`, etc.) happens directly on `this.data` inside `@code-ui/miniapp/behaviors/<domain>`, NEVER via machine `effective*` computed values or `api?.size ?? this.data.size` fallbacks.
     - Do **NOT** include `variant`, `color`, `size`, `highlight`, `block`, `mode`, `title`, `description`, `label`, `icon`, `ui`, or visual formatting of `badge`/`actions`/`items` on `<Name>Props` or `<Name>Api`, and do **NOT** emit unused `data-variant`, `data-color`, or `data-size` attributes inside `rootProps`.
     - _Narrow exceptions (machine-internal only when genuinely required)_:
       1. **Geometry / SVG / cell-driving props** read internally to compute derived styles, SVG `dataUrl`, or cell slots (`orientation` / `inverted` in `slider`, `color` SVG fill in `qr-code`, `placeholder` / `mask` / `separator` in `pin-input`) — return the computed output (`trackStyle`, `dataUrl`, `cells`), not raw theme props.
       2. **Behavior-driving placement/mode** that governs FSM swipe direction or transition tags (`placement` in `drawer`).
     - Return **only**:
       1. FSM state and behavioral values (`state`, `open`, `checked`, `disabled`, `readOnly`, `invalid`, `loading`, `loadingActionIndex`).
       2. Minimal behavioral `wx:for` arrays (`items`, `cells`) containing interactive state and accessibility attrs — format visual props (`color`, `variant`, badges, labels, action buttons) in runtime `computed` (`resolvedItems`, `resolvedActions`, `resolvedBadge`).
       3. Accessibility and DOM descriptors (`rootProps`, `thumbProps`, `getItemProps`) without unused `data-*` visual echoes.
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

1. Create `packages/core/src/theme/definitions/<name>.ts` following the Nuxt UI v4 standalone pattern (`DEFAULT_THEME_COLORS` contains the 6 semantic colors; `neutral` is defined directly without `hasNeutral` conditionals):
   ```ts
   import {
     DEFAULT_THEME_COLORS,
     defineTheme,
     type ThemeOptions,
   } from "../../theme";

   export default function <camelName>Theme(options: ThemeOptions = {}) {
     const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

     return defineTheme({
       slots: {
         root: "relative inline-flex items-center justify-center ...",
       },
       variants: {
         color: Object.assign(
           Object.fromEntries(colors.map((color) => [color, {}])),
           { neutral: {} },
         ),
         size: {
           sm: { root: "text-xs ..." },
           md: { root: "text-sm ..." },
           lg: { root: "text-base ..." },
         },
       },
       compoundVariants: [
         ...colors.map((color) => ({
           color,
           class: { root: `text-${color}` },
         })),
         {
           color: "neutral" as const,
           class: { root: "text-highlighted" },
         },
       ],
       defaultVariants: {
         color: "primary",
         size: "md",
       },
     });
   }
   ```
   - **Prune Dead Slots**: Only define slots that are actually bound in the component's WXML template. Never add unused slots (e.g. don't define `leadingIcon` or `trailingIcon` if WXML only binds `icon`).
   - **Compound Container Rule**:
     - Parent container themes (`checkbox-group`, `radio-group`, `tabs`, `stepper`, `accordion`) MUST only define container slots (`root`, `fieldset`, `legend`).
     - Child item styling (`item`, `indicator`, `label`, `description`) MUST strictly belong to the child item component theme (`checkbox`, `radio`, `tabs-item`, `stepper-item`, `accordion-item`).
   - **Theme Size Optimization**: Avoid duplicating redundant text color or focus ring definitions across multiple variant states. Keep atomic utility class strings concise.
   - **Light/Dark Contrast**: Avoid ad-hoc `dark:` classes that assume dark page backgrounds unless the container itself is explicitly dark. Keep neutral tokens readable in both light and dark modes.
2. Export `{ default as <camelName> } from "./<name>"` in `packages/core/src/theme/definitions/index.ts`.
3. Export `{ default as <camelName>Theme } from "./theme/definitions/<name>"` in `packages/core/src/index.ts`.
   _(Slots are automatically extracted by `ComponentRegistry` from `defineTheme` via `ExtractSlots` — no manual slot registration needed in `packages/core/src/config.ts`)._

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

### 5.1 Create `packages/components/src/runtime/<name>/index.json`

```json
{
  "component": true,
  "virtualHost": true,
  "usingComponents": {}
}
```

_(Note: `options: { multipleSlots: true, styleIsolation: "apply-shared", virtualHost: true }` is automatically merged by `createComponentOptions` at runtime; omitting `"styleIsolation"` from `index.json` saves dist bytes. Add internal `<c-*>` dependencies under `"usingComponents"` when needed, e.g. `"c-icon": "../icon/index"`.)_

### 5.2 Declare `slots` & Register in `@code-ui/compiler`

Whenever the component exposes ANY `<slot />` or `<slot name="..." />`:

1. **Declare `slots` in `createComponentOptions({ slots: { ... } })`** in `index.ts`:
   - List every slot (including `default: false` if the component accepts an unnamed `<slot />`) initialized to `false`:
     ```ts
     slots: {
       default: false,
       leading: false,
       trailing: false,
       loadingIcon: false,
     },
     ```
   - `createComponentOptions` automatically injects `properties.slots`, installs `"slots.**"` observer + `created`/`attached` normalization via `normalizeComponentSlots()`, and makes `this.data.slots.<key>` reactive inside `computed` getters (such as `classes()` and `hasContent()`).
   - **CRITICAL — CamelCase keys for multi-word slots**: Always use **camelCase** keys inside `slots: { ... }`, WXML guards (`slots.loadingIcon`, `slots.completedIndicator`, `slots.listTrailing`, `slots.valueText`), JS `this.data.slots.<key>`, and `COMPONENT_SLOTS_MANIFEST`.
     - _Why_: WeChat MiniProgram's `wcc` compiler throws a runtime `TypeError: Cannot read properties of undefined (reading '0') at rev` if a WXML object literal contains quoted keys (e.g. `slots="{{ { 'completed-indicator': true } }}"`). Therefore `@code-ui/compiler` always converts kebab-case user slot attributes (`slot="completed-indicator"`) into unquoted camelCase keys (`{ completedIndicator: true }`), and `normalizeComponentSlots()` ensures camelCase keys are populated on `this.data.slots`.
     - For new components, prefer camelCase `<slot name="loadingIcon" />` consistently; if exposing a kebab-case `<slot name="completed-indicator" />`, still read `slots.completedIndicator` in WXML/JS.

2. **Register slots in `COMPONENT_SLOTS_MANIFEST`** (`packages/compiler/src/index.ts`):
   - Add `"<name>": [...]` with all valid **camelCase** slot keys (including `"default"` if supported).
   - _Why_: When callers pass dynamic slot names (`<view slot="{{slotVar}}">`) onto `<c-<name>>`, `@code-ui/compiler` uses `COMPONENT_SLOTS_MANIFEST["<name>"]` to enumerate candidate slots; unregistered tags fall back to `["default"]` only.

3. **Zero manual slot flags**: Never add boolean props like `showHeader`, `hasLeading`, or `customIndicator` to toggle slots. `@code-ui/plugin-vite` (`slotDetect`, enabled by default) statically analyzes caller WXML templates (including `wx:if`/`wx:elif`/`wx:else`, `<block>`, `wx:for`, dynamic `slot="{{...}}"`, and WXS loop predicates) and injects `slots="{{ { ... } }}"` onto `<c-<name>>` tags at build time.

### 5.3 Create `packages/components/src/runtime/<name>/index.wxml`

- **Thin Adapter Rule**: Never rely on DOM measurements or imperative slot probing; render strictly from props, machine API (`this.data.<name>`), `computed` fields, `classes`, and `slots`.
- **Static Literals**: Add static `data-scope="<name>"` and `data-part="<part>"` directly on elements.
- **WeChat ARIA**: Use `aria-role="..."` (e.g. `aria-role="button"`), NEVER `role="..."`, NEVER `tabindex`, and ONLY documented WeChat `aria-*` attributes (enforced by `packages/components/tests/wxml-aria.test.ts`).
- **Slot Classes**: Bind theme classes using `{{classes.<part>}}`.
- **Pass-through Props**: Bind props directly (`{{label}}`, `{{icon}}`, `{{title}}`) instead of fallback expressions (`{{cBtn.label || label}}`).
- **WeChat Slot Fallbacks**: WeChat `<slot>` does NOT support default fallback markup inside `<slot>` (e.g. `<slot name="label">fallback</slot>` discards `fallback`). Always use conditional rendering:
  ```wxml
  <text wx:if="{{label}}">{{label}}</text>
  <slot wx:else name="label" />
  ```
- **Conditional Slot Wrappers & Overridable Built-in Parts**:
  - Gate optional wrapper views on `slots.<name>` (combined with props when applicable) so unused wrappers are not mounted:
    ```wxml
    <view wx:if="{{slots.header || title || description}}" class="{{classes.header}}" data-scope="<name>" data-part="header">
      <slot name="header" />
      <text wx:if="{{title}}" class="{{classes.title}}">{{title}}</text>
    </view>
    ```
  - Make **every** built-in icon, indicator, or visual part overridable by a slot:
    ```wxml
    <slot wx:if="{{slots.loadingIcon}}" name="loadingIcon" />
    <c-icon wx:else name="{{loadingIcon}}" className="{{classes.icon}}" />
    ```
- **Internal Slot Forwarding**: When a container component forwards caller slots into an inner `<c-*>` child component (e.g. `<c-tabs-item><slot name="leading-{{item.value}}" slot="leading" /></c-tabs-item>`), consumer apps running `@code-ui/plugin-vite` / `@code-ui/compiler` compile `<c-*>` slot usage into `slots` metadata (`slots && slots[...]`), while `@code-ui/components` keeps `virtual:cui/theme/*` external during library builds (`cui:external-virtual`) so consumers resolve themes from their `cui.config.ts`.
- **Compound Loops**: Never hardcode generic `<view>` in data loops. Containers (`c-tabs`, `c-stepper`, `c-accordion`, `c-checkbox-group`, `c-radio-group`) MUST delegate item rendering to their child item component (`c-<name>-item`) in both declarative (`<slot />`) and data-driven (`wx:for="{{items}}"`) modes.

### 5.4 Create `packages/components/src/runtime/<name>/index.ts`

> [!IMPORTANT]
> **No `machine` field on `createComponentOptions`**: `createComponentOptions` wraps the native WeChat `Component({...})` options to add signal-computed properties and slot normalization. It does **not** accept a `machine` property.
> Instantiate the machine behavior separately via `createMachineBehavior({ machine, connect, key, plugins, exportApi })` and add it to `behaviors: [<camelName>Behavior, computedBehavior]`.

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

      // Declare every slot supported by index.wxml (omit if component has no <slot>)
      slots: {
        default: false,
        header: false,
        footer: false,
      },

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
            // Read this.data.slots.<key> here if any theme variant depends on slot presence
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

      // Declare every slot supported by index.wxml (use camelCase keys)
      slots: {
        default: false,
        leading: false,
        trailing: false,
        loadingIcon: false,
      },

      properties: createProperties(default<Name>Props, {
        // Pure visual/display/pass-through props belong here (never in default<Name>Props):
        variant: { type: String, value: "solid" },
        color: { type: String, value: "primary" },
        size: { type: String, value: "md" },
        ui: { type: Object, value: {} },
        className: { type: String, value: "" },
      }),

      computed: {
        classes() {
          const api = this.data.<name>;
          const themeFns = <camelName>Theme({
            // Read visual props directly from `this.data` (never from `api`)
            variant: this.data.variant,
            color: this.data.color,
            size: this.data.size,
            disabled: Boolean(api?.disabled ?? this.data.disabled),
            // Example when variant tracks active slots:
            // leading: Boolean(this.data.slots.leading || this.data.leadingIcon),
          });
          return resolveSlots(themeFns, this.data.ui, this.data.className);
        },
        // When WXML renders formatted visual arrays/badges (e.g. `resolvedActions`, `resolvedBadge`),
        // format `this.data.*` + minimal machine state (e.g. `api?.loadingActionIndex`) here instead of in `connect()`.
      },

      methods: {
        handleTap(e: WechatMiniprogram.TouchEvent) {
          // Unwrap MiniApp events in runtime; machine connect() takes pure domain values/details
          return getApi(this, "<name>")?.handleTap?.(e?.detail);
        },
      },
    }),
  );
  ```

- **Tier 3: Domain Components with Relations / Form Integration** (`checkbox`, `radio`, `stepper`, `input`, etc.):
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
    type <Name>Color,
    type <Name>Size,
    type <Name>Variant,
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

      slots: {
        default: false,
        indicator: false,
        label: false,
        description: false,
      },

      properties: createProperties(default<Name>Props, {
        // Leave visual defaults empty when inheriting from group/form behaviors; fallback in classes():
        color: { type: String, value: "" },
        size: { type: String, value: "" },
        variant: { type: String, value: "" },
        ui: { type: Object, value: {} },
        className: { type: String, value: "" },
      }),

      computed: {
        classes() {
          const api = this.data.<name>;
          const themeFns = <camelName>Theme({
            // 1. Compound group child items (`checkbox`, `radio`, `tabs-item`, `stepper-item`, `accordion-item`):
            //    Visual inheritance is patched onto `this.data` by `@code-ui/miniapp/behaviors/<domain>`
            //    (`groupVariant`, `groupColor`, `groupSize`, `fieldSize`), never via `api?.<visual>`.
            variant: (this.data.variant ||
              this.data.groupVariant ||
              "outline") as <Name>Variant,
            color: (this.data.color ||
              this.data.groupColor ||
              "primary") as <Name>Color,
            size: (this.data.size ||
              this.data.groupSize ||
              this.data.fieldSize ||
              "md") as <Name>Size,
            disabled: Boolean(api?.disabled ?? this.data.disabled),
            invalid: Boolean(api?.invalid ?? this.data.invalid),

            // 2. Form-integrated standalone controls (`input`, `textarea`, `pin-input`, `slider`, `switch`):
            //    `fieldSize` comes from `<c-form-field>` wrapper's behavior on `this.data`, while
            //    behavioral flags (`disabled`, `invalid`, `checked`) come from `api`:
            //    variant: this.data.variant,
            //    color: this.data.color,
            //    size: (this.data.size || this.data.fieldSize || "md") as <Name>Size,
          });
          return resolveSlots(themeFns, this.data.ui, this.data.className);
        },
      },

      methods: {
        handleTap() {
          // Unwrap MiniApp events in runtime before calling machine API handlers
          return getApi(this, "<name>")?.handleTap?.();
        },
      },
    }),
  );
  ```

### 5.5 Register the Component Across the Library

- `packages/compiler/src/index.ts`: add `"<name>": [...]` (camelCase slot names) to `COMPONENT_SLOTS_MANIFEST` if the component has slots.
- `packages/components/src/types/virtual.d.ts`: add `declare module "virtual:cui/theme/<name>"`.
- `packages/components/src/app.json`: add `"cui-<name>": "runtime/<name>/index"` under `"usingComponents"`.
- `packages/components/src/jsx.ts`: declare `export interface Cui<Name>ElementProps extends CuiCommonElementProps` (already includes `slots?: Record<string, boolean>` — do NOT add legacy slot boolean flags here, and import `<Name>Color` / `<Name>Variant` / `<Name>Size` / `<Name>UI` directly from `@code-ui/<name>` rather than indexing `*Props[...]`).
- `packages/components/src/index.ts`: re-export `export * from "@code-ui/<name>"` (for interactive/machine components).
- `packages/components/package.json`: add `"./<name>"` and `"./<name>/*"` subpath exports pointing to `./dist/runtime/<name>/index.*`.

---

## Step 6: Verification & Quality Assurance

Run the standard validation suite to ensure full monorepo compliance:

```bash
# 1. Build all packages (including @code-ui/compiler and @code-ui/components)
pnpm build

# 2. Run all unit and integration tests (includes slot-detect, wxml-aria, setdata-payload)
pnpm test

# 3. Typecheck entire monorepo (exactOptionalPropertyTypes: true)
pnpm typecheck

# 4. Check bundle size budgets (reference <= 68.0 KB gz, full dist <= 145.0 KB gz)
pnpm size:check

# 5. Lint touched packages (forbids non-null assertions and inline type imports)
npx oxlint packages/<name>/src packages/components/src packages/compiler/src
```
