---
title: Switch
description: A toggle switch for switching between checked and unchecked states, with support for labels, descriptions, thumb/loading icons, controlled/uncontrolled state, and form field integration.
---

## Overview

`c-switch` is a standalone toggle switch component for switching between checked and unchecked states. It supports labels, helper descriptions, thumb and loading icons, controlled and uncontrolled modes, and integration with `<c-form>` and `<c-form-field>`.

When `checkedIcon`, `uncheckedIcon`, or `loadingIcon` props are provided without custom slots, `<c-icon>` is rendered automatically inside the thumb.

## Usage

### Basic

Use `c-switch` on its own or set `defaultChecked` for an initial checked state in uncontrolled mode.

```html
<c-switch />

<c-switch defaultChecked="{{true}}" />
```

### Label & Description

Use the `label` and `description` props to display text alongside the switch.

```html
<c-switch
  defaultChecked="{{true}}"
  label="Notifications"
  description="Receive push alerts for updates."
/>
```

### Color

Use the `color` prop to change the checked track and icon color. Supported values are `"primary"` (default), `"neutral"`, `"danger"`, `"success"`, `"warning"`, and `"info"`.

```html
<c-switch defaultChecked="{{true}}" color="primary" label="Primary" />
<c-switch defaultChecked="{{true}}" color="neutral" label="Neutral" />
<c-switch defaultChecked="{{true}}" color="success" label="Success" />
<c-switch defaultChecked="{{true}}" color="warning" label="Warning" />
<c-switch defaultChecked="{{true}}" color="danger" label="Danger" />
<c-switch defaultChecked="{{true}}" color="info" label="Info" />
```

### Size

Use the `size` prop to change the switch dimensions and typography (`"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`). When empty, it falls back to a parent form's `fieldSize` or `"md"`.

```html
<c-switch size="xs" label="Extra small" />
<c-switch size="sm" label="Small" />
<c-switch size="md" label="Medium" />
<c-switch size="lg" label="Large" />
<c-switch size="xl" label="Extra large" />
```

### Icon

Use `checkedIcon` and `uncheckedIcon` to render `<c-icon>` names inside the thumb for checked and unchecked states.

```html
<c-switch
  defaultChecked="{{true}}"
  checkedIcon="check"
  uncheckedIcon="x"
  label="Marketing emails"
/>
```

### Loading

Use `loading` to display a spinning indicator inside the thumb and disable interaction. Customize the icon name with `loadingIcon` (defaults to `"loading"`).

```html
<c-switch loading="{{true}}" label="Syncing settings..." />

<c-switch
  loading="{{true}}"
  loadingIcon="loader-2"
  defaultChecked="{{true}}"
  label="Saving changes..."
/>
```

### Disabled & Read Only

Use `disabled` to disable interaction and dim the switch, or `readOnly` to prevent toggling while keeping normal visual contrast.

```html
<c-switch disabled="{{true}}" label="Disabled" />
<c-switch disabled="{{true}}" defaultChecked="{{true}}" label="Disabled (checked)" />
<c-switch readOnly="{{true}}" defaultChecked="{{true}}" label="Read only" />
```

### Required & Invalid

Use `required` to display a required asterisk on the label, and `invalid` to apply error ring/color styling.

```html
<c-switch required="{{true}}" label="Accept terms" />
<c-switch invalid="{{true}}" label="Email alerts" description="This setting requires verification." />
```

### Controlled

Pass a boolean `checked` prop (instead of `null`) to control the switch state from page data, and update it via `setData` or the `cSwitch` API.

::code-group

```html [index.wxml]
<c-switch
  id="controlled-switch"
  checked="{{enabled}}"
  label="Airplane mode"
/>
```

```ts [index.ts]
Page({
  data: {
    enabled: false,
  },

  onToggleAirplaneMode() {
    this.setData({ enabled: !this.data.enabled });
  },
});
```

::

### Form Integration

Wrap `<c-switch>` in `<c-form-field>` inside `<c-form>` to participate in form state, validation, and submission. Place `name`, `label`, `required`, and `rules` on `<c-form-field>`, and `validateOn` and `bind:submit` on `<c-form>`.

::code-group

```html [index.wxml]
<c-form
  id="preferences-form"
  validateOn="{{validateOn}}"
  bind:submit="handlePreferencesSubmit"
>
  <c-form-field
    name="newsletter"
    label="Newsletter"
    description="Receive weekly product updates."
    required="{{true}}"
    rules="{{newsletterRules}}"
  >
    <c-switch value="subscribed" defaultChecked="{{true}}" />
  </c-form-field>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    validateOn: ["change"],
    newsletterRules: [
      { required: true, message: "Please enable newsletter updates" },
    ],
  },

  handlePreferencesSubmit(e: WechatMiniprogram.CustomEvent) {
    console.log("Submitted values:", e.detail.values);
  },
});
```

::

### Slots

Use the `label`, `description`, `thumb`, `loadingIcon`, and default slots for custom markup. Ensure `label` / `description` props are empty when using their slots.

