---
title: Checkbox
description: A form-capable checkbox control supporting checked, unchecked, and indeterminate states, optional label/description text, custom indicator icons or slots, and standalone or grouped selection.
---

## Overview

`c-checkbox` is a form-capable checkbox control supporting checked, unchecked, and indeterminate states, optional label and description text, custom indicator icons or slots, and standalone or grouped selection.

- **Tag**: `c-checkbox`
- **Related Components**: `<c-checkbox-group>`, `<c-form>`, `<c-icon>`

::callout{icon="i-lucide-info" color="info"}

- When nested inside `<c-checkbox-group>` or `<c-form>` / form field containers, `color`, `size`, `variant`, and `disabled` inherit group and field context fallbacks (`size` falls back to `groupSize`, then `fieldSize`, then `"md"`; `color` falls back to `groupColor`, then `"primary"`; `variant` falls back to `groupVariant`, then `"outline"`).
- This component uses `className` rather than `class` in its properties for additional root class overrides.
::

## Usage

### Basic

Use `label` to render text beside the checkbox and `defaultChecked` for uncontrolled initial state.

::code-group

```html [index.wxml]
<c-checkbox label="Accept terms and conditions" />

<c-checkbox defaultChecked="{{true}}" label="Subscribe to newsletter" />
```

```json [index.json]
{
  "usingComponents": {
    "c-checkbox": "@code-id-labs/components/checkbox/index"
  }
}
```

::

### Description

Use `description` to display secondary helper text beneath the label.

```html [index.wxml]
<c-checkbox
  defaultChecked="{{true}}"
  label="Accept terms"
  description="You agree to the terms of service and privacy policy."
/>
```

### Controlled & Events

Use `checked` together with `bind:change` to control the checked state from page data. The `change` event detail provides `{ value, checked }`.

::code-group

```html [index.wxml]
<c-checkbox
  checked="{{agreed}}"
  value="terms"
  label="I agree to the terms"
  bind:change="onCheckboxChange"
/>
```

```ts [index.ts]
Page({
  data: {
    agreed: false,
  },

  onCheckboxChange(
    e: WechatMiniprogram.CustomEvent<{ value: string; checked: boolean }>,
  ) {
    this.setData({
      agreed: e.detail.checked,
    });
  },
});
```

::

### Indeterminate

Use `indeterminate` (controlled) or `defaultIndeterminate` (uncontrolled) to represent a partially selected state.

::code-group

```html [index.wxml]
<c-checkbox
  checked="{{allSelected}}"
  indeterminate="{{partial}}"
  label="Select all notifications"
  bind:change="onSelectAllChange"
/>

<c-checkbox defaultIndeterminate="{{true}}" label="Partially selected (uncontrolled)" />
```

```ts [index.ts]
Page({
  data: {
    allSelected: false,
    partial: true,
  },

  onSelectAllChange(
    e: WechatMiniprogram.CustomEvent<{ value: string; checked: boolean }>,
  ) {
    this.setData({
      allSelected: e.detail.checked,
      partial: false,
    });
  },
});
```

::

### Color

Use `color` to change the checked and indeterminate indicator color. Supported tokens include `"primary"`, `"neutral"`, `"success"`, `"warning"`, `"danger"`, and `"info"`.

```html [index.wxml]
<c-checkbox defaultChecked="{{true}}" color="primary" label="Primary" />
<c-checkbox defaultChecked="{{true}}" color="neutral" label="Neutral" />
<c-checkbox defaultChecked="{{true}}" color="success" label="Success" />
<c-checkbox defaultChecked="{{true}}" color="warning" label="Warning" />
<c-checkbox defaultChecked="{{true}}" color="danger" label="Danger" />
<c-checkbox defaultChecked="{{true}}" color="info" label="Info" />
```

### Variant

Use `variant` to switch between `"outline"` (default) and `"card"`.

