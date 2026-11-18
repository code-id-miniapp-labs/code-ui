---
title: AvatarGroup
description: Displays a stacked horizontal group of overlapping avatars with an optional overflow counter rendered when child avatars exceed max.
---

## Overview

`c-avatar-group` (`avatar-group`) displays a stacked horizontal group of overlapping `<c-avatar>` components with an optional overflow counter (`+<overflowCount>`) rendered via `<c-avatar isGroupCounter="{{true}}" />` when the number of child avatars exceeds `max`.

- **Related Components**: `c-avatar` (passed into the default slot, and rendered as the overflow counter when `overflowCount > 0`).

::callout{icon="i-lucide-info" color="info"}
`c-avatar-group` uses `className` (or `ui.root`) rather than `class` for custom root styling.
::

## Usage

### Basic

Pass `<c-avatar>` components inside `<c-avatar-group>` to display a stacked horizontal group of overlapping avatars.

```html [index.wxml]
<c-avatar-group>
  <c-avatar src="https://example.com/a.jpg" alt="Alice" />
  <c-avatar src="https://example.com/b.jpg" alt="Bob" />
  <c-avatar src="https://example.com/c.jpg" alt="Charlie" />
</c-avatar-group>
```

### Max

Use the `max` prop to limit the number of visible avatars and render a `+<overflowCount>` counter when the child avatars exceed `max`. Set `max` to `0` (default) to disable overflow truncation.

```html [index.wxml]
<c-avatar-group max="{{2}}">
  <c-avatar src="https://example.com/a.jpg" alt="Alice" />
  <c-avatar src="https://example.com/b.jpg" alt="Bob" />
  <c-avatar src="https://example.com/c.jpg" alt="Charlie" />
  <c-avatar src="https://example.com/d.jpg" alt="Diana" />
</c-avatar-group>
```

### Size

Use the `size` prop (`"3xs"`, `"2xs"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"`, or `"3xl"`) to control the group spacing, ring thickness, and overflow counter size.

```html [index.wxml]
<c-avatar-group size="xs" max="{{2}}">
  <c-avatar text="A" />
  <c-avatar text="B" />
  <c-avatar text="C" />
</c-avatar-group>

<c-avatar-group size="md" max="{{2}}">
  <c-avatar text="A" />
  <c-avatar text="B" />
  <c-avatar text="C" />
</c-avatar-group>

<c-avatar-group size="xl" max="{{2}}">
  <c-avatar text="A" />
  <c-avatar text="B" />
  <c-avatar text="C" />
</c-avatar-group>
```

### Slots

`c-avatar-group` provides a `default` slot for `<c-avatar>` children. Because the root container uses `flex-row-reverse justify-end items-center`, the overflow counter is rendered at the visual end of the stacked group.

```html [index.wxml]
<c-avatar-group size="md" max="{{3}}">
  <c-avatar src="https://example.com/a.jpg" alt="Alice" />
  <c-avatar text="B" />
  <c-avatar text="C" />
  <c-avatar text="D" />
</c-avatar-group>
```

### Custom Styling (`ui` & `className`)

Use `className` to add classes to the root element, or `ui` to override the `root`, `base`, and `counter` slots per instance.

::code-group

```html [index.wxml]
<c-avatar-group size="lg" max="{{3}}" className="my-4" ui="{{groupUi}}">
  <c-avatar text="A" />
  <c-avatar text="B" />
  <c-avatar text="C" />
  <c-avatar text="D" />
</c-avatar-group>
```

```ts [index.ts]
Page({
  data: {
    groupUi: {
      root: "gap-0",
      base: "ring-primary",
      counter: "bg-primary text-inverted",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `String` | `"md"` | Size variant applied to the group and forwarded to the overflow `<c-avatar>`. One of `"3xs"`, `"2xs"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"`, `"3xl"`. |
| `max` | `Number` | `0` | Maximum number of avatars to display before rendering the `+<overflowCount>` counter (`0` disables overflow truncation). |
| `ui` | `Object` | `{}` | Per-slot CSS class overrides (`root`, `base`, `counter`). |
| `className` | `String` | `""` | Custom CSS class name applied to the root element. |

## Slots

| Name | Description |
| --- | --- |
| `default` | Accepts child `<c-avatar>` components. The root container uses `flex-row-reverse justify-end items-center` so the overflow counter appears at the visual end of the stacked group. |

## Events

None.

## Theme

Customize the `avatar-group` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    avatarGroup: {
      slots: {
        root: "inline-flex flex-row-reverse justify-end items-center",
        base: "relative rounded-full ring-bg ring-2 first:me-0",
        counter: "font-semibold tracking-tight",
      },
      variants: {
        size: {
          "3xs": {
            base: "ring -me-0.5",
            counter: "text-3xs ps-0.5",
          },
          "2xs": {
            base: "ring -me-0.5",
            counter: "text-3xs ps-0.5",
          },
          xs: {
            base: "ring -me-0.5",
            counter: "text-3xs ps-0.5",
          },
          sm: {
            base: "ring-2 -me-1",
            counter: "text-2xs ps-0.5",
          },
          md: {
            base: "ring-2 -me-1.5",
            counter: "text-xs ps-1",
          },
          lg: {
            base: "ring-2 -me-1.5",
            counter: "text-xs ps-1",
          },
          xl: {
            base: "ring-3 -me-2",
            counter: "text-sm ps-1.5",
          },
          "2xl": {
            base: "ring-3 -me-2",
            counter: "text-base ps-1.5",
          },
          "3xl": {
            base: "ring-3 -me-2",
            counter: "text-lg ps-1.5",
          },
        },
      },
      defaultVariants: {
        size: "md",
      },
    }
  }
})
```

### Slot Targets

| Slot | Target |
| --- | --- |
| `root` | Outer `<view>` container. |
| `base` | Passed as `className` to the overflow `<c-avatar>`. |
| `counter` | Passed as `ui={{ { fallback: classes.counter } }}` to the overflow `<c-avatar>`. |
