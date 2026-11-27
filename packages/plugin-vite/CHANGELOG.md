# @code-ui/plugin-vite

## 1.7.0

## 1.6.1

## 1.6.0

### Minor Changes

- 5210f42: Add `<c-tour>` guided product tour component and `useTour` composable:

  - `@code-id-labs/core`: Add `tourTheme` with Nuxt UI v4 semantic colors, `xs`–`lg` sizes, `border-2 border-solid` spotlight outline, directional arrow variants, and `zIndex.tour` config typing.
  - `@code-id-labs/compiler`: Register `tour` slots (`default`, `header`, `title`, `description`, `close`, `footer`, `progress`, `actions`) in `COMPONENT_SLOTS_MANIFEST`.
  - `@code-id-labs/components`: Add Tier 2 `<c-tour>` component backed by `@code-id-labs/tour` FSM supporting `tooltip`, `dialog`, `floating`, and `wait` steps, rounded spotlight cutout with automatic target `border-radius` detection (`spotlightRadius: null`), `wx.pageScrollTo` auto-scrolling, viewport collision flipping, interactive pass-through / `preventInteraction` locking, step-scoped `effect()` with cleanup, `<root-portal>` rendering, and exported machine API.
  - `@code-id-labs/composables`: Add `useTour()` composable with live `<c-tour>` binding via `selector` (safe queued `start()`/`startOnce()` in `onLoad`), controlled data syncing, lifecycle callbacks, and `storageKey`-backed one-time onboarding persistence.
  - `@code-id-labs/plugin-vite`: Add `z-tour` (`10135`) default z-index token, `tour: ["button", "icon"]` dependency tracking, and build-time `tour` theme syncing.

### Patch Changes

- 710e4f9: Add `<c-highlight>` component for spotlighting single or multiple matching substrings inline:

  - `@code-id-labs/core`: Add `highlightTheme` (`root`, `text`, `mark` slots) with `soft`, `solid`, `subtle`, `outline`, and `text` variants, semantic color palette + `neutral`, optional `size` (`xs`–`xl`), and `rounded` toggle.
  - `@code-id-labs/components`: Add Tier 1 presentational `<c-highlight>` component with co-located tree-shakeable `highlightWords()` utility supporting single/multi-term `query`, `ignoreCase`, `matchAll`, `exactMatch`, `markStyle`, `userSelect`, `ui`, and `className`, rendered with nested `<text>` for native multi-line inline wrapping.
  - `@code-id-labs/plugin-vite`: Rebuild to include `highlight` in `componentThemes` for build-time theme compilation and global overrides.

## 1.5.1

## 1.5.0

## 1.4.3

## 1.4.2

## 1.4.1

### Patch Changes

- 40b53f0: Move global `cui.config.ts` component theme overrides to build time and eliminate initial default-prop FOUC:

  - `@code-id-labs/miniapp`: Skip definition-time `evaluateInitialComputed()` in `computedBehavior` for components that declare `properties`, preventing default-prop class FOUC (e.g. `<c-button color="neutral" variant="ghost">` flashing solid `bg-primary` with `transition-colors` before `attached()` flushes real props) and avoiding wasted `tv()` evaluations at startup.
  - `@code-id-labs/compiler`: Add `format: "esm" | "cjs"` option to `serializeCompactThemeModule()`.
  - `@code-id-labs/components`: Emit each component's compiled theme as a sibling `runtime/<name>/theme.js` CJS module and support pre-merged themes (`pm: 1` + `overrides`) in `tv()` so runtime `globalThis.__CODE_UI_GLOBAL_CONFIG__` lookups are skipped when pre-merged at build time.
  - `@code-id-labs/plugin-vite`: Add `syncCompiledComponentThemes()` to write build-time pre-merged `theme.js` modules into `miniprogram_npm/@code-id-labs/components/runtime/<name>/theme.js` (with full `ui`/`components` override precedence and HMR support when `cui.config.*` changes).

## 1.4.0

## 1.3.0

### Patch Changes

