---
title: Icon
description: Renders an Iconify icon, semantic alias, or image/SVG asset path or URL, with support for named or custom sizes, theme or raw CSS colors, and spin animation.
---

## Overview

`c-icon` renders an Iconify CSS icon class (on a `<view>`) from built-in Lucide, additional `@iconify-json/*` collections, or custom `cui.config.ts` aliases, or renders an image/SVG asset path or URL (via `<image mode="aspectFit">`). It supports named or custom sizes, theme or raw CSS colors, and continuous spin animation.

::callout{icon="i-lucide-info" color="info"}
This component declares `className` rather than `class` in `properties` for adding root classes, and renders nothing when `name` is empty.
::

## Usage

### Basic

Use the `name` prop with an Iconify class (`i-lucide-*`), collection shorthand (`lucide:home`), or semantic alias configured in `cui.config.ts`. When `name` is empty, `c-icon` renders nothing.

```html
<c-icon name="lucide:home" />
```

### Image & SVG

Pass a local asset path (`/`, `./`, `../`), remote URL (`http(s)://`), `data:image/` URI, or image/SVG file path (`.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`) to `name` to render via `<image mode="aspectFit">`.

```html
<c-icon name="/assets/icons/logo.svg" />
<c-icon name="https://example.com/icons/badge.png" />
```

### Size

Use the `size` prop with a named variant (`xs`, `sm`, `md`, `lg`, `xl`), a bare numeric string (normalized to `px`, e.g. `"24"` becomes `"24px"`), or a CSS unit such as `rem` or `rpx`. When omitted, the icon defaults to `size-[1em]`.

```html
<!-- Named size variants -->
<c-icon name="lucide:star" size="xs" />
<c-icon name="lucide:star" size="sm" />
<c-icon name="lucide:star" size="md" />
<c-icon name="lucide:star" size="lg" />
<c-icon name="lucide:star" size="xl" />

<!-- Custom CSS sizes -->
<c-icon name="lucide:star" size="24" />
<c-icon name="lucide:star" size="2rem" />
<c-icon name="lucide:star" size="32rpx" />
```

### Color

Use the `color` prop with a configured theme color (`primary`, `secondary`, `danger`, `success`, `warning`, `info`, `neutral`) or a raw CSS color (`#...`, `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`, `oklch(...)`, `var(...)`).

```html
<!-- Theme color variants -->
<c-icon name="lucide:check-circle" color="primary" />
<c-icon name="lucide:sparkles" color="secondary" />
<c-icon name="lucide:check" color="success" />
<c-icon name="lucide:info" color="info" />
<c-icon name="lucide:alert-triangle" color="warning" />
<c-icon name="lucide:x-circle" color="danger" />
<c-icon name="lucide:circle" color="neutral" />

<!-- Raw CSS colors -->
<c-icon name="lucide:palette" color="#0ea5e9" />
<c-icon name="lucide:palette" color="rgb(14, 165, 233)" />
```

### Spin

Set `spin` to `true` to enable continuous rotation animation (`animate-spin`).

```html
<c-icon name="lucide:loader-2" spin="{{true}}" />
```

### Custom Styling

Use `ui` to override the `root` slot classes or `className` to append additional root classes.

::code-group

```html [index.wxml]
<c-icon name="/assets/icons/logo.svg" size="lg" ui="{{ iconUi }}" className="ml-2" />
```

```ts [index.ts]
Page({
  data: {
    iconUi: { root: "opacity-80" },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | `""` | Iconify class (`"i-lucide-home"`), shorthand (`"lucide:home"`), semantic alias (`"check"`), or an image/SVG path or URL (`/`, `./`, `../`, `http(s)://`, `data:image/`, or `.svg`/`.png`/`.jpg`/`.jpeg`/`.webp`/`.gif`). Renders nothing when empty. |
| `size` | `String` | `""` | Named size variant (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`) or custom CSS size. Bare numeric strings (e.g. `"24"`) are normalized to `"24px"`; other CSS values (e.g. `"2rem"`, `"32rpx"`) are applied directly as inline `width`, `height`, and `font-size`. |
| `color` | `String` | `""` | Theme color variant name (e.g. `"neutral"`, or any configured theme color) or a raw CSS color (`#...`, `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`, `oklch(...)`, `var(...)`) applied via inline `color` style. |
| `spin` | `Boolean` | `false` | Enables continuous rotation animation (`animate-spin`) when `true`. |
| `ui` | `Object` | `{}` | Per-slot class overrides merged via `resolveSlots`, e.g. `{ root: "..." }`. |
| `className` | `String` | `""` | Additional root class string passed to `resolveSlots` (note: this component declares `className` rather than `class` in `properties`). |

## Slots

This component does not expose any slots.

## Events

This component does not emit any custom `bind:*` events.

## Theme

Customize the `icon` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    icon: {
      slots: {
        root: "shrink-0 size-[1em]",
      },
      variants: {
        size: {
          xs: { root: "size-3.5" },
          sm: { root: "size-4" },
          md: { root: "size-5" },
          lg: { root: "size-6" },
          xl: { root: "size-7" },
        },
        color: {
          primary: { root: "text-primary" },
          secondary: { root: "text-secondary" },
          danger: { root: "text-danger" },
          success: { root: "text-success" },
          warning: { root: "text-warning" },
          info: { root: "text-info" },
          neutral: { root: "text-neutral" },
        },
        spin: {
          true: { root: "animate-spin" },
        },
      },
    },
  },
});
```
