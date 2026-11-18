# Modal (`c-modal`)

## Overview & Tier

`c-modal` is a dialog overlay component for WeChat MiniProgram with controlled/uncontrolled open state, backdrop overlay, close button, internal or outer scrolling, fullscreen layout, keyboard-height padding adjustment, and enter/leave transitions.

- **Tier**: Tier 2 — Interactive / Stateful (`createMachineBehavior` with `modalMachine` and `connectModal` from `@code-ui/modal`, plus `computedBehavior` and `createComponentOptions` from `../_shared/base`).
- **Compound Relations**: None (standalone component; internally renders `<c-button>` as the default close trigger when `close` is enabled and the `close` slot is not used).

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
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` (`class`) | `string` | `""` | Declared as `className` in component `properties` and passed to `resolveSlots` as the root class override. |

> **Callback props (`ModalProps`)**: `onOpenChange` (`(details: { open: boolean }) => void`), `onClose`, `onClosePrevent`, `onEnter`, `onAfterEnter`, `onLeave`, and `onAfterLeave` are also defined on the modal machine props.

## Slots

Because WeChat MiniProgram `<slot>` elements are static and do not support fallback default content inside `<slot>...</slot>`, `c-modal` uses `wx:if` / `wx:else` conditionals driven by active slot detection (`slots.*`):

| Name | Behavior |
| :--- | :--- |
| `default` | Main body content inside `<scroll-view>` when the `body` slot is not used. |
| `trigger` | Optional trigger element rendered before the modal; tapping it opens/toggles the modal. |
| `content` | Replaces the entire inner modal panel (close trigger, header, body, and footer). |
| `header` | Replaces the default header wrapper (`title` and `description`). |
| `title` | Custom title content; rendered only when the `title` prop is empty (`wx:else`). |
| `description` | Custom description content; rendered only when the `description` prop is empty (`wx:else`). |
| `close` | Custom close trigger content inside the close button wrapper; replaces the default `<c-button>`. |
| `body` | Named body slot inside `<scroll-view>`; takes precedence over the `default` slot. |
| `footer` | Optional footer area rendered below the body. |

## Events

| Event | Detail Payload | Description |
| :--- | :--- | :--- |
| `bind:overlayTap` | `MiniAppBaseEventLike` (raw tap event) | Fired when the backdrop overlay or outer container background is tapped. |
| `bind:closeTriggerTap` | `MiniAppBaseEventLike` (raw tap event) | Fired when the close button or `close` slot is tapped. |

> **Exposed API (`exportApi: true`)**: The component exposes `open`, `visible`, `setOpen(open)`, `openModal()`, `closeModal()`, and `toggle()`.

## Theme

Defined in `packages/core/src/theme/definitions/modal.ts`:

- **Slots**: `root`, `trigger`, `overlay`, `container`, `content`, `header`, `wrapper`, `title`, `description`, `closeTrigger`, `closeButton`, `closeIcon`, `body`, `footer`
- **Variants**:
  - `size`: `"xs" | "sm" | "md" | "lg" | "xl"`
  - `fullscreen`: `boolean`
  - `scrollable`: `boolean`
  - `closable`: `boolean` (derived from `slots.close` or `close !== false && close !== null`)
  - `hasBody`: `boolean` (derived from `slots.body || slots.default`)
  - `hasFooter`: `boolean` (derived from `slots.footer`)
  - `transition`: `boolean` (derived from `transition !== false`)
  - `open`: `boolean`
- **Default Variants**:
  - `size: "md"`
  - `fullscreen: false`
  - `scrollable: false`
  - `closable: true`
  - `hasBody: true`
  - `hasFooter: false`
  - `transition: true`
  - `open: false`

## Examples

### WXML

```xml
<!-- Uncontrolled with trigger slot -->
<c-modal title="Confirm Action" description="This cannot be undone." size="sm">
  <c-button slot="trigger" label="Open Modal" />
  <view>Are you sure you want to proceed?</view>
  <view slot="footer">
    <c-button label="Confirm" color="primary" />
  </view>
</c-modal>

<!-- Controlled -->
<c-modal
  open="{{isOpen}}"
  title="Edit Profile"
  ui="{{ { content: 'rounded-2xl' } }}"
  bind:overlayTap="onModalClose"
  bind:closeTriggerTap="onModalClose"
>
  <view slot="body">Modal body content</view>
</c-modal>
```

### TypeScript (Page)

```ts
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