- d471c4c: Centralize `pageLifetimes` into a single per-page lifecycle hub, scope overlay keyboard listeners to active states, and add a reusable `Presence` primitive:

  - **Eliminated per-component `pageLifetimes` proliferation**: Removed `pageLifetimes` from `computedBehavior` and `createAppThemeBehavior`, replacing them with a shared per-page lifecycle hub driven by the single `<c-app>` host (with an automatic fallback `page.onShow` / `page.onHide` hook when `<c-app>` is absent). Pages with 30+ components now register only 1 `pageLifetimes` listener from Code UI, preventing WeChat / TCMPP `onBeforeUnloadPage_<webviewId>` memory-leak warnings.
  - **Scoped overlay effects & unified exit completion**: Moved `wx.onKeyboardHeightChange` (`listenKeyboardHeight`) out of machine root into active states only in `drawer` (`open` / `dragging`) and `modal` (`open`), extracted a shared `scheduleAnimationEnd` helper, and emitted `bind:exitcomplete` (`onExitComplete`) from `<c-drawer>`, `<c-modal>`, `<c-action-sheet>`, `<c-popover>`, and `<c-toast>`.
  - **Added `Presence` primitive & parent-level unmounting helpers**:
    - Added `<c-presence>` (`@code-id-labs/presence`) supporting `present`, `lazyMount`, `unmountOnExit`, `duration` / `bindanimationend` / `bindtransitionend`, `data-state`, and `bind:exitcomplete`.
    - Exported `usePresence` from `@code-id-labs/composables` and `createPresenceBehavior` from `@code-id-labs/components/behaviors/presence` so parent pages/components can pair `wx:if="{{mounted}}"` with `bind:exitcomplete` to truly detach heavy overlay and custom-component subtrees after exit animations finish.
  - **Vite plugin tree-shake fix**: Updated consumer JS require scanning in `tree-shake` to also match backtick-quoted minified `require(\`...\`)`calls and registered`presence` in component dependency metadata.

## 1.2.6

## 1.2.5

### Patch Changes

- 4522e6a: Fix global `cui.config.ts` component overrides across `toast` and all components:
  - Apply global `slots`/`ui`, `variants`, and `compoundVariants` overrides in `tv()` after built-in variants/compoundVariants (and before per-instance `ui`/`className`), with clean reset on config/HMR updates.
  - Merge global `components.toast` (`defaultVariants`/`defaultProps`) in `ToastManager.add()` for `useToast()`, and replace hardcoded `z-[100]` / inline `z-index` on `toast` with `z-toast`.
  - Assign a fresh object reference in `virtual:cui/config` and extract classes from both `ui.<component>` and `components.<component>` in `compileComponentTheme`.

## 1.2.4

## 1.2.3

### Patch Changes

- 44f1b82: Increase default theme `zIndex` tokens (`popover`, `drawer`, `modal`, `actionSheet`, `picker`, `banner`, `toast`) to the `10050`–`10150` range so overlays render reliably above page and navigation elements.
- 44f1b82: Fix missing Tailwind and Code UI CSS variables (`--spacing`, `--text-*`, `--radius-*`, `--ui-*`) inside `custom-tab-bar` and `<root-portal>` by expanding root variable selectors to include `root-portal`, `custom-tab-bar`, `.light`, and `.dark`, and adding `tw-root` to overlay portal wrappers.

## 1.2.2

### Patch Changes

- 5768982: Preserve `@code-id-labs/components` subpath chunks (such as `computed.js` and `behaviors/app.js`) that are directly `require()`d by consumer app JS files during tree-shaking.

## 1.2.1

## 1.2.0

## 1.1.0

### Patch Changes

- d3e8730: Add `leadingIcon`, `trailingIcon`, `icon`, `leading`, and `trailing` props along with `leading` and `trailing` named slots to `c-form-field` using `useComponentIcons`, including `leadingIcon`/`trailingIcon` theme slots and compile-time slot manifest support.

## 1.0.8

## 1.0.7

## 1.0.6

## 1.0.5

### Patch Changes

- d3cf0fd: Defer production tree-shaking to clean process exit under `weapp-vite` and remove unguarded `generateBundle` purging in watch mode so concurrent `weapp-vite` npm builds (`collectCopiedPackageRequests`) never hit `ENOENT`.

## 1.0.4

### Patch Changes

- eb36b64: - **plugin-vite**: Wait for `dist/miniprogram_npm/<library>` writes to settle in `closeBundle` (`order: "post"`) before running `handleTreeShake`, preventing `ENOENT: chmod` race conditions with `weapp-vite`'s concurrent `copyBuild` during `pnpm build`.

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
