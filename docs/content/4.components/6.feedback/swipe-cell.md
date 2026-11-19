---
title: SwipeCell
description: Swipeable list cell container for WeChat MiniProgram that reveals left and/or right action panels on horizontal touch drag or programmatic control.
---

## Overview

`c-swipe-cell` is a swipeable list cell container for WeChat MiniProgram that reveals left and/or right action panels on horizontal touch drag or programmatic control. It uses `c-icon` internally to render icons on data-driven `left` and `right` action items.

## Usage

### Basic

Pass an array of `SwipeActionItem` objects to `right` (or `left`) and place the cell body inside the default slot.

::code-group
```html [index.wxml]
<c-swipe-cell right="{{rightActions}}">
  <view class="p-4">Swipe left to reveal actions</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    rightActions: [
      { value: "archive", text: "Archive", color: "#64748b" },
      { value: "delete", text: "Delete", icon: "trash", color: "#ef4444" },
    ],
  },
});
```
::

### Left and Right Actions

Use both `left` and `right` props to configure action panels on either side. Each `SwipeActionItem` supports `value`, `text`, `icon`, `color`, `style`, `className`, `disabled`, and an item-level `onClick` callback.

::code-group
```html [index.wxml]
<c-swipe-cell left="{{leftActions}}" right="{{rightActions}}">
  <view class="p-4">Swipe left or right</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    leftActions: [
      {
        value: "pin",
        text: "Pin",
        icon: "pin",
        color: "#3b82f6",
        onClick: (action) => console.log("Pinned:", action.value),
      },
    ],
    rightActions: [
      { value: "mute", text: "Mute", icon: "bell-off", className: "bg-slate-600" },
      { value: "delete", text: "Delete", icon: "trash", style: "background-color: #ef4444;" },
    ],
  },
});
```
::

### Variant

Use the `variant` prop to change the container and content surface style: `"plain"` (default), `"outline"`, `"subtle"`, `"soft"`, or `"separated"`.

::code-group
```html [index.wxml]
<c-swipe-cell variant="plain" right="{{actions}}">
  <view class="p-4">Plain variant</view>
</c-swipe-cell>

<c-swipe-cell variant="outline" right="{{actions}}">
  <view class="p-4">Outline variant</view>
</c-swipe-cell>

<c-swipe-cell variant="subtle" right="{{actions}}">
  <view class="p-4">Subtle variant</view>
</c-swipe-cell>

<c-swipe-cell variant="soft" right="{{actions}}">
  <view class="p-4">Soft variant</view>
</c-swipe-cell>

<c-swipe-cell variant="separated" right="{{actions}}">
  <view class="p-4">Separated variant</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    actions: [{ value: "delete", text: "Delete", color: "#ef4444" }],
  },
});
```
::

### Size

Use the `size` prop (`"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`) to adjust action button padding, text size, gap, and icon size.

::code-group
```html [index.wxml]
<c-swipe-cell size="xs" right="{{actions}}">
  <view class="p-3">Extra small (xs)</view>
</c-swipe-cell>

<c-swipe-cell size="sm" right="{{actions}}">
  <view class="p-3">Small (sm)</view>
</c-swipe-cell>

<c-swipe-cell size="md" right="{{actions}}">
  <view class="p-4">Medium (md)</view>
</c-swipe-cell>

<c-swipe-cell size="lg" right="{{actions}}">
  <view class="p-4">Large (lg)</view>
</c-swipe-cell>

<c-swipe-cell size="xl" right="{{actions}}">
  <view class="p-5">Extra large (xl)</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    actions: [{ value: "edit", text: "Edit", icon: "pencil", color: "#3b82f6" }],
  },
});
```
::

### Disabled

Set `disabled` on `<c-swipe-cell>` to disable swipe gestures and interactions, or set `disabled: true` on an individual `SwipeActionItem` to disable only that action button.

::code-group
```html [index.wxml]
<!-- Entire cell disabled -->
<c-swipe-cell disabled="{{true}}" right="{{actions}}">
  <view class="p-4">Swiping is disabled</view>
</c-swipe-cell>

<!-- Single action item disabled -->
<c-swipe-cell right="{{mixedActions}}">
  <view class="p-4">Delete action is disabled</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    actions: [{ value: "delete", text: "Delete", color: "#ef4444" }],
    mixedActions: [
      { value: "archive", text: "Archive", color: "#64748b" },
      { value: "delete", text: "Delete", color: "#ef4444", disabled: true },
    ],
  },
});
```
::

