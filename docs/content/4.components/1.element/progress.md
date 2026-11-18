---
title: Progress
description: Accessible progress indicator (`c-progress`) for tracking task completion, file uploads, or background loading in linear or circular form, supporting determinate numeric values and indeterminate loading states.
---

## Overview

`c-progress` is an accessible progress indicator for tracking task completion, file uploads, or background loading in linear (`type="linear"`) or circular (`type="circular"`) form. It supports both determinate numeric values and indeterminate loading states.

- **Compound Relations:** Standalone component.
- **Imperative Methods:** Component instances expose `setValue(value: number | null)`, `setToMin()`, `setToMax()`, and `reset()` via `selectComponent`.

## Usage

### Basic

Use `c-progress` with `value` to render a determinate linear progress bar. By default, `min` is `0` and `max` is `100`.

```html
<c-progress value="{{50}}" />

<!-- Custom min/max bounds -->
<c-progress value="{{3}}" min="{{0}}" max="{{5}}" />
```

### Indeterminate

Leave `value` unset (`null`) or set `indeterminate="{{true}}"` to render an indeterminate loading indicator.

```html
<c-progress />

<c-progress indeterminate="{{true}}" value="{{40}}" />
```

### Type

Use the `type` prop to switch between `linear` (default) and `circular` progress indicators. In `circular` mode, you can also configure `circleRadius`, `strokeWidth`, and `trackColor`.

```html
<!-- Linear (default) -->
<c-progress type="linear" value="{{60}}" />

<!-- Circular -->
<c-progress
  type="circular"
  value="{{75}}"
  circleRadius="{{42}}"
  strokeWidth="{{6}}"
  trackColor="#e5e7eb"
/>
```

### Label & Value Readout

Use `label` to display a header title above a linear bar, and `showValue="{{true}}"` to show the formatted value readout (`valueAsString`) in the linear header or centered inside a circular ring.

```html
<c-progress value="{{65}}" label="Uploading file" showValue="{{true}}" />

<c-progress type="circular" value="{{80}}" size="lg" showValue="{{true}}" />
```

### Color

Use the `color` prop to apply any theme color token (such as `primary`, `secondary`, `success`, `warning`, `error`, `info`, or `neutral`). In `circular` mode, direct CSS colors (hex, `rgb()`, `hsl()`, `oklch()`) are also supported for `color` and `trackColor`.

```html
<c-progress value="{{70}}" color="primary" />
<c-progress value="{{70}}" color="success" />
<c-progress value="{{70}}" color="warning" />
<c-progress value="{{70}}" color="error" />
<c-progress value="{{70}}" color="neutral" />

<!-- Direct CSS colors in circular mode -->
<c-progress type="circular" value="{{60}}" color="#0ea5e9" trackColor="#e0f2fe" />
```

### Size

Use the `size` prop (`2xs`, `xs`, `sm`, `md`, `lg`, `xl`, or `2xl`) to scale track thickness, circle dimensions, and label typography.

```html
<c-progress value="{{60}}" size="2xs" />
<c-progress value="{{60}}" size="sm" />
<c-progress value="{{60}}" size="md" />
<c-progress value="{{60}}" size="xl" />

<c-progress type="circular" value="{{60}}" size="sm" />
<c-progress type="circular" value="{{60}}" size="xl" />
```

### Orientation

Use `orientation` to render a linear progress bar horizontally (`horizontal`, default) or vertically (`vertical`) inside a sized container.

```html
<view class="h-32">
  <c-progress orientation="vertical" value="{{70}}" />
</view>
```

### Striped & Animated

Use `striped="{{true}}"` and `animated="{{true}}"` to apply striped and animated styling to the linear indicator range, and `animation` (`carousel`, `carousel-inverse`, `swing`, or `elastic`) to choose the indeterminate animation style.

```html
<c-progress value="{{75}}" striped="{{true}}" animated="{{true}}" />

<c-progress indeterminate="{{true}}" animation="swing" />
```

### Inverted

Set `inverted="{{true}}"` to reverse the progress fill direction in either `linear` or `circular` mode.

```html
<c-progress value="{{45}}" inverted="{{true}}" />

<c-progress type="circular" value="{{45}}" inverted="{{true}}" />
```

