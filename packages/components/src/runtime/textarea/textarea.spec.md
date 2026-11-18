# Textarea (`c-textarea`)

## Overview & Tier

Multi-line text input component for WeChat MiniProgram with Nuxt UI v4-style theming, optional leading/trailing icons and slots, loading state, clear button, character counter, and form-field integration.

- **Architecture Tier**: **Tier 2 Interactive** (with **Tier 3 Form Domain** integration)
  - Powered by `textareaMachine` and `connectTextarea` from `@code-id-labs/textarea` via `createMachineBehavior`.
  - Integrates with `<c-form>` / `<c-form-field>` via the `withFormField()` plugin from `@code-id-labs/miniapp/behaviors/form`.
  - Uses `computedBehavior` from `../_shared/base` and renders `c-icon` internally for icons.
- **Compound Relationships**: Standalone form control (not a parent/child compound container), optionally binds to an ancestor or named `<c-form>` / `<c-form-field>` through `withFormField()`.

---

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number \| null` | `null` | Controlled textarea value. |
| `defaultValue` | `string \| number \| null` | `""` | Initial value when used uncontrolled. |
| `name` | `string` | `""` | Form field name for `<textarea>` and Form registration. |
| `disabled` | `boolean` | `false` | Disables the textarea. |
| `readOnly` | `boolean` | `false` | Makes the textarea read-only (disables editing on native `<textarea>`). |
| `invalid` | `boolean \| null` | `null` | Marks the textarea as invalid (also driven by Form validation). |
| `clearable` | `boolean` | `false` | Shows the clear button when the value is non-empty and interactive. |
| `autoFocus` | `boolean` | `false` | Focuses the textarea on mount. |
| `variant` | `"outline" \| "soft" \| "subtle" \| "ghost" \| "none"` | `"outline"` | Visual style variant. |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"` | `"primary"` | Focus ring and highlight color. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Size preset (falls back to `fieldSize` from form field, then `"md"`). |
| `highlight` | `boolean` | `false` | Permanently applies the colored focus border and ring. |
| `placeholder` | `string` | `""` | Placeholder text displayed when empty. |
| `placeholderClass` | `string` | `""` | Extra CSS class(es) appended to the `placeholder` slot class. |
| `placeholderStyle` | `string` | `""` | Inline style string for the placeholder. |
| `leadingIcon` | `string` | `""` | Icon name rendered in the leading area via `c-icon`. |
| `trailingIcon` | `string` | `""` | Icon name rendered in the trailing area via `c-icon`. |
| `clearIcon` | `string` | `"close"` | Icon name for the clear button. |
| `loading` | `boolean` | `false` | Displays a loading spinner in the trailing area. |
| `loadingIcon` | `string` | `"loading"` | Icon name for the loading spinner. |
| `count` | `boolean` | `false` | Displays the character counter in the bottom-right corner. |
| `autoHeight` | `boolean` | `false` | Automatically adjusts textarea height to fit content (`auto-height`). |
| `fixed` | `boolean` | `false` | Set `true` when the textarea is inside a `position: fixed` container. |
| `maxlength` | `number` | `-1` | Maximum character length (`-1` for unlimited). Displayed as `count/maxlength` when `> 0`. |
| `showConfirmBar` | `boolean` | `true` | Shows the keyboard "Done" toolbar above the keyboard. |
| `cursorSpacing` | `number` | `0` | Distance between the cursor and the keyboard (in px). |
| `confirmType` | `string` | `"return"` | Text of the keyboard confirm button (`"send"`, `"search"`, `"next"`, `"go"`, `"done"`, `"return"`). |
| `confirmHold` | `boolean` | `false` | Keeps the keyboard open when tapping the confirm button. |
| `cursor` | `number` | `-1` | Cursor position when focused. |
| `selectionStart` | `number` | `-1` | Selection start index when focused. |
| `selectionEnd` | `number` | `-1` | Selection end index when focused. |
| `adjustPosition` | `boolean` | `true` | Automatically pushes the page up when the keyboard appears. |
| `holdKeyboard` | `boolean` | `false` | Keeps the keyboard open when tapping outside while focused. |
| `disableDefaultPadding` | `boolean` | `true` | Removes default iOS inner padding on the native `<textarea>`. |
| `ui` | `TextareaUI` (`Partial<Record<TextareaAnatomyPart, string>>`) | `{}` | Per-slot Tailwind/utility class overrides. |
| `className` | `string` | `""` | Additional class(es) merged onto the `root` slot (`index.ts` declares `className` rather than `class`). |

### Additional Machine / Form Props (`TextareaProps`)