```html
<!-- Custom label and description slots -->
<c-switch>
  <view slot="label">Custom <text class="font-bold">Rich Label</text></view>
  <view slot="description">Includes <text class="text-primary">formatted</text> helper text.</view>
</c-switch>

<!-- Custom thumb slot (rendered when not loading and no checkedIcon/uncheckedIcon is active) -->
<c-switch>
  <text slot="thumb" class="text-2xs">ON</text>
</c-switch>

<!-- Custom loadingIcon slot (overrides loadingIcon prop) -->
<c-switch loading="{{true}}" label="Loading">
  <text slot="loadingIcon" class="text-2xs">...</text>
</c-switch>

<!-- Default slot rendered at the end of root -->
<c-switch label="Pro feature">
  <c-badge label="Beta" size="xs" className="ms-2" />
</c-switch>
```

### Custom Styling (`ui` & `className`)

Use `ui` to override classes on specific theme slots (`root`, `base`, `container`, `thumb`, `icon`, `loadingIcon`, `wrapper`, `label`, `description`) and `className` to merge classes onto the `root` slot.

```html
<c-switch
  defaultChecked="{{true}}"
  label="Custom styled switch"
  ui="{{ { base: 'rounded-lg', thumb: 'rounded-md', label: 'font-semibold' } }}"
  className="my-2"
/>
```

### Events & Exposed API

`c-switch` handles taps internally via `catchtap="handleTap"` and does not emit `bind:*` events directly. The machine layer supports `onChange` (`(details: { checked: boolean }) => void`), and the component exposes the `cSwitch` API (`setChecked`, `toggle`, `resetChecked`, `handleTap`) on the component instance.

::code-group

```html [index.wxml]
<c-switch
  id="marketing-switch"
  checked="{{enabled}}"
  color="success"
  label="Marketing emails"
/>

<c-button label="Toggle" bind:tap="onToggle" />
<c-button label="Enable" bind:tap="onEnable" />
<c-button label="Reset" bind:tap="onReset" />
```

```ts [index.ts]
Page({
  data: {
    enabled: false,
  },

  onToggle() {
    const sw = this.selectComponent("#marketing-switch");
    sw?.cSwitch?.toggle();
    this.setData({ enabled: !this.data.enabled });
  },

  onEnable() {
    const sw = this.selectComponent("#marketing-switch");
    sw?.cSwitch?.setChecked(true);
    this.setData({ enabled: true });
  },

  onReset() {
    const sw = this.selectComponent("#marketing-switch");
    sw?.cSwitch?.resetChecked();
    this.setData({ enabled: false });
  },
});
```

