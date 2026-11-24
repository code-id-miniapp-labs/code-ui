# @code-ui/components

## 1.5.1

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

## 1.5.0

### Minor Changes

- 23a0e14: Add a globally configurable `placeholder` theme slot to `<c-input>` and remove the redundant `placeholderClass` prop:

  - `@code-id-labs/core`: Add `placeholder: "text-dimmed"` slot to `inputTheme`.
  - `@code-id-labs/components`: Bind `placeholder-class="{{classes.placeholder}}"` on `<c-input>` and remove `placeholderClass` so placeholder styling is configured consistently via `cui.config.ts` (`components.input.slots.placeholder`) or per-instance `ui.placeholder` with Tailwind class deduplication.

### Patch Changes

- bf07668: Defer `wx.getMenuButtonBoundingClientRect()` / `wx.getWindowInfo()` calls in `appMetricsSignal` until runtime attachment:

  - `@code-id-labs/miniapp`: Initialize `appMetricsSignal` lazily with `EMPTY_METRICS` instead of calling `calculateMetrics()` at module evaluation time, and populate metrics when `<c-app>` attaches (`createAppHostBehavior.lifetimes.attached`). Prevents `getMenuButtonBoundingClientRect:fail Cannot destructure property 'mockConfig' of 'n' as it is undefined` during early MiniProgram cold boot.
  - `@code-id-labs/components`: Rebuild bundled `behaviors/app.js` with the lazy metrics initialization fix.

## 1.4.3

### Patch Changes

- 4973e8f: Scope virtual keyboard height updates to only the topmost open `<c-drawer>` when drawers are stacked:

  - `@code-id-labs/drawer`: Replace per-drawer `wx.onKeyboardHeightChange` listeners with a single shared listener backed by an active drawer stack so only the topmost open drawer receives `KEYBOARD_CHANGE` events, preventing underlying stacked drawers from lifting simultaneously or triggering redundant `setData` calls.
  - `@code-id-labs/drawer` / `@code-id-labs/components`: Store WXS keyboard height in per-instance `instance.getState()` instead of a shared module variable so stacked drawers never overwrite each other's WXS keyboard offset.

## 1.4.2

### Patch Changes

- 97e4768: Fix virtual keyboard positioning in `<c-drawer>` using WXS and add `adjustPosition` to `<c-pin-input>`:

  - `@code-id-labs/drawer`: Move bottom drawer keyboard lift from JS `padding-bottom` to view-thread WXS `change:keyboardHeight` using GPU-composited `transform: translate3d(0, -<height>px, 0)` that composes cleanly with swipe-to-dismiss drag gestures.
  - `@code-id-labs/core`: Remove layout-thrashing `transition-[padding-bottom]` from `drawer` theme `root` slot.
  - `@code-id-labs/components`: Bind `keyboardHeight` / `change:keyboardHeight` on `<c-drawer>` content and add `adjustPosition` (`adjust-position`) property to `<c-pin-input>` so inputs inside `<c-drawer>` can disable native viewport shifting (`adjust-position="{{ false }}"`) and avoid double-offsetting.

## 1.4.1

### Patch Changes

- 40b53f0: Move global `cui.config.ts` component theme overrides to build time and eliminate initial default-prop FOUC:

  - `@code-id-labs/miniapp`: Skip definition-time `evaluateInitialComputed()` in `computedBehavior` for components that declare `properties`, preventing default-prop class FOUC (e.g. `<c-button color="neutral" variant="ghost">` flashing solid `bg-primary` with `transition-colors` before `attached()` flushes real props) and avoiding wasted `tv()` evaluations at startup.
  - `@code-id-labs/compiler`: Add `format: "esm" | "cjs"` option to `serializeCompactThemeModule()`.
  - `@code-id-labs/components`: Emit each component's compiled theme as a sibling `runtime/<name>/theme.js` CJS module and support pre-merged themes (`pm: 1` + `overrides`) in `tv()` so runtime `globalThis.__CODE_UI_GLOBAL_CONFIG__` lookups are skipped when pre-merged at build time.
  - `@code-id-labs/plugin-vite`: Add `syncCompiledComponentThemes()` to write build-time pre-merged `theme.js` modules into `miniprogram_npm/@code-id-labs/components/runtime/<name>/theme.js` (with full `ui`/`components` override precedence and HMR support when `cui.config.*` changes).