Declared in `@code-id-labs/textarea` (`TextareaProps`) for machine and `<c-form>` integration:

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string \| undefined` | `undefined` | Unique component id. |
| `ids` | `Record<string, any> \| undefined` | `undefined` | Sub-element id overrides. |
| `form` | `string \| undefined` | `undefined` | Target `<c-form>` id/name when multiple forms exist on the same page. |
| `formContext` | `FormHostContext \| null \| undefined` | `undefined` | Explicit reactive form host context. |
| `rules` | `FormRule[] \| undefined` | `undefined` | Field-level validation rules. |
| `validateOn` | `FormValidateOn \| undefined` | `undefined` | Field-level override for Form validation triggers. |
| `fieldDisabled` | `boolean \| undefined` | `undefined` | Form field wrapper disabled state. |

---

## Slots

| Slot | Description |
| --- | --- |
| `leading` | Custom content rendered in the leading area (`data-part="leading"`). Overrides `leadingIcon` when provided. |
| `trailing` | Custom content rendered in the trailing area (`data-part="trailing"`). Suppresses `trailingIcon` when provided; rendered alongside the trailing loading/clear conditional block. |
| `loadingIcon` | Custom loading indicator rendered inside the trailing icon wrapper when `loading` is `true`. Falls back to `<c-icon name="{{loadingIcon}}" />` when omitted. |
| `count` | Custom character counter rendered in `data-part="count"` (automatically enables the counter container even if `count` is `false`). Falls back to `<text>{{characterCount}}{{maxlength > 0 ? '/' + maxlength : ''}}</text>` when omitted. |
| `default` | Declared in component `slots` config (`default: false`), but not rendered in `index.wxml`; the input area renders the native `<textarea>` directly. |

**MiniProgram `<slot>` Constraints**: WeChat MiniProgram `<slot>` is static and does not support scoped slots or fallback children inside `<slot>`. All default UI fallbacks (`leadingIcon`, `trailingIcon`, `loadingIcon`, and the character count text) are implemented via conditional `wx:if` / `wx:else` branches gated by the `slots` flags rather than nested inside `<slot>`.

---

## Events

### MiniProgram Custom Events (`bind:*`)

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:keyboardheightchange` | Native MiniProgram `keyboardheightchange` `e.detail` (e.g. `{ height, duration }`) | Forwarded directly via `triggerEvent("keyboardheightchange", e.detail)` when the keyboard height changes. |

### Machine Callback Props (`TextareaProps`)

The runtime component forwards native `<textarea>` events (`input`, `focus`, `blur`, `confirm`, `linechange`) and clear-button taps to the machine API, which invokes the corresponding `TextareaProps` callbacks when configured:

| Callback Prop | Detail Payload | Description |
| --- | --- | --- |
| `onChange` | `{ value: string }` | Fired when the textarea value changes or is cleared. |
| `onFocus` | `{ value: string }` | Fired when the textarea gains focus. |
| `onBlur` | `{ value: string }` | Fired when the textarea loses focus. |
| `onConfirm` | `{ value: string }` | Fired when the keyboard confirm button is tapped. |
| `onClear` | `Record<string, any> \| undefined` | Fired when the clear button is tapped. |
| `onLineChange` | `{ height: number, heightRpx?: number, lineCount: number, lineHeight: number }` | Fired when line count or height changes. |

---

## Theme

Defined in `packages/core/src/theme/definitions/textarea.ts`.

### Slots

- `root` — Outer container (`flex flex-col w-full rounded-md border`)
- `base` — Native `<textarea>` element
- `placeholder` — Placeholder text styling (`text-dimmed`)
- `leading` — Leading icon/slot wrapper (`absolute start-0 top-0`)
- `leadingIcon` — `c-icon` inside the leading slot
- `trailing` — Trailing icon/clear/slot wrapper (`absolute end-0 top-0`)
- `trailingIcon` — `c-icon` inside the trailing slot
- `loadingIcon` — Spinning loading `c-icon`
- `clear` — Clickable clear button wrapper
- `clearIcon` — `c-icon` inside the clear button
- `count` — Bottom-right character counter wrapper

### Variants

- **`variant`**: `outline` | `soft` | `subtle` | `ghost` | `none`
- **`color`**: `primary` | `neutral` | `danger` | `success` | `warning` | `info` (focus-within and `data-[focused=true]` border/ring; `ghost` and `none` suppress focus ring)
- **`size`**: `xs` | `sm` | `md` | `lg` | `xl`
- **`leading`**: `true` | `false` (adds start padding to `base` per `size`)
- **`trailing`**: `true` | `false` (adds end padding to `base` per `size`)
- **`count`**: `true` | `false` (adds bottom padding to `root` per `size`)
- **`highlight`**: `true` | `false` (always shows colored border/ring on `root`)
- **`disabled`**: `true` | `false`
- **`invalid`**: `true` | `false` (applies error border/ring on `root`)
- **`autoHeight`**: `true` | `false`

### `defaultVariants`

```ts
{
  variant: "outline",
  color: "primary",
  size: "md",
  leading: false,
  trailing: false,
  count: false,
  highlight: false,
  disabled: false,
  invalid: false,
  autoHeight: false,
}
```

---

## Examples

### Basic & Character Count (WXML + TS)

```xml
<c-textarea
  value="{{bio}}"
  placeholder="Tell us about yourself..."
  maxlength="{{200}}"
  count
  clearable
  autoHeight
  bind:keyboardheightchange="onKeyboardHeightChange"
/>
```

```ts
Page({
  data: {
    bio: "",
  },
  onKeyboardHeightChange(e: WechatMiniprogram.CustomEvent) {
    console.log("keyboard height:", e.detail);
  },
});
```

### Variants, Slots & `ui` Overrides (WXML)

```xml
<c-textarea
  variant="subtle"
  color="neutral"
  size="lg"
  placeholder="Add a note"
  loading="{{submitting}}"
  ui="{{ { root: 'rounded-xl', base: 'min-h-24' } }}"
>
  <c-icon slot="leading" name="edit" />
  <text slot="count" class="text-xs text-primary">Custom counter</text>
</c-textarea>
```
