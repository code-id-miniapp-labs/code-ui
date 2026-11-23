# @code-id-labs/core

## 0.0.2

### Patch Changes

- 97e4768: Fix virtual keyboard positioning in `<c-drawer>` using WXS and add `adjustPosition` to `<c-pin-input>`:

  - `@code-id-labs/drawer`: Move bottom drawer keyboard lift from JS `padding-bottom` to view-thread WXS `change:keyboardHeight` using GPU-composited `transform: translate3d(0, -<height>px, 0)` that composes cleanly with swipe-to-dismiss drag gestures.
  - `@code-id-labs/core`: Remove layout-thrashing `transition-[padding-bottom]` from `drawer` theme `root` slot.
  - `@code-id-labs/components`: Bind `keyboardHeight` / `change:keyboardHeight` on `<c-drawer>` content and add `adjustPosition` (`adjust-position`) property to `<c-pin-input>` so inputs inside `<c-drawer>` can disable native viewport shifting (`adjust-position="{{ false }}"`) and avoid double-offsetting.