### Controlled & Default Opened

Use `defaultOpened` for an uncontrolled initial state, or bind `opened` (`"left"`, `"right"`, `true`, `false`, or `null`) with `bind:openChange` for controlled state.

::code-group
```html [index.wxml]
<!-- Uncontrolled: initially open on the right -->
<c-swipe-cell defaultOpened="right" right="{{actions}}">
  <view class="p-4">Initially opened cell</view>
</c-swipe-cell>

<!-- Controlled: synced with page state -->
<c-swipe-cell
  opened="{{openedSide}}"
  bind:openChange="onOpenChange"
  left="{{leftActions}}"
  right="{{actions}}"
>
  <view class="p-4">Controlled cell ({{openedSide || "closed"}})</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    openedSide: false as "left" | "right" | boolean,
    leftActions: [{ value: "pin", text: "Pin", color: "#3b82f6" }],
    actions: [{ value: "delete", text: "Delete", color: "#ef4444" }],
  },

  onOpenChange(
    e: WechatMiniprogram.CustomEvent<{ opened: boolean; side: "left" | "right" | null }>,
  ) {
    const { opened, side } = e.detail;
    this.setData({ openedSide: opened && side ? side : false });
  },
});
```
::

### Width, Threshold & Duration

Configure panel widths (`leftWidth`, `rightWidth`), snap drag `threshold`, transition `duration`, and auto-close behavior via `closeOnActionClick` and `closeOnContentClick`.

::code-group
```html [index.wxml]
<c-swipe-cell
  left="{{leftActions}}"
  right="{{rightActions}}"
  leftWidth="{{80}}"
  rightWidth="{{140}}"
  threshold="{{40}}"
  duration="{{200}}"
  closeOnActionClick="{{false}}"
  closeOnContentClick="{{true}}"
>
  <view class="p-4">Custom width, threshold, and close behavior</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    leftActions: [{ value: "read", text: "Read", color: "#3b82f6" }],
    rightActions: [{ value: "delete", text: "Delete", color: "#ef4444" }],
  },
});
```
::

### Slots

When `left` or `right` prop arrays are empty, use the `left` and `right` named slots to render custom action panels.

```html [index.wxml]
<c-swipe-cell variant="outline" leftWidth="{{80}}" rightWidth="{{120}}">
  <view slot="left" class="h-full px-4 flex items-center bg-primary text-white">
    Pin
  </view>

  <view class="p-4">Custom slot content</view>

  <view slot="right" class="h-full px-4 flex items-center bg-error text-white">
    Delete
  </view>
</c-swipe-cell>
```

### Programmatic Control

Use `this.selectComponent(...)` to call `open`, `close`, `toggle`, or `measure` on the component instance.

::code-group
```html [index.wxml]
<c-swipe-cell id="cell" left="{{leftActions}}" right="{{rightActions}}">
  <view class="p-4">Programmatically controlled cell</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    leftActions: [{ value: "pin", text: "Pin", color: "#3b82f6" }],
    rightActions: [{ value: "delete", text: "Delete", color: "#ef4444" }],
  },

  openRight() {
    this.selectComponent("#cell")?.open("right");
  },

  toggleLeft() {
    this.selectComponent("#cell")?.toggle("left");
  },

  closeCell() {
    this.selectComponent("#cell")?.close();
  },

  remeasure() {
    this.selectComponent("#cell")?.measure();
  },
});
```
::

### Events

Bind MiniProgram `bind:*` events to observe open/close transitions, action taps, drag progress, and content taps.

