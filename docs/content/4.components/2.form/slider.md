---
title: Slider
description: Slider input component supporting single-value and range selection, horizontal and vertical orientations, step increments, inverted direction, track marks, and form field integration.
---

## Overview

`c-slider` is a slider input component supporting single-value and range (multi-thumb) selection, horizontal and vertical orientations, step increments, inverted direction, track marks, and form field integration when used within a parent form host (`formContext`).

## Usage

### Basic

Use `c-slider` with `defaultValue` for uncontrolled usage, `label` for a header title, and `showValue` to display the formatted value.

```html
<c-slider label="Volume" showValue="{{true}}" defaultValue="{{40}}" />
```

### Controlled

Use `value` with `onChange` (and optionally `onChangeEnd`) to control the slider value from page state.

::code-group

```html [index.wxml]
<c-slider
  label="Brightness"
  showValue="{{true}}"
  value="{{brightness}}"
  bind:change="handleChange"
  bind:changeEnd="handleChangeEnd"
/>
```

```ts [index.ts]
Page({
  data: {
    brightness: 60,
  },

  handleChange(e: WechatMiniprogram.CustomEvent<{ value: number | number[]; values: number[] }>) {
    this.setData({ brightness: e.detail.value as number });
  },

  handleChangeEnd(e: WechatMiniprogram.CustomEvent<{ value: number | number[]; values: number[] }>) {
    console.log("Committed value:", e.detail.value);
  },
});
```

::

### Min, Max & Step

Use `min`, `max`, and `step` to define the selectable range and increment granularity.

```html
<c-slider
  label="Temperature"
  showValue="{{true}}"
  defaultValue="{{22}}"
  min="{{16}}"
  max="{{30}}"
  step="{{2}}"
/>
```

### Range

Pass an array of numbers to `defaultValue` or `value` to enable range (multi-thumb) mode. Use `minStepsBetweenThumbs` to enforce a minimum step gap between thumbs.

::code-group

```html [index.wxml]
<c-slider
  label="Price Range"
  showValue="{{true}}"
  defaultValue="{{priceRange}}"
  min="{{0}}"
  max="{{100}}"
  step="{{10}}"
  minStepsBetweenThumbs="{{2}}"
/>
```

```ts [index.ts]
Page({
  data: {
    priceRange: [20, 80],
  },
});
```

::

### Marks

Use `marks="{{true}}"` to auto-generate scale marks from `min`, `max`, and `step`, or pass an array of `{ value, label? }` objects for custom marks.

::code-group

```html [index.wxml]
<!-- Auto-generated marks -->
<c-slider
  label="Rating"
  defaultValue="{{3}}"
  min="{{1}}"
  max="{{5}}"
  step="{{1}}"
  marks="{{true}}"
/>

<!-- Custom labeled marks -->
<c-slider
  label="Quality"
  defaultValue="{{50}}"
  min="{{0}}"
  max="{{100}}"
  step="{{25}}"
  marks="{{qualityMarks}}"
/>
```

```ts [index.ts]
Page({
  data: {
    qualityMarks: [
      { value: 0, label: "Low" },
      { value: 50, label: "Medium" },
      { value: 100, label: "High" },
    ],
  },
});
```

::

### Orientation

Use `orientation` to render a `"horizontal"` (default) or `"vertical"` slider track.

```html
<c-slider orientation="horizontal" defaultValue="{{40}}" />
<c-slider orientation="vertical" defaultValue="{{65}}" />
```

### Inverted

Set `inverted="{{true}}"` to reverse the visual direction along the track.

```html
<c-slider label="Inverted" showValue="{{true}}" defaultValue="{{30}}" inverted="{{true}}" />
```

### Color

Use the `color` prop to change the active range and focus ring color. Available colors include `primary` (default), `secondary`, `danger`, `success`, `warning`, `info`, and `neutral`.

```html
<c-slider color="primary" defaultValue="{{50}}" />
<c-slider color="secondary" defaultValue="{{50}}" />
<c-slider color="success" defaultValue="{{50}}" />
<c-slider color="warning" defaultValue="{{50}}" />
<c-slider color="danger" defaultValue="{{50}}" />
<c-slider color="info" defaultValue="{{50}}" />
<c-slider color="neutral" defaultValue="{{50}}" />
```

### Size

