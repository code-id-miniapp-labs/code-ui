---
title: PinInput
description: Multi-cell PIN and one-time-code (OTP) input component supporting configurable length, character type filtering, masking, cell separators, focus management, and form field integration.
---

## Overview

`<c-pin-input>` is a multi-cell PIN and one-time-code (OTP) input component supporting configurable length, character type filtering, masking, cell separators, focus management, and form field integration (`<c-form>` / `<c-form-field>`).

It is a standalone component that renders individual cells and separators internally and exposes its `pinInput` API on the component instance (`exportApi: true`).

## Usage

### Basic

Use `<c-pin-input>` with `label` and `placeholder` for a standard 4-cell numeric PIN input.

```html [index.wxml]
<c-pin-input label="PIN Code" placeholder="○" />
```

### Length

Use the `length` prop to configure the number of input cells (defaults to `4`).

```html [index.wxml]
<c-pin-input label="6-Digit Code" length="{{6}}" />
```

### Type

Use the `type` prop to restrict input to `"numeric"` (default), `"alphanumeric"`, or `"alphabetic"` characters.

```html [index.wxml]
<view class="flex flex-col gap-4">
  <c-pin-input label="Numeric" type="numeric" />
  <c-pin-input label="Alphanumeric" type="alphanumeric" />
  <c-pin-input label="Alphabetic" type="alphabetic" />
</view>
```

### Mask

Use the `mask` prop to hide entered characters in password mode.

```html [index.wxml]
<c-pin-input label="Security PIN" mask="{{true}}" />
```

### OTP & Focus Behavior

Enable `otp` (on by default) for one-time-code auto-fill, and combine with `autoFocus`, `blurOnComplete`, or `selectOnFocus` to control focus behavior.

```html [index.wxml]
<c-pin-input
  label="One-Time Code"
  length="{{6}}"
  otp="{{true}}"
  autoFocus="{{true}}"
  blurOnComplete="{{true}}"
  selectOnFocus="{{true}}"
/>
```

### Separator

Use `separator` and `separatorChar` to render dividers between cells. Pass `true` to split at the midpoint, a `number` to repeat every N cells, or a `number[]` for custom 1-based positions.

```html [index.wxml]
<view class="flex flex-col gap-4">
  <c-pin-input label="Midpoint Separator" length="{{6}}" separator="{{true}}" />
  <c-pin-input label="Every 2 Cells" length="{{6}}" separator="{{2}}" separatorChar="·" />
  <c-pin-input label="Custom Positions" length="{{6}}" separator="{{[2, 4]}}" separatorChar="/" />
</view>
```

### Color

