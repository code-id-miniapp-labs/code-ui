---
"@code-id-labs/drawer": patch
"@code-id-labs/components": patch
---

Scope virtual keyboard height updates to only the topmost open `<c-drawer>` when drawers are stacked:

- `@code-id-labs/drawer`: Replace per-drawer `wx.onKeyboardHeightChange` listeners with a single shared listener backed by an active drawer stack so only the topmost open drawer receives `KEYBOARD_CHANGE` events, preventing underlying stacked drawers from lifting simultaneously or triggering redundant `setData` calls.
- `@code-id-labs/drawer` / `@code-id-labs/components`: Store WXS keyboard height in per-instance `instance.getState()` instead of a shared module variable so stacked drawers never overwrite each other's WXS keyboard offset.
