# @code-id-labs/miniapp

## 0.0.6

### Patch Changes

- Updated dependencies [710e4f9]
- Updated dependencies [5210f42]
  - @code-id-labs/core@0.1.0

## 0.0.5

### Patch Changes

- e32fc53: Component-wide `setData` payload projection, native focus reconciliation fix, and closed-overlay optimization:

  - `@code-id-labs/miniapp`: Strip non-WXML `hiddenInputProps` from serialized `setData` snapshots in `connectToComponent` / `connectToPage` (keeping them on `__codeUiApi`) and add `omitDataKeys` / `ConnectOptions.omitKeys` for runtime payload projection.
  - `@code-id-labs/input`, `@code-id-labs/textarea`, `@code-id-labs/input-menu`: Separate native `bindfocus` from programmatic focus (`programmaticFocus`) so user taps do not re-trigger WeChat's native `<input focus>` reconciliation (~100 ms stall).
  - `@code-id-labs/pin-input`: Remove `force: true` from native `handleFocus()` to prevent blur/refocus double `setData` on every cell focus.
  - `@code-id-labs/components`: Short-circuit `classes`, `disabledClasses`, `resolvedClose`, `resolvedItems`, and `resolvedActions` in closed `<c-drawer>`, `<c-modal>`, and `<c-action-sheet>` overlays, and bind `inputMenu.inputProps.focus` in `<c-input-menu>`.

- e32fc53: Reduce `setData` IPC latency and payload overhead across `computedBehavior`, `connectToComponent`, `theme`, and `toast` behaviors:

  - `@code-id-labs/miniapp`:
    - Coalesce mount-phase `setData` writes from peer behaviors (`appThemeBehavior`, `connectToComponent`, `toastHostBehavior`) with initial `computed` values into a single `attached` `setData` IPC call (`deferUntilFlush` + `__cuiBufferMountData`).
    - Add O(1) per-computed evaluation version tracking (`computedVersions` / `flushedVersions`) so untouched computeds skip deep `isEqual()` and `cloneValue()` checks.
    - Diff multi-slot plain-object computeds (such as `classes`) into granular `"classes.<slot>"` sub-paths instead of re-serializing all unchanged slots.
    - Skip no-op top-level primitive writes in `patchedSetData` (resolving callbacks via `queueMicrotask` without empty `{}` IPC roundtrips) and redundant initial `setData` calls in `createAppThemeBehavior`, `applyHostState` (`hostScaleFactor` / `hostScaleBackground` when unscaled), and `patchInheritedData` (default `""` / `false` inherited props like `fieldSize`).
    - Replace `wx.nextTick` macrotask flushing in `connectToComponent` / `connectToPage` with `queueMicrotask` so machine and computed updates flush together in the same JS turn without stalling behind congested WebView IPC cycles.
    - Strip non-serializable callback functions and `undefined` fields from `toasts` payloads in `createToastHostBehavior`.
  - `@code-id-labs/components`: Rebuild runtime bundles with the optimized `@code-id-labs/miniapp` runtime.

## 0.0.4

### Patch Changes

- bf07668: Defer `wx.getMenuButtonBoundingClientRect()` / `wx.getWindowInfo()` calls in `appMetricsSignal` until runtime attachment:

  - `@code-id-labs/miniapp`: Initialize `appMetricsSignal` lazily with `EMPTY_METRICS` instead of calling `calculateMetrics()` at module evaluation time, and populate metrics when `<c-app>` attaches (`createAppHostBehavior.lifetimes.attached`). Prevents `getMenuButtonBoundingClientRect:fail Cannot destructure property 'mockConfig' of 'n' as it is undefined` during early MiniProgram cold boot.
  - `@code-id-labs/components`: Rebuild bundled `behaviors/app.js` with the lazy metrics initialization fix.

- Updated dependencies [23a0e14]
  - @code-id-labs/core@0.0.3

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
