---
"@code-id-labs/components": minor
"@code-id-labs/composables": minor
---

Support managing multiple overlays with a single `usePresence` or `createPresenceBehavior` call by accepting `key: string | readonly string[]`:

- Passing an array of keys (e.g. `key: ["filter", "sort", "payment"] as const`) syncs each overlay granularly at `this.data[name]`.
- `show`, `hide`, `toggle`, and `onExitComplete` accept either an overlay name or a MiniProgram event carrying `data-name` / `data-presence`.
- Added `hideAll()` (`usePresence`) and `closeAllPresence()` / `hideAllPresence()` (`createPresenceBehavior`), with automatic timer cleanup on `stop()` / `detached()`.
