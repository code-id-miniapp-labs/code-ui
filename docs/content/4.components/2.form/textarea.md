---
title: Textarea
description: Multi-line text input component for WeChat MiniProgram with Code UI (@code-ui) Tailwind-styled theming, optional leading/trailing icons and slots, loading state, clear button, character counter, and form-field integration.
---

## Overview

`c-textarea` is a multi-line text input component for WeChat MiniProgram with Code UI (`@code-ui`) Tailwind-styled theming, optional leading and trailing icons or slots, loading indicator, clear button, character counter, and `<c-form>` / `<c-form-field>` validation integration.

## Usage

### Basic

Use `placeholder` to display hint text when the textarea is empty, and `defaultValue` for an uncontrolled initial value.

```html [index.wxml]
<c-textarea
  placeholder="Type something..."
  defaultValue="Initial notes"
/>
```

### Controlled

Use `value` with `bind:change` to control the textarea value from page state.

::code-group

```html [index.wxml]
<c-textarea
  value="{{bio}}"
  bind:change="handleBioChange"
  placeholder="Tell us about yourself..."
/>
```

```ts [index.ts]
Page({
  data: {
    bio: "",
  },
  handleBioChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ bio: e.detail.value });
  },
});
```

::

### Color

Use the `color` prop (`"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, or `"info"`) to change the focus ring color, and `highlight` to keep the colored border and ring visible even when unfocused.

```html [index.wxml]
<c-textarea color="primary" placeholder="Primary focus ring" />
<c-textarea color="neutral" highlight placeholder="Highlighted neutral" />
<c-textarea color="success" highlight placeholder="Valid feedback" />
<c-textarea color="warning" highlight placeholder="Needs review" />
<c-textarea color="danger" highlight placeholder="Error state" />
<c-textarea color="info" highlight placeholder="Informational note" />
```

### Variant

Use the `variant` prop (`"outline"`, `"soft"`, `"subtle"`, `"ghost"`, or `"none"`) to customize the visual style.

```html [index.wxml]
<c-textarea variant="outline" placeholder="Outline (default)" />
<c-textarea variant="soft" placeholder="Soft" />
<c-textarea variant="subtle" placeholder="Subtle" />
<c-textarea variant="ghost" placeholder="Ghost" />
<c-textarea variant="none" placeholder="None" />
```

### Size

Use the `size` prop (`"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`) to adjust typography, padding, and icon sizing. When unset (`""`), `c-textarea` inherits `fieldSize` from a parent form field or defaults to `"md"`.

```html [index.wxml]
<c-textarea size="xs" placeholder="Extra small" />
<c-textarea size="sm" placeholder="Small" />
<c-textarea size="md" placeholder="Medium" />
<c-textarea size="lg" placeholder="Large" />
<c-textarea size="xl" placeholder="Extra large" />
```

### Auto Height

Use `autoHeight` to automatically expand the textarea height as the user types.

```html [index.wxml]
<c-textarea
  autoHeight
  placeholder="Grows automatically with content..."
/>
```

### Character Count

Use `count` to display a character counter in the bottom-right corner, and combine it with `maxlength` to show `count/maxlength`.

```html [index.wxml]
<c-textarea
  placeholder="Write a short bio..."
  count
  maxlength="{{200}}"
/>
```

### Clearable

Use `clearable` to render a clear button in the trailing area whenever the value is non-empty and the textarea is interactive. Customize the icon with `clearIcon` (defaults to `"close"`).

::code-group

```html [index.wxml]
<c-textarea
  value="{{note}}"
  clearable
  clearIcon="close"
  bind:change="handleNoteChange"
  placeholder="Tap the clear button when non-empty"
/>
```

```ts [index.ts]
Page({
  data: {
    note: "Editable text",
  },
  handleNoteChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ note: e.detail.value });
  },
});
```

::

### Icon

Use `leadingIcon` and `trailingIcon` to render icons via `c-icon` inside the leading and trailing areas.

```html [index.wxml]
<c-textarea
  leadingIcon="edit"
  trailingIcon="check"
  placeholder="Add a comment..."
/>
```

### Loading

Use `loading` to display a spinning loading indicator in the trailing area. Customize the icon name with `loadingIcon` (defaults to `"loading"`).

::code-group

```html [index.wxml]
<c-textarea
  loading="{{submitting}}"
  loadingIcon="loading"
  placeholder="Submitting comment..."
/>
```

```ts [index.ts]
Page({
  data: {
    submitting: true,
  },
});
```

::

### Disabled, Read-only & Invalid

Use `disabled` to prevent interaction, `readOnly` to disallow editing on the native `<textarea>`, and `invalid` to apply error styling independently of form validation.

```html [index.wxml]
<c-textarea disabled placeholder="Disabled textarea" />
<c-textarea readOnly defaultValue="Read-only content" />
<c-textarea invalid placeholder="Invalid input" />
```

### Keyboard & Native Options

`c-textarea` forwards native MiniProgram `<textarea>` behavior props including `autoFocus`, `confirmType`, `confirmHold`, `showConfirmBar`, `adjustPosition`, `holdKeyboard`, `cursorSpacing`, `fixed`, `disableDefaultPadding`, `cursor`, `selectionStart`, `selectionEnd`, `placeholderClass`, and `placeholderStyle`.

```html [index.wxml]
<c-textarea
  placeholder="Send a reply..."
  placeholderClass="italic"
  placeholderStyle="color: #9ca3af;"
  autoFocus
  confirmType="send"
  confirmHold
  showConfirmBar="{{false}}"
  cursorSpacing="{{16}}"
  adjustPosition
  holdKeyboard
  disableDefaultPadding
/>
```

### Form Integration

Nest `<c-textarea>` inside `<c-form-field>` within `<c-form>` and pass `name`, `required`, and `rules` on `<c-form-field>`.

::code-group

```html [index.wxml]
<c-form id="feedback-form" validateOn="blur" bind:submit="handleSubmit">
  <c-form-field
    name="message"
    label="Message"
    required="{{true}}"
    rules="{{messageRules}}"
  >
    <c-textarea placeholder="Enter your feedback..." />
  </c-form-field>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    messageRules: [
      { required: true, message: "Message is required" },
    ],
  },
  handleSubmit(e: WechatMiniprogram.CustomEvent) {
    console.log("Submitted:", e.detail.value);
  },
});
```

::

### Slots

Use the `leading`, `trailing`, `loadingIcon`, and `count` named slots to customize parts of the textarea.

- `leading` overrides `leadingIcon`.
- `trailing` suppresses `trailingIcon` and renders alongside loading/clear controls.
- `loadingIcon` replaces the default spinner icon when `loading` is `true`.
- `count` provides a custom bottom-right counter and enables the counter container even when `count` is `false`.

```html [index.wxml]
<c-textarea
  value="{{content}}"
  loading="{{isSaving}}"
  clearable
  placeholder="Write something..."
>
  <c-icon slot="leading" name="edit" />
  <text slot="trailing" class="text-xs text-dimmed">MD</text>
  <text slot="loadingIcon" class="text-xs text-primary">...</text>
  <text slot="count" class="text-xs text-primary">Custom counter</text>
</c-textarea>
```

### Events

`c-textarea` emits `bind:change`, `bind:focus`, `bind:blur`, `bind:confirm`, `bind:clear`, `bind:lineChange`, and `bind:keyboardheightchange` as MiniProgram custom events.

::code-group

```html [index.wxml]
<c-textarea
  value="{{draft}}"
  clearable
  bind:change="onChange"
  bind:focus="onFocus"
  bind:blur="onBlur"
  bind:confirm="onConfirm"
  bind:clear="onClear"
  bind:lineChange="onLineChange"
  bind:keyboardheightchange="onKeyboardHeightChange"
  placeholder="Type to inspect events..."
/>
```

```ts [index.ts]
Page({
  data: {
    draft: "",
  },
  onChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ draft: e.detail.value });
  },
  onFocus(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("focus:", e.detail.value);
  },
  onBlur(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("blur:", e.detail.value);
  },
  onConfirm(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("confirm:", e.detail.value);
  },
  onClear() {
    console.log("cleared");
  },
  onLineChange(
    e: WechatMiniprogram.CustomEvent<{
      height: number;
      heightRpx?: number;
      lineCount: number;
      lineHeight: number;
    }>,
  ) {
    console.log("line change:", e.detail);
  },
  onKeyboardHeightChange(e: WechatMiniprogram.CustomEvent) {
    console.log("keyboard height:", e.detail);
  },
});
```

::

### Custom Styling

Use `className` to add classes to the `root` slot, and `ui` to override classes for individual theme slots (`root`, `base`, `placeholder`, `leading`, `leadingIcon`, `trailing`, `trailingIcon`, `loadingIcon`, `clear`, `clearIcon`, `count`).

```html [index.wxml]
<c-textarea
  placeholder="Custom styled textarea"
  className="my-4"
  ui="{{ { root: 'rounded-xl', base: 'min-h-24' } }}"
/>
```

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number \| null` | `null` | Controlled textarea value. |
| `defaultValue` | `string \| number \| null` | `""` | Initial value when used uncontrolled. |
| `name` | `string` | `""` | Form field name for `<textarea>` and Form registration. |
| `disabled` | `boolean` | `false` | Disables the textarea. |
| `readOnly` | `boolean` | `false` | Makes the textarea readOnly (disables editing on native `<textarea>`). |
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
| `className` | `string` | `""` | Additional class(es) merged onto the `root` slot (used instead of `class`). |

### Form & Machine Props

Additional properties supported on `TextareaProps` for `<c-form>` and machine integration:

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string \| undefined` | `undefined` | Unique component id. |
| `ids` | `Record<string, any> \| undefined` | `undefined` | Sub-element id overrides. |
| `form` | `string \| undefined` | `undefined` | Target `<c-form>` id/name when multiple forms exist on the same page. |
| `formContext` | `FormHostContext \| null \| undefined` | `undefined` | Explicit reactive form host context. |
| `rules` | `FormRule[] \| undefined` | `undefined` | Field-level validation rules. |
| `validateOn` | `FormValidateOn \| undefined` | `undefined` | Field-level override for Form validation triggers. |
| `fieldDisabled` | `boolean \| undefined` | `undefined` | Form field wrapper disabled state. |

## Slots

| Slot | Description |
| --- | --- |
| `leading` | Custom content rendered in the leading area. Overrides `leadingIcon` when provided. |
| `trailing` | Custom content rendered in the trailing area. Suppresses `trailingIcon` when provided and renders alongside the loading/clear controls. |
| `loadingIcon` | Custom loading indicator rendered when `loading` is `true`. Falls back to `c-icon` using `loadingIcon` when omitted. |
| `count` | Custom character counter rendered in the bottom-right counter container (enables the counter container even when `count` is `false`). |

## Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: string }` | Fired when the textarea value changes or is cleared (maps to `onChange` in `TextareaProps`). |
| `bind:focus` | `{ value: string }` | Fired when the textarea gains focus (maps to `onFocus` in `TextareaProps`). |
| `bind:blur` | `{ value: string }` | Fired when the textarea loses focus (maps to `onBlur` in `TextareaProps`). |
| `bind:confirm` | `{ value: string }` | Fired when the keyboard confirm button is tapped (maps to `onConfirm` in `TextareaProps`). |
| `bind:clear` | `Record<string, any> \| undefined` | Fired when the clear button is tapped (maps to `onClear` in `TextareaProps`). |
| `bind:lineChange` | `{ height: number, heightRpx?: number, lineCount: number, lineHeight: number }` | Fired when line count or height changes (maps to `onLineChange` in `TextareaProps`). |
| `bind:keyboardheightchange` | `{ height: number, duration: number }` | Forwarded from the native `<textarea>` when the keyboard height changes. |

## Theme

Customize the `textarea` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    textarea: {
      slots: {
        root: "relative flex flex-col w-full box-border rounded-md border transition-colors focus-within:outline-none",
        base: "w-full box-border border-0 p-0 m-0 bg-transparent text-highlighted focus:outline-none disabled:cursor-not-allowed disabled:text-dimmed resize-none leading-normal min-h-12",
        placeholder: "text-dimmed",
        leading:
          "absolute start-0 top-0 flex items-center justify-center pointer-events-none text-dimmed",
        leadingIcon: "shrink-0",
        trailing:
          "absolute end-0 top-0 flex items-center justify-center text-dimmed",
        trailingIcon: "shrink-0",
        loadingIcon: "w-full h-full animate-spin",
        clear:
          "cursor-pointer pointer-events-auto transition-colors hover:text-default",
        clearIcon: "size-3.5",
        count:
          "absolute end-0 bottom-0 flex items-center text-dimmed pointer-events-none tabular-nums",
      },
      variants: {
        color: {
          primary: {
            root: "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 data-[focused=true]:border-primary data-[focused=true]:ring-2 data-[focused=true]:ring-primary/20",
          },
          secondary: {
            root: "focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 data-[focused=true]:border-secondary data-[focused=true]:ring-2 data-[focused=true]:ring-secondary/20",
          },
          danger: {
            root: "focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/20 data-[focused=true]:border-danger data-[focused=true]:ring-2 data-[focused=true]:ring-danger/20",
          },
          success: {
            root: "focus-within:border-success focus-within:ring-2 focus-within:ring-success/20 data-[focused=true]:border-success data-[focused=true]:ring-2 data-[focused=true]:ring-success/20",
          },
          warning: {
            root: "focus-within:border-warning focus-within:ring-2 focus-within:ring-warning/20 data-[focused=true]:border-warning data-[focused=true]:ring-2 data-[focused=true]:ring-warning/20",
          },
          info: {
            root: "focus-within:border-info focus-within:ring-2 focus-within:ring-info/20 data-[focused=true]:border-info data-[focused=true]:ring-2 data-[focused=true]:ring-info/20",
          },
          neutral: {
            root: "focus-within:border-inverted focus-within:ring-2 focus-within:ring-inverted/20 data-[focused=true]:border-inverted data-[focused=true]:ring-2 data-[focused=true]:ring-inverted/20",
          },
        },
        variant: {
          outline: {
            root: "bg-default text-highlighted border-accented",
          },
          soft: {
            root: "bg-elevated text-highlighted border-transparent",
          },
          subtle: {
            root: "bg-elevated text-highlighted border-accented",
          },
          ghost: {
            root: "bg-transparent text-highlighted border-transparent focus-within:border-transparent focus-within:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
          },
          none: {
            root: "bg-transparent text-highlighted border-0 focus-within:border-transparent focus-within:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
          },
        },
        size: {
          xs: {
            root: "text-xs p-2 min-h-16",
            base: "text-xs min-h-8",
            placeholder: "text-xs",
            leading: "ps-2 pt-2",
            trailing: "pe-2 pt-2",
            count: "pe-2 pb-1.5 text-xs",
            leadingIcon: "w-3.5 h-3.5",
            trailingIcon: "w-3.5 h-3.5",
            clear: "text-xs",
          },
          sm: {
            root: "text-xs p-2.5 min-h-20",
            base: "text-xs min-h-8",
            placeholder: "text-xs",
            leading: "ps-2.5 pt-2.5",
            trailing: "pe-2.5 pt-2.5",
            count: "pe-2.5 pb-2 text-xs",
            leadingIcon: "w-4 h-4",
            trailingIcon: "w-4 h-4",
            clear: "text-xs",
          },
          md: {
            root: "text-sm p-3 min-h-24",
            base: "text-sm min-h-12",
            placeholder: "text-sm",
            leading: "ps-3 pt-3",
            trailing: "pe-3 pt-3",
            count: "pe-3 pb-2 text-xs",
            leadingIcon: "w-4 h-4",
            trailingIcon: "w-4 h-4",
            clear: "text-sm",
          },
          lg: {
            root: "text-base p-3.5 min-h-28",
            base: "text-base min-h-16",
            placeholder: "text-base",
            leading: "ps-3.5 pt-3.5",
            trailing: "pe-3.5 pt-3.5",
            count: "pe-3.5 pb-2.5 text-sm",
            leadingIcon: "w-5 h-5",
            trailingIcon: "w-5 h-5",
            clear: "text-base",
          },
          xl: {
            root: "text-lg p-4 min-h-32",
            base: "text-lg min-h-20",
            placeholder: "text-lg",
            leading: "ps-4 pt-4",
            trailing: "pe-4 pt-4",
            count: "pe-4 pb-3 text-sm",
            leadingIcon: "w-5 h-5",
            trailingIcon: "w-5 h-5",
            clear: "text-base",
          },
        },
        leading: {
          true: {
            root: "",
          },
          false: {
            root: "",
          },
        },
        trailing: {
          true: {
            root: "",
          },
          false: {
            root: "",
          },
        },
        count: {
          true: {
            root: "",
          },
          false: {
            root: "",
          },
        },
        highlight: {
          true: {
            root: "",
          },
          false: {
            root: "",
          },
        },
        disabled: {
          true: {
            root: "opacity-60 cursor-not-allowed bg-elevated",
            base: "cursor-not-allowed text-dimmed",
          },
          false: {
            root: "",
            base: "",
          },
        },
        invalid: {
          true: {
            root: "",
          },
          false: {
            root: "",
          },
        },
        autoHeight: {
          true: {
            root: "min-h-0",
            base: "h-auto",
          },
          false: {
            base: "h-full min-h-18",
          },
        },
      },
      compoundVariants: [
        {
          leading: true,
          size: "xs",
          class: {
            base: "ps-5",
          },
        },
        {
          leading: true,
          size: "sm",
          class: {
            base: "ps-6",
          },
        },
        {
          leading: true,
          size: "md",
          class: {
            base: "ps-7",
          },
        },
        {
          leading: true,
          size: "lg",
          class: {
            base: "ps-8",
          },
        },
        {
          leading: true,
          size: "xl",
          class: {
            base: "ps-9",
          },
        },
        {
          trailing: true,
          size: "xs",
          class: {
            base: "pe-5",
          },
        },
        {
          trailing: true,
          size: "sm",
          class: {
            base: "pe-6",
          },
        },
        {
          trailing: true,
          size: "md",
          class: {
            base: "pe-7",
          },
        },
        {
          trailing: true,
          size: "lg",
          class: {
            base: "pe-8",
          },
        },
        {
          trailing: true,
          size: "xl",
          class: {
            base: "pe-9",
          },
        },
        {
          count: true,
          size: "xs",
          class: {
            root: "pb-6",
          },
        },
        {
          count: true,
          size: "sm",
          class: {
            root: "pb-6",
          },
        },
        {
          count: true,
          size: "md",
          class: {
            root: "pb-7",
          },
        },
        {
          count: true,
          size: "lg",
          class: {
            root: "pb-8",
          },
        },
        {
          count: true,
          size: "xl",
          class: {
            root: "pb-9",
          },
        },
        {
          color: "primary",
          highlight: true,
          class: {
            root: "border-primary ring-2 ring-primary/20",
          },
        },
        {
          color: "secondary",
          highlight: true,
          class: {
            root: "border-secondary ring-2 ring-secondary/20",
          },
        },
        {
          color: "danger",
          highlight: true,
          class: {
            root: "border-danger ring-2 ring-danger/20",
          },
        },
        {
          color: "success",
          highlight: true,
          class: {
            root: "border-success ring-2 ring-success/20",
          },
        },
        {
          color: "warning",
          highlight: true,
          class: {
            root: "border-warning ring-2 ring-warning/20",
          },
        },
        {
          color: "info",
          highlight: true,
          class: {
            root: "border-info ring-2 ring-info/20",
          },
        },
        {
          color: "neutral",
          highlight: true,
          class: {
            root: "border-inverted ring-2 ring-inverted/20",
          },
        },
        {
          invalid: true,
          class: {
            root: "border-danger ring-2 ring-danger/20 focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/20 data-[focused=true]:border-danger data-[focused=true]:ring-2 data-[focused=true]:ring-danger/20",
          },
        },
      ],
      defaultVariants: {
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
      },
    }
  }
})
```
