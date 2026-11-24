# @code-ui/composables

## 1.5.1

## 1.5.0

## 1.4.3

## 1.4.2

## 1.4.1

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

## 1.2.5

### Patch Changes

- 4522e6a: Fix global `cui.config.ts` component overrides across `toast` and all components:
  - Apply global `slots`/`ui`, `variants`, and `compoundVariants` overrides in `tv()` after built-in variants/compoundVariants (and before per-instance `ui`/`className`), with clean reset on config/HMR updates.
  - Merge global `components.toast` (`defaultVariants`/`defaultProps`) in `ToastManager.add()` for `useToast()`, and replace hardcoded `z-[100]` / inline `z-index` on `toast` with `z-toast`.
  - Assign a fresh object reference in `virtual:cui/config` and extract classes from both `ui.<component>` and `components.<component>` in `compileComponentTheme`.

## 1.2.4

## 1.2.3

## 1.2.2

## 1.2.1

## 1.2.0

## 1.1.0

## 1.0.8

## 1.0.7

## 1.0.6

## 1.0.5

## 1.0.4

## 1.0.3

## 1.0.2

## 1.0.1

## 2.0.0

### Major Changes

- Initial v1.0.0 public release with prebuilt MiniProgram UI components, Vite plugin (with built-in Lucide icons), CLI scaffolding, and composables (useToast, useComponentRef, useColorMode).

## 1.0.0

### Major Changes

- Initial v1.0.0 public release with prebuilt MiniProgram UI components, Vite plugin (with built-in Lucide icons), CLI scaffolding, and composables (useToast, useComponentRef, useColorMode).
