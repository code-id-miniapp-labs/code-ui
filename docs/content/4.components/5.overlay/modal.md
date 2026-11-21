---
title: Modal
description: Dialog overlay component for WeChat MiniProgram with controlled/uncontrolled open state, backdrop overlay, close button, internal or outer scrolling, fullscreen layout, keyboard-height padding adjustment, and enter/leave transitions.
---

## Overview

`c-modal` is a dialog overlay component for WeChat MiniProgram (`weapp`) featuring controlled and uncontrolled open states, a backdrop overlay, close button, internal or outer scrolling, fullscreen layout, keyboard-height padding adjustment, and enter/leave transitions.

It is a standalone component that internally renders `<c-button>` as the default close trigger when `close` is enabled and no custom `close` slot is provided.

## Usage

### Basic

Use the `trigger` slot for uncontrolled modals. Tapping the trigger opens the modal automatically, and `defaultOpen` can be set to `true` to open it on initial render.

```html [index.wxml]
<c-modal title="Confirm Action" description="This cannot be undone.">
  <c-button slot="trigger" label="Open Modal" />
  <view>Are you sure you want to proceed?</view>
  <view slot="footer" class="flex justify-end gap-2">
    <c-button label="Cancel" color="neutral" variant="ghost" />
    <c-button label="Confirm" color="primary" />
  </view>
</c-modal>

<!-- Open on initial render -->
<c-modal defaultOpen="{{true}}" title="Welcome">
  <view>This modal starts open in uncontrolled mode.</view>
</c-modal>
```

### Controlled

Pass a boolean to `open` to control the modal programmatically, and listen to `bind:overlayTap` and `bind:closeTriggerTap` to update your page state.

::code-group

```html [index.wxml]
<c-button label="Edit Profile" bind:tap="openModal" />

<c-modal
  open="{{isOpen}}"
  title="Edit Profile"
  description="Update your account details below."
  bind:overlayTap="onModalClose"
  bind:closeTriggerTap="onModalClose"
>
  <view slot="body">Modal body content</view>
</c-modal>
```

```ts [index.ts]
Page({
  data: {
    isOpen: false,
  },

  openModal() {
    this.setData({ isOpen: true });
  },

  onModalClose() {
    this.setData({ isOpen: false });
  },
});
```

::

### Size

Use the `size` prop to set the maximum width of the modal content container (`"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`). Defaults to `"md"`.

```html [index.wxml]
<c-modal title="Small Modal" size="sm">
  <c-button slot="trigger" label="Small (sm)" />
  <view>Compact dialog content.</view>
</c-modal>

<c-modal title="Large Modal" size="lg">
  <c-button slot="trigger" label="Large (lg)" />
  <view>Wider dialog content.</view>
</c-modal>
```

### Fullscreen

Set `fullscreen` to `true` to expand the modal to fill the entire viewport with safe-area inset padding.

```html [index.wxml]
<c-modal title="Fullscreen Modal" fullscreen="{{true}}">
  <c-button slot="trigger" label="Open Fullscreen" />
  <view>Full-viewport modal content with safe-area insets.</view>
</c-modal>
```

### Scrollable

By default (`scrollable="{{false}}"`), the modal body scrolls internally inside a `<scroll-view>`. Set `scrollable` to `true` to make the outer modal container scroll instead.

```html [index.wxml]
<c-modal title="Terms of Service" scrollable="{{true}}">
  <c-button slot="trigger" label="Open Scrollable" />
  <view class="space-y-4">
    <view>Long content that scrolls with the outer modal container...</view>
  </view>
</c-modal>
```

### Overlay & Dismissible

Use `overlay="{{false}}"` to hide the backdrop overlay, or set `dismissible="{{false}}"` (or `closeOnBackdropClick="{{false}}"`) to prevent closing when tapping outside the modal panel.

```html [index.wxml]
<!-- Prevent dismissal on backdrop tap -->
<c-modal title="Required Action" dismissible="{{false}}">
  <c-button slot="trigger" label="Non-dismissible" />
  <view>Use the close button to dismiss this modal.</view>
</c-modal>

<!-- Without backdrop overlay -->
<c-modal title="No Overlay" overlay="{{false}}">
  <c-button slot="trigger" label="No Overlay" />
  <view>Rendered without the dimmed backdrop.</view>
</c-modal>
```

