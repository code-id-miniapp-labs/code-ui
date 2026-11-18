# Input (`c-input`)

## Overview & Tier

- **Purpose**: Styled, accessible single-line text input component wrapping the WeChat MiniProgram native `<input>`, with controlled/uncontrolled value support, clear button, loading indicator, leading/trailing icons or slots, and form field integration.
- **Architecture Tier**: **Tier 3 Domain** (Interactive / Stateful component backed by `@code-ui/input` and domain form-field behavior `withFormField` from `@code-ui/miniapp/behaviors/form`, importing from `../_shared/base` and `../_shared/machine`).
- **Related Components**:
  - Integrates with parent form / form-field contexts (e.g., `<c-form>`, `c-form-field`) via `withFormField()` (`form`, `name`, `rules`, `validateOn`, `fieldDisabled`, and inherited `fieldSize` fallback when `size` is unset).
  - Uses `c-icon` internally for leading, trailing, clear, and loading icons.

---

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number \| null` | `null` | Controlled input value. |
| `defaultValue` | `string \| number \| null` | `""` | Initial uncontrolled value. |
| `name` | `string` | `""` | Form field name for form registration and native input `name`. |
| `type` | `"text" \| "number" \| "idcard" \| "digit" \| "safe-password" \| "nickname"` | `"text"` | Native MiniProgram `<input>` type. |
| `variant` | `"outline" \| "soft" \| "subtle" \| "ghost" \| "none"` | `"outline"` | Visual style variant. |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"` | `"primary"` | Accent color for focus and highlight rings. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` (resolves to `fieldSize` or `"md"`) | Input height, font size, padding, and icon sizing. |
| `highlight` | `boolean` | `false` | Always display the colored border/ring highlight. |
| `disabled` | `boolean` | `false` | Disables user interaction. |
| `readOnly` | `boolean` | `false` | Makes the input read-only. |
| `invalid` | `boolean \| null` | `null` | Marks the input as invalid (also derived from form validation). |
| `clearable` | `boolean` | `false` | Shows a clear button when non-empty and interactive. |
| `clearIcon` | `string` | `"close"` | Icon name rendered for the clear button. |
| `loading` | `boolean` | `false` | Shows a trailing loading indicator. |
| `loadingIcon` | `string` | `"loading"` | Icon name rendered while `loading` is `true`. |
| `leadingIcon` | `string` | `""` | Icon name rendered in the leading area. |
| `trailingIcon` | `string` | `""` | Icon name rendered in the trailing area. |
| `autoFocus` | `boolean` | `false` | Focuses the input on mount. |
| `password` | `boolean` | `false` | Masks input characters as a password. |
| `placeholder` | `string` | `""` | Placeholder text shown when empty. |
| `placeholderClass` | `string` | `""` | Custom class applied to placeholder text (`placeholder-class`). |
| `placeholderStyle` | `string` | `""` | Inline style applied to placeholder text (`placeholder-style`). |
| `maxlength` | `number` | `140` | Maximum character length (`-1` for unlimited). |
| `cursorSpacing` | `number` | `0` | Distance (px) between cursor and keyboard (`cursor-spacing`). |
| `confirmType` | `string` | `"done"` | Label of the keyboard confirm button (`confirm-type`). |
| `confirmHold` | `boolean` | `false` | Keeps keyboard open when tapping confirm (`confirm-hold`). |
| `cursor` | `number` | `-1` | Cursor position when focused. |
| `selectionStart` | `number` | `-1` | Text selection start index when focused (`selection-start`). |
| `selectionEnd` | `number` | `-1` | Text selection end index when focused (`selection-end`). |
| `adjustPosition` | `boolean` | `true` | Automatically pushes page up when keyboard appears (`adjust-position`). |
| `holdKeyboard` | `boolean` | `false` | Keeps keyboard open on tap outside (`hold-keyboard`). |
| `form` | `string` | `undefined` | Target `<c-form>` id/name when multiple forms exist on a page. |
| `rules` | `FormRule[]` | `undefined` | Field-level validation rules. |
| `validateOn` | `FormValidateOn` | `undefined` | Field-level override for form validation triggers. |
| `fieldDisabled` | `boolean` | `undefined` | Disabled state inherited from a parent form field wrapper. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional class applied to the `root` slot (used instead of `class` on `c-input`). |

> **Note**: `c-input` uses `className` (rather than `class`) as its root class override property alongside `ui` for per-slot customization.

---

## Slots

WeChat MiniProgram `<slot>` elements are static (no scoped slots) and silently drop nested fallback content (`<slot name="foo">fallback</slot>`). To handle this, `c-input` uses boolean flags in the `slots` config (`{ leading: false, trailing: false, loadingIcon: false }`) and `wx:if` / `wx:else` conditional rendering to switch between custom slots and built-in `<c-icon>` fallbacks.

| Slot | Description | Conditional Behavior |
| --- | --- | --- |
| `leading` | Custom content rendered before the native `<input>`. | Rendered when `slots.leading` is enabled (`hasLeadingSlot`). Suppresses the built-in `leadingIcon` `<c-icon>`. |
| `trailing` | Custom content rendered after the native `<input>`. | Rendered when `slots.trailing` is enabled (`hasTrailingSlot`). Suppresses the built-in `trailingIcon` `<c-icon>`, while `loading` or clear button indicators can still render alongside it. |
| `loadingIcon` | Custom loading indicator rendered when `loading` is `true`. | Rendered when `slots.loadingIcon` is enabled (`hasLoadingSlot`); otherwise falls back via `wx:else` to `<c-icon name="{{loadingIcon}}">`. |
| Default slot | None | No unnamed `<slot />` is defined. |

---

## Events

### MiniProgram Component Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:keyboardheightchange` | `Record<string, any>` (native MiniProgram detail, e.g., `{ height, duration }`) | Forwarded directly from the native `<input>` when the keyboard height changes. |

