---
title: Avatar
description: Displays a circular avatar image with automatic fallback to a custom icon slot, a c-icon via the icon prop, a default slot, or computed initials/text when src is omitted or fails to load.
---

## Overview

`c-avatar` displays a circular avatar image with automatic fallback to a custom `icon` slot, a `<c-icon>` via the `icon` prop, a `default` slot, or computed initials/text when `src` is omitted or fails to load.

- **Component Tag**: `c-avatar`
- **Compound Components**: Child item of `c-avatar-group`.

::callout{icon="i-lucide-info"}
- When used inside `c-avatar-group`, `c-avatar` receives group layout and sizing data (`groupSize`, `groupAttached`, `groupHidden`, `groupOrder`, `groupZIndex`, `groupIsEdge`, and `groupBaseClass`), and `groupSize` overrides the component's `size` prop.
- This component accepts `className` rather than `class` for additional root classes.
::

## Usage

### Basic

Use `src` to display an avatar image and `alt` to provide a name for automatic initials fallback when `src` is omitted or fails to load.

::code-group

```html [index.wxml]
<c-avatar src="{{avatarUrl}}" alt="Jane Doe" />
```

```ts [index.ts]
Page({
  data: {
    avatarUrl: "https://example.com/avatar.png",
  },
});
```

::

### Size

Use the `size` prop to change the avatar size (`"3xs"`, `"2xs"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"`, or `"3xl"`). Defaults to `"md"`.

```html [WXML]
<c-avatar alt="Jane Doe" size="3xs" />
<c-avatar alt="Jane Doe" size="xs" />
<c-avatar alt="Jane Doe" size="md" />
<c-avatar alt="Jane Doe" size="xl" />
<c-avatar alt="Jane Doe" size="3xl" />
```

### Color

Use the `color` prop to set the theme color of the fallback background, text, and icon (`"neutral"`, `"primary"`, `"secondary"`, `"success"`, `"info"`, `"warning"`, or `"danger"`). Defaults to `"neutral"`.

```html [WXML]
<c-avatar alt="Ada Lovelace" color="neutral" />
<c-avatar alt="Ada Lovelace" color="primary" />
<c-avatar alt="Ada Lovelace" color="secondary" />
<c-avatar alt="Ada Lovelace" color="success" />
<c-avatar alt="Ada Lovelace" color="info" />
<c-avatar alt="Ada Lovelace" color="warning" />
<c-avatar alt="Ada Lovelace" color="danger" />
```

### Text & Initials

Use the `text` prop to specify explicit fallback text (taking precedence over `alt`). Up to two initials are extracted from space-separated words unless the string starts with `+` or `isGroupCounter` is `true`, which renders the text verbatim.

```html [WXML]
<!-- Extracts initials ("AL") -->
<c-avatar text="Ada Lovelace" color="primary" />

<!-- Verbatim group overflow counter -->
<c-avatar text="+5" isGroupCounter="{{true}}" />
```

### Icon

Use the `icon` prop to display a `<c-icon>` in the fallback branch when `src` is omitted or fails to load.

```html [WXML]
<c-avatar icon="lucide:user" />
<c-avatar icon="lucide:user" color="primary" size="lg" />
```

### Image Mode & Lazy Loading

Use `mode` (defaults to `"aspectFill"`) and `lazyLoad` (defaults to `true`) to configure the underlying WeChat `<image>` cropping behavior and lazy loading.

::code-group

```html [index.wxml]
<c-avatar
  src="{{avatarUrl}}"
  alt="Jane Doe"
  mode="aspectFit"
  lazyLoad="{{false}}"
/>
```

```ts [index.ts]
Page({
  data: {
    avatarUrl: "https://example.com/avatar.png",
  },
});
```

::

### Slots

Use the `icon` named slot or the `default` slot to render custom fallback content when `src` is empty or fails to load. The `icon` slot takes precedence over the `icon` prop, `default` slot, and computed fallback text.

```html [WXML]
<!-- Named icon slot -->
<c-avatar color="warning">
  <view slot="icon">★</view>
</c-avatar>

<!-- Default slot -->
<c-avatar color="primary">
  <text>VIP</text>
</c-avatar>
```

### Custom Styling

Use `className` to append classes to the root element and `ui` to override individual slots (`root`, `image`, `fallback`, and `icon`).

::code-group

