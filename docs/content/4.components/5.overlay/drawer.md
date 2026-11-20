---
title: Drawer
description: "Slide-over modal sheet with backdrop overlay, drag-to-dismiss grabber gesture, keyboard height awareness, and optional background scaling coordination with <c-app>."
---

## Overview

`c-drawer` is a slide-over modal sheet with a backdrop overlay, drag-to-dismiss grabber gesture, keyboard height awareness, and optional background scaling coordination with `<c-app>`.

- **Related Components**:
  - `<c-app>` — optional parent page wrapper scaled when `shouldScaleBackground` is `true`.
  - `<c-button>` — rendered internally as the default close trigger when no custom `close` slot is provided.

::callout{icon="i-lucide-info"}
This component declares `className` (`className` in WXML) rather than `class` for applying additional classes to the `root` slot.
::

## Usage

### Basic

Use `open` with `bind:close` to toggle the drawer from a trigger button.

::code-group

```html [index.wxml]
<c-button label="Open Drawer" bind:tap="onOpen" />

<c-drawer open="{{isOpen}}" bind:close="onClose">
  <view slot="header" class="text-base font-semibold">Filters</view>

  <view class="py-2">Drawer body content goes here.</view>

  <view slot="footer" class="flex gap-2">
    <c-button label="Cancel" variant="ghost" bind:tap="onClose" />
    <c-button label="Apply" bind:tap="onApply" />
  </view>
</c-drawer>
```

```ts [index.ts]
Page({
  data: {
    isOpen: false,
  },

  onOpen() {
    this.setData({ isOpen: true });
  },

  onClose() {
    this.setData({ isOpen: false });
  },

  onApply() {
    this.setData({ isOpen: false });
  },
});
```

::

### Controlled & Uncontrolled

Set `open` to a boolean for controlled mode, or omit it (`null`) and use `defaultOpen` to render an initially open drawer in uncontrolled mode.

::code-group

```html [index.wxml]
<!-- Uncontrolled: starts open -->
<c-drawer defaultOpen="{{true}}">
  <view slot="header" class="text-base font-semibold">Welcome</view>
  <view>This drawer manages its own open state.</view>
</c-drawer>

<!-- Controlled: synced with page data -->
<c-drawer open="{{isOpen}}" bind:close="onClose">
  <view slot="header" class="text-base font-semibold">Controlled</view>
  <view>Close events update page state.</view>
</c-drawer>
```

```ts [index.ts]
Page({
  data: {
    isOpen: false,
  },

  onClose() {
    this.setData({ isOpen: false });
  },
});
```

::

### Placement

Use the `placement` prop to slide the drawer in from `"bottom"` (default), `"top"`, `"left"`, or `"right"`.

::code-group

```html [index.wxml]
<view class="flex flex-wrap gap-2">
  <c-button label="Bottom" data-placement="bottom" bind:tap="onOpen" />
  <c-button label="Top" data-placement="top" bind:tap="onOpen" />
  <c-button label="Left" data-placement="left" bind:tap="onOpen" />
  <c-button label="Right" data-placement="right" bind:tap="onOpen" />
</view>

<c-drawer open="{{isOpen}}" placement="{{placement}}" bind:close="onClose">
  <view slot="header" class="text-base font-semibold">Placement: {{placement}}</view>
  <view>Slides in from the {{placement}} edge.</view>
</c-drawer>
```

```ts [index.ts]
Page({
  data: {
    isOpen: false,
    placement: "bottom",
  },

  onOpen(e: WechatMiniprogram.TouchEvent) {
    this.setData({
      isOpen: true,
      placement: e.currentTarget.dataset.placement,
    });
  },

  onClose() {
    this.setData({ isOpen: false });
  },
});
```

::

### Close Button

Use the `close` prop to hide the default header `<c-button>` (`false` or `null`) or pass a `DrawerCloseProps` object (`icon`, `leadingIcon`, `trailingIcon`, `label`, `loading`, `loadingIcon`, `color`, `variant`, `size`, `disabled`, `ui`, `className`) to customize it.

```html [index.wxml]
<!-- Hide the default close button -->
<c-drawer open="{{isOpen}}" close="{{false}}" bind:close="onClose">
  <view slot="header" class="text-base font-semibold">No Close Button</view>
  <view>Dismiss via backdrop tap or drag gesture.</view>
</c-drawer>

<!-- Customize the internal <c-button> -->
<c-drawer
  open="{{isOpen}}"
  close="{{ { label: 'Done', color: 'primary', variant: 'soft', size: 'sm', leadingIcon: 'check' } }}"
  bind:close="onClose"
>
  <view slot="header" class="text-base font-semibold">Custom Close Trigger</view>
  <view>Forwards props directly to the header button.</view>
</c-drawer>
```

