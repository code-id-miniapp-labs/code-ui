# `c-popover` (`popover`)

## Overview & Tier

- **Purpose**: Anchored floating menu / popover surface positioned relative to a trigger element, with collision handling, optional directional arrow, optional `<root-portal>` rendering, backdrop dismissal, and enter/exit visibility transitions.
- **Architecture Tier**: **Tier 2 — Interactive / Stateful**
  - State machine & connect layer: `@code-ui/popover` (`packages/machines/popover`)
  - Theme definition: `packages/core/src/theme/definitions/popover.ts`
  - MiniProgram runtime: `packages/components/src/runtime/popover` (`../_shared/base` + `../_shared/machine`, plus `createAppThemeBehavior` from `@code-ui/miniapp/behaviors/theme` for portal theme CSS variables)
- **Compound Structure**: Standalone component (no parent/child relation components). Exposes its machine API on the component instance (`exportApi: true` under key `"popover"`).

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean \| null` | `null` | Controlled open state (`null` uses uncontrolled internal state). |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled (`open === null`). |
| `disabled` | `boolean` | `false` | Disables trigger interaction. |
| `closeOnBackdropClick` | `boolean` | `true` | Whether tapping the backdrop closes the menu. |
| `triggerMode` | `"manual" \| "tap"` | `"manual"` | `"tap"` toggles the menu automatically on trigger tap; `"manual"` lets the parent control open state. |
| `portal` | `boolean` | `false` | Renders the floating layer inside WeChat `<root-portal>` and applies app theme CSS variables/mode on the portal wrapper. |
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
| `ui` | `PopoverUI` (`Record<string, string>`) | `{}` | Per-slot Tailwind/utility class overrides (`root`, `trigger`, `backdrop`, `positioner`, `content`, `arrow`). |
| `className` | `string` | `""` | Additional class string merged onto the `root` slot (note: `popover` declares `className` rather than `class` in its runtime `properties`). |

## Slots

`index.ts` declares single (non-multiple) slots `slots: { default: false, trigger: false }`.

| Slot | Placement | Behavior & Constraints |
| --- | --- | --- |
| `trigger` | `<view data-part="trigger" bindtap="handleTriggerTap">` | Anchor element that receives tap events (`handleTriggerTap`). No fallback content is rendered if omitted. |
| *(default)* | Inside `<root-portal enable="{{portal}}">` → `positioner` → `content` | Menu body content, wrapped in an `overflow-hidden` container inheriting `max-height`, `border-radius`, and `background-color`. No fallback content is rendered if omitted. |

**MiniProgram Static `<slot>` Notes**:
- WeChat `<slot>` does not support scoped slots or fallback default content inside `<slot>...</slot>`.
- The floating wrapper uses `hidden="{{!popover.visible}}"` and `display:none;` when not visible (rather than `wx:if`), keeping slotted content mounted while hidden and preserving portal CSS variables when `portal` is enabled.

## Events

`index.ts` does not call `this.triggerEvent(...)` directly; instead, lifecycle/interaction callbacks are modeled in `PopoverProps` and forwarded through the machine behavior:

| Callback Prop | Payload | Description |
| --- | --- | --- |
| `onOpenChange` | `{ open: boolean }` | Fired when the menu open state changes. |
| `onOpen` | `void` | Fired when the menu opens. |
| `onClose` | `void` | Fired when the menu closes. |
| `onBackdropTap` | `void` | Fired when the backdrop is tapped (`catchtap="handleBackdropTap"`). |

## Theme

Defined in `packages/core/src/theme/definitions/popover.ts`:

- **Slots**:
  - `root`: `"relative w-full"`
  - `trigger`: `"relative w-full"`
  - `backdrop`: `"fixed inset-0 z-40 bg-transparent"`
  - `positioner`: `"z-50 box-border"`
  - `content`: `"relative w-full rounded-md bg-default text-default shadow-lg ring-1 ring-default box-border transition-all duration-150 ease-out"`
  - `arrow`: `"absolute w-2.5 h-2.5 bg-default border-default pointer-events-none"`
- **Variants**:
  - `portal`: `true` (`positioner: "fixed"`) | `false` (`positioner: "absolute"`)
  - `open`: `true` (`backdrop: "pointer-events-auto"`, `content: "opacity-100 scale-100 pointer-events-auto"`) | `false` (`backdrop: "pointer-events-none"`, `content: "opacity-0 scale-95 pointer-events-none"`)
  - `visible`: `true` (`root: "z-50"`, `trigger: "z-50"`) | `false` (`{}`)
  - `side`: `"bottom"` (`arrow: "border-t border-l"`) | `"top"` (`arrow: "border-b border-r"`)
- **Default Variants**:
  - `portal: false`
  - `open: false`
  - `visible: false`
  - `side: "bottom"`

## Examples

### WXML

```xml
<!-- Uncontrolled tap-to-toggle floating menu rendered in root-portal -->
<c-popover
  id="actions-menu"
  triggerMode="tap"
  portal="{{true}}"
  arrow="{{true}}"
  side="bottom"
  align="end"
  ui="{{ { content: 'p-1' } }}"
>
  <view slot="trigger" class="px-3 py-2 rounded-md border">
    Open Menu
  </view>

  <view class="py-1">
    <view class="px-3 py-2" bindtap="onSelectOption" data-value="edit">Edit</view>
    <view class="px-3 py-2" bindtap="onSelectOption" data-value="delete">Delete</view>
  </view>
</c-popover>
```

### TypeScript (Page / Parent Component)

```ts
Page({
  onSelectOption(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value;
    const menu = this.selectComponent("#actions-menu");
    // When exportApi is enabled, the machine API is accessible on the component instance
    menu?.popover?.closeMenu?.();
    console.log("Selected:", value);
  },
});
```