```html [index.wxml]
<c-checkbox
  variant="outline"
  defaultChecked="{{true}}"
  label="Outline variant"
  description="Default compact checkbox style."
/>

<c-checkbox
  variant="card"
  defaultChecked="{{true}}"
  label="Card variant"
  description="Full-width bordered card container."
/>
```

### Size

Use `size` to adjust the checkbox dimensions and text scale across `"xs"`, `"sm"`, `"md"`, `"lg"`, and `"xl"`.

```html [index.wxml]
<c-checkbox defaultChecked="{{true}}" size="xs" label="Extra small" />
<c-checkbox defaultChecked="{{true}}" size="sm" label="Small" />
<c-checkbox defaultChecked="{{true}}" size="md" label="Medium" />
<c-checkbox defaultChecked="{{true}}" size="lg" label="Large" />
<c-checkbox defaultChecked="{{true}}" size="xl" label="Extra large" />
```

### Icon

Use `icon` and `indeterminateIcon` to customize the `<c-icon>` name rendered inside the checkbox when checked or indeterminate.

```html [index.wxml]
<c-checkbox
  defaultChecked="{{true}}"
  icon="check-bold"
  label="Custom checked icon"
/>

<c-checkbox
  defaultIndeterminate="{{true}}"
  indeterminateIcon="minus-circle"
  label="Custom indeterminate icon"
/>
```

### Disabled & Read Only

Use `disabled` to prevent interaction with muted styling, or `readOnly` to keep the current visual state non-editable.

```html [index.wxml]
<c-checkbox disabled="{{true}}" label="Disabled unchecked" />
<c-checkbox disabled="{{true}}" defaultChecked="{{true}}" label="Disabled checked" />
<c-checkbox readOnly="{{true}}" defaultChecked="{{true}}" label="Read-only checked" />
```

### Required & Invalid

Use `required` to display a required asterisk on the label, and `invalid` to apply error border and ring styling.

```html [index.wxml]
<c-checkbox required="{{true}}" label="Required agreement" />
<c-checkbox invalid="{{true}}" label="Must accept to continue" />
<c-checkbox variant="card" invalid="{{true}}" defaultChecked="{{true}}" label="Invalid card option" />
```

### Form Integration

Wrap `<c-checkbox>` inside `<c-form-field>` within a `<c-form>` to participate in form validation and submission. Define `name`, `required`, and `rules` on `<c-form-field>`, and `validate-on` and `bind:submit` on `<c-form>`.

::code-group

```html [index.wxml]
<c-form
  id="profile-form"
  validate-on="{{ validateOn }}"
  bind:submit="onFormSubmit"
>
  <c-form-field
    name="terms"
    required="{{ true }}"
    rules="{{ termsRules }}"
  >
    <c-checkbox
      label="Accept terms of service"
      description="Agree to the terms and privacy policy to continue."
    />
  </c-form-field>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    validateOn: ["change", "blur"],
    termsRules: [
      { required: true, message: "You must accept the terms of service" },
    ],
  },

  onFormSubmit(e: WechatMiniprogram.CustomEvent<{ values: Record<string, unknown> }>) {
    console.log("Submitted:", e.detail.values);
  },
});
```

::

### Slots

Use the `indicator`, `label`, `description`, or default slots to customize the checkbox rendering.

```html [index.wxml]
<!-- Custom indicator, label, and description slots -->
<c-checkbox defaultChecked="{{true}}">
  <text slot="indicator">✓</text>
  <view slot="label">Custom <text class="text-primary">Label</text></view>
  <view slot="description">Rendered via the <text class="font-medium">description</text> slot.</view>
</c-checkbox>

<!-- Default slot when label and description are omitted -->
<c-checkbox defaultChecked="{{true}}">
  <text>Custom default slot content</text>
</c-checkbox>
```

### Custom Styling

Use `ui` to override individual slot classes (`root`, `base`, `indicator`, `icon`, `wrapper`, `label`, `description`) and `className` to add classes to the root element.

