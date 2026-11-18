---
title: Chip
description: A small badge, dot indicator, or counter overlay used to annotate anchor content (such as an icon, avatar, or button) or render inline as a standalone indicator.
---

## Overview

`c-chip` is a small badge, dot indicator, or counter overlay used to annotate anchor content (such as an icon, avatar, or button) or render inline as a standalone indicator.

## Usage

### Basic

Wrap an anchor element inside `<c-chip>` to display a dot indicator in the corner.

```html [index.wxml]
<c-chip>
  <c-button label="Inbox" color="neutral" variant="outline" />
</c-chip>
```

### Text

Use the `text` prop to display a number or short label inside the chip badge. Any non-empty `text` value (including `0`) takes precedence over the `content` slot.

::code-group

```html [index.wxml]
<c-chip text="{{ unreadCount }}">
  <c-button label="Messages" color="neutral" variant="outline" />
</c-chip>

<c-chip text="NEW" color="success">
  <c-button label="Features" color="neutral" variant="outline" />
</c-chip>
```

```ts [index.ts]
Page({
  data: {
    unreadCount: 5,
  },
});
```

::

### Color

Use the `color` prop to change the background color of the chip badge (`primary`, `secondary`, `danger`, `success`, `warning`, `info`, or `neutral`).

```html [index.wxml]
<c-chip color="primary">
  <c-button label="Primary" color="neutral" variant="outline" />
</c-chip>
<c-chip color="secondary">
  <c-button label="Secondary" color="neutral" variant="outline" />
</c-chip>
<c-chip color="danger">
  <c-button label="Danger" color="neutral" variant="outline" />
</c-chip>
<c-chip color="success">
  <c-button label="Success" color="neutral" variant="outline" />
</c-chip>
<c-chip color="warning">
  <c-button label="Warning" color="neutral" variant="outline" />
</c-chip>
<c-chip color="info">
  <c-button label="Info" color="neutral" variant="outline" />
</c-chip>
<c-chip color="neutral">
  <c-button label="Neutral" color="neutral" variant="outline" />
</c-chip>
```

### Size

Use the `size` prop (`xs`, `sm`, `md`, `lg`, or `xl`) to adjust the badge dimensions, font size, and horizontal padding.

```html [index.wxml]
<c-chip size="xs" text="1">
  <c-button label="XS" color="neutral" variant="outline" />
</c-chip>
<c-chip size="sm" text="2">
  <c-button label="SM" color="neutral" variant="outline" />
</c-chip>
<c-chip size="md" text="3">
  <c-button label="MD" color="neutral" variant="outline" />
</c-chip>
<c-chip size="lg" text="4">
  <c-button label="LG" color="neutral" variant="outline" />
</c-chip>
<c-chip size="xl" text="5">
  <c-button label="XL" color="neutral" variant="outline" />
</c-chip>
```

### Position

Use the `position` prop (`top-right`, `bottom-right`, `top-left`, or `bottom-left`) to place the badge at any corner of the anchor element when `standalone` is `false`.

```html [index.wxml]
<c-chip position="top-right">
  <c-button label="Top Right" color="neutral" variant="outline" />
</c-chip>
<c-chip position="bottom-right">
  <c-button label="Bottom Right" color="neutral" variant="outline" />
</c-chip>
<c-chip position="top-left">
  <c-button label="Top Left" color="neutral" variant="outline" />
</c-chip>
<c-chip position="bottom-left">
  <c-button label="Bottom Left" color="neutral" variant="outline" />
</c-chip>
```

### Inset

Set `inset="{{ true }}"` to keep the badge inside the corner boundary of the anchor element instead of translating it outward by 50% (useful for circular avatars).

```html [index.wxml]
<c-chip color="success" size="sm" inset="{{ true }}">
  <view class="w-10 h-10 rounded-full bg-neutral-200" />
</c-chip>
```

### Standalone

Set `standalone="{{ true }}"` to render the chip inline with `relative` positioning without wrapping anchor content.

```html [index.wxml]
<c-chip standalone="{{ true }}" color="success" size="md" text="Online" />
```

### Show

Use the `show` prop to control whether the chip badge is rendered while keeping the `default` slot anchor content visible.

::code-group

```html [index.wxml]
<c-chip color="success" size="sm" inset="{{ true }}" show="{{ isOnline }}">
  <view class="w-10 h-10 rounded-full bg-neutral-200" />
</c-chip>
```

```ts [index.ts]
Page({
  data: {
    isOnline: true,
  },
  toggleStatus() {
    this.setData({ isOnline: !this.data.isOnline });
  },
});
```

::

### Slots

