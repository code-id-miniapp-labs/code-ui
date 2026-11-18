---
title: RadioGroup
description: Accessible single-selection radio group container supporting both data-driven rendering and declarative compound composition, with optional form-field integration.
---

## Overview

`c-radio-group` is an accessible single-selection radio group container supporting both data-driven rendering (`items`) and declarative compound composition (`<c-radio>` children), with optional form-field integration.

- **Related Components**:
  - **Child**: `c-radio` (automatically rendered when `items` is provided, or placed declaratively inside the default slot).
  - **Parent (optional)**: `c-form` / `c-form-field`.

## Usage

### Basic

Use the `items` prop with an array of strings or objects (`{ value, label, description, disabled, color, variant, size, ui }`) and `defaultValue` for uncontrolled selection.

::code-group

```html [index.wxml]
<c-radio-group
  legend="Plan"
  defaultValue="pro"
  items="{{items}}"
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { value: "free", label: "Free", description: "Basic features for personal use" },
      { value: "pro", label: "Pro", description: "Advanced tools for teams" },
      { value: "enterprise", label: "Enterprise", description: "Custom security and support" },
    ],
  },
});
```

::

### Controlled

Use `value` with `bind:change` to control the selected value from page state.

::code-group

```html [index.wxml]
<c-radio-group
  legend="Billing Cycle"
  value="{{billing}}"
  items="{{billingItems}}"
  bind:change="onBillingChange"
/>
```

```ts [index.ts]
Page({
  data: {
    billing: "monthly",
    billingItems: ["monthly", "yearly"],
  },
  onBillingChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ billing: e.detail.value });
  },
});
```

::

### Declarative Composition

Place `<c-radio>` children directly inside `<c-radio-group>` for declarative compound composition.

```html [index.wxml]
<c-radio-group legend="Notification Channel" defaultValue="email">
  <c-radio value="email" label="Email" />
  <c-radio value="sms" label="SMS" />
</c-radio-group>
```

### Legend

Use the `legend` prop to display a group heading above the radio items.

```html [index.wxml]
<c-radio-group
  legend="Delivery Method"
  defaultValue="standard"
  items="{{['standard', 'express']}}"
/>
```

### Color

Use the `color` prop to set the accent color across `"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, and `"info"`.

```html [index.wxml]
<c-radio-group
  legend="Status"
  color="success"
  defaultValue="active"
  items="{{['active', 'paused']}}"
/>
```

### Variant

Use the `variant` prop to switch between `"outline"` (default) and `"card"`.

::code-group

```html [index.wxml]
<c-radio-group
  legend="Tier"
  variant="card"
  defaultValue="monthly"
  items="{{items}}"
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { value: "monthly", label: "Monthly", description: "$12 / month" },
      { value: "yearly", label: "Yearly", description: "$120 / year" },
    ],
  },
});
```

::

### Size

Use the `size` prop to adjust the legend and item sizing across `"xs"`, `"sm"`, `"md"`, `"lg"`, and `"xl"`.

```html [index.wxml]
<c-radio-group
  legend="Text Size"
  size="lg"
  defaultValue="medium"
  items="{{['small', 'medium', 'large']}}"
/>
```

### Orientation

Use the `orientation` prop to arrange items `"vertical"` (default) or `"horizontal"`.

```html [index.wxml]
<c-radio-group
  legend="Direction"
  orientation="horizontal"
  defaultValue="left"
  items="{{['left', 'center', 'right']}}"
/>
```

### Disabled

Use the `disabled` prop to disable all items in the group, or set `disabled: true` on individual `items`.

::code-group

```html [index.wxml]
<!-- Disable the entire group -->
<c-radio-group
  legend="Disabled Group"
  disabled="{{true}}"
  defaultValue="a"
  items="{{['a', 'b']}}"
/>

<!-- Disable a single item -->
<c-radio-group
  legend="Partially Disabled"
  defaultValue="a"
  items="{{partialItems}}"
/>
```

```ts [index.ts]
Page({
  data: {
    partialItems: [
      { value: "a", label: "Available" },
      { value: "b", label: "Unavailable", disabled: true },
    ],
  },
});
```

::

### Read Only

Use the `readOnly` prop to prevent changing the selected value while keeping the group enabled for display and focus.

```html [index.wxml]
<c-radio-group
  legend="Assigned Role"
  readOnly="{{true}}"
  value="viewer"
  items="{{['viewer', 'editor', 'admin']}}"
/>
```

### Required

Use the `required` prop to mark the group as required and display a required indicator on the `legend`.

```html [index.wxml]
<c-radio-group
  legend="Agreement"
  required="{{true}}"
  items="{{['accept', 'decline']}}"
/>
```

### Invalid

Use the `invalid` prop to mark the group with an invalid state (`aria-invalid`).

```html [index.wxml]
<c-radio-group
  legend="Payment Option"
  invalid="{{true}}"
  items="{{['card', 'bank']}}"
