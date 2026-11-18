# `c-tabs-item`

## Overview & Tier

- **Purpose**: Represents an individual tab in a tabs group, acting either as a tab trigger button (`mode="trigger"`) or as a tab content panel (`mode="auto"` / panel mode).
- **Architecture Tier**: **Tier 3 Domain** (uses FSM in `@code-ui/tabs-item` with `createMachineBehavior` and domain relation plugin `withTabsItem` from `@code-ui/miniapp/behaviors/tabs`).
- **Compound Relationships**: Child component of `c-tabs`. Coordinates selection state, index, and inherited styling props (`orientation`, `variant`, `color`, `size`, `fitted`) with the parent `c-tabs` via `withTabsItem()`.

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number` | `""` | Unique tab value identifier. |
| `disabled` | `boolean` | `false` | Whether the tab item is disabled and non-interactive. |
| `selected` | `boolean \| null` | `null` | Direct selected state override (typically managed by parent `c-tabs`). |
| `triggerId` | `string` | `""` | Explicit DOM `id` for the trigger element. |
| `index` | `number \| null` | `null` | Optional index override among sibling tabs. |
| `mode` | `string` | `"auto"` | Rendering mode: `"trigger"` renders the tab trigger button; any other value (default `"auto"`) renders the tab content panel. |
| `label` | `string` | `""` | Trigger label text. When non-empty, renders `<text>` and takes precedence over the `label` slot. |
| `icon` | `string` | `""` | Leading icon name rendered via `c-icon` in trigger mode. |
| `trailingIcon` | `string` | `""` | Trailing icon name rendered via `c-icon` in trigger mode. |
| `lazy` | `boolean` | `true` | When `true`, panel default slot content is mounted only while the tab is selected. |
| `orientation` | `string` | `""` | Orientation override (`"horizontal"` \| `"vertical"`). Inherits from parent `c-tabs` or falls back to `"horizontal"`. |
| `variant` | `string` | `""` | Visual variant override (`"pill"` \| `"link"`). Inherits from parent `c-tabs` or falls back to `"pill"`. |
| `color` | `string` | `""` | Color theme override (`"neutral"` or configured theme colors such as `"primary"`). Inherits from parent `c-tabs` or falls back to `"primary"`. |
| `size` | `string` | `""` | Size override (`"xs"` \| `"sm"` \| `"md"` \| `"lg"` \| `"xl"`). Inherits from parent `c-tabs` or falls back to `"md"`. |
| `fitted` | `boolean \| null` | `null` | Whether the trigger stretches to fill available space. Inherits boolean value from parent `c-tabs` or falls back to `false`. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Custom CSS class string passed to `resolveSlots` (note: this component defines `className` rather than `class`). |

## Slots

Because WeChat MiniProgram `<slot>` is static (no scoped slots) and silently discards inline fallback markup inside `<slot>fallback</slot>`, `c-tabs-item` uses conditional rendering and mode-specific slot placement:

| Slot | Mode | Behavior |
| --- | --- | --- |
| *(default)* | Panel (`mode !== "trigger"`) | Renders panel content inside `.cui-tabs-item-content`. Mounted only when `isSelected` is `true` or `lazy` is `false`. |
| `leading` | Trigger (`mode === "trigger"`) | Conditionally rendered before the leading icon/label when the `leading` slot is active. |
| `label` | Trigger (`mode === "trigger"`) | Conditional fallback when `label` prop is empty (`<text wx:if="{{label}}">...<slot wx:else name="label" />`). |
| `trailing` | Trigger (`mode === "trigger"`) | Conditionally rendered after the label and before the trailing icon when the `trailing` slot is active. |

## Events

None. `c-tabs-item` does not emit custom `bind:*` events directly; tapping the trigger calls internal `handleTap` -> `select()`, which updates the linked parent `c-tabs`. (It also exposes a `select()` component method.)

## Theme

Defined in `packages/core/src/theme/definitions/tabs-item.ts`:

- **Slots**:
  - `root`
  - `content`
  - `trigger`
  - `triggerInner`
  - `leading`
  - `label`
  - `trailing`
  - `indicator`
- **Variants**:
  - `color`: configured `DEFAULT_THEME_COLORS` (e.g., `primary`, etc.) and `neutral`
  - `variant`: `pill` | `link`
  - `orientation`: `horizontal` | `vertical`
  - `selected`: `true` | `false`
  - `size`: `xs` | `sm` | `md` | `lg` | `xl`
  - `disabled`: `true` | `false`
  - `fitted`: `true` | `false`
- **defaultVariants**:
  - `color`: `"primary"`
  - `variant`: `"pill"`
  - `orientation`: `"horizontal"`
  - `size`: `"md"`
  - `disabled`: `false`
  - `selected`: `false`
  - `fitted`: `false`

## Examples

### WXML

```xml
<c-tabs defaultValue="account">
  <c-tabs-item value="account" label="Account" icon="user">
    <view>Account settings content</view>
  </c-tabs-item>
  <c-tabs-item value="security" lazy="{{false}}" ui="{{ { content: 'p-4' } }}">
    <view slot="label">Security</view>
    <view>Security settings content</view>
  </c-tabs-item>
</c-tabs>
```

### TypeScript

```ts
Page({
  data: {
    activeTab: "account",
  },
});
```
