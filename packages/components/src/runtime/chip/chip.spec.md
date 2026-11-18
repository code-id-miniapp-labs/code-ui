# Chip (`c-chip`)

## Overview & Tier

`c-chip` is a small badge, dot indicator, or counter overlay used to annotate anchor content (such as an icon, avatar, or button) or render inline as a standalone indicator.

- **Architecture Tier**: **Tier 1 — Presentational**
  - Uses only `computedBehavior` and `createComponentOptions` from `../_shared/base` (no FSM machine in `packages/machines/`).
- **Compound Components**: None. `c-chip` is a standalone wrapper component that projects arbitrary anchor content into its default slot.

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string \| number` | `""` | Text or number rendered inside the chip badge. When `text` is non-empty (`!== ""`, `undefined`, `null`), it takes precedence over the `content` slot. |
| `color` | `string` | `"primary"` | Color variant applied to the `base` badge (`DEFAULT_THEME_COLORS` or `"neutral"`). |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Controls the dimensions, font size, and horizontal padding of the `base` badge. |
| `position` | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` | `"top-right"` | Corner placement of the `base` badge relative to `root` when `standalone` is `false`. |
| `inset` | `boolean` | `false` | When `true` and `standalone` is `false`, keeps the badge inside the corner boundary instead of translating it outward by 50%. |
| `standalone` | `boolean` | `false` | When `true`, renders `base` with `relative` positioning inline instead of `absolute` overlay positioning. |
| `show` | `boolean` | `true` | Controls whether the `base` badge is rendered (`wx:if="{{ show }}"`). The default slot anchor content remains visible when `false`. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by slot name (`root`, `base`). |
| `className` | `string` | `""` | Custom class string forwarded as the `class` override to `resolveSlots` for the `root` slot (note: `chip/index.ts` declares this property as `className` rather than `class`). |

## Slots

| Name | Description |
| --- | --- |
| `default` | Anchor element(s) wrapped by the `root` `<view>` (always rendered regardless of `show`). |
| `content` | Custom content rendered inside the `base` badge when `text` is empty (`""`, `undefined`, or `null`). |

**MiniProgram Static Slot Notes**:
- Both `default` and `content` are declared as non-scoped static slots (`slots: { default: false, content: false }`).
- Because WeChat `<slot>` does not support inline fallback markup, `index.wxml` uses conditional rendering (`<text wx:if="{{ text !== '' && text !== undefined && text !== null }}">{{ text }}</text><slot wx:else name="content" />`). Providing any non-empty `text` (including `0`) prevents the `content` slot from rendering.

## Events

None.

## Theme

Defined in `packages/core/src/theme/definitions/chip.ts`:

### `slots`
- `root`: `"relative inline-flex items-center justify-center shrink-0"`
- `base`: `"rounded-full ring-2 ring-bg flex items-center justify-center text-white font-medium leading-none whitespace-nowrap"`

### `variants`
- `color`: All colors in `options.colors ?? DEFAULT_THEME_COLORS`, plus `"neutral"` (resolved via `compoundVariants` to `bg-<color>` / `bg-neutral` on `base`).
- `size`:
  - `xs`: `{ base: "h-1.5 min-w-1.5 text-[6px]" }`
  - `sm`: `{ base: "h-2 min-w-2 text-[7px]" }`
  - `md`: `{ base: "h-3 min-w-3 text-[8px] px-1" }`
  - `lg`: `{ base: "h-3.5 min-w-3.5 text-[9px] px-1" }`
  - `xl`: `{ base: "h-4 min-w-4 text-[10px] px-1.5" }`
- `position`:
  - `"top-right"`: `{ base: "top-0 right-0" }`
  - `"bottom-right"`: `{ base: "bottom-0 right-0" }`
  - `"top-left"`: `{ base: "top-0 left-0" }`
  - `"bottom-left"`: `{ base: "bottom-0 left-0" }`
- `inset`:
  - `true` / `false`: Combined with `position` and `standalone: false` in `compoundVariants`; `inset: false` applies `±translate-y-1/2 ±translate-x-1/2 transform` to `base`.
- `standalone`:
  - `true`: `{ base: "relative" }`
  - `false`: `{ base: "absolute" }`

### `defaultVariants`
- `size`: `"md"`
- `color`: `"primary"`
- `position`: `"top-right"`
- `inset`: `false`
- `standalone`: `false`

## Examples

### WXML

```xml
<!-- Counter chip anchored to a button/avatar -->
<c-chip text="{{ unreadCount }}" color="error" size="md" position="top-right">
  <c-button label="Inbox" />
</c-chip>

<!-- Inset dot indicator -->
<c-chip color="success" size="sm" inset="{{ true }}" show="{{ isOnline }}">
  <view class="w-10 h-10 rounded-full bg-neutral-200" />
</c-chip>

<!-- Standalone chip with custom content slot and ui overrides -->
<c-chip standalone="{{ true }}" color="neutral" ui="{{ chipUi }}" className="ml-2">
  <view slot="content">NEW</view>
</c-chip>
```

### Page / Component TS

```ts
Page({
  data: {
    unreadCount: 5,
    isOnline: true,
    chipUi: {
      base: "px-2 text-xs",
    },
  },
});
```