Use the `size` prop to control track thickness, thumb dimensions, and header typography. Available sizes are `xs`, `sm`, `md` (default), `lg`, and `xl`.

```html
<c-slider size="xs" defaultValue="{{50}}" />
<c-slider size="sm" defaultValue="{{50}}" />
<c-slider size="md" defaultValue="{{50}}" />
<c-slider size="lg" defaultValue="{{50}}" />
<c-slider size="xl" defaultValue="{{50}}" />
```

### Disabled

Set `disabled="{{true}}"` to disable touch/pointer interaction and apply disabled styling.

```html
<c-slider label="Disabled" defaultValue="{{45}}" disabled="{{true}}" />
```

### Read-Only

Set `readOnly="{{true}}"` to prevent value changes while keeping the normal interactive appearance.

```html
<c-slider label="Read-only" showValue="{{true}}" defaultValue="{{70}}" readOnly="{{true}}" />
```

### Invalid

Set `invalid="{{true}}"` to apply invalid/error styling to the range and thumb.

```html
<c-slider label="Invalid" defaultValue="{{15}}" invalid="{{true}}" />
```

### Form Integration

Wrap `c-slider` inside `<c-form-field>` within `<c-form>` to integrate with form state, validation rules, and submission handling.

::code-group

```html [index.wxml]
<c-form
  id="audio-settings"
  validate-on="{{validateOn}}"
  bind:submit="handleSubmit"
>
  <c-form-field
    name="volume"
    label="Master Volume"
    hint="0-100"
    required="{{true}}"
    rules="{{volumeRules}}"
  >
    <c-slider defaultValue="{{50}}" min="{{0}}" max="{{100}}" showValue="{{true}}" />
  </c-form-field>

  <c-button label="Save" bind:tap="submitForm" />
</c-form>
```

```ts [index.ts]
Page({
  data: {
    validateOn: ["change", "blur"],
    volumeRules: [
      {
        validator: (val: unknown) =>
          (typeof val === "number" && val >= 10) || "Volume must be at least 10",
      },
    ],
  },

  submitForm() {
    this.selectComponent("#audio-settings")?.submit?.();
  },

  handleSubmit(e: WechatMiniprogram.CustomEvent) {
    console.log("Submitted values:", e.detail.values);
  },
});
```

::

### Slots

Use the `label`, `value`, and `thumb` named slots to customize the header label, header value display, and thumb contents. The `label` prop overrides the `label` slot when non-empty, and `showValue="{{true}}"` overrides the `value` slot.

::code-group

```html [index.wxml]
<c-slider defaultValue="{{progress}}">
  <text slot="label" class="font-semibold">Progress</text>
  <text slot="value" class="text-xs text-muted">{{progress}}%</text>
  <view slot="thumb" class="w-1.5 h-1.5 rounded-full bg-primary" />
</c-slider>
```

```ts [index.ts]
Page({
  data: {
    progress: 65,
  },
});
```

::

### Events

Pass `onChange`, `onChangeEnd`, `onFocus`, and `onBlur` callbacks via `SliderProps` to respond to value updates and thumb focus transitions.

::code-group

```html [index.wxml]
<c-slider
  label="Opacity"
  showValue="{{true}}"
  defaultValue="{{opacity}}"
  bind:change="onOpacityChange"
  bind:changeEnd="onOpacityChangeEnd"
  bind:focus="onThumbFocus"
  bind:blur="onThumbBlur"
/>
```

```ts [index.ts]
Page({
  data: {
    opacity: 80,
  },

  onOpacityChange(e: WechatMiniprogram.CustomEvent<{ value: number | number[]; values: number[] }>) {
    this.setData({ opacity: e.detail.value as number });
  },

  onOpacityChangeEnd(e: WechatMiniprogram.CustomEvent<{ value: number | number[]; values: number[] }>) {
    console.log("Final opacity:", e.detail.values);
  },

  onThumbFocus(e: WechatMiniprogram.CustomEvent<{ index: number; value: number }>) {
    console.log("Focused thumb:", e.detail.index, e.detail.value);
  },

  onThumbBlur(e: WechatMiniprogram.CustomEvent<{ index: number; value: number }>) {
    console.log("Blurred thumb:", e.detail.index, e.detail.value);
  },
});
```

::

### Custom Styling