::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `checked` | `Boolean \| null` | `null` | Controlled checked state. When `null`, operates in uncontrolled mode. |
| `defaultChecked` | `Boolean` | `false` | Initial checked state when used in uncontrolled mode. |
| `disabled` | `Boolean` | `false` | Disables user interaction and applies disabled styling. |
| `readOnly` | `Boolean` | `false` | Makes the switch read-only. |
| `required` | `Boolean` | `false` | Marks the switch as required in a form and renders a required asterisk on the label. |
| `invalid` | `Boolean \| null` | `null` | Marks the switch as invalid (applies error ring/color styling). |
| `loading` | `Boolean` | `false` | Displays a loading indicator inside the thumb and disables interaction. |
| `color` | `String` | `"primary"` | Theme color when checked (`"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, `"info"`). |
| `size` | `String` | `""` | Switch size (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). Falls back to form `fieldSize` or `"md"` when empty. |
| `label` | `String` | `""` | Text label rendered beside the switch track. |
| `description` | `String` | `""` | Helper description text rendered beneath the label. |
| `checkedIcon` | `String` | `""` | `<c-icon>` name rendered inside the thumb when checked. |
| `uncheckedIcon` | `String` | `""` | `<c-icon>` name rendered inside the thumb when unchecked. |
| `loadingIcon` | `String` | `"loading"` | `<c-icon>` name rendered inside the thumb when `loading` is `true`. |
| `name` | `String` | `""` | Form field name for form registration. |
| `value` | `String` | `"on"` | Form submission value when checked. |
| `form` | `String` | `""` | Target `<c-form>` id/name when multiple forms exist on the same page. |
| `formContext` | `Object \| null` | `undefined` | Optional explicit reactive form host context. |
| `ui` | `Object` | `{}` | Per-slot CSS class overrides keyed by theme slot name (`SwitchUI`). |
| `className` | `String` | `""` | Custom CSS class(es) merged onto the `root` slot (serves as the component's `class` override prop). |

## Slots

| Name | Description |
| :--- | :--- |
| `default` | Rendered at the end of the root `<view>`. |
| `loadingIcon` | Rendered inside the thumb when `loading` is active; overrides the `loadingIcon` prop's `<c-icon>`. |
| `thumb` | Rendered inside the thumb when not loading and neither `checkedIcon` (when checked) nor `uncheckedIcon` (when unchecked) is active. |
| `label` | Rendered inside the label container when the `label` prop is empty. |
| `description` | Rendered inside the description container when the `description` prop is empty. |

::callout{icon="i-lucide-info"}
The outer `wrapper` container renders only when `label` or `description` content is provided via props or slots.
::

## Events

| Event | Detail Payload | Description |
| :--- | :--- | :--- |
| `bind:change` | `{ checked: boolean }` (`SwitchCheckedChangeDetails`) | Fired when the checked state changes. |

### Exposed API (`cSwitch`)

Access via `this.selectComponent("#id").cSwitch`:

| Method | Signature | Description |
| :--- | :--- | :--- |
| `setChecked` | `(checked: boolean) => void` | Sets the checked state programmatically. |
| `toggle` | `() => void` | Toggles the current checked state. |
| `resetChecked` | `() => void` | Resets the checked state to its default value. |
| `handleTap` | `() => void` | Handles tap interaction on the switch. |

## Theme

Customize the `switch` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    switch: {
      slots: {
        root: "relative inline-flex items-start select-none",
        base: "inline-flex mt-0.5 items-center shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        container: "flex items-center",
        thumb:
          "pointer-events-none rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-out motion-reduce:transition-none flex items-center justify-center translate-y-0",
        icon: "shrink-0 transition-[color,opacity] duration-200 ease-out",
        loadingIcon: "w-full h-full animate-spin",
        wrapper: "ms-2 flex flex-col justify-center",
        label: "block font-medium text-highlighted leading-snug",
        description: "text-muted mt-0.5 leading-snug",
      },
      variants: {
        color: {
          primary: {},
          secondary: {},
          danger: {},
          success: {},
          warning: {},
          info: {},
          neutral: {},
        },
        size: {
          xs: {
            base: "w-7 h-4",
            thumb: "w-3 h-3",
            icon: "w-2.5 h-2.5",
            wrapper: "text-xs",
            label: "text-xs",
            description: "text-2xs",
          },
          sm: {
            base: "w-8 h-4.5",
            thumb: "w-3.5 h-3.5",
            icon: "w-3 h-3",
            wrapper: "text-xs",
            label: "text-xs",
            description: "text-2xs",
          },
          md: {
            base: "w-9 h-5",
            thumb: "w-4 h-4",
            icon: "w-3.5 h-3.5",
            wrapper: "text-sm",
            label: "text-sm",
            description: "text-xs",
          },
          lg: {
            base: "w-10 h-5.5",
            thumb: "w-4.5 h-4.5",
            icon: "w-4 h-4",
            wrapper: "text-base",
            label: "text-base",
            description: "text-sm",
          },
          xl: {
            base: "w-11 h-6",
            thumb: "w-5 h-5",
            icon: "w-4.5 h-4.5",
            wrapper: "text-base",
            label: "text-base",
            description: "text-sm",
          },
        },
        disabled: {
          true: {
            root: "opacity-60 cursor-not-allowed pointer-events-none",
            base: "cursor-not-allowed",
          },
          false: {},
        },
        checked: {
          true: {
            icon: "opacity-100",
          },
          false: {
            base: "bg-accented",
            thumb: "translate-x-0",
            icon: "opacity-0",
          },
        },
        loading: {
          true: {
            root: "opacity-80 pointer-events-none",
          },
          false: {},
        },
        required: {
          true: {
            label: "after:content-['*'] after:ms-0.5 after:text-danger",
          },
          false: {},
        },
        invalid: {
          true: {
            base: "ring-1 ring-danger",
          },
          false: {},
        },
      },
      compoundVariants: [
        {
          color: "primary",
          checked: true,
          class: {
            base: "bg-primary",
            icon: "text-primary",
          },
        },
        {
          color: "secondary",
          checked: true,
          class: {
            base: "bg-secondary",
            icon: "text-secondary",
          },
        },
        {
          color: "danger",
          checked: true,
          class: {
            base: "bg-danger",
            icon: "text-danger",
          },
        },
        {
          color: "success",
          checked: true,
          class: {
            base: "bg-success",
            icon: "text-success",
          },
        },
        {
          color: "warning",
          checked: true,
          class: {
            base: "bg-warning",
            icon: "text-warning",
          },
        },
        {
          color: "info",
          checked: true,
          class: {
            base: "bg-info",
            icon: "text-info",
          },
        },
        {
          color: "neutral",
          checked: true,
          class: {
            base: "bg-inverted",
            icon: "text-inverted",
          },
        },
        {
          invalid: true,
          checked: true,
          class: {
            base: "bg-danger",
            icon: "text-danger",
          },
        },
        {
          size: "xs",
          checked: true,
          class: {
            thumb: "translate-x-3",
          },
        },
        {
          size: "sm",
          checked: true,
          class: {
            thumb: "translate-x-3.5",
          },
        },
        {
          size: "md",
          checked: true,
          class: {
            thumb: "translate-x-4",
          },
        },
        {
          size: "lg",
          checked: true,
          class: {
            thumb: "translate-x-4.5",
          },
        },
        {
          size: "xl",
          checked: true,
          class: {
            thumb: "translate-x-5",
          },
        },
      ],
      defaultVariants: {
        color: "primary",
        size: "md",
        disabled: false,
        checked: false,
        loading: false,
        required: false,
        invalid: false,
      },
    },
  },
})
```
