---
title: Radio
description: A single radio selection control that can be used standalone or as an item inside c-radio-group.
---

## Overview

`c-radio` is a single radio selection control that can be used standalone or as an item inside `c-radio-group`. It supports controlled and uncontrolled checked states, disabled, read-only, and invalid states, `outline` and `card` variants, theme colors and sizes, and customizable slots.

- **Related Components**:
  - **Parent**: `c-radio-group` (inherits `groupSize`, `groupColor`, `groupVariant`, and group selection context when nested inside a group).

::callout{icon="i-lucide-info" color="neutral"}
When nested inside `c-radio-group`, `c-radio` inherits `groupSize`, `groupColor`, `groupVariant`, and selection state when `size`, `color`, `variant`, or `checked` are unset. Root class overrides use `className` rather than `class`.
::

## Usage

### Basic

Use `value`, `label`, and `defaultChecked` for basic uncontrolled usage.

```html [index.wxml]
<c-radio
  value="standard"
  label="Standard Shipping"
  defaultChecked="{{true}}"
/>
```

### Description

Use the `description` prop to display secondary helper text below the `label`.

```html [index.wxml]
<c-radio
  value="pro"
  label="Pro Plan"
  description="Includes unlimited projects and priority support."
/>
```

### Controlled

Use the `checked` prop to control the checked state externally. When `checked` is `null` (default), state is managed by `defaultChecked` or the parent `<c-radio-group>`.

::code-group

```html [index.wxml]
<c-radio
  value="agree"
  checked="{{isSelected}}"
  label="Accept terms"
/>
```

```ts [index.ts]
Page({
  data: {
    isSelected: true,
  },
});
```

::

### Inside RadioGroup

Place `<c-radio>` inside `<c-radio-group>` to coordinate single selection and inherit `groupColor`, `groupSize`, and `groupVariant` automatically when `color`, `size`, `variant`, or `checked` are unset.

::code-group

```html [index.wxml]
<c-radio-group
  legend="Billing Cycle"
  value="{{billing}}"
  color="primary"
  variant="card"
  bind:change="onBillingChange"
>
  <c-radio value="monthly" label="Monthly" description="Billed every month" />
  <c-radio value="yearly" label="Yearly" description="Save 20% annually" />
</c-radio-group>
```

```ts [index.ts]
Page({
  data: {
    billing: "monthly",
  },
  onBillingChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ billing: e.detail.value });
  },
});
```

::

### Color

Use the `color` prop to set the accent color across `"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, and `"info"`.

```html [index.wxml]
<c-radio value="primary" color="primary" defaultChecked="{{true}}" label="Primary" />
<c-radio value="neutral" color="neutral" defaultChecked="{{true}}" label="Neutral" />
<c-radio value="danger" color="danger" defaultChecked="{{true}}" label="Danger" />
<c-radio value="success" color="success" defaultChecked="{{true}}" label="Success" />
<c-radio value="warning" color="warning" defaultChecked="{{true}}" label="Warning" />
<c-radio value="info" color="info" defaultChecked="{{true}}" label="Info" />
```

### Variant

Use the `variant` prop to switch between `"outline"` (default) and `"card"`.

```html [index.wxml]
<c-radio
  value="outline"
  variant="outline"
  defaultChecked="{{true}}"
  label="Outline"
  description="Default compact radio control."
/>

<c-radio
  value="card"
  variant="card"
  defaultChecked="{{true}}"
  label="Card"
  description="Bordered container with highlighted checked state."
/>
```

### Size

Use the `size` prop to adjust the control and typography sizing across `"xs"`, `"sm"`, `"md"` (default), `"lg"`, and `"xl"`.

```html [index.wxml]
<c-radio value="xs" size="xs" defaultChecked="{{true}}" label="Extra Small" />
<c-radio value="sm" size="sm" defaultChecked="{{true}}" label="Small" />
<c-radio value="md" size="md" defaultChecked="{{true}}" label="Medium" />
<c-radio value="lg" size="lg" defaultChecked="{{true}}" label="Large" />
<c-radio value="xl" size="xl" defaultChecked="{{true}}" label="Extra Large" />
```

### Disabled

Use `disabled="{{true}}"` to disable user interaction and apply disabled styling.

```html [index.wxml]
<c-radio value="disabled-off" disabled="{{true}}" label="Unavailable option" />
<c-radio value="disabled-on" disabled="{{true}}" defaultChecked="{{true}}" label="Locked selection" />
```

### Read Only

Use `readOnly="{{true}}"` to prevent changing the checked state on tap while keeping the control readable and focusable.

```html [index.wxml]
<c-radio
  value="fixed"
  readOnly="{{true}}"
  defaultChecked="{{true}}"
  label="Read-only selection"
