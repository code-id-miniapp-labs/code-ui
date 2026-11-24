---
title: Input
description: Styled, accessible single-line text input component wrapping the WeChat MiniProgram native <input>, with controlled/uncontrolled value support, clear button, loading indicator, leading/trailing icons or slots, and form field integration.
---

## Overview

`c-input` (`Input`) is a styled, accessible single-line text input component wrapping the WeChat MiniProgram native `<input>`. It supports controlled and uncontrolled values, a clear button, a loading indicator, leading/trailing icons or custom slots, and form validation integration.

- **Related Components**:
  - Integrates with `<c-form>` and `<c-form-field>` (`form`, `name`, `rules`, `validateOn`, `fieldDisabled`, and inherited `fieldSize` fallback when `size` is unset).
  - Uses `<c-icon>` internally for leading, trailing, clear, and loading icons.

::callout{icon="i-lucide-info"}
`c-input` uses `className` (rather than `class`) as its root class override property alongside `ui` for per-slot customization.
::

## Usage

### Basic

Use `placeholder` to display hint text when the input is empty, and `defaultValue` for an uncontrolled initial value.

```html [index.wxml]
<c-input
  placeholder="Enter your username"
  defaultValue="alice"
/>
```

### Controlled

Use `value` with `bind:change` to control the input value from page state.

::code-group

```html [index.wxml]
<c-input
  value="{{username}}"
  bind:change="handleUsernameChange"
  placeholder="Enter username"
/>
```

```ts [index.ts]
Page({
  data: {
    username: "",
  },
  handleUsernameChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ username: e.detail.value });
  },
});
```

::

### Type & Password

Use `type` (`"text"`, `"number"`, `"idcard"`, `"digit"`, `"safe-password"`, or `"nickname"`) to configure the native MiniProgram `<input>` keyboard, and `password` to mask entered characters.

```html [index.wxml]
<c-input type="text" placeholder="Text input" />
<c-input type="number" placeholder="Number input" />
<c-input type="digit" placeholder="Decimal number" />
<c-input type="idcard" placeholder="ID card number" />
<c-input type="nickname" placeholder="WeChat nickname" />
<c-input password="{{true}}" placeholder="Password" />
```

### Color

