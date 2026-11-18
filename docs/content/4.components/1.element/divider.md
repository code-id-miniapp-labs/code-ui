---
title: Divider
description: A separator component used to visually divide sections or content horizontally or vertically, with optional text, icons, or custom slot content.
---

## Overview

`c-divider` is a standalone separator component used to visually divide sections or content horizontally or vertically, with optional text, icons, or custom slot content. When `leadingIcon` or `trailingIcon` is provided without the corresponding slot, it renders `<c-icon>` internally.

## Usage

### Basic

Use `<c-divider />` without props to render a default horizontal solid separator.

```html
<c-divider />
```

### Label

Use the `label` prop to display text centered along the divider. When `label` is set, it takes precedence over the default slot.

```html
<c-divider label="OR" />
```

### Icon

Use `leadingIcon` and `trailingIcon` to render `<c-icon>` before or after the divider content. Icons are ignored when the corresponding `leading` or `trailing` slot is provided.

```html
<c-divider label="Featured" leadingIcon="lucide:sparkles" />
<c-divider label="Continue" trailingIcon="lucide:arrow-right" />
<c-divider leadingIcon="lucide:minus" trailingIcon="lucide:minus" label="Section" />
```

### Color

Use the `color` prop to apply `"neutral"` (default) or any configured theme color from `DEFAULT_THEME_COLORS` to the divider border.

```html
<c-divider color="neutral" />
<c-divider color="primary" label="Primary" />
<c-divider color="success" label="Success" />
<c-divider color="warning" label="Warning" />
```

### Type

Use the `type` prop to switch the border style between `"solid"` (default), `"dashed"`, and `"dotted"`.

```html
<c-divider type="solid" label="Solid" />
<c-divider type="dashed" label="Dashed" />
<c-divider type="dotted" label="Dotted" />
```

### Size

