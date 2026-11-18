---
title: CheckboxGroup
description: Manages a group of checkboxes with shared controlled or uncontrolled selection state, selection bounds, layout orientation, theming, and form field integration.
---

## Overview

`c-checkbox-group` manages a group of checkboxes with shared controlled or uncontrolled selection state (`value` / `defaultValue`), selection bounds (`min` / `max`), layout `orientation`, visual `variant` / `color` / `size`, optional `legend`, and form field integration. It supports both data-driven rendering via `items` and declarative compound composition via the default `<slot />`.

- **Related Components**:
  - **Child (`c-checkbox`)**: Rendered automatically via `wx:for` when `items` is provided, or placed directly inside `<c-checkbox-group>` as compound children.
  - **Parent (`c-form` / `c-form-field`, optional)**: Integrates validation, `disabled`, `readOnly`, `invalid`, and `fieldSize`.

## Usage

### Basic

Use the `items` prop to render a list of checkboxes from an array of strings or option objects, paired with `legend` and `defaultValue` for uncontrolled selection.

::code-group
```html [index.wxml]
<c-checkbox-group
  legend="Frameworks"
  items="{{frameworks}}"
  defaultValue="{{['react']}}"
/>
```

```ts [index.ts]
Page({
  data: {
    frameworks: ["react", "vue", "svelte"],
  },
});
```
::

Each item object in `items` supports `value`, `label`, `description`, `disabled`, `color`, `variant`, `size`, and `ui`.

::code-group
```html [index.wxml]
<c-checkbox-group
  legend="Notifications"
  items="{{notificationItems}}"
  defaultValue="{{['email']}}"
/>
```

```ts [index.ts]
Page({
  data: {
    notificationItems: [
      { value: "email", label: "Email", description: "Receive daily digest emails" },
      { value: "sms", label: "SMS", description: "Receive urgent alerts via SMS" },
      { value: "push", label: "Push", disabled: true },
    ],
  },
});
```
::

### Controlled & Events

Use `value` with `bind:change` to control the selected values. The event payload `e.detail.value` contains the updated `string[]`.

::code-group
```html [index.wxml]
<c-checkbox-group
  legend="Notifications"
  items="{{notificationItems}}"
  value="{{selectedNotifications}}"
  bind:change="onNotificationsChange"
/>
```

```ts [index.ts]
Page({
  data: {
    selectedNotifications: ["email"],
    notificationItems: [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
      { value: "push", label: "Push" },
    ],
  },
  onNotificationsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ selectedNotifications: e.detail.value });
  },
});
```
::

### Color

Use the `color` prop to set the theme color for the group and forward it as the default color to rendered `items`. Supports `"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, and `"info"`.

```html [index.wxml]
<c-checkbox-group
  legend="Primary"
  color="primary"
  items="{{items}}"
  defaultValue="{{['a']}}"
/>

<c-checkbox-group
  legend="Success"
  color="success"
  items="{{items}}"
  defaultValue="{{['a']}}"
/>

<c-checkbox-group
  legend="Danger"
  color="danger"
  items="{{items}}"
  defaultValue="{{['a']}}"
/>
```

### Variant

Use the `variant` prop to switch between `"outline"` (default) and `"card"` styles for rendered `items`.

```html [index.wxml]
<c-checkbox-group
  legend="Outline (default)"
  variant="outline"
  items="{{items}}"
  defaultValue="{{['a']}}"
/>

<c-checkbox-group
  legend="Card"
  variant="card"
  items="{{items}}"
  defaultValue="{{['a']}}"
/>
```

### Size

Use the `size` prop to adjust the legend and rendered `items` size. Supports `"xs"`, `"sm"`, `"md"`, `"lg"`, and `"xl"` (falls back to form `fieldSize` or `"md"` when unset).

```html [index.wxml]
<c-checkbox-group legend="Extra Small" size="xs" items="{{items}}" />
<c-checkbox-group legend="Medium" size="md" items="{{items}}" />
<c-checkbox-group legend="Extra Large" size="xl" items="{{items}}" />
```

### Orientation

Use the `orientation` prop to lay out the checkbox fieldset `"vertical"` (default) or `"horizontal"`.

```html [index.wxml]
<c-checkbox-group
  legend="Horizontal"
  orientation="horizontal"
  items="{{items}}"
  defaultValue="{{['a']}}"
/>
```

### Min & Max

Use `min` and `max` to enforce the minimum number of items that must remain selected and the maximum number of items that can be selected.

::code-group
```html [index.wxml]
<c-checkbox-group
  legend="Pick 1 to 2 toppings"
  items="{{toppings}}"
  defaultValue="{{['cheese']}}"
  min="{{1}}"
  max="{{2}}"
/>
```

```ts [index.ts]
Page({
  data: {
    toppings: ["cheese", "mushroom", "pepperoni", "olives"],
  },
});
```
::

### Disabled & Read Only

Use `disabled` to disable all checkboxes in the group, or `readOnly` to prevent user toggling while keeping the checkboxes interactive-looking.

```html [index.wxml]
<c-checkbox-group
  legend="Disabled group"
  items="{{items}}"
  defaultValue="{{['a']}}"
  disabled="{{true}}"
/>

<c-checkbox-group
  legend="Read-only group"
  items="{{items}}"
  defaultValue="{{['a']}}"
  readOnly="{{true}}"