Use `color` (`"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, or `"info"`) to change the focus ring accent color, and `highlight` to keep the colored border and ring visible when unfocused.

```html [index.wxml]
<c-input color="primary" placeholder="Primary focus ring" />
<c-input color="neutral" highlight="{{true}}" placeholder="Neutral highlight" />
<c-input color="success" highlight="{{true}}" placeholder="Success highlight" />
<c-input color="warning" highlight="{{true}}" placeholder="Warning highlight" />
<c-input color="danger" highlight="{{true}}" placeholder="Danger highlight" />
<c-input color="info" highlight="{{true}}" placeholder="Info highlight" />
```

### Variant

Use `variant` (`"outline"`, `"soft"`, `"subtle"`, `"ghost"`, or `"none"`) to change the visual style.

```html [index.wxml]
<c-input variant="outline" placeholder="Outline (default)" />
<c-input variant="soft" placeholder="Soft" />
<c-input variant="subtle" placeholder="Subtle" />
<c-input variant="ghost" placeholder="Ghost" />
<c-input variant="none" placeholder="None" />
```

### Size

Use `size` (`"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`) to control height, padding, typography, and icon sizing. When unset (`""`), `c-input` inherits `fieldSize` from a parent form field or falls back to `"md"`.

```html [index.wxml]
<c-input size="xs" placeholder="Extra small" />
<c-input size="sm" placeholder="Small" />
<c-input size="md" placeholder="Medium" />
<c-input size="lg" placeholder="Large" />
<c-input size="xl" placeholder="Extra large" />
```

### Disabled, Read-only & Invalid

Use `disabled` to prevent interaction, `readOnly` to disallow editing, and `invalid` to apply error border and ring styling independently of form validation.

```html [index.wxml]
<c-input disabled="{{true}}" placeholder="Disabled input" />
<c-input readOnly="{{true}}" defaultValue="Read-only value" />
<c-input invalid="{{true}}" placeholder="Invalid input" />
```

### Icon

Use `leadingIcon` and `trailingIcon` to render icons via `<c-icon>` in the leading and trailing areas.

```html [index.wxml]
<c-input
  leadingIcon="search"
  trailingIcon="chevron-right"
  placeholder="Search..."
/>
```

### Clearable

Use `clearable` to show a clear button when the input is non-empty and editable. Customize the icon with `clearIcon` (defaults to `"close"`).

::code-group

```html [index.wxml]
<c-input
  value="{{query}}"
  clearable="{{true}}"
  clearIcon="close"
  bind:change="handleQueryChange"
  bind:clear="handleQueryClear"
  placeholder="Type to search..."
/>
```

```ts [index.ts]
Page({
  data: {
    query: "code-ui",
  },
  handleQueryChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ query: e.detail.value });
  },
  handleQueryClear() {
    this.setData({ query: "" });
  },
});
```

::

### Loading

Use `loading` to show a spinning indicator in the trailing area. Customize the icon with `loadingIcon` (defaults to `"loading"`).

::code-group

```html [index.wxml]
<c-input
  loading="{{isSearching}}"
  loadingIcon="loading"
  placeholder="Searching..."
/>
```

```ts [index.ts]
Page({
  data: {
    isSearching: true,
  },
});
```

::

### Slots

Use the `leading`, `trailing`, and `loadingIcon` named slots for custom adornments (`c-input` has no default unnamed slot):

- `leading` replaces `leadingIcon` when provided.
- `trailing` replaces `trailingIcon` when provided, while `loading` and `clearable` indicators can still render alongside it.
- `loadingIcon` replaces the built-in `loadingIcon` icon when `loading` is `true`.

::code-group

```html [index.wxml]
<c-input
  value="{{amount}}"
  loading="{{isConverting}}"
  clearable="{{true}}"
  placeholder="0.00"
>
  <text slot="leading" class="text-xs text-muted">USD</text>
  <text slot="trailing" class="text-xs text-muted">.00</text>
  <text slot="loadingIcon" class="text-xs text-primary">...</text>
</c-input>
```

```ts [index.ts]
Page({
  data: {
    amount: "100",
    isConverting: false,
  },
});
```

::

### Keyboard & Placeholder Options

`c-input` forwards native MiniProgram `<input>` options including `autoFocus`, `placeholderStyle`, `maxlength`, `cursorSpacing`, `confirmType`, `confirmHold`, `cursor`, `selectionStart`, `selectionEnd`, `adjustPosition`, and `holdKeyboard`. Use `ui.placeholder` (or global `components.input.slots.placeholder` in `cui.config.ts`) to style placeholder text.

```html [index.wxml]
<c-input
  placeholder="Search products"
  ui="{{ { placeholder: 'italic text-muted' } }}"
  placeholderStyle="color: #9ca3af;"
  maxlength="{{50}}"
  autoFocus="{{true}}"
  confirmType="search"
  confirmHold="{{true}}"
  cursorSpacing="{{16}}"
  cursor="{{0}}"
  selectionStart="{{-1}}"
  selectionEnd="{{-1}}"
  adjustPosition="{{true}}"
  holdKeyboard="{{false}}"
/>
```

### Events

`c-input` forwards `bind:keyboardheightchange` from the native `<input>` and emits MiniProgram events (`bind:change`, `bind:focus`, `bind:blur`, `bind:confirm`, `bind:clear`).

::code-group

```html [index.wxml]
<c-input
  value="{{username}}"
  clearable="{{true}}"
  bind:change="onChange"
  bind:focus="onFocus"
  bind:blur="onBlur"
  bind:confirm="onConfirm"
  bind:clear="onClear"
  bind:keyboardheightchange="onKeyboardHeightChange"
  placeholder="Enter username"
/>
```

```ts [index.ts]
Page({
  data: {
    username: "",
  },
  onChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ username: e.detail.value });
  },
  onFocus(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("Focus:", e.detail.value);
  },
  onBlur(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("Blur:", e.detail.value);
  },
  onConfirm(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("Confirm:", e.detail.value);
  },
  onClear() {
    console.log("Cleared");
  },
  onKeyboardHeightChange(e: WechatMiniprogram.CustomEvent) {
    console.log("Keyboard height:", e.detail.height);
  },
});
```

::

### Form Integration

Nest `<c-input>` inside `<c-form-field>` within `<c-form>`. Place `name`, `label`, `required`, and `rules` on `<c-form-field>`, and configure `validateOn` and `bind:submit` on `<c-form>`.

::code-group

```html [index.wxml]
<c-form
  id="profile-form"
  validateOn="{{['blur']}}"
  bind:submit="handleSubmit"
>
  <c-form-field
    name="email"
    label="Email"
    required="{{true}}"
    rules="{{emailRules}}"
  >
    <c-input placeholder="you@example.com" />
  </c-form-field>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    emailRules: [
      { required: true, message: "Email is required" },
      { email: true, message: "Invalid email address format" },
    ],
  },
  handleSubmit(e: WechatMiniprogram.CustomEvent) {
    console.log("Form values:", e.detail.values);
  },
});
```

::

### Custom Styling

Use `className` to add classes to the `root` slot, and `ui` to override classes for individual theme slots (`root`, `base`, `nativeInput`, `leading`, `leadingIcon`, `trailing`, `trailingIcon`, `iconInner`, `loadingIcon`).

```html [index.wxml]
<c-input
  placeholder="Rounded search input"
  leadingIcon="search"
  className="my-4"
  ui="{{ { base: 'rounded-full', nativeInput: 'text-sm' } }}"
/>
```

## State Machine

Click any active transition or event button below to simulate the `input` state machine live:

::machine-visualizer{name="input"}
::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number \| null` | `null` | Controlled input value. |
| `defaultValue` | `string \| number \| null` | `""` | Initial uncontrolled value. |
| `name` | `string` | `""` | Form field name for form registration and native input `name`. |
| `type` | `"text" \| "number" \| "idcard" \| "digit" \| "safe-password" \| "nickname"` | `"text"` | Native MiniProgram `<input>` type. |
| `variant` | `"outline" \| "soft" \| "subtle" \| "ghost" \| "none"` | `"outline"` | Visual style variant. |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"` | `"primary"` | Accent color for focus and highlight rings. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Input height, font size, padding, and icon sizing. Resolves to `fieldSize` or `"md"` when unset. |
| `highlight` | `boolean` | `false` | Always display the colored border/ring highlight. |
| `disabled` | `boolean` | `false` | Disables user interaction. |
| `readOnly` | `boolean` | `false` | Makes the input read-only. |
| `invalid` | `boolean \| null` | `null` | Marks the input as invalid (also derived from form validation). |
| `clearable` | `boolean` | `false` | Shows a clear button when non-empty and editable (not disabled or read-only). |
| `clearIcon` | `string` | `"close"` | Icon name rendered for the clear button. |
| `loading` | `boolean` | `false` | Shows a trailing loading indicator. |
| `loadingIcon` | `string` | `"loading"` | Icon name rendered while `loading` is `true`. |
| `leadingIcon` | `string` | `""` | Icon name rendered in the leading area. |
| `trailingIcon` | `string` | `""` | Icon name rendered in the trailing area. |
| `autoFocus` | `boolean` | `false` | Focuses the input on mount. |
| `password` | `boolean` | `false` | Masks input characters as a password. |
| `placeholder` | `string` | `""` | Placeholder text shown when empty. |
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
| `className` | `string` | `""` | Additional class applied to the `root` slot. |

## Slots

`c-input` has no default unnamed `<slot />`. The following named slots are supported:

| Name | Description |
| --- | --- |
| `leading` | Custom content rendered before the native `<input>`. Replaces the built-in `leadingIcon` when provided. |
| `trailing` | Custom content rendered after the native `<input>`. Replaces the built-in `trailingIcon` when provided, while `loading` and clear button indicators can still render alongside it. |
| `loadingIcon` | Custom loading indicator rendered when `loading` is `true`. Replaces the built-in `loadingIcon` icon when provided. |

## Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: string }` | Fired when the input value changes. |
| `bind:focus` | `{ value: string }` | Fired when the input receives focus. |
| `bind:blur` | `{ value: string }` | Fired when the input loses focus. |
| `bind:confirm` | `{ value: string }` | Fired when the keyboard confirm button is tapped. |
| `bind:clear` | `Record<string, any>` | Fired when the clear button is tapped. |
| `bind:keyboardheightchange` | `Record<string, any>` | Forwarded directly from the native `<input>` when the keyboard height changes (e.g. `{ height, duration }`). |

## Theme

Customize the `input` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    input: {
      slots: {
        root: "relative flex items-center w-full",
        base: "relative w-full min-h-0 flex items-center overflow-hidden box-border rounded-md border text-highlighted transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-elevated disabled:text-dimmed",
        nativeInput:
          "flex-1 min-w-0 w-full min-h-0 bg-transparent border-0 p-0 m-0 font-sans text-inherit leading-normal placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:text-dimmed",
        placeholder: "text-dimmed",
        leading: "shrink-0 flex items-center justify-center text-dimmed",
        leadingIcon:
          "inline-flex items-center justify-center shrink-0 leading-none",
        trailing: "shrink-0 flex items-center justify-center gap-1 text-dimmed",
        trailingIcon:
          "inline-flex items-center justify-center shrink-0 leading-none",
        iconInner: "w-full h-full block",
        loadingIcon: "w-full h-full block animate-spin",
      },
      variants: {
        color: Object.assign(
          Object.fromEntries(
            colors.map((color) => [
              color,
              {
                base: `focus:border-${color} focus:ring-2 focus:ring-${color}/20 data-[focused=true]:border-${color} data-[focused=true]:ring-2 data-[focused=true]:ring-${color}/20`,
              },
            ]),
          ),
          {
            neutral: {
              base: "focus:border-inverted focus:ring-2 focus:ring-inverted/20 data-[focused=true]:border-inverted data-[focused=true]:ring-2 data-[focused=true]:ring-inverted/20",
            },
          },
        ),
        variant: {
          outline: {
            base: "bg-default text-highlighted border-accented",
          },
          soft: {
            base: "bg-elevated text-highlighted border-transparent",
          },
          subtle: {
            base: "bg-elevated text-highlighted border-accented",
          },
          ghost: {
            base: "bg-transparent text-highlighted border-transparent focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
          },
          none: {
            base: "bg-transparent text-highlighted border-0 focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
          },
        },
        size: {
          xs: {
            base: "h-7 text-xs px-2 gap-1",
            leadingIcon: "size-3",
            trailingIcon: "size-3",
          },
          sm: {
            base: "h-8 text-xs px-2.5 gap-1.5",
            leadingIcon: "size-4",
            trailingIcon: "size-4",
          },
          md: {
            base: "h-9 text-sm px-3 gap-1.5",
            leadingIcon: "size-4",
            trailingIcon: "size-4",
          },
          lg: {
            base: "h-10 text-base px-3.5 gap-2",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
          },
          xl: {
            base: "h-11 text-lg px-4 gap-2",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
          },
        },
        leading: {
          true: { base: "" },
          false: { base: "" },
        },
        trailing: {
          true: { base: "" },
          false: { base: "" },
        },
        highlight: {
          true: { base: "" },
          false: { base: "" },
        },
        disabled: {
          true: {
            root: "opacity-60 cursor-not-allowed",
            base: "cursor-not-allowed bg-elevated text-dimmed",
          },
          false: {
            base: "",
          },
        },
        invalid: {
          true: { base: "" },
          false: { base: "" },
        },
      },
      compoundVariants: [
        ...colors.map((color) => ({
          color,
          highlight: true as const,
          class: {
            base: `border-${color} ring-2 ring-${color}/20`,
          },
        })),
        {
          color: "neutral" as const,
          highlight: true as const,
          class: {
            base: "border-inverted ring-2 ring-inverted/20",
          },
        },
        {
          invalid: true as const,
          class: {
            base: `border-${errorColor} ring-2 ring-${errorColor}/20 focus:border-${errorColor} focus:ring-2 focus:ring-${errorColor}/20 data-[focused=true]:border-${errorColor} data-[focused=true]:ring-2 data-[focused=true]:ring-${errorColor}/20`,
          },
        },
      ],
      defaultVariants: {
        variant: "outline",
        color: "primary",
        size: "md",
        leading: false,
        trailing: false,
        highlight: false,
        disabled: false,
        invalid: false,
      },
    }
  }
})
```