::code-group
```html [index.wxml]
<c-swipe-cell
  right="{{rightActions}}"
  bind:openChange="onOpenChange"
  bind:open="onOpen"
  bind:close="onClose"
  bind:actionClick="onActionClick"
  bind:dragStart="onDragStart"
  bind:drag="onDrag"
  bind:dragEnd="onDragEnd"
  bind:contentTap="onContentTap"
>
  <view class="p-4">Swipe or tap to inspect events</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    rightActions: [{ value: "delete", text: "Delete", color: "#ef4444" }],
  },

  onOpenChange(
    e: WechatMiniprogram.CustomEvent<{ opened: boolean; side: "left" | "right" | null }>,
  ) {
    console.log("openChange:", e.detail.opened, e.detail.side);
  },

  onOpen(e: WechatMiniprogram.CustomEvent<{ side: "left" | "right" }>) {
    console.log("open:", e.detail.side);
  },

  onClose() {
    console.log("close");
  },

  onActionClick(
    e: WechatMiniprogram.CustomEvent<{
      action: { value?: string | number };
      side: "left" | "right";
      index: number;
    }>,
  ) {
    const { action, side, index } = e.detail;
    console.log("actionClick:", action.value, side, index);
  },

  onDragStart(e: WechatMiniprogram.CustomEvent<Record<string, unknown>>) {
    console.log("dragStart:", e.detail);
  },

  onDrag(e: WechatMiniprogram.CustomEvent<{ offset: number }>) {
    console.log("drag offset:", e.detail.offset);
  },

  onDragEnd(
    e: WechatMiniprogram.CustomEvent<{
      opened: boolean;
      side: "left" | "right" | null;
      offset: number;
    }>,
  ) {
    console.log("dragEnd:", e.detail.opened, e.detail.side, e.detail.offset);
  },

  onContentTap() {
    console.log("contentTap");
  },
});
```
::

### Styling with `ui` and `className`

Customize individual theme slots (`root`, `wrapper`, `content`, `left`, `right`, `action`, `actionText`, `actionIcon`) with `ui` and append root classes with `className`.

::code-group
```html [index.wxml]
<c-swipe-cell
  variant="outline"
  className="my-2"
  ui="{{ { root: 'rounded-xl', content: 'px-4 py-3', actionText: 'tracking-wide' } }}"
  right="{{rightActions}}"
>
  <view>Custom styled swipe cell</view>
</c-swipe-cell>
```

```ts [index.ts]
Page({
  data: {
    rightActions: [{ value: "delete", text: "Delete", icon: "trash", color: "#ef4444" }],
  },
});
```
::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Disables swipe gestures and pointer interactions when `true`. |
| `opened` | `"left" \| "right" \| boolean \| null` | `null` | Controlled opened state (`"left"`, `"right"`, `true`, `false`, or `null` for uncontrolled). |
| `defaultOpened` | `"left" \| "right" \| boolean` | `false` | Initial opened state when uncontrolled. |
| `left` | `SwipeActionItem[]` | `[]` | Data-driven action items rendered in the left panel. |
| `right` | `SwipeActionItem[]` | `[]` | Data-driven action items rendered in the right panel. |
| `leftWidth` | `number` | `0` | Explicit width in `px` for the left action panel (`0` uses measured width). |
| `rightWidth` | `number` | `0` | Explicit width in `px` for the right action panel (`0` uses measured width). |
| `threshold` | `number` | `30` | Drag distance threshold in `px` required to snap open. |
| `duration` | `number` | `300` | Slide transition duration in `ms`. |
| `closeOnActionClick` | `boolean` | `true` | Automatically closes the cell when an action item is tapped. |
| `closeOnContentClick` | `boolean` | `true` | Automatically closes the cell when the center content is tapped while open. |
| `variant` | `"plain" \| "outline" \| "subtle" \| "soft" \| "separated"` | `"plain"` | Visual style variant of the cell container and content surface. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Controls action button padding, text size, gap, and icon size. |
| `ui` | `Record<string, string>` (`SwipeCellUI`) | `{}` | Per-slot class overrides (`root`, `wrapper`, `content`, `left`, `right`, `action`, `actionText`, `actionIcon`). |
| `className` | `string` | `""` | Additional class names applied to the `root` slot. |

### `SwipeActionItem`

