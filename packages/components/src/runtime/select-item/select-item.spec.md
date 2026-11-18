# `c-select-item` (`select-item`)

## Overview & Tier

`c-select-item` renders an individual option, group label, or visual separator inside a `c-select` dropdown menu. It supports leading/trailing icons, primary label and secondary description text, selected-state indicators, disabled state styling, and per-slot theme overrides.

- **Architecture Tier**: **Tier 3 — Domain**
  - Uses `computedBehavior` + `createComponentOptions` (`../_shared/base`), `createMachineBehavior` (`../_shared/machine`), `@code-id-labs/select-item`, and the domain relation plugin `withSelectItem()` from `@code-id-labs/miniapp/behaviors/select`.
- **Compound Relationship**: Child item component designed to be paired with parent `c-select` (both declaratively via `<slot />` and in data-driven `wx:for` lists).

---

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number` | `""` | Option value identifier used for selection matching. |
| `type` | `"item" \| "label" \| "separator"` | `"item"` | Item kind: interactive option (`"item"`), non-interactive group heading (`"label"`), or divider line (`"separator"`). |
| `label` | `string` | `""` | Primary option text (when `type === "item"`) or heading text (when `type === "label"`). |
| `description` | `string` | `""` | Secondary descriptive text rendered below `label` for `"item"` entries. |
| `icon` | `string` | `""` | Leading icon name rendered via `c-icon` when the `leading` slot is not provided. |
| `trailingIcon` | `string` | `""` | Trailing icon name rendered via `c-icon` when selected and no `trailing` slot is provided. Falls back to parent `groupSelectedIcon`, then `"check"`. |
| `color` | `SelectItemColor` (`string`) | `""` | Theme color token (e.g. `"primary"`, `"neutral"`, etc.). Falls back to parent `groupColor`, then `"primary"`. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Size variant. Falls back to parent `groupSize`, then `"md"`. |
| `disabled` | `boolean` | `false` | Disables interaction and applies disabled styling when `true`. |
| `selected` | `boolean \| null` | `null` | Direct selected state override when used standalone or overriding parent selection state. |
| `index` | `number \| null` | `null` | Explicit item index override. |
| `managed` | `boolean` | `false` | Internal flag indicating the item is rendered by parent `c-select` via `wx:for`. |
| `ui` | `Record<string, string>` | `{}` | Per-slot utility class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (declared as `className` in `index.ts`; `class` is not separately declared). |

---

## Slots

Because WeChat MiniProgram `<slot>` elements are static (no fallback content inside `<slot>...</slot>` and no scoped slot props), `c-select-item` uses conditional `wx:if` / `wx:elif` / `wx:else` branches paired with boolean `slots` flags:

- **`default` (unnamed slot)**: Rendered inside the `wrapper` container when `slots.default` is enabled. When provided, it replaces both the `label` and `description` props/slots.
- **`label`**:
  - When `type === "label"`: Renders `label` prop if non-empty, otherwise renders `<slot name="label" />`.
  - When `type === "item"` (and `slots.default` is not used): Renders `label` prop if non-empty, otherwise renders `<slot name="label" />` when `slots.label` is enabled.
- **`description`**:
  - When `type === "item"` (and `slots.default` is not used): Renders `description` prop if non-empty, otherwise renders `<slot name="description" />` when `slots.description` is enabled.
- **`leading`**: Rendered inside the `leading` container. Uses `<slot name="leading" />` when `slots.leading` is enabled; otherwise falls back to `<c-icon name="{{icon}}" />` when `icon` is non-empty.
- **`trailing`**: Rendered inside the `trailing` container when `slots.trailing` is enabled or the item is selected. Uses `<slot name="trailing" />` when `slots.trailing` is enabled; otherwise falls back to `<c-icon name="{{resolvedTrailingIcon}}" />` when selected.
- **Note**: When `type === "separator"`, no slots are rendered.

---

## Events

**None.**

`c-select-item` does not emit custom `bind:*` events directly. Tapping an interactive item (`catchtap="handleTap"`) triggers selection internally and propagates through the `withSelectItem()` relation to the parent `c-select` component.

---

## Theme

Defined in `packages/core/src/theme/definitions/select-item.ts`:

### `slots`

- `root` — Outer container (`w-full`)
- `base` — Interactive option row (`flex items-center`, cursor/active styles)
- `leading` — Leading icon/slot wrapper
- `leadingIcon` — Leading `<c-icon>` styling
- `wrapper` — Content column wrapping default slot or `label` + `description`
- `label` — Primary option text
- `description` — Secondary description text
- `trailing` — Trailing icon/slot wrapper
- `trailingIcon` — Trailing `<c-icon>` styling
- `groupLabel` — Heading text when `type === "label"`
- `separator` — Divider line when `type === "separator"`

### `variants`

- **`color`**: All `DEFAULT_THEME_COLORS` (or configured `options.colors`) plus `"neutral"`
- **`size`**: `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`
- **`selected`**: `true`, `false`
- **`disabled`**: `true`, `false`

### `compoundVariants`

- `color` (any configured theme color) + `selected: true`: sets `trailingIcon` to `text-${color}`
- `color: "neutral"` + `selected: true`: sets `trailingIcon` to `text-highlighted`

### `defaultVariants`

- `color`: `"primary"`
- `size`: `"md"`
- `selected`: `false`
- `disabled`: `false`

---

## Examples

### WXML

```xml
<!-- Declarative compound usage inside c-select -->
<c-select value="{{selectedFruit}}" placeholder="Pick a fruit" bind:change="onFruitChange">
  <c-select-item type="label" label="Citrus" />
  <c-select-item
    value="orange"
    label="Orange"
    description="Sweet and tangy"
    icon="sun"
  />
  <c-select-item
    value="lemon"
    label="Lemon"
    disabled="{{true}}"
  />

  <c-select-item type="separator" />

  <c-select-item type="label" label="Berries" />
  <c-select-item
    value="strawberry"
    label="Strawberry"
    ui="{{ { label: 'font-semibold' } }}"
    className="my-custom-item"
  />
</c-select>

<!-- Custom slots -->
<c-select value="{{selectedUser}}" bind:change="onUserChange">
  <c-select-item value="u1" slots="{{ { default: true, leading: true, trailing: true } }}">
    <c-avatar slot="leading" size="xs" text="AJ" />
    <view class="flex flex-col">
      <text class="text-sm font-medium">Alex Johnson</text>
      <text class="text-xs text-muted">alex@example.com</text>
    </view>
    <text slot="trailing" class="text-xs text-primary">Selected</text>
  </c-select-item>
</c-select>
```

### Page TS

```ts
Page({
  data: {
    selectedFruit: "orange",
    selectedUser: "u1",
  },

  onFruitChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ selectedFruit: e.detail.value });
  },

  onUserChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ selectedUser: e.detail.value });
  },
});
```