### Slots

In `linear` mode, use the `label` and `value-text` slots when `label` is empty and `showValue` is `false`, or the default slot to place content below the track. In `circular` mode, the default slot renders centered inside the ring when `showValue` is `false`.

```html
<!-- Linear named slots + default slot below track -->
<c-progress value="{{75}}">
  <text slot="label" class="text-xs font-semibold">Processing</text>
  <text slot="value-text" class="text-xs text-muted">3 / 4</text>
  <text class="text-xs text-muted mt-1">Almost complete</text>
</c-progress>

<!-- Circular centered default slot -->
<c-progress type="circular" value="{{100}}" size="xl" color="success">
  <text class="text-xs font-medium">Done</text>
</c-progress>
```

### Imperative Methods

Use `defaultValue` together with `selectComponent` to update or reset progress imperatively via `setValue()`, `setToMin()`, `setToMax()`, and `reset()`.

::code-group

```html [index.wxml]
<c-progress
  id="upload-progress"
  defaultValue="{{20}}"
  min="{{0}}"
  max="{{100}}"
  label="Uploading file"
  showValue="{{true}}"
/>

<view class="flex gap-2 mt-3">
  <c-button size="sm" bind:tap="onAdvance">Set 85%</c-button>
  <c-button size="sm" variant="outline" bind:tap="onComplete">Max</c-button>
  <c-button size="sm" variant="ghost" bind:tap="onReset">Reset</c-button>
</view>
```

```ts [index.ts]
Page({
  onAdvance() {
    const comp = this.selectComponent("#upload-progress");
    comp?.setValue(85);
  },

  onComplete() {
    const comp = this.selectComponent("#upload-progress");
    comp?.setToMax();
  },

  onReset() {
    const comp = this.selectComponent("#upload-progress");
    comp?.reset();
  },
});
```

::

### Custom Styling

Use `className` to merge classes onto the `root` slot and `ui` to override individual theme slots (`root`, `header`, `track`, `range`, `label`, `valueText`, `view`, `circle`, `circleTrack`, `circleRange`, `circleOverlay`, `circleContent`).

::code-group

```html [index.wxml]
<c-progress
  value="{{75}}"
  color="success"
  className="my-4"
  ui="{{ progressUi }}"
/>
```

```ts [index.ts]
Page({
  data: {
    progressUi: {
      track: "bg-neutral-200 rounded-none",
      range: "rounded-none",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `number \| null` | `null` | Current progress value. When `null` (or `indeterminate` is `true`), renders in indeterminate mode. |
| `defaultValue` | `number \| null` | `null` | Initial value used when `reset()` is called. |
| `min` | `number` | `0` | Minimum progress bound (`aria-valuemin`). |
| `max` | `number` | `100` | Maximum progress bound (`aria-valuemax`). |
| `indeterminate` | `boolean` | `false` | Forces indeterminate loading state regardless of `value`. |
| `type` | `"linear" \| "circular"` | `"linear"` | Visual presentation mode. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Bar direction when `type="linear"`. |
| `size` | `"2xs" \| "xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl"` | `"md"` | Track thickness / circle size and label typography scale. |
| `color` | `ThemeColor \| string` | `"primary"` | Theme color token (or `"neutral"`); in `circular` mode, CSS colors (`#...`, `rgb(...)`, `hsl(...)`, `oklch(...)`) are also applied directly via `color`. |
| `trackColor` | `string` | `"#e5e7eb"` | CSS color passed as `--cui-progress-track-color` in `circular` mode. |
| `striped` | `boolean` | `false` | Applies striped styling to the linear indicator range. |
| `animated` | `boolean` | `false` | Animates the linear indicator range. |
| `animation` | `"carousel" \| "carousel-inverse" \| "swing" \| "elastic" \| string` | `"carousel"` | Animation style name. |
| `inverted` | `boolean` | `false` | Reverses the progress fill direction (`rotate-180` on track in linear mode; `scaleX(-1)` in circular mode). |
| `circleRadius` | `number` | `42` | Circle radius configuration for `circular` mode. |
| `strokeWidth` | `number` | `8` | Ring stroke thickness in `px` (`--cui-progress-stroke-width`) for `circular` mode. |
| `label` | `string` | `""` | Text label rendered in the header above the linear bar when `type !== "circular"`. |
| `showValue` | `boolean` | `false` | Displays the formatted value readout (`valueAsString`) in the linear header or inside the circular ring overlay. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional CSS classes merged onto the `root` slot (runtime property name for `class` on `c-progress`). |

