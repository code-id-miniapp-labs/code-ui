---
title: Card
description: A structured container component for grouping content into optional header, body, and footer sections with consistent borders, padding, and surface styling.
---

## Overview

`c-card` is a standalone container component for grouping content into optional `header`, `body`, and `footer` sections with consistent borders, padding, and surface styling.

## Usage

### Basic

Use `c-card` with default slot content to wrap content inside a styled container.

```html
<c-card>
  <view>Main card body content.</view>
</c-card>
```

### Title & Description

Use the `title` and `description` props to render a heading and subtitle in the header section.

```html
<c-card
  title="Project Overview"
  description="Active MiniProgram components"
>
  <view>Main card body content.</view>
</c-card>
```

### Variant

Use the `variant` prop to control the card's background, border, and text contrast. Available variants are `outline` (default), `solid`, `soft`, and `subtle`.

```html
<c-card variant="outline" title="Outline">
  <view>Default bordered surface.</view>
</c-card>

<c-card variant="solid" title="Solid">
  <view>Inverted high-contrast surface.</view>
</c-card>

<c-card variant="soft" title="Soft">
  <view>Muted background without a border.</view>
</c-card>

<c-card variant="subtle" title="Subtle">
  <view>Muted background with a default border.</view>
</c-card>
```

### Size

Use the `size` prop to adjust the padding applied to `header`, `body`, and `footer`. Available sizes are `sm`, `md` (default), and `lg`.

```html
<c-card size="sm" title="Small">
  <view>Compact padding across all sections.</view>
</c-card>

<c-card size="md" title="Medium">
  <view>Default padding across all sections.</view>
</c-card>

<c-card size="lg" title="Large">
  <view>Spacious padding across all sections.</view>
</c-card>
```

### Slots

Use the `header`, `default`, and `footer` slots to place custom content in each section. Empty sections are omitted automatically when no slot content or header text is provided.

```html
<c-card>
  <view slot="header" class="font-bold">Custom Header</view>
  <view>Card body content</view>
  <view slot="footer">Footer actions</view>
</c-card>
```

### Custom Styling

Use `className` to merge classes onto `root`, and `ui` to override classes on individual theme slots (`root`, `header`, `title`, `description`, `body`, `footer`).

::code-group

```html [index.wxml]
<c-card
  title="Styled Card"
  description="Per-slot overrides via ui"
  className="w-full"
  ui="{{ cardUi }}"
>
  <view>Card body content</view>
  <view slot="footer">Footer actions</view>
</c-card>
```

```ts [index.ts]
Page({
  data: {
    cardUi: {
      body: "text-highlighted",
      footer: "justify-end",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `"outline" \| "solid" \| "soft" \| "subtle"` | `"outline"` | Visual style variant controlling background, border, and text contrast. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Padding size applied to `header`, `body`, and `footer` slots. |
| `title` | `String` | `""` | Optional heading text rendered in the `header` section. |
| `description` | `String` | `""` | Optional subtitle/description text rendered below `title` in the `header` section. |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot name (`root`, `header`, `title`, `description`, `body`, `footer`). |
| `className` | `String` | `""` | Additional classes merged onto the `root` slot (declared as `className` in `properties`, not `class`). |

## Slots

| Name | Description |
| :--- | :--- |
| `header` | Named slot rendered at the top of the `header` container before `title` and `description`. |
| `default` | Default slot rendered inside the `body` container. |
| `footer` | Named slot rendered inside the `footer` container. |

## Events

None. `c-card` does not attach interaction handlers or emit custom `bind:*` events.

## Theme

Customize the `card` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    card: {
      slots: {
        root: "rounded-md overflow-hidden flex flex-col",
        header: "flex flex-col gap-1 border-b border-default",
        title: "text-base font-semibold text-highlighted",
        description: "text-sm text-muted",
        body: "flex-1 text-sm text-default",
        footer: "flex items-center gap-2 border-t border-default",
      },
      variants: {
        variant: {
          outline: {
            root: "bg-default border border-default shadow-xs",
          },
          solid: {
            root: "bg-inverted text-inverted border border-inverted",
            header: "border-accented",
            title: "text-inverted",
            description: "text-dimmed",
            body: "text-inverted",
            footer: "border-accented",
          },
          soft: {
            root: "bg-muted border border-transparent",
          },
          subtle: {
            root: "bg-muted border border-default",
          },
        },
        size: {
          sm: {
            header: "p-3",
            body: "p-3",
            footer: "p-3",
          },
          md: {
            header: "p-4",
            body: "p-4",
            footer: "p-4",
          },
          lg: {
            header: "p-6",
            body: "p-6",
            footer: "p-6",
          },
        },
      },
      defaultVariants: {
        variant: "outline",
        size: "md",
      },
    },
  },
})
```