/>
```

### Required & Invalid

Use `required` to add the required indicator to `legend` and set `aria-required`, and `invalid` to mark the group as invalid (`aria-invalid`).

```html [index.wxml]
<c-checkbox-group
  legend="Terms"
  items="{{items}}"
  required="{{true}}"
  invalid="{{true}}"
/>
```

### Form Integration

Wrap `<c-checkbox-group>` inside `<c-form-field>` within `<c-form>`, placing `name`, `label`, `required`, and `rules` on `<c-form-field>` and `validate-on` / `bind:submit` on `<c-form>`.

::code-group
```html [index.wxml]
<c-form
  id="preferences-form"
  validate-on="{{validateOn}}"
  bind:submit="onSubmit"
>
  <c-form-field
    name="channels"
    label="Channels"
    required="{{true}}"
    rules="{{channelRules}}"
  >
    <c-checkbox-group
      items="{{items}}"
      default-value="{{['email']}}"
    />
  </c-form-field>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    validateOn: ["input", "change", "blur"],
    items: [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
      { value: "push", label: "Push" },
    ],
    channelRules: [
      {
        validator: (val: unknown) => {
          const arr = Array.isArray(val) ? val : [];
          return arr.length >= 1 || "Select at least one channel";
        },
      },
    ],
  },
  onSubmit(e: WechatMiniprogram.CustomEvent<{ values: Record<string, unknown> }>) {
    console.log(e.detail.values);
  },
});
```
::

### Slots

Use the default `<slot />` to compose `<c-checkbox>` children declaratively, and `slot="legend"` to provide custom legend markup when the `legend` prop is empty.

```html [index.wxml]
<c-checkbox-group
  defaultValue="{{['react']}}"
  orientation="horizontal"
  required="{{true}}"
>
  <view slot="legend" class="font-semibold">Frameworks</view>
  <c-checkbox value="react" label="React" />
  <c-checkbox value="vue" label="Vue" />
  <c-checkbox value="svelte" label="Svelte" />
</c-checkbox-group>
```

### Custom Styling

Use `ui` to override the `root`, `fieldset`, or `legend` slot classes (also forwarded as default `ui` to rendered `items`), and `className` to append classes to `root`.

```html [index.wxml]
<c-checkbox-group
  legend="Custom styled"
  items="{{items}}"
  ui="{{ { root: 'w-full', fieldset: 'gap-3', legend: 'text-primary' } }}"
  className="p-4 rounded-lg border"
/>
```

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string[] \| null` | `null` | Controlled array of selected item values. |
| `defaultValue` | `string[] \| null` | `[]` | Initial selected values for uncontrolled mode. |
| `items` | `(string \| CheckboxGroupItemRaw)[]` | `[]` | Options rendered automatically as `<c-checkbox>` children via `wx:for`. Each object supports `value`, `label`, `description`, `disabled`, `color`, `variant`, `size`, and `ui`. |
| `legend` | `string` | `""` | Group legend text displayed above the fieldset. When empty, uses the `legend` slot. |
| `color` | `CheckboxGroupColor` (`"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info" \| string`) | `"primary"` | Theme color for the group and default color forwarded to rendered `items`. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Size variant (resolves to `fieldSize` from form context if unset, otherwise `"md"`). Forwarded to rendered `items`. |
| `variant` | `"outline" \| "card"` | `"outline"` | Visual style variant forwarded to rendered `items`. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Layout direction of the checkbox fieldset. |
| `disabled` | `boolean` | `false` | Disables all checkboxes in the group. |
| `readOnly` | `boolean` | `false` | Makes the group read-only (prevents user toggling). |
| `required` | `boolean` | `false` | Marks the group as required (`aria-required` and required indicator on `legend`). |
| `invalid` | `boolean \| null` | `null` | Marks the group as invalid (`aria-invalid`). |
| `min` | `number \| null` | `null` | Minimum number of items that must remain selected. |
| `max` | `number \| null` | `null` | Maximum number of items that can be selected. |
| `name` | `string` | `""` | Form field name for `<c-form>` registration. |
| `form` | `string` | `""` | Target `<c-form>` id or name when multiple forms exist on the same page. |
| `formContext` | `FormHostContext \| null` | `undefined` | Optional explicit reactive form host context. |
| `ui` | `CheckboxGroupUI` (`Partial<Record<"root" \| "fieldset" \| "legend", string>>`) | `{}` | Per-slot class overrides merged into theme slot classes; also forwarded as default `ui` to rendered `items`. |
| `class` (`className`) | `string` | `""` | Additional root class string (`className` property in component definition) merged onto the `root` slot. |

## Slots

| Slot Name | Description |
| --- | --- |
| `default` | Rendered inside the `fieldset` container (`<slot />`) for declarative `<c-checkbox>` children. Remains present even when `items` is non-empty. |
| `legend` | Custom legend content rendered above the fieldset when the `legend` prop is empty. |

## Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: string[] }` (`CheckboxGroupValueChangeDetails`) | Fired when the selected values change (either from `items` `<c-checkbox>` taps or linked compound `<c-checkbox>` children). |

## Theme

Customize the `checkbox-group` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    checkboxGroup: {
      slots: {
        root: "relative inline-flex flex-col gap-1.5",
        fieldset: "flex flex-col gap-2",
        legend: "block font-medium text-highlighted leading-snug select-none",
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
        disabled: false,
        required: false,
        invalid: false,
      },
    },
  },
});
```