### Component / Machine Callbacks

The following callback props are supported on `InputProps` (handled via the component behavior):

- `onChange`: `(details: { value: string }) => void` — Fired when the input value changes.
- `onFocus`: `(details: { value: string }) => void` — Fired when the input receives focus.
- `onBlur`: `(details: { value: string }) => void` — Fired when the input loses focus.
- `onConfirm`: `(details: { value: string }) => void` — Fired when the keyboard confirm button is tapped.
- `onClear`: `(details?: Record<string, any>) => void` — Fired when the clear button is tapped.

---

## Theme

Defined in `packages/core/src/theme/definitions/input.ts`.

### Slots

- `root` — Outer container (`relative flex items-center w-full`).
- `base` — Bordered field wrapper (`relative w-full min-h-0 flex items-center overflow-hidden box-border rounded-md border ...`).
- `nativeInput` — Inner MiniProgram `<input>` element (`flex-1 min-w-0 w-full min-h-0 bg-transparent border-0 ...`).
- `leading` — Leading adornment container (`shrink-0 flex items-center justify-center text-dimmed`).
- `leadingIcon` — Leading icon wrapper (`inline-flex items-center justify-center shrink-0 leading-none`).
- `trailing` — Trailing adornment container (`shrink-0 flex items-center justify-center gap-1 text-dimmed`).
- `trailingIcon` — Trailing / clear / loading icon wrapper (`inline-flex items-center justify-center shrink-0 leading-none`).
- `iconInner` — Inner `<c-icon>` class for leading, trailing, and clear icons (`w-full h-full block`).
- `loadingIcon` — Inner `<c-icon>` class for the loading indicator (`w-full h-full block animate-spin`).

### Variants

- `color`: `"primary"` | `"neutral"` | `"danger"` | `"success"` | `"warning"` | `"info"`
- `variant`: `"outline"` | `"soft"` | `"subtle"` | `"ghost"` | `"none"`
- `size`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
- `leading`: `true` | `false`
- `trailing`: `true` | `false`
- `highlight`: `true` | `false`
- `disabled`: `true` | `false`
- `invalid`: `true` | `false`

### Compound Variants

- `color` + `highlight: true` — Applies persistent border and ring styling in the selected color (or inverted color for `"neutral"`).
- `invalid: true` — Applies error-color (`danger`) border and ring styling in both default and focused states.

### Default Variants

- `variant`: `"outline"`
- `color`: `"primary"`
- `size`: `"md"`
- `leading`: `false`
- `trailing`: `false`
- `highlight`: `false`
- `disabled`: `false`
- `invalid`: `false`

---

## Examples

### Basic & Clearable Input (WXML)

```xml
<c-input
  value="{{username}}"
  placeholder="Enter username"
  leadingIcon="user"
  clearable="{{true}}"
  variant="outline"
  size="md"
  bind:keyboardheightchange="onKeyboardHeightChange"
/>
```

### Custom Leading Slot & Per-Slot `ui` Overrides (WXML)

```xml
<c-input
  placeholder="Search items"
  slots="{{ { leading: true } }}"
  className="my-4"
  ui="{{ { base: 'rounded-full', nativeInput: 'text-sm' } }}"
  loading="{{isSearching}}"
>
  <text slot="leading" class="text-xs text-muted">Query:</text>
</c-input>
```

### Page Controller (TypeScript)

```ts
Page({
  data: {
    username: "",
    isSearching: false,
  },

  onKeyboardHeightChange(e: WechatMiniprogram.CustomEvent) {
    console.log("Keyboard height:", e.detail.height);
  },
});
```