Each item in `left` or `right` accepts:

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string \| number` | Optional identifier for the action item. |
| `text` | `string` | Label text displayed inside the action button. |
| `icon` | `string` | Icon name passed to `c-icon`. |
| `className` | `string` | Additional class names applied to the action button. |
| `style` | `string` | Inline style string applied to the action button. |
| `color` | `string` | Background or accent color for the action button. |
| `disabled` | `boolean` | Disables tap interaction on the action button when `true`. |
| `onClick` | `(action: SwipeActionItem) => void` | Per-item tap callback. |

### Methods

Exposed on the component instance via `this.selectComponent(...)`:

| Method | Signature | Description |
| --- | --- | --- |
| `open` | `(side?: "left" \| "right") => void` | Programmatically opens the cell on the specified side (defaults to `"right"`). |
| `close` | `() => void` | Programmatically closes the cell. |
| `toggle` | `(side?: "left" \| "right") => void` | Toggles the cell open or closed on the specified side. |
| `measure` | `() => void` | Triggers measurement of the left and right action panel widths. |

## Slots

| Name | Description |
| --- | --- |
| `(default)` | Renders the primary cell content inside the `content` container. |
| `left` | Renders custom left-side action content when the `left` prop array is empty. |
| `right` | Renders custom right-side action content when the `right` prop array is empty. |

## Events

Emitted as MiniProgram `bind:*` component events with the following `detail` payloads:

| Event | Callback Prop | `detail` Payload | Description |
| --- | --- | --- | --- |
| `bind:openChange` | `onOpenChange` | `{ opened: boolean; side: "left" \| "right" \| null }` | Fired when the opened state changes. |
| `bind:open` | `onOpen` | `{ side: "left" \| "right" }` | Fired when the cell opens. |
| `bind:close` | `onClose` | `—` | Fired when the cell closes. |
| `bind:actionClick` / `bind:click` | `onActionClick` / `onClick` | `{ action: SwipeActionItem; side: "left" \| "right"; index: number }` | Fired when a data-driven action button is tapped. |
| `bind:dragStart` | `onDragStart` | `Record<string, unknown>` | Fired when horizontal drag begins. |
| `bind:drag` | `onDrag` | `{ offset: number }` | Fired continuously while dragging. |
| `bind:dragEnd` | `onDragEnd` | `{ opened: boolean; side: "left" \| "right" \| null; offset: number }` | Fired when dragging finishes. |
| `bind:contentTap` | `onContentTap` | `—` | Fired when the center content area is tapped. |

## Theme

Customize the `swipe-cell` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    swipeCell: {
      slots: {
        root: "relative overflow-hidden w-full select-none touch-pan-y box-border",
        wrapper:
          "relative flex flex-row w-full transition-transform duration-300 ease-out will-change-transform box-border",
        content: "relative z-10 w-full shrink-0 bg-default box-border",
        left: "absolute left-0 top-0 bottom-0 z-0 flex flex-row h-full box-border",
        right:
          "absolute right-0 top-0 bottom-0 z-0 flex flex-row h-full box-border",
        action:
          "flex flex-row items-center justify-center h-full text-white transition-opacity active:opacity-85 select-none cursor-pointer box-border font-medium",
        actionText: "font-medium leading-none",
        actionIcon: "shrink-0",
      },
      variants: {
        variant: {
          plain: {
            root: "",
            content: "bg-default",
          },
          outline: {
            root: "border border-default rounded-md overflow-hidden shadow-xs",
            content: "bg-default",
          },
          subtle: {
            root: "border border-default rounded-md overflow-hidden bg-muted",
            content: "bg-muted",
          },
          soft: {
            root: "rounded-md overflow-hidden bg-elevated",
            content: "bg-elevated",
          },
          separated: {
            root: "rounded-md border border-default shadow-xs overflow-hidden",
            content: "bg-default",
          },
        },
        size: {
          xs: {
            action: "px-2.5 text-xs gap-1",
            actionText: "text-xs",
            actionIcon: "size-3.5",
          },
          sm: {
            action: "px-3 text-xs gap-1.5",
            actionText: "text-xs",
            actionIcon: "size-3.5",
          },
          md: {
            action: "px-4 text-sm gap-2",
            actionText: "text-sm",
            actionIcon: "size-4",
          },
          lg: {
            action: "px-5 text-base gap-2",
            actionText: "text-base",
            actionIcon: "size-5",
          },
          xl: {
            action: "px-6 text-lg gap-2.5",
            actionText: "text-lg",
            actionIcon: "size-6",
          },
        },
        disabled: {
          true: {
            root: "opacity-60 pointer-events-none",
          },
          false: {},
        },
      },
      compoundVariants: [],
      defaultVariants: {
        variant: "plain",
        size: "md",
        disabled: false,
      },
    },
  },
})
```