/>
```

### Invalid

Use `invalid="{{true}}"` to mark the radio as invalid and apply error styling.

```html [index.wxml]
<c-radio
  value="required-option"
  invalid="{{true}}"
  label="Required selection"
  description="Please select this option to continue."
/>
```

### Custom Styling

Use `ui` to override classes on individual slots (`root`, `base`, `indicator`, `wrapper`, `label`, `description`), and `className` to add classes to the `root` slot.

```html [index.wxml]
<c-radio
  value="styled"
  defaultChecked="{{true}}"
  label="Custom Styled Radio"
  description="Per-slot overrides via ui and className."
  className="my-2"
  ui="{{ { label: 'font-semibold text-primary', description: 'italic' } }}"
/>
```

### Slots

Use the `indicator`, `label`, and `description` slots for custom markup (leaving the `label` and `description` props empty so the named slots render), or use the `default` slot when no `label` or `description` props or slots are provided.

```html [index.wxml]
<!-- Custom indicator, label, and description slots -->
<c-radio value="slots" defaultChecked="{{true}}">
  <view slot="indicator" class="w-2 h-2 rounded-full bg-white" />
  <view slot="label" class="font-semibold">Custom Label Slot</view>
  <view slot="description" class="text-xs text-muted">Custom description markup</view>
</c-radio>

<!-- Custom default slot content -->
<c-radio value="inline">
  <view class="text-sm">Custom inline label content</view>
</c-radio>
```

### Events

`c-radio` does not emit custom component events directly via `triggerEvent`. When used inside `<c-radio-group>`, selection updates are coordinated with the parent group; at the state-machine level (`RadioProps`), `onChange` is invoked with `{ value: string; checked: boolean }`.

::code-group

```html [index.wxml]
<c-radio-group defaultValue="email" bind:change="onSelectionChange">
  <c-radio value="email" label="Email" />
  <c-radio value="sms" label="SMS" />