/>
```

### Form Integration

Wrap `<c-radio-group>` inside `<c-form-field>` within `<c-form>`, placing `name`, `label`, `required`, and `rules` on `<c-form-field>` and `validate-on` / `bind:submit` on `<c-form>`.

```html [index.wxml]
<c-form id="checkout-form" validate-on="submit" bind:submit="onSubmit">
  <c-form-field name="shipping" label="Shipping" required="{{true}}" rules="{{shippingRules}}">
    <c-radio-group items="{{['standard', 'overnight']}}" />
  </c-form-field>
</c-form>
```

### Custom Styling

Use `ui` to override classes on the `root`, `fieldset`, and `legend` slots (and forward default `ui` to data-driven items), or `className` for additional root classes.

```html [index.wxml]
<c-radio-group
  legend="Custom Styled"
  className="p-4"
  ui="{{ { legend: 'text-primary font-semibold', fieldset: 'gap-3' } }}"
  defaultValue="one"
  items="{{['one', 'two']}}"
/>
```

### Slots

Use the `legend` slot for custom legend markup when the `legend` prop is empty, and the `default` slot for declarative `<c-radio>` children.

```html [index.wxml]
<c-radio-group defaultValue="email">
  <view slot="legend" class="font-semibold text-primary">Notification Channel</view>
  <c-radio value="email" label="Email" />
  <c-radio value="sms" label="SMS" />
</c-radio-group>
```

### Events

Listen to `bind:change` to handle selection changes via `e.detail.value`.

::code-group

```html [index.wxml]
<c-radio-group
  legend="Theme Mode"
  defaultValue="system"
  items="{{['light', 'dark', 'system']}}"
  bind:change="onThemeChange"
/>
```

```ts [index.ts]
Page({
  onThemeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("Selected:", e.detail.value);
  },
});
```

::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| null` | `null` | Controlled selected value. |
| `defaultValue` | `string \| null` | `null` | Initial selected value for uncontrolled mode. |
| `items` | `(string \| RadioGroupItemRaw)[]` | `[]` | Options rendered automatically as `<c-radio>` items (`RadioGroupItemRaw`: `{ value, label?, description?, disabled?, color?, variant?, size?, ui? }`). |
| `legend` | `string` | `""` | Group legend text. When non-empty, renders the text instead of the `legend` slot. |
| `name` | `string` | `""` | Form field name for form registration. |
| `form` | `string` | `""` | Target `<c-form>` id/name when multiple forms exist on the same page. |
| `formContext` | `FormHostContext \| null` | `undefined` | Optional explicit reactive form host context. |
| `disabled` | `boolean` | `false` | Disables all radio items in the group. |
| `readOnly` | `boolean` | `false` | Prevents changing the selected value while keeping focus/display. |
| `required` | `boolean` | `false` | Marks the group as required (`aria-required` and required indicator on `legend`). |
| `invalid` | `boolean \| null` | `null` | Marks the group as invalid (`aria-invalid`). |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"` | `"primary"` | Accent color passed to theme and data-driven `<c-radio>` items. |
| `variant` | `"outline" \| "card"` | `"outline"` | Visual style variant passed to theme and data-driven `<c-radio>` items. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Size token; falls back to parent form field size (`fieldSize`) or `"md"`. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Layout direction of the `fieldset` container. |
| `ui` | `RadioGroupUI` (`Partial<Record<"root" \| "fieldset" \| "legend", string>>`) | `{}` | Per-slot class overrides; also forwarded as default `ui` to data-driven `<c-radio>` items unless overridden per item. |
| `className` | `string` | `""` | Additional root class override (declared as `className` in MiniApp `properties`). |

Additional machine/form props accepted via `RadioGroupProps`: `id`, `ids`, `rules`, `validateOn`, `fieldDisabled`.

## Slots

| Slot | Description |
| --- | --- |
| `default` | Renders inside the `fieldset` container for declarative `<c-radio>` children. |
| `legend` | Custom legend content. Rendered when the `legend` prop is empty. |

## Events

| Event | `detail` Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: string }` (`RadioGroupValueChangeDetails`) | Fired when the selected value changes (maps to `onChange` in `RadioGroupProps`). |

## Theme

Customize the `radio-group` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    radioGroup: {
      slots: {
        root: "relative inline-flex flex-col gap-1.5",
        fieldset: "flex flex-col gap-2",
        legend: "block font-medium text-highlighted leading-snug",
      },
      variants: {
        variant: {
          outline: {},
          card: {},
        },
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
          xs: { legend: "text-xs" },
          sm: { legend: "text-xs" },
          md: { legend: "text-sm" },
          lg: { legend: "text-base" },
          xl: { legend: "text-lg" },
        },
        orientation: {
          vertical: {
            fieldset: "flex flex-col gap-2",
          },
          horizontal: {
            fieldset: "flex flex-row flex-wrap gap-4",
          },
        },
        checked: {
          true: {},
          false: {},
        },
        disabled: {
          true: {},
          false: {},
        },
        required: {
          true: {
            legend: "after:content-['*'] after:ms-0.5 after:text-danger",
          },
          false: {},
        },
        invalid: {
          true: {},
          false: {},
        },
      },
      defaultVariants: {
        variant: "outline",
        color: "primary",
        size: "md",
        orientation: "vertical",
        checked: false,
        disabled: false,
        required: false,
        invalid: false,
      },
    }
  }
})
```