Use `className` to add classes to the `root` slot and `ui` to override classes on individual theme slots (`root`, `wrapper`, `label`, `valueText`, `control`, `track`, `range`, `thumb`, `markerGroup`, `marker`, `markerTick`, `markerTickActive`, `markerLabel`, `markerLabelActive`).

::code-group

```html [index.wxml]
<c-slider
  label="Custom Slider"
  showValue="{{true}}"
  defaultValue="{{50}}"
  className="mt-4"
  ui="{{sliderUi}}"
/>
```

```ts [index.ts]
Page({
  data: {
    sliderUi: {
      track: "h-2.5 bg-elevated",
      range: "bg-primary",
      thumb: "ring-2 ring-primary",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number \| number[] \| string \| null` | `null` | Controlled slider value. Use a `number` for single-thumb mode or `number[]` for range mode. |
| `defaultValue` | `number \| number[] \| string \| null` | `null` | Initial value for uncontrolled usage. |
| `min` | `number` | `0` | Minimum allowed value. |
| `max` | `number` | `100` | Maximum allowed value. |
| `step` | `number` | `1` | Step increment between selectable values. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Axis orientation of the slider track. |
| `inverted` | `boolean` | `false` | Reverses the visual direction along the track. |
| `minStepsBetweenThumbs` | `number` | `0` | Minimum step distance enforced between thumbs in range mode. |
| `marks` | `boolean \| SliderMark[]` | `false` | Displays scale marks along the track. `true` auto-generates marks from `min`, `max`, and `step`; an array of `{ value: number; label?: string }` renders custom marks. |
| `label` | `string` | `""` | Text label rendered in the header wrapper. Overrides the `label` slot when non-empty. |
| `showValue` | `boolean` | `false` | Displays the formatted value (`valueText`) in the header wrapper. Overrides the `value` slot when `true`. |
| `color` | `string` | `"primary"` | Theme color variant (any configured theme color or `"neutral"`). |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Size variant. Falls back to form `fieldSize` or `"md"` when empty. |
| `disabled` | `boolean` | `false` | Disables pointer/touch interaction and applies disabled styling. |
| `readOnly` | `boolean` | `false` | Prevents value changes without applying disabled appearance. |
| `invalid` | `boolean` | `false` | Applies invalid/error styling. |
| `required` | `boolean` | `false` | Marks the slider as required for form validation. |
| `name` | `string` | `""` | Field name used for form integration. |
| `form` | `string` | `""` | Associated form identifier. |
| `rules` | `FormRule[]` | `undefined` | Form validation rules (`SliderProps`). |
| `validateOn` | `FormValidateOn` | `undefined` | Form validation trigger timing (`SliderProps`). |
| `formContext` | `FormHostContext \| null` | `undefined` | Parent form host context for form binding. |
| `fieldDisabled` | `boolean` | `false` | Disabled flag propagated from a parent form field. |
| `ui` | `SliderUI` (`Record<string, string>`) | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Custom class applied to the `root` slot. |

## Slots

| Name | Description |
| --- | --- |
| `label` | Custom label content rendered in the header wrapper when the `label` prop is empty. |
| `value` | Custom value display rendered in the header wrapper when `showValue` is `false`. |
| `thumb` | Custom content rendered inside each thumb element. |

## Events

Listen to slider value changes and thumb focus transitions using WeChat MiniProgram event bindings (`e.detail` contains the event payload):

