# @code-id-labs/drawer

## 0.0.3

### Patch Changes

- 4973e8f: Scope virtual keyboard height updates to only the topmost open `<c-drawer>` when drawers are stacked:

  - `@code-id-labs/drawer`: Replace per-drawer `wx.onKeyboardHeightChange` listeners with a single shared listener backed by an active drawer stack so only the topmost open drawer receives `KEYBOARD_CHANGE` events, preventing underlying stacked drawers from lifting simultaneously or triggering redundant `setData` calls.
  - `@code-id-labs/drawer` / `@code-id-labs/components`: Store WXS keyboard height in per-instance `instance.getState()` instead of a shared module variable so stacked drawers never overwrite each other's WXS keyboard offset.

## 0.0.2

### Patch Changes

- 97e4768: Fix virtual keyboard positioning in `<c-drawer>` using WXS and add `adjustPosition` to `<c-pin-input>`:

  - `@code-id-labs/drawer`: Move bottom drawer keyboard lift from JS `padding-bottom` to view-thread WXS `change:keyboardHeight` using GPU-composited `transform: translate3d(0, -<height>px, 0)` that composes cleanly with swipe-to-dismiss drag gestures.
  - `@code-id-labs/core`: Remove layout-thrashing `transition-[padding-bottom]` from `drawer` theme `root` slot.
  - `@code-id-labs/components`: Bind `keyboardHeight` / `change:keyboardHeight` on `<c-drawer>` content and add `adjustPosition` (`adjust-position`) property to `<c-pin-input>` so inputs inside `<c-drawer>` can disable native viewport shifting (`adjust-position="{{ false }}"`) and avoid double-offsetting.

- Updated dependencies [97e4768]
  - @code-id-labs/core@0.0.2
