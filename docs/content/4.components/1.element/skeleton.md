---
title: Skeleton
description: A visual placeholder component used to indicate a loading state while content is being fetched or rendered.
---

## Overview

`c-skeleton` is a standalone visual placeholder component used to indicate a loading state while content is being fetched or rendered.

## Usage

### Basic

Render a loading placeholder and control its dimensions with `className`.

```html [index.wxml]
<c-skeleton className="h-4 w-48" />
```

### Variant

Use the `variant` prop to switch between `"pulse"` (default), `"shine"`, and `"none"` animations.

```html [index.wxml]
<c-skeleton variant="pulse" className="h-4 w-48" />
<c-skeleton variant="shine" className="h-4 w-48" />
<c-skeleton variant="none" className="h-4 w-48" />
```

### Custom Styling

Use `className` or pass a `ui` object to override the `root` slot classes (for example, to render a circular avatar placeholder).

::code-group

```html [index.wxml]
<!-- Circular placeholder via className -->
<c-skeleton className="h-12 w-12 rounded-full" />

<!-- Shine variant with root override via ui -->
<c-skeleton variant="shine" ui="{{ skeletonUi }}" />
```

```ts [index.ts]
Page({
  data: {
    skeletonUi: {
      root: "h-12 w-12 rounded-full",
    },
  },
});
```

::

### Slots

Use the `default` slot to project child elements inside the `root` container.

```html [index.wxml]
<c-skeleton variant="none" className="p-4">
  <view class="h-4 w-32" />
</c-skeleton>
```

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `"pulse" \| "shine" \| "none"` (`String`) | `"pulse"` | Loading animation variant. |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot name (`root`). |
| `className` | `String` | `""` | Additional CSS classes applied to the `root` element (declared as `className` in `properties` and passed as the `class` override to `resolveSlots`; no separate `class` prop is declared). |

## Slots

| Name | Description |
| :--- | :--- |
| `default` | Default slot projected directly inside the `root` container. |

## Events

None. `c-skeleton` does not emit any custom events.

## Theme

Customize the `skeleton` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    skeleton: {
      slots: {
        root: "bg-accented rounded-sm",
      },
      variants: {
        variant: {
          pulse: {
            root: "animate-pulse",
          },
          shine: {
            root: "cui-skeleton-shine",
          },
          none: {
            root: "",
          },
        },
      },
      defaultVariants: {
        variant: "pulse",
      },
    }
  }
})
```