### Dismissal & Transition

Control backdrop taps with `closeOnBackdropClick`, grabber drag dismissal with `dismissible` and `threshold` (in `px`), and enter/exit timing with `duration` (in `ms`).

```html [index.wxml]
<c-drawer
  open="{{isOpen}}"
  closeOnBackdropClick="{{false}}"
  dismissible="{{true}}"
  threshold="{{120}}"
  duration="{{400}}"
  bind:close="onClose"
>
  <view slot="header" class="text-base font-semibold">Persistent Backdrop</view>
  <view>Tapping the backdrop will not dismiss; drag 120px or tap close.</view>
</c-drawer>
```

### Scale Background

Enable `shouldScaleBackground` alongside `<c-app>` to scale down the page container while the drawer is open, and tune the effect with `scaleFactor` and `scaleBackground`. By default `portal="{{true}}"` renders the drawer inside `<root-portal>`; if you disable `portal`, pass `slot="overlay"` on `<c-drawer>` inside `<c-app>` so `<c-app>`'s scale transform does not trap `position: fixed`.

::code-group

```html [index.wxml]
<c-app>
  <view class="p-4">
    <c-button label="Open Scaled Drawer" bind:tap="onOpen" />
  </view>

  <c-drawer
    open="{{isOpen}}"
    shouldScaleBackground="{{true}}"
    scaleFactor="{{0.92}}"
    scaleBackground="bg-neutral-950"
    bind:close="onClose"
  >
    <view slot="header" class="text-base font-semibold">Scaled Background</view>
    <view>The surrounding c-app scales down to 0.92 behind this drawer.</view>
  </c-drawer>
</c-app>
```

```ts [index.ts]
Page({
  data: {
    isOpen: false,
  },

  onOpen() {
    this.setData({ isOpen: true });
  },

  onClose() {
    this.setData({ isOpen: false });
  },
});
```

::

### Virtual Keyboard & Form Inputs

`c-drawer` listens to `wx.onKeyboardHeightChange` and applies `padding-bottom` + `--keyboard-height` on the drawer `root` container so all placements (`"bottom"`, `"top"`, `"left"`, `"right"`) stay positioned and scrollable above the virtual keyboard without conflicting with WXS grabber drag transforms.

When placing `<c-input>` or `<c-textarea>` inside `<c-drawer>`, set `adjust-position="{{ false }}"` on the input so native WebView page shifting does not double-offset the drawer:

```html [index.wxml]
<c-drawer open="{{isOpen}}" placement="bottom" bind:close="onClose">
  <view slot="header" class="text-base font-semibold">Quick Reply</view>

  <view class="flex flex-col gap-3 py-2">
    <c-input placeholder="Subject" adjust-position="{{false}}" />
    <c-textarea placeholder="Write your message..." adjust-position="{{false}}" />
  </view>

  <view slot="footer" class="flex justify-end gap-2">
    <c-button label="Send" color="primary" bind:tap="onClose" />
  </view>
</c-drawer>
```

### Slots

Use the `header`, `close`, default body, and `footer` slots to compose custom layouts.

```html [index.wxml]
<c-drawer open="{{isOpen}}" bind:close="onClose">
  <view slot="header" class="text-base font-semibold">Custom Slots</view>

  <view slot="close" class="text-xs font-medium text-primary">Dismiss</view>

  <view class="space-y-2">
    <view>Scrollable body content rendered in the default slot.</view>
  </view>

  <view slot="footer" class="flex justify-end gap-2">
    <c-button label="Cancel" variant="ghost" bind:tap="onClose" />
    <c-button label="Confirm" color="primary" bind:tap="onClose" />
  </view>
</c-drawer>
```

### Events

Listen to `bind:close` (with `reason`: `"backdrop"` or `"close-trigger"`), `bind:backdropTap`, `bind:closeTriggerTap`, and grabber gesture events (`bind:dragstart`, `bind:drag`, `bind:dragend`).

::code-group

```html [index.wxml]
<c-drawer
  open="{{isOpen}}"
  bind:close="onClose"
  bind:backdropTap="onBackdropTap"
  bind:closeTriggerTap="onCloseTriggerTap"
  bind:dragstart="onDragStart"
  bind:drag="onDrag"
  bind:dragend="onDragEnd"
>
  <view slot="header" class="text-base font-semibold">Event Lifecycle</view>
  <view>Drag the grabber or tap the backdrop to inspect event payloads.</view>
</c-drawer>
```