```html [index.wxml]
<c-checkbox
  variant="card"
  defaultChecked="{{true}}"
  label="Custom styled checkbox"
  ui="{{ { root: 'mb-3', label: 'font-semibold text-primary' } }}"
  className="w-full"
/>
```

## Props

| Name                   | Type                                                                                                          | Default     | Description                                                                            |
| :--------------------- | :------------------------------------------------------------------------------------------------------------ | :---------- | :------------------------------------------------------------------------------------- |
| `checked`              | `boolean \| null`                                                                                             | `null`      | Controlled checked state.                                                              |
| `defaultChecked`       | `boolean`                                                                                                     | `false`     | Initial checked state when uncontrolled.                                               |
| `indeterminate`        | `boolean \| null`                                                                                             | `null`      | Controlled indeterminate state.                                                        |
| `defaultIndeterminate` | `boolean`                                                                                                     | `false`     | Initial indeterminate state when uncontrolled.                                         |
| `disabled`             | `boolean`                                                                                                     | `false`     | Disables user interaction.                                                             |
| `readOnly`             | `boolean`                                                                                                     | `false`     | Makes the checkbox non-editable while preserving display state.                        |
| `required`             | `boolean`                                                                                                     | `false`     | Marks the checkbox as required (adds required indicator styling on `label`).           |
| `invalid`              | `boolean \| null`                                                                                             | `null`      | Marks the checkbox as invalid (applies error styling).                                 |
| `value`                | `string`                                                                                                      | `""`        | Value submitted with the parent group or form when checked.                            |
| `name`                 | `string`                                                                                                      | `""`        | Field name used for form registration.                                                 |
| `form`                 | `string`                                                                                                      | `""`        | Target `<c-form>` id or name when multiple forms exist on the same page.               |
| `formContext`          | `FormHostContext \| null \| undefined`                                                                        | `undefined` | Optional explicit reactive form host context.                                          |
| `color`                | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info" \| string`                            | `""`        | Visual color token. Falls back to `groupColor`, then `"primary"`.                      |
| `size`                 | `"xs" \| "sm" \| "md" \| "lg" \| "xl"`                                                                        | `""`        | Size token. Falls back to `groupSize`, then `fieldSize`, then `"md"`.                  |
| `variant`              | `"outline" \| "card"`                                                                                         | `""`        | Visual variant. Falls back to `groupVariant`, then `"outline"`.                        |
| `label`                | `string`                                                                                                      | `""`        | Primary label text rendered next to the checkbox.                                      |
| `description`          | `string`                                                                                                      | `""`        | Secondary helper or description text rendered below the label.                         |
| `icon`                 | `string`                                                                                                      | `"check"`   | Icon name passed to `<c-icon>` when checked and no `indicator` slot is supplied.       |
| `indeterminateIcon`    | `string`                                                                                                      | `"minus"`   | Icon name passed to `<c-icon>` when indeterminate and no `indicator` slot is supplied. |
| `ui`                   | `Partial<Record<"root" \| "base" \| "indicator" \| "icon" \| "wrapper" \| "label" \| "description", string>>` | `{}`        | Per-slot class overrides merged with the resolved theme classes.                       |
| `className`            | `string`                                                                                                      | `""`        | Additional root class override merged onto the `root` slot.                            |

## Slots

| Name          | Description                                                                                                                                                     |
| :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(default)_   | Custom content rendered when `label`, `description`, and their corresponding named slots are not provided.                                                      |
| `indicator`   | Replaces the default `<c-icon>` indicator inside the checkbox box. When omitted, `<c-icon>` renders `indeterminateIcon` if indeterminate, or `icon` if checked. |
| `label`       | Custom label content inside the text wrapper when the `label` prop is empty.                                                                                    |
| `description` | Custom description content inside the text wrapper when the `description` prop is empty.                                                                        |

## Events

| Event         | Detail Payload                                                         | Description                           |
| :------------ | :--------------------------------------------------------------------- | :------------------------------------ |
| `bind:change` | `{ value: string, checked: boolean }` (`CheckboxCheckedChangeDetails`) | Fired when the checked state changes. |

