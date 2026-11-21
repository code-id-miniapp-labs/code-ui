---
title: FormField
description: Form field layout and validation wrapper that renders an optional label, required indicator, hint, description, control container, and error or help text while integrating with a form host and child controls.
---

## Overview

`c-form-field` is a form field layout and validation wrapper component. It renders an optional label, required indicator, hint, description, wrapped form control container, and validation error or help text, while integrating with an enclosing form host and child form controls.

- **Related Components**:
  - **Parent**: Form container (e.g. `c-form`) providing form host context (`formContext` or injected via `form`).
  - **Children**: Form input/control components placed in the default slot, which receive field state and validation context.

## Usage

### Basic

Wrap a form control in `c-form-field` and pass `name` and `label` to render a labeled field container.

```html
<c-form-field name="email" label="Email">
  <c-input placeholder="Enter your email" />
</c-form-field>
```

### Required

Set `required="{{true}}"` to mark the field as required and display an asterisk (`*`) indicator next to the label.

```html
<c-form-field name="email" label="Email" required="{{true}}">
  <c-input placeholder="Enter your email" />
</c-form-field>
```

### Description

Use the `description` prop to add descriptive text below the label row.

```html
<c-form-field
  name="email"
  label="Email"
  description="We will never share your email with anyone else."
>
  <c-input placeholder="you@example.com" />
</c-form-field>
```

### Hint

Use the `hint` prop to display trailing hint text opposite the label.

```html
<c-form-field name="email" label="Email" hint="Optional">
  <c-input placeholder="you@example.com" />
</c-form-field>
```

### Help

Use the `help` prop (or `helperText` as a fallback alias when `help` is empty) to display helper text below the control when no error is shown.

```html
<c-form-field
  name="email"
  label="Email"
  help="Use your work email address."
>
  <c-input placeholder="you@company.com" />
</c-form-field>
```

### Error

Use the `error` prop to display an explicit validation error message. When `error` is set, it overrides form validation errors and replaces `help` text.

::code-group

```html [index.wxml]
<c-form-field
  name="email"
  label="Email"
  help="Use your work email address."
  error="{{emailError}}"
>
  <c-input
    value="{{email}}"
    placeholder="you@example.com"
    bind:change="onEmailChange"
  />
</c-form-field>
```

```ts [index.ts]
Page({
  data: {
    email: "invalid-email",
    emailError: "Please enter a valid email address.",
  },
  onEmailChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({
      email: e.detail.value,
      emailError: "",
    });
  },
});
```

::

### Validation & Form Integration

Pass `rules` to validate the field inside a form host. Use `form` to target a specific `<c-form>` by name, or `formContext` to pass an explicit `FormHostContext` object.

::code-group

```html [index.wxml]
<c-form id="signup" validateOn="submit" bind:submit="onSubmit">
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
      { required: true, message: "Email is required." },
      { email: true, message: "Enter a valid email address." },
    ],
  },
  onSubmit(e: WechatMiniprogram.CustomEvent) {
    console.log("Submitted:", e.detail.values);
  },
});
```

::

### Size

Use the `size` prop to control spacing and typography across `"xs"`, `"sm"`, `"md"`, `"lg"`, and `"xl"`.

```html
<c-form-field name="xsField" label="Extra Small" size="xs">
  <c-input placeholder="xs" />
</c-form-field>

<c-form-field name="smField" label="Small" size="sm">
  <c-input placeholder="sm" />
</c-form-field>

<c-form-field name="mdField" label="Medium" size="md">
  <c-input placeholder="md (default)" />
</c-form-field>

<c-form-field name="lgField" label="Large" size="lg">
  <c-input placeholder="lg" />
</c-form-field>

<c-form-field name="xlField" label="Extra Large" size="xl">
  <c-input placeholder="xl" />
</c-form-field>
```

### Disabled

Set `disabled="{{true}}"` to disable the field and propagate disabled state to child controls (also inherited automatically from an enclosing form host).

```html
<c-form-field name="email" label="Email" disabled="{{true}}">
  <c-input placeholder="Disabled field" />
</c-form-field>
```

### Slots

Customize parts of the field using the `label`, `hint`, `description`, `error`, and `help` named slots alongside the default control slot.

