---
title: Popover
description: Anchored floating menu / popover surface positioned relative to a trigger element, with collision handling, optional directional arrow, optional <root-portal> rendering, backdrop dismissal, and enter/exit visibility transitions.
---

## Overview

`c-popover` is an anchored floating menu and popover surface positioned relative to a trigger element. It supports viewport collision handling, an optional directional arrow, optional `<root-portal>` rendering, backdrop dismissal, and enter/exit visibility transitions.

It is a standalone component and exposes its machine API on the component instance under the `popover` key (`exportApi: true`).

## Usage

### Basic

Use `triggerMode="tap"` for an uncontrolled menu that toggles when the `trigger` slot is tapped.

```html
<c-popover triggerMode="tap">
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Open Menu
  </view>

  <view class="py-1">
    <view class="px-3 py-2">Profile</view>
    <view class="px-3 py-2">Settings</view>
    <view class="px-3 py-2">Sign out</view>
  </view>
</c-popover>
```

### Controlled & Default Open

Set `defaultOpen="{{true}}"` to start open in uncontrolled mode (`open === null`). For controlled mode, bind a boolean to `open` and update it via `bind:openChange` (with `triggerMode="manual"`, the default).

::code-group

```html [index.wxml]
<c-popover
  open="{{isOpen}}"
  triggerMode="manual"
  bind:openChange="handleOpenChange"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border" bindtap="toggleMenu">
    Controlled Menu
  </view>

  <view class="p-2">
    <view class="px-3 py-2" bindtap="closeMenu">Done</view>
  </view>
</c-popover>
```

```ts [index.ts]
Page({
  data: {
    isOpen: false,
  },

  handleOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean }>) {
    this.setData({ isOpen: e.detail.open });
  },

  toggleMenu() {
    this.setData({ isOpen: !this.data.isOpen });
  },

  closeMenu() {
    this.setData({ isOpen: false });
  },
});
```

::

### Trigger Mode

Use `triggerMode` to choose between `"manual"` (default, parent controls `open`) and `"tap"` (automatically toggles on trigger tap).

```html
<!-- Automatic tap toggle -->
<c-popover triggerMode="tap">
  <view slot="trigger" class="px-3 py-2 rounded-md border">Tap to Toggle</view>
  <view class="p-2">Menu content</view>
</c-popover>

<!-- Manual control (default) -->
<c-popover triggerMode="manual" open="{{isOpen}}">
  <view slot="trigger" class="px-3 py-2 rounded-md border" bindtap="openMenu">Manual Trigger</view>
  <view class="p-2">Menu content</view>
</c-popover>
```

### Placement & Offsets

Position the floating surface with `side` (`"bottom"` or `"top"`), `align` (`"start"`, `"center"`, or `"end"`), `sideOffset` (gap in `px`), and `alignOffset` (offset in `px` along the alignment axis).

```html
<c-popover
  triggerMode="tap"
  side="top"
  align="end"
  sideOffset="{{8}}"
  alignOffset="{{-4}}"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Top End
  </view>

  <view class="p-2">Positioned above and aligned to the end edge.</view>
</c-popover>
```

### Arrow

Set `arrow="{{true}}"` to render a directional arrow element inside the menu container.

```html
<c-popover
  triggerMode="tap"
  arrow="{{true}}"
  side="bottom"
  align="center"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    With Arrow
  </view>

  <view class="p-2">Menu with directional arrow</view>
</c-popover>
```

### Collision Handling

`avoidCollisions` (default `true`) flips `side` or clamps alignment to stay inside the viewport, keeping at least `collisionPadding` `px` (default `8`) from viewport edges.

```html
<c-popover
  triggerMode="tap"
  avoidCollisions="{{true}}"
  collisionPadding="{{12}}"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Viewport Safe
  </view>

  <view class="p-2">Flips or clamps within 12px of viewport edges.</view>
</c-popover>
```

### Portal

Set `portal="{{true}}"` to render the floating layer inside WeChat `<root-portal>` and apply app theme CSS variables on the portal wrapper, avoiding parent `overflow: hidden` clipping.

```html
<c-popover
  triggerMode="tap"
  portal="{{true}}"
  arrow="{{true}}"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Portal Menu
  </view>

  <view class="p-2">Rendered inside root-portal</view>
</c-popover>
```

### Width & Max Height

