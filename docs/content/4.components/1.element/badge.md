---
title: Badge
description: A compact visual indicator used to display status, counts, tags, or short labels, optionally accompanied by leading and trailing slot content.
---

## Overview

`c-badge` is a compact visual indicator used to display status, counts, tags, or short labels, optionally accompanied by leading and trailing slot content.

- **Tag**: `c-badge`

## Usage

### Basic

Use the `label` prop to display text inside a badge.

::code-group
```html [index.wxml]
<c-badge label="New" />
```

```json [index.json]
{
  "usingComponents": {
    "c-badge": "@code-ui/components/badge/index"
  }
}
```
::

### Color

Use the `color` prop to change the badge color (`"primary"` by default, any configured `DEFAULT_THEME_COLORS` value, or `"neutral"`).

```html [index.wxml]
<c-badge label="Primary" color="primary" />
<c-badge label="Success" color="success" />
<c-badge label="Warning" color="warning" />
<c-badge label="Neutral" color="neutral" />
```

### Variant

Use the `variant` prop to switch between `"solid"`, `"outline"`, and `"soft"` styles.

```html [index.wxml]
<c-badge label="Solid" variant="solid" />
<c-badge label="Outline" variant="outline" />
<c-badge label="Soft" variant="soft" />
```

### Size

Use the `size` prop to control the badge size (`"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`).

```html [index.wxml]
<c-badge label="XS" size="xs" />
<c-badge label="SM" size="sm" />
<c-badge label="MD" size="md" />
<c-badge label="LG" size="lg" />
<c-badge label="XL" size="xl" />
```

### Slots

Use the `leading` and `trailing` slots to place icons or indicators around the badge text, or use the default slot for custom inner content instead of `label`.

```html [index.wxml]
<!-- Leading slot -->
<c-badge label="Alert" color="warning" variant="solid">
  <c-icon slot="leading" name="alert-circle" />
</c-badge>

<!-- Trailing slot -->
<c-badge label="Verified" color="success" variant="soft">
  <c-icon slot="trailing" name="check" />
</c-badge>

<!-- Default slot -->
<c-badge color="primary" variant="soft">
  <text>99+</text>
</c-badge>
```

### Custom Styling

Use `className` to merge classes onto the `root` slot, and `ui` to override classes for specific theme slots (`root`, `text`, `leading`, `trailing`).

::code-group
```html [index.wxml]
<c-badge
  label="Featured"
  color="primary"
  variant="soft"
  className="ml-2"
  ui="{{ badgeUi }}"
/>
```

```ts [index.ts]
Page({
  data: {
    badgeUi: {
      root: "px-3",
      text: "font-bold",
    },
  },
});
```
::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot (`root`, `text`, `leading`, `trailing`). |
| `className` | `String` | `""` | Custom classes merged onto the `root` slot. |
| `color` | `String` | `"primary"` | Color variant (`DEFAULT_THEME_COLORS` from theme options, plus `"neutral"`). |
| `size` | `String` | `"md"` | Size variant (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). |
| `variant` | `String` | `"solid"` | Visual style variant (`"solid"`, `"outline"`, `"soft"`). |
| `label` | `String` | `""` | Text content rendered inside the `text` slot container. |

## Slots

| Name | Description |
| :--- | :--- |
| *(default)* | Custom inner content rendered alongside `label` inside the `text` slot container. |
| `leading` | Leading content (such as an icon or dot) rendered before `text`. |
| `trailing` | Trailing content (such as an icon) rendered after `text`. |

## Events

| Name | Payload | Description |
| :--- | :--- | :--- |
| — | — | `c-badge` does not emit any custom events. |

## Theme

Customize the `badge` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    badge: {
      slots: {
        root: "flex items-center justify-center rounded-full font-medium leading-none whitespace-nowrap",
        text: "text-xs",
        leading: "shrink-0",
        trailing: "shrink-0",
      },
      variants: {
        color: Object.assign(
          Object.fromEntries(colors.map((color) => [color, {}])),
          { neutral: {} },
        ),
        size: {
          xs: {
            root: "px-1 py-0.5 gap-1.5 rounded-sm",
            text: "text-3xs/3",
          },
          sm: {
            root: "text-2xs/3 px-1.5 py-1 gap-1.5 rounded-sm",
            text: "text-2xs/3",
          },
          md: {
            root: "px-2 py-1 gap-1.5 rounded-md",
            text: "text-xs ",
          },
          lg: {
            root: "text-sm px-2 py-1 gap-2 rounded-md",
            text: "text-sm ",
          },
          xl: {
            root: "px-2.5 py-1 gap-2 rounded-md",
            text: "text-base",
          },
        },
        variant: {
          solid: {
            root: "text-white",
          },
          outline: {
            root: "bg-transparent border",
          },
          soft: {
            root: "",
          },
        },
      },
      compoundVariants: [
        ...colors.map((color) => ({
          color,
          variant: "solid" as const,
          class: {
            root: `bg-${color}`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "solid" as const,
          class: {
            root: "bg-neutral",
          },
        },
        ...colors.map((color) => ({
          color,
          variant: "outline" as const,
          class: {
            root: `border-${color} text-${color}`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "outline" as const,
          class: {
            root: "border-neutral text-neutral",
          },
        },
        ...colors.map((color) => ({
          color,
          variant: "soft" as const,
          class: {
            root: `bg-${color}/20 text-${color}`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "soft" as const,
          class: {
            root: "bg-neutral/20 text-neutral",
          },
        },
      ],
      defaultVariants: {
        color: "primary",
        size: "md",
        variant: "solid",
      },
    },
  },
});
```