Use the `default` slot for the anchor element and the `content` slot to render custom content inside the badge when `text` is empty.

```html [index.wxml]
<c-chip color="primary" size="lg">
  <c-button label="Profile" color="neutral" variant="outline" />
  <text slot="content">★</text>
</c-chip>
```

### Custom Styling

Use `ui` to override classes on the `root` or `base` slots, and `className` to add custom classes to the `root` slot.

::code-group

```html [index.wxml]
<c-chip standalone="{{ true }}" color="neutral" ui="{{ chipUi }}" className="ml-2">
  <view slot="content">NEW</view>
</c-chip>
```

```ts [index.ts]
Page({
  data: {
    chipUi: {
      base: "px-2 text-xs",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string \| number` | `""` | Text or number rendered inside the chip badge. When non-empty (`!== ""`, `undefined`, `null`), it takes precedence over the `content` slot. |
| `color` | `string` | `"primary"` | Color variant applied to the `base` badge (`DEFAULT_THEME_COLORS` or `"neutral"`). |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Controls the dimensions, font size, and horizontal padding of the `base` badge. |
| `position` | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` | `"top-right"` | Corner placement of the `base` badge relative to `root` when `standalone` is `false`. |
| `inset` | `boolean` | `false` | When `true` and `standalone` is `false`, keeps the badge inside the corner boundary instead of translating it outward by 50%. |
| `standalone` | `boolean` | `false` | When `true`, renders `base` with `relative` positioning inline instead of `absolute` overlay positioning. |
| `show` | `boolean` | `true` | Controls whether the `base` badge is shown. The `default` slot anchor content remains visible when `false`. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by slot name (`root`, `base`). |
| `className` | `string` | `""` | Custom class string applied to the `root` slot. |

## Slots

| Name | Description |
| --- | --- |
| `default` | Anchor element(s) wrapped by the `root` container (always rendered regardless of `show`). |
| `content` | Custom content rendered inside the `base` badge when `text` is empty (`""`, `undefined`, or `null`). |

## Events

None.

## Theme

Customize the `chip` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    chip: {
      slots: {
        root: "relative inline-flex items-center justify-center shrink-0",
        base: "rounded-full ring-2 ring-bg flex items-center justify-center text-white font-medium leading-none whitespace-nowrap",
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
            base: "h-1.5 min-w-1.5 text-[6px]",
          },
          sm: {
            base: "h-2 min-w-2 text-[7px]",
          },
          md: {
            base: "h-3 min-w-3 text-[8px] px-1",
          },
          lg: {
            base: "h-3.5 min-w-3.5 text-[9px] px-1",
          },
          xl: {
            base: "h-4 min-w-4 text-[10px] px-1.5",
          },
        },
        position: {
          "top-right": {
            base: "top-0 right-0",
          },
          "bottom-right": {
            base: "bottom-0 right-0",
          },
          "top-left": {
            base: "top-0 left-0",
          },
          "bottom-left": {
            base: "bottom-0 left-0",
          },
        },
        inset: {
          true: {
            base: "",
          },
          false: {
            base: "",
          },
        },
        standalone: {
          true: {
            base: "relative",
          },
          false: {
            base: "absolute",
          },
        },
      },
      compoundVariants: [
        {
          color: "primary",
          class: {
            base: "bg-primary",
          },
        },
        {
          color: "secondary",
          class: {
            base: "bg-secondary",
          },
        },
        {
          color: "danger",
          class: {
            base: "bg-danger",
          },
        },
        {
          color: "success",
          class: {
            base: "bg-success",
          },
        },
        {
          color: "warning",
          class: {
            base: "bg-warning",
          },
        },
        {
          color: "info",
          class: {
            base: "bg-info",
          },
        },
        {
          color: "neutral",
          class: {
            base: "bg-neutral",
          },
        },
        {
          position: "top-right",
          inset: false,
          standalone: false,
          class: {
            base: "-translate-y-1/2 translate-x-1/2 transform",
          },
        },
        {
          position: "bottom-right",
          inset: false,
          standalone: false,
          class: {
            base: "translate-y-1/2 translate-x-1/2 transform",
          },
        },
        {
          position: "top-left",
          inset: false,
          standalone: false,
          class: {
            base: "-translate-y-1/2 -translate-x-1/2 transform",
          },
        },
        {
          position: "bottom-left",
          inset: false,
          standalone: false,
          class: {
            base: "translate-y-1/2 -translate-x-1/2 transform",
          },
        },
      ],
      defaultVariants: {
        size: "md",
        color: "primary",
        position: "top-right",
        inset: false,
        standalone: false,
      },
    },
  },
})
```