## 1.4.0

### Minor Changes

- 4f88472: Support managing multiple overlays with a single `usePresence` or `createPresenceBehavior` call by accepting `key: string | readonly string[]`:

  - Passing an array of keys (e.g. `key: ["filter", "sort", "payment"] as const`) syncs each overlay granularly at `this.data[name]`.
  - `show`, `hide`, `toggle`, and `onExitComplete` accept either an overlay name or a MiniProgram event carrying `data-name` / `data-presence`.
  - Added `hideAll()` (`usePresence`) and `closeAllPresence()` / `hideAllPresence()` (`createPresenceBehavior`), with automatic timer cleanup on `stop()` / `detached()`.

## 1.3.0

### Minor Changes

- d471c4c: Centralize `pageLifetimes` into a single per-page lifecycle hub, scope overlay keyboard listeners to active states, and add a reusable `Presence` primitive:

  - **Eliminated per-component `pageLifetimes` proliferation**: Removed `pageLifetimes` from `computedBehavior` and `createAppThemeBehavior`, replacing them with a shared per-page lifecycle hub driven by the single `<c-app>` host (with an automatic fallback `page.onShow` / `page.onHide` hook when `<c-app>` is absent). Pages with 30+ components now register only 1 `pageLifetimes` listener from Code UI, preventing WeChat / TCMPP `onBeforeUnloadPage_<webviewId>` memory-leak warnings.
  - **Scoped overlay effects & unified exit completion**: Moved `wx.onKeyboardHeightChange` (`listenKeyboardHeight`) out of machine root into active states only in `drawer` (`open` / `dragging`) and `modal` (`open`), extracted a shared `scheduleAnimationEnd` helper, and emitted `bind:exitcomplete` (`onExitComplete`) from `<c-drawer>`, `<c-modal>`, `<c-action-sheet>`, `<c-popover>`, and `<c-toast>`.
  - **Added `Presence` primitive & parent-level unmounting helpers**:
    - Added `<c-presence>` (`@code-id-labs/presence`) supporting `present`, `lazyMount`, `unmountOnExit`, `duration` / `bindanimationend` / `bindtransitionend`, `data-state`, and `bind:exitcomplete`.
    - Exported `usePresence` from `@code-id-labs/composables` and `createPresenceBehavior` from `@code-id-labs/components/behaviors/presence` so parent pages/components can pair `wx:if="{{mounted}}"` with `bind:exitcomplete` to truly detach heavy overlay and custom-component subtrees after exit animations finish.
  - **Vite plugin tree-shake fix**: Updated consumer JS require scanning in `tree-shake` to also match backtick-quoted minified `require(\`...\`)`calls and registered`presence` in component dependency metadata.

## 1.2.6

### Patch Changes

- b66b0d7: Fix `c-icon` prepending the icon class prefix (`i-`) to hosted image URLs and data URIs (`https://...`, `http://...`, `data:image/...`, `cloud://...`, `wxfile://...`) by skipping Iconify `collection:name` parsing for URLs and paths in `getIcon()`.

## 1.2.5

### Patch Changes

- 4522e6a: Fix global `cui.config.ts` component overrides across `toast` and all components:
  - Apply global `slots`/`ui`, `variants`, and `compoundVariants` overrides in `tv()` after built-in variants/compoundVariants (and before per-instance `ui`/`className`), with clean reset on config/HMR updates.
  - Merge global `components.toast` (`defaultVariants`/`defaultProps`) in `ToastManager.add()` for `useToast()`, and replace hardcoded `z-[100]` / inline `z-index` on `toast` with `z-toast`.
  - Assign a fresh object reference in `virtual:cui/config` and extract classes from both `ui.<component>` and `components.<component>` in `compileComponentTheme`.

## 1.2.4

### Patch Changes