```html [index.wxml]
<c-avatar
  src="{{avatarUrl}}"
  alt="Jane Doe"
  className="ring-2 ring-primary"
  ui="{{avatarUi}}"
/>
```

```ts [index.ts]
Page({
  data: {
    avatarUrl: "https://example.com/avatar.png",
    avatarUi: {
      root: "border border-default",
      fallback: "tracking-wide",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `String` | `""` | Image URL rendered in the `<image>` element. When empty or after an image load error, the fallback branch is rendered instead. |
| `alt` | `String` | `""` | Alternative text used to compute fallback initials (up to 2 characters from space-separated words, or verbatim if starting with `+` or `isGroupCounter` is `true`) when `text` is empty. |
| `mode` | `String` | `"aspectFill"` | WeChat `<image>` `mode` attribute controlling cropping and scaling. |
| `lazyLoad` | `Boolean` | `true` | Passed to the `<image>` `lazy-load` attribute. |
| `color` | `String` | `"neutral"` | Theme color variant (`"neutral"` or any color in `DEFAULT_THEME_COLORS`). |
| `icon` | `String` | `""` | Icon name passed to `<c-icon>` in the fallback branch when the `icon` slot is not provided. |
| `text` | `String` | `""` | Explicit fallback text; takes precedence over `alt` for `fallbackText` (formatted as up to 2 initials unless starting with `+` or `isGroupCounter` is `true`). |
| `size` | `String` | `"md"` | Size variant (`"3xs"`, `"2xs"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"`, `"3xl"`). Overridden by `groupSize` when inside `c-avatar-group`. |
| `ui` | `Object` | `{}` | Per-slot class overrides for `root`, `image`, `fallback`, and `icon`. |
| `className` | `String` | `""` | Additional root class string merged into the `root` slot. |
| `isGroupCounter` | `Boolean` | `false` | When `true`, renders `text`/`alt` verbatim without extracting initials (used for overflow counter avatars in groups). |

## Slots

| Name | Description |
| --- | --- |
| `icon` | Named slot rendered in the fallback branch when `src` is empty or fails to load. Takes precedence over the `icon` prop, `default` slot, and computed fallback text. |
| `default` | Default slot rendered in the fallback branch when neither the `icon` slot nor the `icon` prop is used. Takes precedence over computed fallback text. |

## Events

| Name | Payload | Description |
| --- | --- | --- |
| — | — | This component does not emit custom events. Image load errors are handled internally to activate the fallback branch. |

## Theme

Customize the `avatar` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    avatar: {
      slots: {
        root: "relative overflow-hidden inline-flex items-center justify-center shrink-0 select-none rounded-full align-middle",
        image: "absolute inset-0 h-full w-full rounded-full object-cover block",
        fallback: "font-medium truncate text-sm",
        icon: "shrink-0",
      },
      variants: {
        color: {
          primary: {
            root: "bg-primary/10",
            fallback: "text-primary",
            icon: "text-primary",
          },
          secondary: {
            root: "bg-secondary/10",
            fallback: "text-secondary",
            icon: "text-secondary",
          },
          danger: {
            root: "bg-danger/10",
            fallback: "text-danger",
            icon: "text-danger",
          },
          success: {
            root: "bg-success/10",
            fallback: "text-success",
            icon: "text-success",
          },
          warning: {
            root: "bg-warning/10",
            fallback: "text-warning",
            icon: "text-warning",
          },
          info: {
            root: "bg-info/10",
            fallback: "text-info",
            icon: "text-info",
          },
          neutral: {
            root: "bg-elevated",
            fallback: "text-muted",
            icon: "text-muted",
          },
        },
        size: {
          "3xs": {
            root: "size-4",
            fallback: "text-[length:calc(var(--spacing)_*_2)]",
          },
          "2xs": {
            root: "size-5",
            fallback: "text-3xs",
          },
          xs: {
            root: "size-6",
            fallback: "text-xs",
          },
          sm: {
            root: "size-7",
            fallback: "text-xs",
          },
          md: {
            root: "size-8",
            fallback: "text-sm",
          },
          lg: {
            root: "size-9",
            fallback: "text-md",
          },
          xl: {
            root: "size-10",
            fallback: "text-lg",
          },
          "2xl": {
            root: "size-11",
            fallback: "text-xl",
          },
          "3xl": {
            root: "size-12",
            fallback: "text-2xl",
          },
        },
      },
      defaultVariants: {
        size: "md",
        color: "neutral",
      },
    },
  },
});
```
