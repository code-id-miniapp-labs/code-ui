# @code-ui/composables

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

- cb39309: Fix cross-page memory leaks and reduce per-instance heap & `setData` footprint on component-dense MiniProgram pages:

  - **Context & Form leak fixes**: Key page context scopes on live `Page` objects from `getCurrentPages()` (auto-GC'd on unload), add `unprovide()` / `unprovideFormHost()` cleanup on `<c-form>` exit, stop registering auto-generated `scope.id` as permanent scoped keys, prune empty `provideListeners` buckets, and lazily create `bindFormField` registration effects only when a form host connects.
  - **App host & banner leak fixes**: Cap `behaviors/app` pending queues, clear pending entries on `unregisterAppHost()`, clear `topPage.__cuiApp` on host detach, and guard `measureBanner` retry timers against detached instances.
  - **Composable lifecycle cleanup**: Auto-unsubscribe `useColorMode()` on `target.onUnload` / `detached` and share a single `WeakMap`-backed lifecycle hook dispatcher across `useColorMode()` and `useComponentRef()` to prevent nested wrapper chains.
  - **Machine / Connect / Domain cleanup**: Release component, event, and handler-cache references on `MiniappMachine.stop()`, clear `__codeUiApi` / snapshot listeners on `detached`, guard queued `connectToComponent` microtask flushes after `dispose()`, add `onDetached` cleanup to compound relation behaviors (`accordion`, `checkbox`, `input-menu`, `radio`, `select`, `stepper`, `tabs`), and cancel pending `file-upload` ActionSheet timers on exit.
  - **Per-instance heap & `setData` optimizations**:
    - Introduce zero-Proxy / zero-signal `staticComputedBehavior` and migrate 8 Tier-1 presentational components (`icon`, `badge`, `card`, `chip`, `divider`, `highlight`, `skeleton`, `avatar`).
    - Enable `deferred: true` + `shouldStart` lazy machine boot on closed overlays (`modal`, `drawer`, `action-sheet`, `tour`).
    - Add `omitDataKeys` to strip unused `*Props` objects (`input`, `textarea`, `pin-input`, `progress`, `select`, `input-menu`) and guard closed `select` / `input-menu` dropdown item computations on `visible`.
    - Reduce `MiniappMachine` signal allocations (direct state signal, skip `propCache` signals on non-reactive `prop()` reads, reuse `paramsCache`/`serviceCache` across events), remove redundant `cloneValue()` in `computedBehavior`, and lower per-`tv()` LRU cache capacity from `512` to `128`.

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
