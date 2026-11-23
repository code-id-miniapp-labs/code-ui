# @code-id-labs/miniapp

## 0.0.3

### Patch Changes

- Updated dependencies [97e4768]
  - @code-id-labs/core@0.0.2

## 0.0.2

### Patch Changes

- 40b53f0: Move global `cui.config.ts` component theme overrides to build time and eliminate initial default-prop FOUC:

  - `@code-id-labs/miniapp`: Skip definition-time `evaluateInitialComputed()` in `computedBehavior` for components that declare `properties`, preventing default-prop class FOUC (e.g. `<c-button color="neutral" variant="ghost">` flashing solid `bg-primary` with `transition-colors` before `attached()` flushes real props) and avoiding wasted `tv()` evaluations at startup.
  - `@code-id-labs/compiler`: Add `format: "esm" | "cjs"` option to `serializeCompactThemeModule()`.
  - `@code-id-labs/components`: Emit each component's compiled theme as a sibling `runtime/<name>/theme.js` CJS module and support pre-merged themes (`pm: 1` + `overrides`) in `tv()` so runtime `globalThis.__CODE_UI_GLOBAL_CONFIG__` lookups are skipped when pre-merged at build time.
  - `@code-id-labs/plugin-vite`: Add `syncCompiledComponentThemes()` to write build-time pre-merged `theme.js` modules into `miniprogram_npm/@code-id-labs/components/runtime/<name>/theme.js` (with full `ui`/`components` override precedence and HMR support when `cui.config.*` changes).