```html
<c-form-field name="username" required="{{true}}">
  <view slot="label" class="font-semibold">Username</view>
  <text slot="hint" class="text-xs text-muted">3–20 characters</text>
  <text slot="description">Visible on your public profile.</text>
  <c-input placeholder="johndoe" />
  <text slot="help">Letters and numbers only.</text>
</c-form-field>
```

### Class Overrides

Use `ui` to override individual theme slot classes and `className` to append classes to the `root` slot.

```html
<c-form-field
  name="username"
  label="Username"
  ui="{{ { label: 'text-primary', description: 'italic' } }}"
  description="Custom styled field."
  className="mb-4"
>
  <c-input placeholder="johndoe" />
</c-form-field>
```

## State Machine

Click any active transition or event button below to simulate the `form-field` state machine live:

::machine-visualizer{name="form-field"}
::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `String` | `""` | Field identifier used for form registration, validation, and `data-name`. |
| `form` | `String` | `""` | Target form identifier when connecting to a form host by name. |
| `formContext` | `Object` | `undefined` | Explicit `FormHostContext` object (overrides injected form host). |
| `label` | `String` | `""` | Label text displayed above the field container. |
| `required` | `Boolean` | `false` | Marks the field as required and renders an asterisk (`*`) indicator next to the label. |
| `disabled` | `Boolean` | `false` | Disables the field (also inherits disabled state from the connected form host). |
| `rules` | `Array` | `[]` | Array of `FormRule` validation rules applied to this field. |
| `error` | `String` | `""` | Explicit error message; overrides form validation errors when set. |
| `description` | `String` | `""` | Descriptive text rendered below the label row. |
| `hint` | `String` | `""` | Trailing hint text rendered opposite the label. |
| `help` | `String` | `""` | Helper text rendered below the container when no error is displayed. |
| `helperText` | `String` | `""` | Alias/fallback for `help` (used when `help` is empty). |
| `size` | `String` | `"md"` | Size variant for spacing and typography: `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`. |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `String` | `""` | Additional class string applied to the `root` slot. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Main form control area inside the `container` wrapper. |
| `label` | Custom label content inside `labelInner` (before the `*` required indicator). |
| `hint` | Custom trailing content inside `labelWrapper`. |
| `description` | Custom description content inside `wrapper`, below `labelWrapper`. |
| `error` | Custom error content rendered below `container`. |
| `help` | Custom helper content rendered below `container`. |

## Events

None. `c-form-field` does not emit custom `bind:*` component events.

## Theme

Customize the `form-field` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    formField: {
      slots: {
        root: "flex flex-col gap-1.5 w-full",
        wrapper: "flex flex-col gap-0.5",
        labelWrapper: "flex items-center justify-between gap-1.5",
        labelInner: "flex items-center gap-1",
        label: "block text-sm font-medium text-highlighted",
        container: "relative w-full",
        description: "text-xs text-muted",
        error: "text-xs text-danger font-medium mt-0.5",
        hint: "text-xs text-dimmed",
        help: "text-xs text-muted mt-0.5",
        required: "text-xs text-danger font-bold",
      },
      variants: {
        size: {
          xs: {
            root: "gap-1",
            label: "text-xs",
            description: "text-2xs",
            error: "text-2xs",
            help: "text-2xs",
            hint: "text-2xs",
          },
          sm: {
            root: "gap-1",
            label: "text-xs",
            description: "text-xs",
            error: "text-xs",
            help: "text-xs",
            hint: "text-xs",
          },
          md: {
            root: "gap-1.5",
            label: "text-sm",
            description: "text-xs",
            error: "text-xs",
            help: "text-xs",
            hint: "text-xs",
          },
          lg: {
            root: "gap-2",
            label: "text-base",
            description: "text-sm",
            error: "text-sm",
            help: "text-sm",
            hint: "text-sm",
          },
          xl: {
            root: "gap-2.5",
            label: "text-lg",
            description: "text-base",
            error: "text-sm",
            help: "text-sm",
            hint: "text-sm",
          },
        },
        disabled: {
          true: {
            root: "opacity-60 pointer-events-none",
          },
          false: {
            root: "",
          },
        },
        required: {
          true: {},
          false: {},
        },
      },
      compoundVariants: [],
      defaultVariants: {
        size: "md",
        disabled: false,
        required: false,
      },
    },
  },
})
```
