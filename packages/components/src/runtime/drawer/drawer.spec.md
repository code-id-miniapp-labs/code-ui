# Drawer (`c-drawer`)

## Overview & Tier

- **Purpose**: Slide-over modal sheet with backdrop overlay, drag-to-dismiss grabber gesture, keyboard height awareness, and optional background scaling coordination with `<c-app>`.
- **Architecture Tier**: **Tier 2 — Interactive** (backed by the `@code-ui/drawer` finite state machine, using `../_shared/base`, `../_shared/machine`, and `withAppScale` from `@code-ui/miniapp/behaviors/app`).
- **Related Components**:
  - `<c-app>` (optional parent page wrapper scaled when `shouldScaleBackground` is `true`)
  - `<c-button>` (rendered internally as the default close trigger when no custom `close` slot is provided)

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
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides merged with the resolved theme classes. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (`class-name` in WXML; this component declares `className` rather than `class`). |

## Slots

WeChat MiniProgram `<slot>` elements are static and do not support scoped slots or fallback default children inside `<slot>`. Conditional rendering driven by slot-presence flags (`slots.*`) is used instead.

| Slot | Behavior |
| :--- | :--- |
| *(default)* | Main body content rendered inside a vertical `<scroll-view>` (`body` slot). |
| `header` | Rendered inside the header bar (`headerContent` slot) beside the close trigger. |
| `close` | Replaces the default `<c-button>` close trigger when provided (`wx:if="{{slots.close}}"`). |
| `footer` | Conditionally renders the footer bar (`wx:if="{{slots.footer}}"`) pinned below the scrollable body. |

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

Defined in `packages/core/src/theme/definitions/drawer.ts`:

- **Slots**: `root`, `backdrop`, `content`, `container`, `grabber`, `grabberBar`, `header`, `headerContent`, `closeTrigger`, `closeButton`, `closeIcon`, `body`, `footer`
- **Variants**:
  - `placement`: `"bottom"` | `"top"` | `"left"` | `"right"`
  - `open`: `true` | `false`
- **Compound Variants**: Combines `placement` (`"bottom" | "top" | "left" | "right"`) and `open` (`true | false`) to apply directional enter/exit classes to `content`.
- **Default Variants**:
  - `placement`: `"bottom"`
  - `open`: `true`

## Examples

### WXML

```xml
<c-button label="Open Drawer" bind:tap="onOpenDrawer" />

<c-drawer
  open="{{isOpen}}"
  placement="bottom"
  should-scale-background="{{true}}"
  ui="{{ { content: 'max-h-[70vh]' } }}"
  bind:close="onCloseDrawer"
>
  <view slot="header" class="text-base font-semibold">Filters</view>

  <view class="py-2">Drawer body content goes here.</view>

  <view slot="footer" class="flex gap-2">
    <c-button label="Cancel" variant="ghost" bind:tap="onCloseDrawer" />
    <c-button label="Apply" bind:tap="onApply" />
  </view>
</c-drawer>
```

### TypeScript

```ts
Page({
  data: {
    isOpen: false,
  },

  onOpenDrawer() {
    this.setData({ isOpen: true });
  },

  onCloseDrawer() {
    this.setData({ isOpen: false });
  },

  onApply() {
    this.setData({ isOpen: false });
  },
});
```