Control how the menu width relates to the trigger with `matchTriggerWidth` (`true` / `"exact"`, `"min"`, or `false`) and cap content height in `px` with `maxHeight` (default `240`).

```html
<!-- Menu at least as wide as trigger, capped at 180px height -->
<c-popover
  triggerMode="tap"
  matchTriggerWidth="min"
  maxHeight="{{180}}"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Min Trigger Width
  </view>

  <view class="p-2">Scrollable or tall content capped at 180px.</view>
</c-popover>

<!-- Independent width -->
<c-popover
  triggerMode="tap"
  matchTriggerWidth="{{false}}"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Auto Width
  </view>

  <view class="w-56 p-2">Custom fixed-width menu</view>
</c-popover>
```

### Backdrop & Transition

Configure `closeOnBackdropClick` (default `true`) to control whether tapping outside dismisses the menu, and `duration` (default `150` `ms`) for the close transition.

```html
<c-popover
  triggerMode="tap"
  closeOnBackdropClick="{{false}}"
  duration="{{200}}"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Persistent Backdrop
  </view>

  <view class="p-2">Tapping the backdrop will not close this menu.</view>
</c-popover>
```

### Disabled

Set `disabled="{{true}}"` to prevent trigger interaction from opening or toggling the menu.

```html
<c-popover triggerMode="tap" disabled="{{true}}">
  <view slot="trigger" class="px-3 py-2 rounded-md border opacity-50">
    Disabled Menu
  </view>

  <view class="p-2">Unreachable while disabled</view>
</c-popover>
```

### Slots

Provide the anchor element in the `trigger` slot and the menu body in the default slot.

```html
<c-popover triggerMode="tap">
  <view slot="trigger" class="inline-flex items-center gap-2 px-3 py-2 rounded-md border">
    <text>Actions</text>
  </view>

  <view class="py-1">
    <view class="px-3 py-2">Duplicate</view>
    <view class="px-3 py-2">Archive</view>
  </view>
</c-popover>
```

### Events & Machine API

Listen to `bind:openChange`, `bind:open`, `bind:close`, and `bind:backdropTap`, and optionally access the exported `popover` API via `this.selectComponent`.

::code-group

```html [index.wxml]
<c-popover
  id="actions-menu"
  triggerMode="tap"
  portal="{{true}}"
  bind:open="handleOpen"
  bind:close="handleClose"
  bind:openChange="handleOpenChange"
  bind:backdropTap="handleBackdropTap"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Actions
  </view>

  <view class="py-1">
    <view class="px-3 py-2" bindtap="onSelectOption" data-value="edit">Edit</view>
    <view class="px-3 py-2" bindtap="onSelectOption" data-value="delete">Delete</view>
  </view>
</c-popover>
```

```ts [index.ts]
Page({
  handleOpen() {
    console.log("Menu opened");
  },

  handleClose() {
    console.log("Menu closed");
  },

  handleOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean }>) {
    console.log("Open state:", e.detail.open);
  },

  handleBackdropTap() {
    console.log("Backdrop tapped");
  },

  onSelectOption(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value;
    const menu = this.selectComponent("#actions-menu");
    menu?.popover?.closeMenu?.();
    console.log("Selected:", value);
  },
});
```

::

### Custom Styling (`ui` & `className`)

Use `ui` to override classes on individual slots (`root`, `trigger`, `backdrop`, `positioner`, `content`, `arrow`), and `className` (rather than `class`) to add classes to `root`. You can also pass `id` or `ids` for custom element IDs.

```html
<c-popover
  id="styled-menu"
  ids="{{ { content: 'styled-menu-content' } }}"
  triggerMode="tap"
  arrow="{{true}}"
  className="inline-block w-auto"
  ui="{{ { content: 'p-2 rounded-xl shadow-xl', arrow: 'w-3 h-3' } }}"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Styled Menu
  </view>

  <view class="px-2 py-1">Custom slot classes</view>
</c-popover>
```

## State Machine

Click any active transition or event button below to simulate the `popover` state machine live:

::machine-visualizer{name="popover"}
::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `open` | `boolean \| null` | `null` | Controlled open state (`null` uses uncontrolled internal state). |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled (`open === null`). |
| `disabled` | `boolean` | `false` | Disables trigger interaction. |
| `closeOnBackdropClick` | `boolean` | `true` | Whether tapping the backdrop closes the menu. |
| `triggerMode` | `"manual" \| "tap"` | `"manual"` | `"tap"` toggles the menu automatically on trigger tap; `"manual"` lets the parent control open state. |
| `portal` | `boolean` | `false` | Renders the floating layer inside WeChat `<root-portal>` and applies app theme CSS variables/mode on the portal wrapper. |
| `block` | `boolean` | `false` | Expands `root` and `trigger` to `w-full` when `true`, or shrinks them to `w-fit` when `false`. |
| `arrow` | `boolean` | `false` | Renders a directional arrow element inside the content container. |
| `side` | `"bottom" \| "top"` | `"bottom"` | Preferred placement side relative to the trigger. |
| `align` | `"start" \| "center" \| "end"` | `"start"` | Preferred alignment along the trigger edge. |
| `sideOffset` | `number` | `4` | Gap in `px` between the trigger and the menu. |
| `alignOffset` | `number` | `0` | Offset in `px` along the alignment axis. |
| `collisionPadding` | `number` | `8` | Minimum padding in `px` from viewport edges when clamping/flipping. |
| `avoidCollisions` | `boolean` | `true` | Whether to flip `side` or clamp alignment to stay within the viewport. |
| `matchTriggerWidth` | `boolean \| "min" \| "exact"` | `true` | Controls width matching against the trigger (`true` / `"exact"`, `"min"`, or `false`). |
| `maxHeight` | `number` | `240` | Maximum content height in `px`. |
| `duration` | `number` | `150` | Close transition duration in `ms`. |
| `id` | `string` | `undefined` | Custom root id for the component instance. |
| `ids` | `Record<string, string>` | `undefined` | Custom sub-element id overrides. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides (`root`, `trigger`, `backdrop`, `positioner`, `content`, `arrow`). |
| `className` | `string` | `""` | Additional class string merged onto the `root` slot (`popover` declares `className` rather than `class`). |

## Slots

| Name | Description |
| :--- | :--- |
| `trigger` | Anchor element wrapped in the trigger container (`bindtap="handleTriggerTap"`). |
| `default` | Menu body content rendered inside the floating `positioner` → `content` container (wrapped in an `overflow-hidden` container inheriting `max-height`, `border-radius`, and `background-color`). |

> The floating wrapper stays mounted and toggles visibility with `hidden` / `display: none` rather than unmounting, preserving slotted content state and portal theme CSS variables when `portal` is enabled.

## Events

| Event | `detail` Payload | Description |
| :--- | :--- | :--- |
| `bind:openChange` | `{ open: boolean }` | Fired when the menu open state changes. |
| `bind:open` | `void` | Fired when the menu opens. |
| `bind:close` | `void` | Fired when the menu closes. |
| `bind:backdropTap` | `void` | Fired when the backdrop is tapped (`catchtap="handleBackdropTap"`). |

## Theme

Customize the `popover` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    popover: {
      slots: {
        root: "relative",
        trigger: "relative",
        backdrop: "fixed inset-0 z-40 bg-transparent",
        positioner: "z-popover box-border",
        content:
          "relative w-full rounded-md bg-default text-default shadow-lg ring-1 ring-default box-border transition-all duration-150 ease-out",
        body: "relative w-full overflow-hidden rounded-[inherit] bg-inherit",
        arrow:
          "absolute w-2.5 h-2.5 bg-default border-default pointer-events-none",
      },
      variants: {
        portal: {
          true: {
            positioner: "fixed",
          },
          false: {
            positioner: "absolute",
          },
        },
        block: {
          true: {
            root: "w-full",
            trigger: "w-full",
          },
          false: {
            root: "self-start w-fit max-w-full",
            trigger: "w-fit max-w-full",
          },
        },
        open: {
          true: {
            backdrop: "pointer-events-auto",
            content: "opacity-100 scale-100 pointer-events-auto",
          },
          false: {
            backdrop: "pointer-events-none",
            content: "opacity-0 scale-95 pointer-events-none",
          },
        },
        visible: {
          true: {
            root: "z-50",
            trigger: "z-50",
          },
          false: {},
        },
        side: {
          bottom: {
            arrow: "border-t border-l",
          },
          top: {
            arrow: "border-b border-r",
          },
        },
      },
      defaultVariants: {
        portal: false,
        block: false,
        open: false,
        visible: false,
        side: "bottom",
      },
    },
  },
})
```