```ts [index.ts]
Page({
  data: {
    isOpen: false,
  },

  onClose(e: WechatMiniprogram.CustomEvent<{ reason: "backdrop" | "close-trigger" }>) {
    console.log("close reason:", e.detail.reason);
    this.setData({ isOpen: false });
  },

  onBackdropTap() {
    console.log("backdrop tapped");
  },

  onCloseTriggerTap() {
    console.log("close trigger tapped");
  },

  onDragStart(e: WechatMiniprogram.CustomEvent<{ offset?: number }>) {
    console.log("drag start offset:", e.detail.offset);
  },

  onDrag(e: WechatMiniprogram.CustomEvent<{ offset?: number }>) {
    console.log("dragging offset:", e.detail.offset);
  },

  onDragEnd(e: WechatMiniprogram.CustomEvent<{ passed: boolean; offset?: number }>) {
    console.log("drag end:", e.detail.passed, e.detail.offset);
  },
});
```

::

### Custom Styling

Use `ui` to override individual slot classes and `className` (`className`) to add classes to the `root` slot.

```html [index.wxml]
<c-drawer
  open="{{isOpen}}"
  className="z-60"
  ui="{{ { backdrop: 'bg-black/60', content: 'max-h-[70vh] rounded-t-2xl', body: 'px-6 py-4' } }}"
  bind:close="onClose"
>
  <view slot="header" class="text-base font-semibold">Styled Drawer</view>
  <view>Custom backdrop, content height, and body padding.</view>
</c-drawer>
```

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `open` | `boolean \| null` | `null` | Controlled open state. Set to `boolean` for controlled mode or `null` for uncontrolled mode. |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled (`open` is `null`). |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Screen edge from which the drawer slides in. |
| `closeOnBackdropClick` | `boolean` | `true` | Whether tapping the backdrop dismisses the drawer. |
| `dismissible` | `boolean` | `true` | Whether dragging the grabber can dismiss the drawer. |
| `threshold` | `number` | `80` | Drag distance threshold (in `px`) required to trigger dismissal. |
| `duration` | `number` | `300` | Enter/exit transition duration (in `ms`). |
| `shouldScaleBackground` | `boolean` | `false` | Whether opening the drawer scales down the surrounding `<c-app>` container. |
| `scaleFactor` | `number` | `0.94` | Scale factor applied to `<c-app>` when `shouldScaleBackground` is enabled. |
| `scaleBackground` | `string` | `"bg-black"` | Background color or utility class shown behind `<c-app>` while scaled. |
| `close` | `boolean \| DrawerCloseProps \| null` | `true` | Controls the header close button. `false`/`null` hides it (unless the `close` slot is used); an object forwards props (`icon`, `leadingIcon`, `trailingIcon`, `label`, `loading`, `loadingIcon`, `color`, `variant`, `size`, `disabled`, `ui`, `className`) to `<c-button>`. |
| `portal` | `boolean` | `true` | Renders the drawer overlay and sheet inside WeChat `<root-portal>` so fixed positioning stays anchored to the viewport above page content and scaling transforms. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides merged with the resolved theme classes. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (`className` in WXML). |

## Slots

| Slot | Behavior |
| :--- | :--- |
| *(default)* | Main body content rendered inside a vertical `<scroll-view>` (`body` slot). |
| `header` | Rendered inside the header bar (`headerContent` slot) beside the close trigger. |
| `close` | Replaces the default `<c-button>` close trigger when provided. |
| `footer` | Renders the footer bar pinned below the scrollable body when provided. |

## Events

| Event | Detail Payload | Description |
| :--- | :--- | :--- |
| `bind:backdropTap` | MiniApp tap event object | Fired when the backdrop is tapped. |
| `bind:closeTriggerTap` | MiniApp tap event object | Fired when the close trigger or `close` slot wrapper is tapped. |
| `bind:close` | `{ reason: "backdrop" \| "close-trigger" }` | Fired when a tap on the backdrop or close trigger requests closing. |
| `bind:dragstart` | `{ offset?: number }` | Fired when a drag gesture starts on the grabber. |
| `bind:drag` | `{ offset?: number }` | Fired while dragging the grabber. |
| `bind:dragend` | `{ passed: boolean; offset?: number }` | Fired when a drag gesture ends or is cancelled; `passed` indicates whether the threshold was reached. |

## Theme

