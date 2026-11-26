---
"@code-id-labs/components": patch
"@code-id-labs/composables": patch
---

Fix cross-page memory leaks and reduce per-instance heap & `setData` footprint on component-dense MiniProgram pages:

- **Context & Form leak fixes**: Key page context scopes on live `Page` objects from `getCurrentPages()` (auto-GC'd on unload), add `unprovide()` / `unprovideFormHost()` cleanup on `<c-form>` exit, stop registering auto-generated `scope.id` as permanent scoped keys, prune empty `provideListeners` buckets, and lazily create `bindFormField` registration effects only when a form host connects.
- **App host & banner leak fixes**: Cap `behaviors/app` pending queues, clear pending entries on `unregisterAppHost()`, clear `topPage.__cuiApp` on host detach, and guard `measureBanner` retry timers against detached instances.
- **Composable lifecycle cleanup**: Auto-unsubscribe `useColorMode()` on `target.onUnload` / `detached` and share a single `WeakMap`-backed lifecycle hook dispatcher across `useColorMode()` and `useComponentRef()` to prevent nested wrapper chains.
- **Machine / Connect / Domain cleanup**: Release component, event, and handler-cache references on `MiniappMachine.stop()`, clear `__codeUiApi` / snapshot listeners on `detached`, guard queued `connectToComponent` microtask flushes after `dispose()`, add `onDetached` cleanup to compound relation behaviors (`accordion`, `checkbox`, `input-menu`, `radio`, `select`, `stepper`, `tabs`), and cancel pending `file-upload` ActionSheet timers on exit.
- **Per-instance heap & `setData` optimizations**:
  - Introduce zero-Proxy / zero-signal `staticComputedBehavior` and migrate 8 Tier-1 presentational components (`icon`, `badge`, `card`, `chip`, `divider`, `highlight`, `skeleton`, `avatar`).
  - Enable `deferred: true` + `shouldStart` lazy machine boot on closed overlays (`modal`, `drawer`, `action-sheet`, `tour`).
  - Add `omitDataKeys` to strip unused `*Props` objects (`input`, `textarea`, `pin-input`, `progress`, `select`, `input-menu`) and guard closed `select` / `input-menu` dropdown item computations on `visible`.
  - Reduce `MiniappMachine` signal allocations (direct state signal, skip `propCache` signals on non-reactive `prop()` reads, reuse `paramsCache`/`serviceCache` across events), remove redundant `cloneValue()` in `computedBehavior`, and lower per-`tv()` LRU cache capacity from `512` to `128`.