## Theme

Customize the `checkbox` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    checkbox: {
      slots: {
        root: "relative inline-flex flex-row items-start select-none cursor-pointer",
        base: "relative mt-0.5 flex items-center justify-center border transition-colors shrink-0",
        indicator:
          "flex items-center justify-center w-full h-full text-white transition-opacity duration-150 ease-out select-none pointer-events-none",
        icon: "w-full h-full select-none pointer-events-none",
        wrapper: "ms-2 flex flex-col justify-center select-none min-w-0",
        label: "block font-medium text-highlighted leading-snug select-none",
        description: "block mt-0.5 text-muted leading-snug select-none",
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
                base: `border-${color} bg-${color} text-white`,
              },
            ]),
          ),
          {
            neutral: {
              base: "border-inverted bg-inverted text-inverted",
            },
          },
        ),
        size: {
          xs: {
            base: "w-3.5 h-3.5 rounded-xs",
            indicator: "w-2.5 h-2.5",
            icon: "text-xs",
            wrapper: "text-xs",
            label: "text-xs",
            description: "text-2xs",
          },
          sm: {
            base: "w-4 h-4 rounded-xs",
            indicator: "w-3 h-3",
            icon: "text-xs",
            wrapper: "text-xs",
            label: "text-xs",
            description: "text-2xs",
          },
          md: {
            base: "w-4.5 h-4.5 rounded-sm",
            indicator: "w-3.5 h-3.5",
            icon: "text-sm",
            wrapper: "text-sm",
            label: "text-sm",
            description: "text-xs",
          },
          lg: {
            base: "w-5 h-5 rounded-sm",
            indicator: "w-4 h-4",
            icon: "text-base",
            wrapper: "text-base",
            label: "text-base",
            description: "text-sm",
          },
          xl: {
            base: "w-6 h-6 rounded-md",
            indicator: "w-4.5 h-4.5",
            icon: "text-lg",
            wrapper: "text-lg",
            label: "text-lg",
            description: "text-base",
          },
        },
        checked: {
          true: {
            indicator: "opacity-100",
          },
          false: {},
        },
        indeterminate: {
          true: {
            indicator: "opacity-100",
          },
          false: {},
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
        required: {
          true: {
            label: `after:content-['*'] after:ms-0.5 after:text-${errorColor}`,
          },
          false: {},
        },
      },
      compoundVariants: [
        {
          checked: false,
          indeterminate: false,
          invalid: false,
          class: {
            base: "border-accented bg-default",
            indicator: "opacity-0",
          },
        },
        {
          checked: false,
          indeterminate: false,
          invalid: true,
          class: {
            base: `border-${errorColor} bg-default`,
            indicator: "opacity-0",
          },
        },
        ...colors.flatMap((color) => [
          {
            variant: "card" as const,
            color,
            checked: true as const,
            class: {
              root: `border-${color} bg-${color}/5 ring-1 ring-${color}`,
            },
          },
          {
            variant: "card" as const,
            color,
            indeterminate: true as const,
            class: {
              root: `border-${color} bg-${color}/5 ring-1 ring-${color}`,
            },
          },
        ]),
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
          color: "neutral" as const,
          indeterminate: true as const,
          class: {
            root: "border-inverted bg-elevated ring-1 ring-inverted",
          },
        },
        {
          invalid: true,
          checked: true,
          class: {
            base: `border-${errorColor} bg-${errorColor} text-white`,
            indicator: "opacity-100",
          },
        },
        {
          invalid: true,
          indeterminate: true,
          class: {
            base: `border-${errorColor} bg-${errorColor} text-white`,
            indicator: "opacity-100",
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
      ],
      defaultVariants: {
        variant: "outline",
        color: "primary",
        size: "md",
        checked: false,
        indeterminate: false,
        disabled: false,
        invalid: false,
        required: false,
      },
    },
  },
});
```