Customize the `drawer` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    drawer: {
      slots: {
        root: "fixed inset-0 z-drawer flex overflow-hidden overscroll-contain box-border transition-[padding-bottom] duration-150 ease-out",
        backdrop: "fixed inset-0 bg-black/40 transition-opacity duration-300",
        content:
          "relative z-10 flex bg-default shadow-2xl transition-transform duration-300 ease-out box-border overflow-hidden",
        container: "flex flex-col min-w-0 min-h-0 overflow-hidden",
        grabber:
          "flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 box-border",
        grabberBar: "rounded-full bg-accented",
        header:
          "flex items-center justify-between px-4 py-3 border-b border-muted shrink-0 box-border w-full",
        headerContent: "flex-1 min-w-0",
        closeTrigger:
          "inline-flex items-center justify-center w-8 h-8 rounded-full text-dimmed hover:text-default hover:bg-elevated transition-colors shrink-0",
        closeButton: "p-0 w-full h-full rounded-full text-inherit",
        closeIcon: "w-4 h-4",
        body: "min-h-0 w-full box-border overflow-y-auto px-4 pt-3 pb-6 text-sm text-toned overscroll-contain",
        footer:
          "flex items-center justify-end gap-2 px-4 py-3 border-t border-muted shrink-0 box-border w-full pb-[calc(var(--spacing)_*_3_+_env(safe-area-inset-bottom))]",
      },
      variants: {
        placement: {
          bottom: {
            root: "items-end justify-center",
            content: "flex-col w-full max-h-[85vh] rounded-t-xl",
            container: "w-full flex-initial",
            body: "flex-initial max-h-[60vh]",
            grabber: "w-full py-2.5",
            grabberBar: "w-12 h-1.5",
          },
          top: {
            root: "items-start justify-center",
            content: "flex-col w-full max-h-[85vh] rounded-b-xl",
            container: "w-full flex-initial",
            body: "flex-initial max-h-[60vh]",
            grabber: "w-full py-2.5",
            grabberBar: "w-12 h-1.5",
            header: "pt-[calc(var(--spacing)_*_3_+_env(safe-area-inset-top))]",
            footer: "pb-3",
          },
          left: {
            root: "items-center justify-start",
            content: "flex-row h-full w-4/5 max-w-sm md:max-w-md rounded-none",
            container: "flex-1 h-full",
            body: "flex-1 h-0",
            grabber: "h-full px-2.5",
            grabberBar: "w-1.5 h-12",
            header: "pt-[calc(var(--spacing)_*_3_+_env(safe-area-inset-top))]",
          },
          right: {
            root: "items-center justify-end",
            content: "flex-row h-full w-4/5 max-w-sm md:max-w-md rounded-none",
            container: "flex-1 h-full",
            body: "flex-1 h-0",
            grabber: "h-full px-2.5",
            grabberBar: "w-1.5 h-12",
            header: "pt-[calc(var(--spacing)_*_3_+_env(safe-area-inset-top))]",
          },
        },
        open: {
          true: {
            backdrop:
              "cui-drawer-backdrop-enter opacity-100 pointer-events-auto",
            content: "cui-drawer-open",
          },
          false: {
            backdrop: "opacity-0 pointer-events-none",
          },
        },
        keyboardOpen: {
          true: {
            footer: "pb-3",
          },
          false: {},
        },
      },
      compoundVariants: [
        {
          placement: "bottom",
          keyboardOpen: true,
          class: {
            content: "max-h-[calc(100%_-_env(safe-area-inset-top))]",
            body: "max-h-[calc(100vh_-_var(--keyboard-height,0px)_-_env(safe-area-inset-top,0px)_-_10rem)]",
          },
        },
        {
          placement: "top",
          keyboardOpen: true,
          class: {
            content: "max-h-full",
            body: "max-h-[calc(100vh_-_var(--keyboard-height,0px)_-_env(safe-area-inset-top,0px)_-_10rem)]",
          },
        },
        {
          placement: "bottom",
          open: true,
          class: {
            content: "cui-drawer-enter-bottom",
          },
        },
        {
          placement: "top",
          open: true,
          class: {
            content: "cui-drawer-enter-top",
          },
        },
        {
          placement: "left",
          open: true,
          class: {
            content: "cui-drawer-enter-left",
          },
        },
        {
          placement: "right",
          open: true,
          class: {
            content: "cui-drawer-enter-right",
          },
        },
        {
          placement: "bottom",
          open: false,
          class: {
            content: "cui-drawer-closed-bottom",
          },
        },
        {
          placement: "top",
          open: false,
          class: {
            content: "cui-drawer-closed-top",
          },
        },
        {
          placement: "left",
          open: false,
          class: {
            content: "cui-drawer-closed-left",
          },
        },
        {
          placement: "right",
          open: false,
          class: {
            content: "cui-drawer-closed-right",
          },
        },
      ],
      defaultVariants: {
        placement: "bottom",
        open: true,
        keyboardOpen: false,
      },
    }
  }
})
```
