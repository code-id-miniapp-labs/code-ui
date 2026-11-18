# `c-swipe-cell` Specification

## Overview & Tier

- **Purpose**: Swipeable list cell container for WeChat MiniProgram that reveals left and/or right action panels on horizontal touch drag or programmatic control.
- **Architecture Tier**: **Tier 2 — Interactive / Stateful** (`createMachineBehavior` backed by `@code-id-labs/swipe-cell` with `exportApi: true`, `computedBehavior`, and a WXS touch gesture handler).
- **Related Components**: Standalone component (uses `c-icon` internally to render icons on data-driven `left` / `right` action items; not a parent/child compound group).

---

## Props

> **Note**: In `packages/components/src/runtime/swipe-cell/index.ts`, the root custom class property is declared as `className` (rather than `class`) and passed to `resolveSlots(themeFns, ui, this.data.className)`.

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
| `className` (`class`) | `string` | `""` | Additional class names applied to the `root` slot (`declared as className` in runtime `properties`). |

### `SwipeActionItem` Shape

Each item in `left` or `right` accepts:

- `value?: string | number`
- `text?: string`
- `icon?: string`
- `className?: string`
- `style?: string`
- `color?: string`
- `disabled?: boolean`
- `onClick?: (action: SwipeActionItem) => void`

### Component Methods

Exposed on the component instance in `index.ts`:

- `open(side?: "left" | "right")`: Programmatically opens the cell on the specified side (defaults to `"right"`).
- `close()`: Programmatically closes the cell.
- `toggle(side?: "left" | "right")`: Toggles the cell open/closed.
- `measure()`: Triggers measurement of the left and right action panel widths.

---

## Slots

Runtime slot configuration declares `{ default: false, left: false, right: false }`.

| Slot | Behavior & Constraints |
| --- | --- |
| *(default)* | Renders the primary cell content inside the `content` container. |
| `left` | Renders custom left-side action content when the `left` prop array is empty (`wx:else`). |
| `right` | Renders custom right-side action content when the `right` prop array is empty (`wx:else`). |

**MiniProgram Static `<slot>` Constraints**:
- WeChat `<slot>` does not support scoped slots or nested fallback content.
- `index.wxml` uses conditional rendering (`wx:if="{{swipeCell.leftActions.length > 0}}"` / `wx:else` and similarly for `right`) so data-driven `left` / `right` arrays take precedence over `<slot name="left" />` / `<slot name="right" />`.
- The `left` and `right` wrapper `<view>` elements only mount when actions exist or the corresponding slot is active (`swipeCell.hasLeftActions || slots.left`, `swipeCell.hasRightActions || slots.right`).

---

## Events

`index.ts` and `index.wxml` do not invoke `triggerEvent` directly; instead, interaction callbacks are bridged from `SwipeCellProps` via `createMachineBehavior`:

| Callback (`SwipeCellProps`) | Payload (`detail`) | Description |
| --- | --- | --- |
| `onOpenChange` | `{ opened: boolean; side: "left" \| "right" \| null }` | Fired when the opened state changes. |
| `onOpen` | `{ side: "left" \| "right" }` | Fired when the cell opens. |
| `onClose` | *(none)* | Fired when the cell closes. |
| `onActionClick` / `onClick` | `{ action: SwipeActionItem; side: "left" \| "right"; index: number }` | Fired when a data-driven action button is tapped. |
| `onDragStart` | `Record<string, unknown>` | Fired when horizontal drag begins. |
| `onDrag` | `{ offset: number }` | Fired continuously while dragging. |
| `onDragEnd` | `{ opened: boolean; side: "left" \| "right" \| null; offset: number }` | Fired when dragging finishes. |
| `onContentTap` | *(none)* | Fired when the center content area is tapped. |

---

## Theme

Defined in `packages/core/src/theme/definitions/swipe-cell.ts`:

### `slots`

- `root`: `"relative overflow-hidden w-full select-none touch-pan-y box-border"`
- `wrapper`: `"relative flex flex-row w-full transition-transform duration-300 ease-out will-change-transform box-border"`
- `content`: `"relative z-10 w-full shrink-0 bg-default box-border"`
- `left`: `"absolute left-0 top-0 bottom-0 z-0 flex flex-row h-full -translate-x-full box-border"`
- `right`: `"absolute right-0 top-0 bottom-0 z-0 flex flex-row h-full translate-x-full box-border"`
- `action`: `"flex flex-row items-center justify-center h-full text-white transition-opacity active:opacity-85 select-none cursor-pointer box-border font-medium"`
- `actionText`: `"font-medium leading-none"`
- `actionIcon`: `"shrink-0"`

### `variants`

- **`variant`**:
  - `plain`: `root: ""`, `content: "bg-default"`
  - `outline`: `root: "border border-default rounded-md overflow-hidden shadow-xs"`, `content: "bg-default"`
  - `subtle`: `root: "border border-default rounded-md overflow-hidden bg-muted"`, `content: "bg-muted"`
  - `soft`: `root: "rounded-md overflow-hidden bg-elevated"`, `content: "bg-elevated"`
  - `separated`: `root: "rounded-md border border-default shadow-xs overflow-hidden"`, `content: "bg-default"`
- **`size`**:
  - `xs`: `action: "px-2.5 text-xs gap-1"`, `actionText: "text-xs"`, `actionIcon: "size-3.5"`
  - `sm`: `action: "px-3 text-xs gap-1.5"`, `actionText: "text-xs"`, `actionIcon: "size-3.5"`
  - `md`: `action: "px-4 text-sm gap-2"`, `actionText: "text-sm"`, `actionIcon: "size-4"`
  - `lg`: `action: "px-5 text-base gap-2"`, `actionText: "text-base"`, `actionIcon: "size-5"`
  - `xl`: `action: "px-6 text-lg gap-2.5"`, `actionText: "text-lg"`, `actionIcon: "size-6"`
- **`disabled`**:
  - `true`: `root: "opacity-60 pointer-events-none"`
  - `false`: `{}`

### `defaultVariants`

- `variant`: `"plain"`
- `size`: `"md"`
- `disabled`: `false`

---

## Examples

### WXML

```xml
<!-- Data-driven actions -->
<c-swipe-cell
  id="cell"
  variant="outline"
  size="md"
  right="{{rightActions}}"
>
  <view class="p-4">Swipe left to reveal actions</view>
</c-swipe-cell>

<!-- Custom slot actions -->
<c-swipe-cell variant="plain" leftWidth="{{80}}" rightWidth="{{120}}">
  <view slot="left" class="h-full px-4 flex items-center bg-primary text-white">Pin</view>
  <view class="p-4">Custom slot content</view>
  <view slot="right" class="h-full px-4 flex items-center bg-error text-white">Delete</view>
</c-swipe-cell>
```

### TypeScript (Page / Component)

```ts
Page({
  data: {
    rightActions: [
      { value: "archive", text: "Archive", style: "background-color: #64748b;" },
      { value: "delete", text: "Delete", icon: "trash", style: "background-color: #ef4444;" },
    ],
  },

  openRight() {
    const cell = this.selectComponent("#cell");
    cell?.open("right");
  },

  closeCell() {
    const cell = this.selectComponent("#cell");
    cell?.close();
  },
});
```
