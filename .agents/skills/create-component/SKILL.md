---
name: create-component
description: Step-by-step guide to creating a new Code UI component (Theme definition in @code-ui/core, optional FSM machine in @code-ui/<name>, and MiniApp runtime component in @code-ui/components).
---

# Creating a Code UI Component

Follow this checklist whenever adding a new component `<name>` (e.g., `card`, `chip`, `pin-input`).

## Step 1: Decide if an FSM Machine is Needed

- **Presentational Component** (`card`, `chip`, `badge`, `avatar`, `skeleton`, `alert`):
  Skip Step 2 and go directly to **Step 3 (Theme Definition)**.
- **Interactive / Stateful Component** (`pin-input`, `button`, `drawer`, `switch`, `tabs`, `dialog`):
  Create or use a state machine package in `packages/machines/<name>` (`@code-ui/<name>`).

## Step 2: (Interactive Only) Create Machine in `packages/machines/<name>`

1. Create `src/<name>.anatomy.ts` using `createAnatomy("<name>").parts(...)`.
2. Create `src/<name>.types.ts` with `Props`, `Context`, `Event`, `State`, `Schema`, `Service`, and `Api`.
3. Create `src/<name>.props.ts` with `default<Name>Props`.
4. Create `src/<name>.dom.ts` with deterministic element ID helpers (`scope.ids?.<part> ?? ...`).
5. Create `src/<name>.machine.ts` using `createMachine<<Name>Schema>({ ... })`.
6. Create `src/<name>.connect.ts` exporting `connect<Name>(service): <Name>Api`.
   - **Important for WXML**: WeChat MiniProgram WXML cannot call methods like `api.getInputProps(index)` inside `wx:for`. Always pre-compute per-item `inputProps` / `itemProps` inside array items (e.g. `inputs: [{ index, value, inputProps, ... }]`) while keeping `getInputProps(index)` on the API for programmatic/test usage.
7. Export everything from `src/index.ts` and add the alias `"@code-ui/<name>": resolve(import.meta.dirname, "packages/machines/<name>/src")` to `vitest.config.mts`.

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
         root: "...",
       },
       variants: {
         color: createColorVariants(colors),
       },
       compoundVariants: [],
       defaultVariants: {},
     });
   }
   ```
2. Export `{ default as <camelName> } from "./<name>"` in `packages/core/src/theme/definitions/index.ts`.
3. Export `{ default as <camelName>Theme } from "./theme/definitions/<name>"` in `packages/core/src/index.ts`.
4. Add `<camelName>: "root" | ...` to `ComponentRegistry` in `packages/core/src/config.ts`.

## Step 4: Create Runtime Component in `packages/components`

1. Create `packages/components/src/runtime/<name>/index.json`:
   ```json
   {
     "component": true,
     "styleIsolation": "apply-shared",
     "usingComponents": {}
   }
   ```
2. Create `packages/components/src/runtime/<name>/index.wxml`:
   - Bind slot classes via `{{classes.<slot>}}`.
   - Use `<slot />` or named `<slot name="header" />` (with `"multipleSlots": true` in `options` if using named slots).
   - For multi-input components like `pin-input`, render a dedicated `<input>` per item in `wx:for` binding Zag.js-compatible `data-scope`, `data-part`, `data-index`, `data-state`, `data-focused`, `data-disabled`, `data-readonly`, `data-complete`, `id`, `value`, `focus`, `disabled`, `type`, `password`, `placeholder`, `maxlength`, `role`, and `aria-label`.
3. Create `packages/components/src/runtime/<name>/index.ts`:
   - Import `createComponentOptions, createProperties, computedBehavior` (and `createMachineBehavior` if stateful) from `"../_shared"`.
   - Import `resolveSlots` from `"../utils/ui"`, `tv` from `"../utils/variants"`, and `themeConfig` from `"virtual:cui/theme/<name>"`.
   - Compute `classes()` inside `computed: { classes() { ... return resolveSlots(themeFns, ui, this.data.class); } }`.
4. Register the component in:
   - `packages/components/src/types/virtual.d.ts` (`declare module "virtual:cui/theme/<name>"`)
   - `packages/components/src/app.json` (`"components": ["runtime/<name>/index", ...]`)
   - `packages/components/src/jsx.ts` (JSX types & `Cui IntrinsicElements` for `c-<name>` and `cui-<name>`)
   - `packages/components/src/index.ts`
   - `packages/components/package.json` (`exports["./<name>"]`)