| Event | Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: number \| number[]; values: number[] }` (`SliderChangeDetails`) | Fired when the slider value changes. |
| `bind:changeEnd` | `{ value: number \| number[]; values: number[] }` (`SliderChangeDetails`) | Fired when a drag or tap interaction finishes committing a value. |
| `bind:focus` | `{ index: number; value: number }` | Fired when a thumb receives focus. |
| `bind:blur` | `{ index: number; value: number }` | Fired when a thumb loses focus. |

## Theme

Customize the `slider` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    slider: {
      slots: {
        root: "relative inline-flex flex-col gap-1.5 w-full select-none touch-none",
        wrapper: "flex items-center justify-between",
        label: "block font-medium text-highlighted leading-snug",
        valueText: "text-muted font-medium tabular-nums",
        control: "relative flex items-center cursor-pointer",
        track: "relative bg-accented rounded-full grow overflow-hidden",
        range: "absolute rounded-full transition-all duration-75",
        thumb:
          "absolute rounded-full bg-white shadow-md ring-1 ring-black/5 flex items-center justify-center transition-[transform,shadow] duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        markerGroup: "absolute inset-0 pointer-events-none",
        marker:
          "absolute flex flex-col items-center text-dimmed font-medium",
        markerTick: "w-1 h-1 rounded-full bg-default",
        markerTickActive: "bg-white/90",
        markerLabel: "mt-2 tabular-nums select-none",
        markerLabelActive: "text-default font-semibold",
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
            control: "h-4",
            track: "h-1",
            thumb: "w-3 h-3",
            label: "text-xs",
            valueText: "text-xs",
            marker: "text-2xs",
          },
          sm: {
            control: "h-4.5",
            track: "h-1.5",
            thumb: "w-3.5 h-3.5",
            label: "text-xs",
            valueText: "text-xs",
            marker: "text-2xs",
          },
          md: {
            control: "h-5",
            track: "h-2",
            thumb: "w-4 h-4",
            label: "text-sm",
            valueText: "text-sm",
            marker: "text-xs",
          },
          lg: {
            control: "h-6",
            track: "h-2.5",
            thumb: "w-5 h-5",
            label: "text-base",
            valueText: "text-base",
            marker: "text-sm",
          },
          xl: {
            control: "h-7",
            track: "h-3",
            thumb: "w-6 h-6",
            label: "text-base",
            valueText: "text-base",
            marker: "text-sm",
          },
        },
        orientation: {
          horizontal: {
            root: "w-full flex-col",
            control: "w-full flex-row items-center",
            track: "w-full",
            range: "h-full top-0",
            thumb: "top-1/2",
            marker: "top-1/2",
            markerTick: "-translate-y-1/2",
            markerLabel: "mt-2",
          },
          vertical: {
            root: "h-48 flex-row items-center",
            control: "h-full flex-col justify-end",
            track: "h-full w-2",
            range: "w-full bottom-0",
            thumb: "left-1/2",
            marker: "left-1/2 flex-row",
            markerTick: "-translate-x-1/2",
            markerLabel: "ml-2.5 mt-0",
          },
        },
        disabled: {
          true: {
            root: "opacity-60 cursor-not-allowed pointer-events-none",
            control: "cursor-not-allowed",
          },
          false: {},
        },
        invalid: {
          true: {
            range: "bg-danger",
            thumb: "ring-2 ring-danger",
          },
          false: {},
        },
        dragging: {
          true: {
            range: "transition-none",
            thumb: "transition-none scale-110 shadow-lg",
          },
          false: {},
        },
        hasMarkers: {
          true: {
            root: "pb-5",
          },
          false: {},
        },
      },
      compoundVariants: [
        {
          orientation: "vertical",
          hasMarkers: true,
          class: {
            root: "pr-6 pb-0",
          },
        },
        {
          color: "primary",
          invalid: false,
          class: {
            range: "bg-primary",
            thumb: "focus-visible:ring-primary",
          },
        },
        {
          color: "secondary",
          invalid: false,
          class: {
            range: "bg-secondary",
            thumb: "focus-visible:ring-secondary",
          },
        },
        {
          color: "danger",
          invalid: false,
          class: {
            range: "bg-danger",
            thumb: "focus-visible:ring-danger",
          },
        },
        {
          color: "success",
          invalid: false,
          class: {
            range: "bg-success",
            thumb: "focus-visible:ring-success",
          },
        },
        {
          color: "warning",
          invalid: false,
          class: {
            range: "bg-warning",
            thumb: "focus-visible:ring-warning",
          },
        },
        {
          color: "info",
          invalid: false,
          class: {
            range: "bg-info",
            thumb: "focus-visible:ring-info",
          },
        },
        {
          color: "neutral",
          invalid: false,
          class: {
            range: "bg-inverted",
            thumb: "focus-visible:ring-inverted",
          },
        },
        {
          invalid: true,
          class: {
            range: "bg-danger",
            thumb: "focus-visible:ring-danger",
          },
        },
      ],
      defaultVariants: {
        color: "primary",
        size: "md",
        orientation: "horizontal",
        disabled: false,
        invalid: false,
        dragging: false,
        hasMarkers: false,
      },
    },
  },
});
```
