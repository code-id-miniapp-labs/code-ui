# Drawer (`c-drawer`)

## Overview & Tier

- **Purpose**: Slide-over modal sheet with backdrop overlay, drag-to-dismiss grabber gesture, keyboard height awareness, `<root-portal>` viewport isolation, and optional background scaling coordination with `<c-app>`.
- **Architecture Tier**: **Tier 2 — Interactive** (backed by the `@code-id-labs/drawer` finite state machine via `connectDrawer` / `getApi(this, "drawer")`, using `../_shared/base`, `../_shared/machine`, `createAppThemeBehavior` from `@code-id-labs/miniapp/behaviors/theme`, and `withAppScale` from `@code-id-labs/miniapp/behaviors/app`).
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
| `portal` | `boolean` | `true` | Renders the drawer overlay and content inside `<root-portal>` so fixed positioning stays anchored to the viewport above page content and scaling transforms. When used inside `<c-app>` with `shouldScaleBackground="true"`, place `<c-drawer slot="overlay">` directly under `<c-app>` so container scaling never traps `position: fixed`. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides merged with the resolved theme classes. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (`className` in WXML; this component declares `className` rather than `class`). |

> **Callback props (`DrawerProps`)**: `onOpenChange`, `onClose`, `onBackdropTap`, `onCloseTriggerTap`, `onDragStart`, `onDrag`, and `onDragEnd` are handled by `@code-id-labs/drawer` and automatically bridged to MiniProgram `bind:*` events via `createMachinePropGetter`.

## Slots

WeChat MiniProgram `<slot>` elements are static and do not support scoped slots or fallback default children inside `<slot>`. Conditional rendering driven by slot-presence flags (`slots.*`) is used instead.

| Slot | Behavior |
| :--- | :--- |
| *(default)* | Main body content rendered inside a vertical `<scroll-view>` (`body` slot). |
| `header` | Rendered inside the header bar (`headerContent` slot) beside the close trigger. |
| `close` | Replaces the default `<c-button>` close trigger when provided (`wx:if="{{slots.close}}"`). |
| `footer` | Conditionally renders the footer bar (`wx:if="{{slots.footer}}"`) pinned below the scrollable body. |

## Events

All component events are bridged through `@code-id-labs/drawer` via `createMachinePropGetter` (no direct `this.triggerEvent(...)` in runtime `index.ts`; UI handlers delegate via `getApi(this, "drawer")`):

| Event | Detail Payload | Description |
| :--- | :--- | :--- |
| `bind:openChange` (`bind:openchange`) | `{ open: boolean }` | Fired when the drawer transitions to open or closing. |
| `bind:backdropTap` (`bind:backdroptap`) | `undefined` | Fired when the backdrop is tapped. |
| `bind:closeTriggerTap` (`bind:closetriggertap`) | `undefined` | Fired when the close trigger or `close` slot wrapper is tapped. |
| `bind:close` | `undefined` | Fired when the drawer begins closing (API close, passing drag threshold, close trigger tap, or allowed backdrop tap). |
| `bind:dragstart` (`bind:dragStart`) | `{ offset?: number }` | Fired when a drag gesture starts on the grabber. |
| `bind:drag` | `{ offset?: number }` | Fired while dragging the grabber. |
| `bind:dragend` (`bind:dragEnd`) | `{ passed: boolean; offset?: number }` | Fired when a drag gesture ends or is cancelled; `passed` indicates whether the threshold was reached. |

## Theme

Defined in `packages/core/src/theme/definitions/drawer.ts`:

- **Slots**: `root`, `backdrop`, `content`, `container`, `grabber`, `grabberBar`, `header`, `headerContent`, `closeTrigger`, `closeButton`, `closeIcon`, `body`, `footer`
- **Variants**:
  - `placement`: `"bottom"` | `"top"` | `"left"` | `"right"`
  - `open`: `true` | `false`
  - `keyboardOpen`: `true` | `false` (tightens footer bottom padding and constrains `bottom`/`top` sheet height when the virtual keyboard is open)
- **Compound Variants**: Combines `placement` (`"bottom" | "top" | "left" | "right"`) with `open` (`true | false`) for directional enter/exit animations, and `placement` (`"bottom" | "top"`) with `keyboardOpen: true` to cap content & scroll-body height above the virtual keyboard.
- **Default Variants**:
  - `placement`: `"bottom"`
  - `open`: `true`
  - `keyboardOpen`: `false`

> **Virtual keyboard positioning**: `@code-id-labs/drawer` listens to `wx.onKeyboardHeightChange` and applies `padding-bottom: <height>px` + `--keyboard-height` on the drawer `root` container so all four placements (`bottom`, `top`, `left`, `right`) stay positioned and scrollable above the virtual keyboard without conflicting with WXS drag transforms on `content`. When placing `<c-input>` or `<c-textarea>` inside `<c-drawer>`, set `adjust-position="{{ false }}"` on the input so native WebView shifting does not double-offset the sheet.

## Examples

### WXML

```xml
<c-button label="Open Drawer" bind:tap="onOpenDrawer" />

<c-drawer
  open="{{isOpen}}"
  placement="bottom"
  shouldScaleBackground="{{true}}"
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
