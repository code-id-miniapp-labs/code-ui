# `c-input-menu-item` (`input-menu-item`)

## Overview & Tier

- **Purpose**: Renders a single option, group heading (`type="label"`), or divider (`type="separator"`) inside an input menu, supporting leading/trailing icons, label/description text, custom slots, and selection coordination.
- **Architecture Tier**: **Tier 3 — Domain / Stateful** (uses `@code-ui/input-menu-item` machine via `createMachineBehavior` and the `withInputMenuItem` relation plugin from `@code-ui/miniapp/behaviors/input-menu`).
- **Compound Relationships**: Child component of `c-input-menu`. Inherits `color`, `size`, and selected icon defaults from its parent `c-input-menu` when not explicitly overridden on the item.

---

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string \| number` | `""` | Option value identifier used for selection matching. |
| `type` | `'item' \| 'label' \| 'separator'` | `"item"` | Item kind: interactive option (`'item'`), group heading (`'label'`), or divider (`'separator'`). |
| `label` | `string` | `""` | Primary option text (or heading text when `type="label"`). |
| `description` | `string` | `""` | Secondary descriptive text rendered below `label` when `type="item"`. |
| `icon` | `string` | `""` | Leading `<c-icon>` name rendered when no `leading` slot is provided. |
| `trailingIcon` | `string` | `""` | Trailing `<c-icon>` name shown when selected; falls back to parent `groupSelectedIcon` or `"check"`. |
| `color` | `string` | `""` | Theme color variant override; falls back to parent `groupColor` or `"primary"`. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| ''` | `""` | Size variant override; falls back to parent `groupSize` or `"md"`. |
| `disabled` | `boolean` | `false` | Disables interaction and applies disabled styling. |
| `selected` | `boolean \| null` | `null` | Direct selected state override. When `null`, selection is controlled by the parent `c-input-menu`. |
| `index` | `number \| null` | `null` | Explicit item index override. |
| `managed` | `boolean` | `false` | Internal flag indicating the item is rendered by parent `wx:for`. |
| `ui` | `Record<string, string>` | `{}` | Per-instance class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional CSS classes merged onto the `root` slot (acts as the component's `class` override property). |

> **Internal / Parent-Injected Props**: `id`, `ids`, `inputMenuId`, `groupContext`, and `groupIndex` are defined on the machine props for parent-child synchronization via `withInputMenuItem`.

---

## Slots

All slots are registered in the component `slots` map for active-slot detection (`slots.*`). Because WeChat MiniProgram `<slot>` elements are static and do not render fallback content nested inside `<slot>`, prop-based text/icons and named slots are switched using `wx:if` / `wx:elif` / `wx:else`.

| Slot | Behavior |
| :--- | :--- |
| `default` | Replaces the entire `wrapper` content (both `label` and `description` props/slots) when `type="item"` and `slots.default` is active. |
| `leading` | Replaces the default `<c-icon name="{{icon}}" />` inside the `leading` container (container renders when `slots.leading \|\| icon`). |
| `label` | Custom label content. When `type="label"`, renders only if the `label` prop is empty. When `type="item"`, renders only if `slots.default` is inactive and the `label` prop is empty. |
| `description` | Custom description content when `type="item"`, `slots.default` is inactive, and the `description` prop is empty. |
| `trailing` | Replaces the default selected `<c-icon>` inside the `trailing` container (container renders when `slots.trailing \|\| selected`). |

---

## Events

- **Direct `bind:*` events**: None emitted directly via `triggerEvent` in the runtime component (`index.ts`).
- **Tap & Selection Flow**: Tapping the item (`catchtap="handleTap"`) invokes the machine API's `select()` method, which triggers the machine `onSelect` callback (`{ value: string | number }`) and notifies the parent `c-input-menu` through `withInputMenuItem`.
- **Exposed Method**: `select()` on the component instance programmatically triggers selection.

---

## Theme

Defined in `packages/core/src/theme/definitions/input-menu-item.ts`.

### Slots

- `root` — Outer item container.
- `base` — Interactive option row container (`type="item"`).
- `leading` — Leading icon/slot wrapper.
- `leadingIcon` — Class applied to the default leading `<c-icon>`.
- `wrapper` — Flex column wrapping label/description or default slot.
- `label` — Primary label text.
- `description` — Secondary description text.
- `trailing` — Trailing icon/slot wrapper.
- `trailingIcon` — Class applied to the default selected trailing `<c-icon>`.
- `groupLabel` — Heading container when `type="label"`.
- `separator` — Divider line when `type="separator"`.

### Variants

- `color`: All `DEFAULT_THEME_COLORS` plus `"neutral"` (highlights `trailingIcon` when `selected: true`).
- `size`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`.
- `selected`: `true` | `false`.
- `disabled`: `true` | `false`.

### Default Variants

- `color`: `"primary"`
- `size`: `"md"`
- `selected`: `false`
- `disabled`: `false`

---

## Examples

### Basic Declarative Usage (WXML)

```xml
<c-input-menu value="{{selectedFruit}}" bind:change="onChange">
  <c-input-menu-item type="label" label="Fruits" />
  <c-input-menu-item
    value="apple"
    label="Apple"
    description="Crisp and sweet"
    icon="apple"
  />
  <c-input-menu-item
    value="banana"
    label="Banana"
    disabled="{{true}}"
  />
  <c-input-menu-item type="separator" />
  <c-input-menu-item value="cherry" color="success" size="lg">
    <view slot="leading">🍒</view>
    <text>Custom Cherry Option</text>
    <view slot="trailing">Pick</view>
  </c-input-menu-item>
</c-input-menu>
```

### Page Logic & `ui` Slot Override (TS / WXML)

```ts
Page({
  data: {
    selectedFruit: "apple",
    itemUi: {
      base: "rounded-lg",
      label: "font-semibold",
    },
  },
  onChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ selectedFruit: e.detail.value });
  },
});
```

```xml
<c-input-menu-item
  value="mango"
  label="Mango"
  ui="{{itemUi}}"
  className="my-1"
/>
```