Use the `color` prop to set the focus and highlight accent color (`"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, or `"info"`).

```html [index.wxml]
<view class="flex flex-col gap-4">
  <c-pin-input color="primary" highlight="{{true}}" />
  <c-pin-input color="neutral" highlight="{{true}}" />
  <c-pin-input color="success" highlight="{{true}}" />
  <c-pin-input color="warning" highlight="{{true}}" />
  <c-pin-input color="danger" highlight="{{true}}" />
  <c-pin-input color="info" highlight="{{true}}" />
</view>
```

### Variant

Use the `variant` prop to change the visual style of the cells (`"outline"`, `"soft"`, `"subtle"`, `"ghost"`, or `"none"`).

```html [index.wxml]
<view class="flex flex-col gap-4">
  <c-pin-input variant="outline" />
  <c-pin-input variant="soft" />
  <c-pin-input variant="subtle" />
  <c-pin-input variant="ghost" />
  <c-pin-input variant="none" />
</view>
```

### Size

Use the `size` prop to adjust cell and separator dimensions (`"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`).

```html [index.wxml]
<view class="flex flex-col gap-4">
  <c-pin-input size="xs" />
  <c-pin-input size="sm" />
  <c-pin-input size="md" />
  <c-pin-input size="lg" />
  <c-pin-input size="xl" />
</view>
```

### Highlight

Use the `highlight` prop to keep the active `color` border and ring visible even when the input is not focused.

```html [index.wxml]
<c-pin-input color="primary" highlight="{{true}}" />
```

### Disabled & Read-only

Use `disabled` to disable interaction across all cells, or `readOnly` to prevent edits while keeping non-disabled styling.

```html [index.wxml]
<view class="flex flex-col gap-4">
  <c-pin-input label="Disabled" defaultValue="1234" disabled="{{true}}" />
  <c-pin-input label="Read-only" defaultValue="1234" readOnly="{{true}}" />
</view>
```

### Invalid

Use `invalid` to display error styling explicitly. When left `null` (default), it inherits validation state from form integration.

```html [index.wxml]
<c-pin-input label="Verification Code" invalid="{{true}}" />
```

### Controlled

Bind `value` alongside `bind:change` for controlled state, or use `defaultValue` for uncontrolled initialization.

::code-group

```html [index.wxml]
<c-pin-input
  label="Verification Code"
  length="{{6}}"
  separator="{{3}}"
  value="{{code}}"
  bind:change="onCodeChange"
  bind:complete="onCodeComplete"
/>
```

```ts [index.ts]
Page({
  data: {
    code: "",
  },

  onCodeChange(
    e: WechatMiniprogram.CustomEvent<{
      value: string[];
      valueAsString: string;
    }>,
  ) {
    this.setData({ code: e.detail.valueAsString });
  },

  onCodeComplete(
    e: WechatMiniprogram.CustomEvent<{
      value: string[];
      valueAsString: string;
    }>,
  ) {
    console.log("Completed PIN:", e.detail.valueAsString);
  },
});
```

::

### Events

Listen to `bind:change`, `bind:complete`, `bind:invalid`, `bind:focus`, and `bind:blur` to react to cell input and focus lifecycle events.

::code-group

```html [index.wxml]
<c-pin-input
  type="numeric"
  length="{{4}}"
  bind:change="onChange"
  bind:complete="onComplete"
  bind:invalid="onInvalid"
  bind:focus="onFocus"
  bind:blur="onBlur"
/>
```

```ts [index.ts]
Page({
  onChange(
    e: WechatMiniprogram.CustomEvent<{
      value: string[];
      valueAsString: string;
    }>,
  ) {
    console.log("Change:", e.detail.valueAsString);
  },

  onComplete(
    e: WechatMiniprogram.CustomEvent<{
      value: string[];
      valueAsString: string;
    }>,
  ) {
    console.log("Complete:", e.detail.valueAsString);
  },

  onInvalid(
    e: WechatMiniprogram.CustomEvent<{ value: string; index: number }>,
  ) {
    console.warn("Invalid character at index", e.detail.index, e.detail.value);
  },

  onFocus(
    e: WechatMiniprogram.CustomEvent<{
      value: string[];
      valueAsString: string;
      index: number;
    }>,
  ) {
    console.log("Focused cell:", e.detail.index);
  },

  onBlur(
    e: WechatMiniprogram.CustomEvent<{
      value: string[];
      valueAsString: string;
    }>,
  ) {
    console.log("Blurred with value:", e.detail.valueAsString);
  },
});
```

::

### Form Integration

Wrap `<c-pin-input>` in `<c-form-field>` inside `<c-form>`, placing `name`, `label`, `required`, and `rules` on `<c-form-field>` and `validate-on` / `bind:submit` on `<c-form>`.

::code-group

```html [index.wxml]
<c-form validate-on="submit" bind:submit="onSubmit">
  <c-form-field
    name="otp"
    label="Verification Code"
    required="{{true}}"
    rules="{{otpRules}}"
  >
    <c-pin-input length="{{6}}" placeholder="○" />
  </c-form-field>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    otpRules: [{ required: true, message: "Please enter the 6-digit code" }],
  },

  onSubmit(e: WechatMiniprogram.CustomEvent<{ value: { otp: string } }>) {
    console.log("Submitted OTP:", e.detail.value.otp);
  },
});
```

::

### Slots

Use the `label` slot for custom label markup when the `label` prop is empty. When `label` is non-empty, it takes precedence over the slot.

```html [index.wxml]
<c-pin-input length="{{4}}">
  <view slot="label" class="text-sm font-semibold">Enter Security PIN</view>
</c-pin-input>
```

### Custom Styling

Use `ui` to override classes on individual slots (`root`, `label`, `control`, `input`, `nativeInput`, `separator`) and `className` to add root-level classes.

```html [index.wxml]
<c-pin-input
  length="{{4}}"
  variant="subtle"
  size="lg"
  separator="{{true}}"
  className="my-4"
  ui="{{ { input: 'rounded-xl', separator: 'text-primary' } }}"
/>
```

## Props

| Name             | Type                                                                                                 | Default     | Description                                                                                                                                                                                     |
| :--------------- | :--------------------------------------------------------------------------------------------------- | :---------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`          | `string[] \| string \| null`                                                                         | `null`      | Controlled PIN value as an array of single-character strings or a combined string.                                                                                                              |
| `defaultValue`   | `string[] \| string \| null`                                                                         | `undefined` | Initial uncontrolled PIN value.                                                                                                                                                                 |
| `length`         | `number`                                                                                             | `4`         | Number of PIN input cells.                                                                                                                                                                      |
| `type`           | `"numeric" \| "alphanumeric" \| "alphabetic"`                                                        | `"numeric"` | Accepted character type. `"numeric"` configures native `<input type="number">`.                                                                                                                 |
| `label`          | `string`                                                                                             | `""`        | Optional text label rendered above the cells. Takes precedence over the `label` slot when non-empty.                                                                                            |
| `placeholder`    | `string`                                                                                             | `""`        | Placeholder character displayed in empty cells.                                                                                                                                                 |
| `mask`           | `boolean`                                                                                            | `false`     | Masks entered characters using native `password` mode when a cell has a value.                                                                                                                  |
| `disabled`       | `boolean`                                                                                            | `false`     | Disables interaction across all cells.                                                                                                                                                          |
| `readOnly`       | `boolean`                                                                                            | `false`     | Prevents editing across all cells while preserving non-disabled styling.                                                                                                                        |
| `invalid`        | `boolean \| null`                                                                                    | `null`      | Explicit invalid state. When `null`, inherits validation state from form integration.                                                                                                           |
| `otp`            | `boolean`                                                                                            | `true`      | Enables one-time-code (OTP) auto-fill handling.                                                                                                                                                 |
| `autoFocus`      | `boolean`                                                                                            | `false`     | Automatically focuses the first cell on mount.                                                                                                                                                  |
| `blurOnComplete` | `boolean`                                                                                            | `false`     | Blurs the active cell once all cells are filled.                                                                                                                                                |
| `selectOnFocus`  | `boolean`                                                                                            | `false`     | Selects existing cell text on focus.                                                                                                                                                            |
| `separator`      | `boolean \| number \| number[]`                                                                      | `false`     | Renders separators between cells: `true` inserts at `Math.floor(length / 2)`, a `number` inserts after every Nth cell, and `number[]` inserts after specified 1-based cell counts (e.g. `[3]`). |
| `separatorChar`  | `string`                                                                                             | `"-"`       | Character rendered inside separator elements.                                                                                                                                                   |
| `variant`        | `"outline" \| "soft" \| "subtle" \| "ghost" \| "none"`                                               | `"outline"` | Visual style variant for input cells.                                                                                                                                                           |
| `color`          | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"`                             | `"primary"` | Accent color applied to focus and highlight rings/borders.                                                                                                                                      |
| `size`           | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""`                                                         | `""`        | Cell and separator size. Falls back to form `fieldSize` or `"md"` when empty.                                                                                                                   |
| `highlight`      | `boolean`                                                                                            | `false`     | Keeps the active `color` border/ring highlighted even when not focused.                                                                                                                         |
| `name`           | `string`                                                                                             | `""`        | Field name for form registration and hidden input metadata.                                                                                                                                     |
| `form`           | `string`                                                                                             | `undefined` | Target `<c-form>` id/name when multiple forms exist on the same page.                                                                                                                           |
| `rules`          | `FormRule[]`                                                                                         | `undefined` | Field-level validation rules for form integration.                                                                                                                                              |
| `validateOn`     | `FormValidateOn`                                                                                     | `undefined` | Field-level override for form validation triggers.                                                                                                                                              |
| `fieldDisabled`  | `boolean`                                                                                            | `undefined` | Disabled state inherited from a wrapping form field.                                                                                                                                            |
| `ui`             | `Partial<Record<"root" \| "label" \| "control" \| "input" \| "nativeInput" \| "separator", string>>` | `{}`        | Per-slot Tailwind/utility class overrides merged with the resolved theme classes.                                                                                                               |
| `className`      | `string`                                                                                             | `""`        | Additional root class override passed to `resolveSlots` for root `class` customization.                                                                                                         |

## Slots

| Name        | Description                                                                                      |
| :---------- | :----------------------------------------------------------------------------------------------- |
| `label`     | Named slot for custom label markup rendered above the cell group when the `label` prop is empty. |
| _(default)_ | Not supported. Cells and separators are rendered internally.                                     |

## Events

| Event           | Detail Payload                                              | Description                                                           |
| :-------------- | :---------------------------------------------------------- | :-------------------------------------------------------------------- |
| `bind:change`   | `{ value: string[], valueAsString: string }`                | Fired when the PIN value changes.                                     |
| `bind:complete` | `{ value: string[], valueAsString: string }`                | Fired when all cells have been filled.                                |
| `bind:invalid`  | `{ value: string, index: number }`                          | Fired when an invalid character is entered for the configured `type`. |
| `bind:focus`    | `{ value: string[], valueAsString: string, index: number }` | Fired when a cell receives focus.                                     |
| `bind:blur`     | `{ value: string[], valueAsString: string }`                | Fired when focus leaves the PIN input.                                |

## Theme

Customize the `pin-input` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    pinInput: {
      slots: {
        root: "inline-flex flex-col gap-1.5",
        label: "text-sm font-medium text-highlighted",
        control: "relative inline-flex items-center gap-1.5",
        input:
          "flex items-center justify-center overflow-hidden min-h-0 box-border p-0 m-0 rounded-md border text-center font-semibold transition-colors focus:outline-none",
        nativeInput:
          "w-full min-h-0 bg-transparent border-0 p-0 m-0 text-center font-semibold text-inherit leading-normal focus:outline-none",
        separator: "text-dimmed font-medium select-none px-0.5",
      },
      variants: {
        color: {
          primary: {
            input:
              "focus:border-primary focus:ring-2 focus:ring-primary/20 data-[focused=true]:border-primary data-[focused=true]:ring-2 data-[focused=true]:ring-primary/20",
          },
          secondary: {
            input:
              "focus:border-secondary focus:ring-2 focus:ring-secondary/20 data-[focused=true]:border-secondary data-[focused=true]:ring-2 data-[focused=true]:ring-secondary/20",
          },
          danger: {
            input:
              "focus:border-danger focus:ring-2 focus:ring-danger/20 data-[focused=true]:border-danger data-[focused=true]:ring-2 data-[focused=true]:ring-danger/20",
          },
          success: {
            input:
              "focus:border-success focus:ring-2 focus:ring-success/20 data-[focused=true]:border-success data-[focused=true]:ring-2 data-[focused=true]:ring-success/20",
          },
          warning: {
            input:
              "focus:border-warning focus:ring-2 focus:ring-warning/20 data-[focused=true]:border-warning data-[focused=true]:ring-2 data-[focused=true]:ring-warning/20",
          },
          info: {
            input:
              "focus:border-info focus:ring-2 focus:ring-info/20 data-[focused=true]:border-info data-[focused=true]:ring-2 data-[focused=true]:ring-info/20",
          },
          neutral: {
            input:
              "focus:border-inverted focus:ring-2 focus:ring-inverted/20 data-[focused=true]:border-inverted data-[focused=true]:ring-2 data-[focused=true]:ring-inverted/20",
          },
        },
        variant: {
          outline: {
            input: "bg-default text-highlighted border-accented",
          },
          soft: {
            input: "bg-elevated text-highlighted border-transparent",
          },
          subtle: {
            input: "bg-elevated text-highlighted border-accented",
          },
          ghost: {
            input:
              "bg-transparent text-highlighted border-transparent focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
          },
          none: {
            input:
              "bg-transparent text-highlighted border-0 focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
          },
        },
        size: {
          xs: {
            input: "w-7 h-7 text-xs",
            separator: "text-xs",
          },
          sm: {
            input: "w-8 h-8 text-xs",
            separator: "text-xs",
          },
          md: {
            input: "w-9 h-9 text-sm",
            separator: "text-sm",
          },
          lg: {
            input: "w-10 h-10 text-base",
            separator: "text-base",
          },
          xl: {
            input: "w-11 h-11 text-lg",
            separator: "text-lg",
          },
        },
        highlight: {
          true: {
            input: "",
          },
          false: {
            input: "",
          },
        },
        disabled: {
          true: {
            root: "opacity-60 cursor-not-allowed",
            input: "cursor-not-allowed bg-elevated text-dimmed",
          },
          false: {
            input: "",
          },
        },
        invalid: {
          true: {
            input: "",
          },
          false: {
            input: "",
          },
        },
      },
      compoundVariants: [
        {
          color: "primary",
          highlight: true,
          class: {
            input: "border-primary ring-2 ring-primary/20",
          },
        },
        {
          color: "secondary",
          highlight: true,
          class: {
            input: "border-secondary ring-2 ring-secondary/20",
          },
        },
        {
          color: "danger",
          highlight: true,
          class: {
            input: "border-danger ring-2 ring-danger/20",
          },
        },
        {
          color: "success",
          highlight: true,
          class: {
            input: "border-success ring-2 ring-success/20",
          },
        },
        {
          color: "warning",
          highlight: true,
          class: {
            input: "border-warning ring-2 ring-warning/20",
          },
        },
        {
          color: "info",
          highlight: true,
          class: {
            input: "border-info ring-2 ring-info/20",
          },
        },
        {
          color: "neutral",
          highlight: true,
          class: {
            input: "border-inverted ring-2 ring-inverted/20",
          },
        },
        {
          invalid: true,
          class: {
            input:
              "border-danger ring-2 ring-danger/20 focus:border-danger focus:ring-2 focus:ring-danger/20 data-[focused=true]:border-danger data-[focused=true]:ring-2 data-[focused=true]:ring-danger/20",
          },
        },
      ],
      defaultVariants: {
        variant: "outline",
        color: "primary",
        size: "md",
        highlight: false,
        disabled: false,
        invalid: false,
      },
    },
  },
});
```