Use the `size` prop to control the border thickness and label text size (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`).

```html
<c-divider size="xs" label="XS" />
<c-divider size="sm" label="SM" />
<c-divider size="md" label="MD" />
<c-divider size="lg" label="LG" />
<c-divider size="xl" label="XL" />
```

### Orientation

Use the `orientation` prop to switch between `"horizontal"` (default) and `"vertical"`. Vertical dividers should be placed inside a flex container with an explicit height.

```html
<view class="h-12 flex items-center">
  <text>Left</text>
  <c-divider orientation="vertical" class="mx-4" />
  <text>Center</text>
  <c-divider orientation="vertical" label="OR" class="mx-4" />
  <text>Right</text>
</view>
```

### Position

Use the `position` prop to align the content container to `"start"`, `"center"` (default), or `"end"` along the divider.

```html
<c-divider position="start" label="Start" />
<c-divider position="center" label="Center" />
<c-divider position="end" label="End" />
```

### Slots

Use the default slot for custom label content (when `label` is empty), and the `leading` or `trailing` named slots to replace `leadingIcon` or `trailingIcon`.

```html
<!-- Default slot -->
<c-divider>
  <text class="font-semibold">Custom Label</text>
</c-divider>

<!-- Named leading and trailing slots -->
<c-divider position="start">
  <view slot="leading">*</view>
  <text>Section Title</text>
  <view slot="trailing">New</view>
</c-divider>
```

### Custom Styling (`ui` & `class`)

Use `class` (or `className` as a fallback when `class` is empty) to style the `root` slot, or pass `ui` to override individual slots (`root`, `container`, `border`, `icon`, `label`).

::code-group

```html [index.wxml]
<c-divider
  label="Styled Divider"
  class="my-6"
  ui="{{ dividerUi }}"
/>
```

```ts [index.ts]
Page({
  data: {
    dividerUi: {
      border: "border-primary",
      label: "text-primary font-semibold",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot name (`root`, `container`, `border`, `icon`, `label`). |
| `class` | `String` | `""` | Custom classes applied to the `root` slot (takes precedence over `className` when non-empty). |
| `className` | `String` | `""` | Fallback custom classes applied to the `root` slot when `class` is empty. |
| `color` | `String` | `"neutral"` | Semantic border color variant (`neutral` or any configured theme color from `DEFAULT_THEME_COLORS`). |
| `size` | `String` | `"md"` | Border thickness and content text size (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). |
| `type` | `String` | `"solid"` | Border line style (`"solid"`, `"dashed"`, `"dotted"`). |
| `label` | `String` | `""` | Text displayed in the divider content area. Takes precedence over the default slot. |
| `orientation` | `String` | `"horizontal"` | Divider direction (`"horizontal"`, `"vertical"`). |
| `position` | `String` | `"center"` | Position of the content container along the divider (`"start"`, `"center"`, `"end"`). |
| `leadingIcon` | `String` | `""` | Icon name passed to `<c-icon>` before the label. Ignored if the `leading` slot is provided. |
| `trailingIcon` | `String` | `""` | Icon name passed to `<c-icon>` after the label. Ignored if the `trailing` slot is provided. |

## Slots

| Slot | Description |
| :--- | :--- |
| `(default)` | Custom content rendered inside the `label` wrapper when `label` is empty. |
| `leading` | Custom content rendered before the label inside `container`, replacing `leadingIcon`. |
| `trailing` | Custom content rendered after the label inside `container`, replacing `trailingIcon`. |

## Events

None.

## Theme

Customize the `divider` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    divider: {
      slots: {
        root: "flex items-center",
        container: "flex items-center gap-2 shrink-0",
        border: "flex-1",
        icon: "shrink-0",
        label: "shrink-0",
      },
      variants: {
        color: Object.assign(
          Object.fromEntries(colors.map((color) => [color, {}])),
          { neutral: {} },
        ),
        size: {
          xs: {
            container: "text-2xs",
          },
          sm: {
            container: "text-xs",
          },
          md: {
            container: "text-sm",
          },
          lg: {
            container: "text-base",
          },
          xl: {
            container: "text-lg",
          },
        },
        type: {
          solid: {
            border: "border-solid",
          },
          dashed: {
            border: "border-dashed",
          },
          dotted: {
            border: "border-dotted",
          },
        },
        orientation: {
          horizontal: {
            root: "w-full flex-row",
            border: "border-t",
          },
          vertical: {
            root: "h-full flex-col",
            border: "border-s border-t-0",
          },
        },
        position: {
          center: {
            // handled in WXML logic
          },
          start: {
            // handled in WXML logic
          },
          end: {
            // handled in WXML logic
          },
        },
      },
      compoundVariants: [
        {
          orientation: "horizontal",
          position: "start",
          class: {
            container: "me-3",
          },
        },
        {
          orientation: "horizontal",
          position: "center",
          class: {
            container: "mx-3",
          },
        },
        {
          orientation: "horizontal",
          position: "end",
          class: {
            container: "ms-3",
          },
        },
        {
          orientation: "vertical",
          position: "start",
          class: {
            container: "mb-2",
          },
        },
        {
          orientation: "vertical",
          position: "center",
          class: {
            container: "my-2",
          },
        },
        {
          orientation: "vertical",
          position: "end",
          class: {
            container: "mt-2",
          },
        },
        {
          orientation: "horizontal",
          size: "xs",
          class: {
            border: "border-t",
          },
        },
        {
          orientation: "horizontal",
          size: "sm",
          class: {
            border: "border-t-[2px]",
          },
        },
        {
          orientation: "horizontal",
          size: "md",
          class: {
            border: "border-t-[3px]",
          },
        },
        {
          orientation: "horizontal",
          size: "lg",
          class: {
            border: "border-t-[4px]",
          },
        },
        {
          orientation: "horizontal",
          size: "xl",
          class: {
            border: "border-t-[5px]",
          },
        },
        {
          orientation: "vertical",
          size: "xs",
          class: {
            border: "border-s",
          },
        },
        {
          orientation: "vertical",
          size: "sm",
          class: {
            border: "border-s-[2px]",
          },
        },
        {
          orientation: "vertical",
          size: "md",
          class: {
            border: "border-s-[3px]",
          },
        },
        {
          orientation: "vertical",
          size: "lg",
          class: {
            border: "border-s-[4px]",
          },
        },
        {
          orientation: "vertical",
          size: "xl",
          class: {
            border: "border-s-[5px]",
          },
        },
        ...colors.map((color) => ({
          color,
          class: {
            border: `border-${color}`,
          },
        })),
        {
          color: "neutral" as const,
          class: {
            border: "border-neutral",
          },
        },
      ],
      defaultVariants: {
        color: "neutral",
        size: "xs",
        type: "solid",
        orientation: "horizontal",
        position: "center",
      },
    }
  }
})
```
