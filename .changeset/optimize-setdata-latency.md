---
"@code-id-labs/miniapp": patch
"@code-id-labs/components": patch
---

Reduce `setData` IPC latency and payload overhead across `computedBehavior`, `connectToComponent`, `theme`, and `toast` behaviors:

- `@code-id-labs/miniapp`:
  - Coalesce mount-phase `setData` writes from peer behaviors (`appThemeBehavior`, `connectToComponent`, `toastHostBehavior`) with initial `computed` values into a single `attached` `setData` IPC call (`deferUntilFlush` + `__cuiBufferMountData`).
  - Add O(1) per-computed evaluation version tracking (`computedVersions` / `flushedVersions`) so untouched computeds skip deep `isEqual()` and `cloneValue()` checks.
  - Diff multi-slot plain-object computeds (such as `classes`) into granular `"classes.<slot>"` sub-paths instead of re-serializing all unchanged slots.
  - Skip no-op top-level primitive writes in `patchedSetData` (resolving callbacks via `queueMicrotask` without empty `{}` IPC roundtrips) and redundant initial `setData` calls in `createAppThemeBehavior`, `applyHostState` (`hostScaleFactor` / `hostScaleBackground` when unscaled), and `patchInheritedData` (default `""` / `false` inherited props like `fieldSize`).
  - Replace `wx.nextTick` macrotask flushing in `connectToComponent` / `connectToPage` with `queueMicrotask` so machine and computed updates flush together in the same JS turn without stalling behind congested WebView IPC cycles.
  - Strip non-serializable callback functions and `undefined` fields from `toasts` payloads in `createToastHostBehavior`.
- `@code-id-labs/components`: Rebuild runtime bundles with the optimized `@code-id-labs/miniapp` runtime.