### Close Button

Customize the default `<c-button>` close trigger with `closeIcon`, pass an object of `<c-button>` props (`icon`, `color`, `variant`, `size`, `disabled`, `ui`, `className`) to `close`, or set `close="{{false}}"` to hide it.

::code-group

```html [index.wxml]
<!-- Custom close icon -->
<c-modal title="Custom Close Icon" closeIcon="x">
  <c-button slot="trigger" label="Custom Icon" />
  <view>Uses a custom icon in the close button.</view>
</c-modal>

<!-- Custom close button props -->
<c-modal title="Styled Close Button" close="{{closeButtonProps}}">
  <c-button slot="trigger" label="Styled Close" />
  <view>Forwards props to the internal close button.</view>
</c-modal>

<!-- Hide default close button -->
<c-modal title="No Close Button" close="{{false}}">
  <c-button slot="trigger" label="No Close Button" />
  <view>Close button is hidden.</view>
</c-modal>
```

```ts [index.ts]
Page({
  data: {
    closeButtonProps: {
      color: "neutral",
      variant: "soft",
      size: "sm",
      icon: "close",
    },
  },
});
```

::

### Transition & Duration

Set `transition="{{false}}"` to disable enter/leave transition animations, or adjust `duration` (in milliseconds, default `300`) to change the transition timing.

```html [index.wxml]
<c-modal title="Fast Transition" duration="{{150}}">
  <c-button slot="trigger" label="150ms" />
  <view>Animates in 150ms.</view>
</c-modal>

<c-modal title="Instant" transition="{{false}}">
  <c-button slot="trigger" label="No Transition" />
  <view>Opens and closes without transition animations.</view>
</c-modal>
```

### Slots

`c-modal` provides slots for `trigger`, `header`, `title`, `description`, `close`, `body` (or `default`), `footer`, and `content`. The `title` and `description` props take precedence over their corresponding slots when non-empty; `body` takes precedence over the `default` slot; and `content` replaces the entire inner panel.

```html [index.wxml]
<!-- Custom title, description, close, body, and footer slots -->
<c-modal>
  <c-button slot="trigger" label="Custom Slots" />
  <view slot="title" class="text-primary font-bold">Custom Title</view>
  <view slot="description" class="text-xs text-muted">Custom description slot</view>
  <view slot="close" class="text-xs">✕</view>
  <view slot="body">Named body slot inside scroll-view.</view>
  <view slot="footer" class="flex justify-end gap-2">
    <c-button label="Done" color="primary" />
  </view>
</c-modal>

<!-- Custom header slot -->
<c-modal>
  <c-button slot="trigger" label="Custom Header" />
  <view slot="header" class="flex items-center gap-2 font-semibold">Custom Header</view>
  <view>Replaces the default title and description wrapper.</view>
</c-modal>

<!-- Full content replacement -->
<c-modal>
  <c-button slot="trigger" label="Custom Content" />
  <view slot="content" class="p-6">
    <view class="font-semibold">Fully Custom Panel</view>
    <view class="mt-2 text-sm">Replaces close button, header, body, and footer.</view>
  </view>
</c-modal>
```

### Events & Exposed API

Listen to `bind:overlayTap` and `bind:closeTriggerTap` for tap interactions, or access the exposed component API (`open`, `visible`, `setOpen(open)`, `openModal()`, `closeModal()`, `toggle()`) via `this.selectComponent`.

::code-group

```html [index.wxml]
<c-button label="Open via API" bind:tap="handleOpen" />

<c-modal
  id="demo-modal"
  title="Imperative Modal"
  bind:overlayTap="onOverlayTap"
  bind:closeTriggerTap="onCloseTriggerTap"
>
  <view>Controlled via events or exposed API methods.</view>
</c-modal>
```

```ts [index.ts]
Page({
  handleOpen() {
    const modal = this.selectComponent("#demo-modal");
    modal?.openModal();
  },

  onOverlayTap(e: WechatMiniprogram.CustomEvent) {
    console.log("Overlay tapped", e);
  },

  onCloseTriggerTap(e: WechatMiniprogram.CustomEvent) {
    console.log("Close trigger tapped", e);
  },
});
```

::

### Custom Styling

Override any theme slot with `ui` or pass additional classes to the root element via `className`.