- 0687b7d: Fix global component theme overrides (`components.<name>` and `ui.<name>` in `cui.config.ts`) not taking effect in pre-built runtime components by tagging serialized theme configs with their component name and merging `globalThis.__CODE_UI_GLOBAL_CONFIG__` overrides inside `tv()`.

## 1.2.3

### Patch Changes

- 44f1b82: Fix missing Tailwind and Code UI CSS variables (`--spacing`, `--text-*`, `--radius-*`, `--ui-*`) inside `custom-tab-bar` and `<root-portal>` by expanding root variable selectors to include `root-portal`, `custom-tab-bar`, `.light`, and `.dark`, and adding `tw-root` to overlay portal wrappers.

## 1.2.2

## 1.2.1

### Patch Changes

- b52efa4: Emit standalone `dist/computed.d.ts` type declarations for the `@code-id-labs/components/computed` subpath export.

## 1.2.0

### Minor Changes

- 8101c79: Expose `createPageOptions`, `createComponentOptions`, and `computedBehavior` via the new `@code-id-labs/components/computed` subpath export.

## 1.1.0

### Minor Changes

- d3e8730: Add `leadingIcon`, `trailingIcon`, `icon`, `leading`, and `trailing` props along with `leading` and `trailing` named slots to `c-form-field` using `useComponentIcons`, including `leadingIcon`/`trailingIcon` theme slots and compile-time slot manifest support.

## 1.0.8

### Patch Changes

- 2c914f8: Refactor `banner`, `file-upload`, and `form` state machines to use declarative `target` transitions (`OPEN`, guarded `SET_UPLOADING`, and form lifecycle events) and guard `file-upload` `setValue`/`hydrateLocalImages` against non-array file lists.

## 1.0.7

### Patch Changes

- 7983505: Fix `c-button` native disabled styling override when using `formType` with `loadingAuto` by removing the native `disabled` attribute and guarding `form-type` and `open-type` while disabled or loading.

## 1.0.6

### Patch Changes

- d7681fd: Remove redundant `rootStyle` prop from `c-qr-code` in favor of `ui` and `className`.

## 1.0.5

## 1.0.4

### Patch Changes

- 2fc4b1b: - **button / form**: Link `<c-button>` to ancestor `<c-form>` via form relations (and add `wx://form-field-button` for native `<form>` support) so `form-type="submit"` and `form-type="reset"` reliably trigger `<c-form>`'s `bind:submit` and `bind:reset`.
  - **button / form**: Support `e.detail.setPromise(promise)` in `<c-form>`'s `bind:submit` and inherit the form submit promise in `<c-button form-type="submit" loading-auto="{{true}}" />` so the button stays in its loading state until validation and async submission settle.

## 1.0.3

## 1.0.2

## 1.0.1

### Patch Changes

- f2eb88a: - **file-upload**: Add built-in fullscreen `<root-portal>` swipeable preview overlay (`previewMode="overlay"`) with base64 data-URI hydration for local temporary images and theme-based safe-area slots.
  - **form & form-field**: Fix `focusOnError` and `scrollToError` on simulator and real devices by resolving unique `form-field` IDs, atomic `#rootId` selector measurement, and refocus pulsing on form controls.
  - **drawer**: Position drawer above virtual keyboard across all placements (`bottom`, `top`, `left`, `right`) via `root` padding and `keyboardOpen` theme variants, and optimize `<c-app>` background scaling.
  - **action-sheet**: Reserve symmetric header clearance (`closable` variant `px-14 min-h-14` and `break-words`) so long titles and descriptions never collide with `closeTrigger`.
  - **overlays & plugin-vite**: Render `modal`, `drawer`, `action-sheet`, and `popover` inside `<root-portal>` with semantic `--z-*` layering variables and automatic `<c-app>` wrapper injection.

## 2.0.0

### Major Changes

- Initial v1.0.0 public release with prebuilt MiniProgram UI components, Vite plugin (with built-in Lucide icons), CLI scaffolding, and composables (useToast, useComponentRef, useColorMode).

## 1.0.0

### Major Changes

- Initial v1.0.0 public release with prebuilt MiniProgram UI components, Vite plugin (with built-in Lucide icons), CLI scaffolding, and composables (useToast, useComponentRef, useColorMode).