## Slots

| Slot | Description |
| :--- | :--- |
| `label` | Custom label content rendered in the linear header when `type !== "circular"` and the `label` prop is empty. |
| `value-text` | Custom value text rendered in the linear header when `type !== "circular"` and `showValue` is `false`. |
| *(default)* | In `type="circular"` mode, rendered centered inside the ring (`circleContent`) when `showValue` is `false`. In linear mode, rendered below the track. |

## Events

None — `c-progress` does not emit custom `bind:*` events.

## Theme

Customize the `progress` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    progress: {
      slots: {
        root: "relative select-none",
        header: "flex items-center justify-between mb-1.5 w-full",
        track: "overflow-hidden rounded-full bg-accented transition-colors",
        range: "rounded-full transition-all duration-300 ease-out",
        label: "font-medium text-highlighted",
        valueText:
          "font-medium text-muted tabular-nums leading-none text-center",
        view: "relative inline-flex items-center justify-center",
        circle:
          "overflow-visible block box-border rounded-full transition-all duration-300 ease-out",
        circleTrack: "text-accented stroke-current",
        circleRange:
          "transition-[stroke-dashoffset] duration-300 ease-out stroke-current",
        circleOverlay:
          "absolute inset-0 flex items-center justify-center pointer-events-none",
        circleContent: "absolute inset-0 flex items-center justify-center",
      },
      variants: {
        color: Object.assign(
          Object.fromEntries(colors.map((color) => [color, {}])),
          { neutral: {} },
        ),
        size: {
          "2xs": {
            track: "h-1",
            circle: "size-6",
            label: "text-xs",
            valueText: "text-xs",
          },
          xs: {
            track: "h-1.5",
            circle: "size-8",
            label: "text-xs",
            valueText: "text-xs",
          },
          sm: {
            track: "h-2",
            circle: "size-10",
            label: "text-xs",
            valueText: "text-xs",
          },
          md: {
            track: "h-2.5",
            circle: "size-12",
            label: "text-xs",
            valueText: "text-xs",
          },
          lg: {
            track: "h-3",
            circle: "size-14",
            label: "text-sm",
            valueText: "text-xs",
          },
          xl: {
            track: "h-3.5",
            circle: "size-16",
            label: "text-base",
            valueText: "text-sm",
          },
          "2xl": {
            track: "h-4",
            circle: "size-20",
            label: "text-lg",
            valueText: "text-base",
          },
        },
        orientation: {
          horizontal: {
            root: "w-full flex flex-col",
            track: "w-full",
            range: "h-full",
          },
          vertical: {
            root: "h-full flex flex-row items-end",
            track: "h-full",
            range: "w-full",
          },
        },
        type: {
          linear: {
            root: "w-full",
            view: "hidden",
          },
          circular: {
            root: "inline-flex items-center justify-center relative",
            track: "hidden",
          },
        },
        indeterminate: {
          true: {
            range: "cui-progress-indeterminate",
            circle: "animate-spin",
          },
          false: {},
        },
        striped: {
          true: {
            range: "cui-progress-striped",
          },
          false: {},
        },
        animated: {
          true: {
            range: "cui-progress-animated",
          },
          false: {},
        },
        inverted: {
          true: {
            track: "rotate-180",
          },
          false: {},
        },
      },
      compoundVariants: [
        ...colors.map((color) => ({
          color,
          class: {
            range: `bg-${color}`,
            circleRange: `text-${color}`,
          },
        })),
        {
          color: "neutral" as const,
          class: {
            range: "bg-inverted",
            circleRange: "text-highlighted",
          },
        },
        {
          color: "error" as any,
          class: {
            range: "bg-danger",
            circleRange: "text-danger",
          },
        },
      ],
      defaultVariants: {
        color: "primary",
        size: "md",
        type: "linear",
        orientation: "horizontal",
        indeterminate: false,
        striped: false,
        animated: false,
        inverted: false,
      },
    }
  }
})
```