```html [index.wxml]
<c-modal
  title="Styled Modal"
  className="custom-modal-root"
  ui="{{ { content: 'rounded-2xl', header: 'bg-elevated', body: 'py-6' } }}"
>
  <c-button slot="trigger" label="Styled Modal" />
  <view>Custom slot styling applied.</view>
</c-modal>
```

## State Machine

Click any active transition or event button below to simulate the `modal` state machine live:

::machine-visualizer{name="modal"}
::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `open` | `boolean \| null` | `null` | Controlled open state (`null` for uncontrolled mode). |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled. |
| `title` | `string` | `""` | Header title text (takes precedence over the `title` slot). |
| `description` | `string` | `""` | Header description text (takes precedence over the `description` slot). |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Max-width preset for the modal content container. |
| `overlay` | `boolean` | `true` | Whether to render the backdrop overlay. |
| `dismissible` | `boolean` | `true` | Whether tapping the overlay closes the modal. |
| `closeOnBackdropClick` | `boolean` | `true` | Alias for overlay-click dismissal. |
| `scrollable` | `boolean` | `false` | When `true`, the outer modal container scrolls; when `false`, the body `<scroll-view>` scrolls internally. |
| `fullscreen` | `boolean` | `false` | Expands the modal to fill the viewport with safe-area insets. |
| `close` | `boolean \| ModalCloseProps \| null` | `true` | Controls the default close button (`false`/`null` hides it; object overrides `<c-button>` props: `icon`, `color`, `variant`, `size`, `disabled`, `ui`, `className`). |
| `closeIcon` | `string` | `""` | Icon name for the default close button (falls back to `"close"` when empty). |
| `transition` | `boolean` | `true` | Enables enter/leave transition classes and timing. |
| `duration` | `number` | `300` | Transition duration in milliseconds. |
| `portal` | `boolean` | `true` | Renders the modal overlay and dialog inside WeChat `<root-portal>` above page content and native inputs while keeping `trigger` inline. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` (`class`) | `string` | `""` | Declared as `className` in component `properties` and passed to `resolveSlots` as the root class override. |

::callout{icon="i-lucide-code"}
**Callback props (`ModalProps`)**: `onOpenChange` (`(details: { open: boolean }) => void`), `onClose`, `onClosePrevent`, `onEnter`, `onAfterEnter`, `onLeave`, and `onAfterLeave` are also defined on the modal props.
::

## Slots

| Name | Behavior |
| :--- | :--- |
| `default` | Main body content inside `<scroll-view>` when the `body` slot is not used. |
| `trigger` | Optional trigger element rendered before the modal; tapping it opens/toggles the modal. |
| `content` | Replaces the entire inner modal panel (close trigger, header, body, and footer). |
| `header` | Replaces the default header wrapper (`title` and `description`). |
| `title` | Custom title content; rendered only when the `title` prop is empty. |
| `description` | Custom description content; rendered only when the `description` prop is empty. |
| `close` | Custom close trigger content inside the close button wrapper; replaces the default `<c-button>`. |
| `body` | Named body slot inside `<scroll-view>`; takes precedence over the `default` slot. |
| `footer` | Optional footer area rendered below the body. |

## Events

| Event | Detail Payload | Description |
| :--- | :--- | :--- |
| `bind:overlayTap` | `MiniAppBaseEventLike` (raw tap event) | Fired when the backdrop overlay or outer container background is tapped. |
| `bind:closeTriggerTap` | `MiniAppBaseEventLike` (raw tap event) | Fired when the close button or `close` slot is tapped. |

::callout{icon="i-lucide-terminal"}
**Exposed API (`exportApi: true`)**: The component exposes `open`, `visible`, `setOpen(open)`, `openModal()`, `closeModal()`, and `toggle()`.
::

## Theme

Customize the `modal` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    modal: {
      slots: {
        root: "fixed inset-0 z-modal box-border overscroll-contain",
        trigger: "inline-flex",
        overlay: "fixed inset-0 bg-black/35 backdrop-blur-md",
        container:
          "relative z-10 w-full flex items-center justify-center box-border",
        content:
          "pointer-events-auto relative flex flex-col w-full bg-default border border-muted shadow-2xl overflow-hidden box-border",
        header:
          "relative flex flex-col shrink-0 box-border w-full px-5 pt-4 pb-3.5",
        wrapper: "flex flex-col gap-1 min-w-0 w-full",
        title:
          "text-base font-semibold tracking-tight text-highlighted leading-snug",
        description: "text-xs text-muted leading-relaxed",
        closeTrigger:
          "absolute top-3.5 right-3.5 z-20 inline-flex items-center justify-center w-7 h-7 rounded-full bg-elevated text-muted shrink-0 cursor-pointer active:opacity-70 transition-opacity",
        closeButton: "p-0 w-full h-full rounded-full text-inherit",
        closeIcon: "w-3.5 h-3.5",
        body: "w-full box-border px-5 py-4 text-sm text-default leading-relaxed",
        footer:
          "flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-muted shrink-0 box-border w-full",
      },
      variants: {
        size: {
          xs: {
            content: "max-w-xs",
          },
          sm: {
            content: "max-w-sm",
          },
          md: {
            content: "max-w-md",
          },
          lg: {
            content: "max-w-lg",
          },
          xl: {
            content: "max-w-xl",
          },
        },
        fullscreen: {
          true: {
            container: "p-0",
            content:
              "w-full h-full max-w-none max-h-none rounded-none border-0 shadow-none",
            header: "pt-[calc(var(--spacing)_*_4_+_env(safe-area-inset-top))]",
            closeTrigger:
              "top-[calc(var(--spacing)_*_4_+_env(safe-area-inset-top))] right-4",
            footer:
              "pb-[calc(var(--spacing)_*_3.5_+_env(safe-area-inset-bottom))]",
          },
          false: {
            container: "p-5",
            content: "rounded-xl",
          },
        },
        scrollable: {
          true: {
            root: "overflow-y-auto",
            container: "min-h-full pointer-events-auto",
            body: "flex-none",
          },
          false: {
            root: "overflow-hidden",
            container: "h-full pointer-events-none",
            body: "flex-1 min-h-0 overflow-y-auto overscroll-contain",
          },
        },
        closable: {
          true: {},
          false: {},
        },
        hasBody: {
          true: {},
          false: {},
        },
        hasFooter: {
          true: {},
          false: {},
        },
        transition: {
          true: {
            overlay: "transition-opacity duration-300 ease-out",
            content: "transition-all duration-300 ease-out",
          },
          false: {
            overlay: "transition-none",
            content: "transition-none",
          },
        },
        open: {
          true: {
            overlay: "opacity-100 pointer-events-auto",
          },
          false: {
            overlay: "opacity-0 pointer-events-none",
          },
        },
      },
      compoundVariants: [
        {
          fullscreen: false,
          scrollable: false,
          class: {
            content: "max-h-[85vh]",
          },
        },
        {
          fullscreen: false,
          scrollable: true,
          class: {
            content: "max-h-none my-auto",
          },
        },
        {
          fullscreen: true,
          hasFooter: false,
          class: {
            body: "pb-[calc(var(--spacing)_*_4_+_env(safe-area-inset-bottom))]",
          },
        },
        {
          closable: true,
          class: {
            header: "pr-12",
          },
        },
        {
          hasBody: true,
          class: {
            header: "border-b border-muted",
          },
        },
        {
          open: true,
          transition: true,
          fullscreen: false,
          class: {
            overlay: "cui-modal-overlay-enter",
            content:
              "cui-modal-content-enter opacity-100 scale-100 translate-y-0",
          },
        },
        {
          open: true,
          transition: true,
          fullscreen: true,
          class: {
            overlay: "cui-modal-overlay-enter",
            content: "cui-modal-fullscreen-enter opacity-100 translate-y-0",
          },
        },
        {
          open: true,
          transition: false,
          class: {
            content: "opacity-100 scale-100 translate-y-0",
          },
        },
        {
          open: false,
          fullscreen: false,
          class: {
            content: "opacity-0 scale-95 translate-y-2",
          },
        },
        {
          open: false,
          fullscreen: true,
          class: {
            content: "opacity-0 translate-y-8",
          },
        },
      ],
      defaultVariants: {
        size: "md",
        fullscreen: false,
        scrollable: false,
        closable: true,
        hasBody: true,
        hasFooter: false,
        transition: true,
        open: false,
      },
    }
  }
})
```