</c-radio-group>
```

```ts [index.ts]
Page({
  onSelectionChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("Selected radio value:", e.detail.value);
  },
});
```

::

## State Machine

Click any active transition or event button below to simulate the `radio` state machine live:

::machine-visualizer{name="radio"}
::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `""` | Value associated with the radio item (used to match against parent group selection and change details). |
| `checked` | `boolean \| null` | `null` | Controlled checked state. When `null`, state is managed by the parent group or `defaultChecked`. |
| `defaultChecked` | `boolean` | `false` | Initial checked state when uncontrolled. |
| `disabled` | `boolean` | `false` | Disables user interaction and applies disabled styling and ARIA state. |
| `readOnly` | `boolean` | `false` | Prevents changing the checked state on tap while remaining focusable/readable. |
| `invalid` | `boolean \| null` | `null` | Marks the radio as invalid and applies error styling and ARIA state. |
| `color` | `RadioColor` (`"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"`) | `""` | Theme color override. Falls back to parent `groupColor`, then `"primary"`. |
| `size` | `RadioSize` (`"xs" \| "sm" \| "md" \| "lg" \| "xl"`) | `""` | Size override. Falls back to parent `groupSize`, then `"md"`. |
| `variant` | `RadioVariant` (`"outline" \| "card"`) | `""` | Visual variant override. Falls back to parent `groupVariant`, then `"outline"`. |
| `label` | `string` | `""` | Text label displayed next to the radio control. Takes precedence over the `label` slot. |
| `description` | `string` | `""` | Secondary description text displayed below the label. Takes precedence over the `description` slot. |
| `ui` | `RadioUI` (`Partial<Record<"root" \| "base" \| "indicator" \| "wrapper" \| "label" \| "description", string>>`) | `{}` | Per-slot class overrides merged with the resolved theme classes. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (no separate `class` prop is defined). |

## Slots

| Name | Description |
| :--- | :--- |
| `indicator` | Replaces the default inner radio dot inside `base`. |
| `label` | Custom label content inside `wrapper`. Rendered when the `label` prop is empty. |
| `description` | Custom description content inside `wrapper`. Rendered when the `description` prop is empty. |
| `default` | Custom inline content rendered when `label`, `description`, and their corresponding slots are not provided. |

## Events

Listen to `bind:change` on standalone `c-radio` components to handle checked state changes. When nested inside `c-radio-group`, selection updates are coordinated by the parent group.

| Event | Payload | Description |
| :--- | :--- | :--- |
| `bind:change` | `{ value: string; checked: boolean }` | Emitted when the checked state changes. |

## Theme

Customize the `radio` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    radio: {
      slots: {
        root: "relative inline-flex items-start select-none cursor-pointer",
        base: "relative mt-0.5 flex items-center justify-center rounded-full border border-accented bg-default transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        indicator: "rounded-full transition-transform duration-150 ease-out",
        wrapper: "ms-2 flex flex-col justify-center",
        label: "block font-medium text-highlighted leading-snug",
        description: "text-muted mt-0.5 leading-snug",
      },
      variants: {
        variant: {
          outline: {},
          card: {
            root: "p-3 rounded-xl border border-default bg-default shadow-xs transition-all w-full",
          },
        },
        color: Object.assign(
          Object.fromEntries(
            colors.map((color) => [
              color,
              {
                base: `border-${color} text-${color}`,
                indicator: `bg-${color}`,
              },
            ]),
          ),
          {
            neutral: {
              base: "border-inverted text-inverted",
              indicator: "bg-inverted",
            },
          },
        ),
        size: {
          xs: {
            base: "w-3.5 h-3.5",
            indicator: "w-1.5 h-1.5",
            wrapper: "text-xs",
            label: "text-xs",
            description: "text-2xs",
          },
          sm: {
            base: "w-4 h-4",
            indicator: "w-2 h-2",
            wrapper: "text-xs",
            label: "text-xs",
            description: "text-2xs",
          },
          md: {
            base: "w-4.5 h-4.5",
            indicator: "w-2.5 h-2.5",
            wrapper: "text-sm",
            label: "text-sm",
            description: "text-xs",
          },
          lg: {
            base: "w-5 h-5",
            indicator: "w-3 h-3",
            wrapper: "text-base",
            label: "text-base",
            description: "text-sm",
          },
          xl: {
            base: "w-6 h-6",
            indicator: "w-3.5 h-3.5",
            wrapper: "text-lg",
            label: "text-lg",
            description: "text-base",
          },
        },
        checked: {
          true: {
            indicator: "scale-100 opacity-100",
          },
          false: {
            indicator: "scale-0 opacity-0",
          },
        },
        disabled: {
          true: {
            root: "opacity-50 cursor-not-allowed",
            base: "cursor-not-allowed",
          },
          false: {},
        },
        invalid: {
          true: {
            base: `border-${errorColor} ring-1 ring-${errorColor}`,
          },
          false: {},
        },
      },
      compoundVariants: [
        {
          checked: false,
          invalid: false,
          class: {
            base: "border-accented text-transparent",
          },
        },
        ...colors.map((color) => ({
          variant: "card" as const,
          color,
          checked: true as const,
          class: {
            root: `border-${color} bg-${color}/5 ring-1 ring-${color}`,
          },
        })),
        {
          variant: "card" as const,
          color: "neutral" as const,
          checked: true as const,
          class: {
            root: "border-inverted bg-elevated ring-1 ring-inverted",
          },
        },
        {
          variant: "card" as const,
          invalid: true,
          class: {
            root: `border-${errorColor} ring-1 ring-${errorColor}`,
            base: `border-${errorColor}`,
          },
        },
        {
          invalid: true,
          checked: true,
          class: {
            base: `border-${errorColor} text-${errorColor}`,
            indicator: `bg-${errorColor}`,
          },
        },
        {
          variant: "card" as const,
          invalid: true,
          checked: true,
          class: {
            root: `border-${errorColor} ring-1 ring-${errorColor}`,
            base: `border-${errorColor} text-${errorColor}`,
            indicator: `bg-${errorColor}`,
          },
        },
      ],
      defaultVariants: {
        variant: "outline",
        color: "primary",
        size: "md",
        checked: false,
        disabled: false,
        invalid: false,
      },
    }
  }
})
```
