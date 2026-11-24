# @code-id-labs/input-menu

## 0.0.4

### Patch Changes

- e32fc53: Component-wide `setData` payload projection, native focus reconciliation fix, and closed-overlay optimization:

  - `@code-id-labs/miniapp`: Strip non-WXML `hiddenInputProps` from serialized `setData` snapshots in `connectToComponent` / `connectToPage` (keeping them on `__codeUiApi`) and add `omitDataKeys` / `ConnectOptions.omitKeys` for runtime payload projection.
  - `@code-id-labs/input`, `@code-id-labs/textarea`, `@code-id-labs/input-menu`: Separate native `bindfocus` from programmatic focus (`programmaticFocus`) so user taps do not re-trigger WeChat's native `<input focus>` reconciliation (~100 ms stall).
  - `@code-id-labs/pin-input`: Remove `force: true` from native `handleFocus()` to prevent blur/refocus double `setData` on every cell focus.
  - `@code-id-labs/components`: Short-circuit `classes`, `disabledClasses`, `resolvedClose`, `resolvedItems`, and `resolvedActions` in closed `<c-drawer>`, `<c-modal>`, and `<c-action-sheet>` overlays, and bind `inputMenu.inputProps.focus` in `<c-input-menu>`.

## 0.0.3

### Patch Changes

- Updated dependencies [23a0e14]
  - @code-id-labs/core@0.0.3
  - @code-id-labs/form@0.0.3
  - @code-id-labs/popover@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [97e4768]
  - @code-id-labs/core@0.0.2
  - @code-id-labs/form@0.0.2
  - @code-id-labs/popover@0.0.2
