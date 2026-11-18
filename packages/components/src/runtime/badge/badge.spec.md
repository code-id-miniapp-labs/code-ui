# Badge (`c-badge`)

## Overview & Tier

- **Purpose**: A compact visual indicator used to display status, counts, tags, or short labels, optionally accompanied by leading and trailing slot content.
- **Architecture Tier**: **Tier 1 — Presentational** (uses `computedBehavior` and `createComponentOptions` from `../_shared/base`; no FSM machine in `packages/machines/`).
- **Compound Relations**: None (standalone component).

---

## Props

Defined in `packages/components/src/runtime/badge/index.ts`:

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot (`root`, `text`, `leading`, `trailing`). |
| `className` | `String` | `""` | Custom classes merged onto the `root` slot (defined as `className` in `properties`; `class` is not separately declared in `properties`). |
| `color` | `String` | `"primary"` | Color variant (`DEFAULT_THEME_COLORS` from theme options, plus `"neutral"`). |
| `size` | `String` | `"md"` | Size variant (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). |
| `variant` | `String` | `"solid"` | Visual style variant (`"solid"`, `"outline"`, `"soft"`). |
| `label` | `String` | `""` | Text content rendered inside the `text` slot container. |

---

## Slots

Defined in `packages/components/src/runtime/badge/index.ts` (`slots: { default: false, leading: false, trailing: false }`) and `packages/components/src/runtime/badge/index.wxml`:

| Slot | Wrapper / Condition | Description |
| :--- | :--- | :--- |
| *(default)* | `<view class="{{classes.text}}">` (always rendered) | Custom inner content rendered alongside `{{label}}`. |
| `leading` | `<view wx:if="{{slots.leading}}" class="{{classes.leading}}">` | Leading content (e.g. an icon or dot) rendered before `text`. |
| `trailing` | `<view wx:if="{{slots.trailing}}" class="{{classes.trailing}}">` | Trailing content (e.g. an icon) rendered after `text`. |

### MiniProgram `<slot>` Constraints

- **Static slots only**: WeChat MiniProgram does not support scoped slots or dynamic data injection into slot content.
- **No `<slot>` fallback markup**: Default content nested inside `<slot>...</slot>` is ignored by MiniProgram. In `index.wxml`, `{{label}}` is rendered next to `<slot />` rather than inside it (without a `wx:if` guard, both render if both `label` and default slot content are supplied).
- **Conditional wrappers**: `leading` and `trailing` wrappers are conditionally mounted via `wx:if="{{slots.leading}}"` and `wx:if="{{slots.trailing}}"` (with `slots` declared in `index.ts` with `false` defaults).

---

## Events

None. `c-badge` is a non-interactive presentational component and does not emit any `bind:*` custom events.

---

## Theme

Defined in `packages/core/src/theme/definitions/badge.ts`:

### Slots

- `root`: `"flex items-center justify-center rounded-full font-medium leading-none whitespace-nowrap"`
- `text`: `"text-xs"`
- `leading`: `"shrink-0"`
- `trailing`: `"shrink-0"`

### Variants

- **`color`**: Dynamic keys from `options.colors ?? DEFAULT_THEME_COLORS`, plus `"neutral"`.
- **`size`**: `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"` (adjusts `root` padding/gap/radius and `text` font size).
- **`variant`**:
  - `"solid"`: `root` gets `"text-white"` and `bg-<color>` (via `compoundVariants`).
  - `"outline"`: `root` gets `"bg-transparent border"` and `border-<color> text-<color>` (via `compoundVariants`).
  - `"soft"`: `root` gets `bg-<color>/20 text-<color>` (via `compoundVariants`).

### Default Variants

- `color`: `"primary"`
- `size`: `"md"`
- `variant`: `"solid"`

---

## Examples

### WXML

```xml
<!-- Basic label badge -->
<c-badge label="New" />

<!-- Variants, colors, and sizes -->
<c-badge label="Verified" color="success" variant="soft" size="sm" />
<c-badge label="Beta" color="neutral" variant="outline" size="xs" />

<!-- With leading/trailing slots and custom ui overrides -->
<c-badge
  label="Alert"
  color="warning"
  variant="solid"
  className="ml-2"
  ui="{{ { root: 'px-3', text: 'font-bold' } }}"
>
  <c-icon slot="leading" name="alert-circle" />
</c-badge>

<!-- Using default slot instead of label -->
<c-badge color="primary" variant="soft">
  <text>99+</text>
</c-badge>
```

### Page / Component TS

```ts
Page({
  data: {
    badgeUi: {
      root: "px-3",
      text: "font-bold",
    },
  },
});
```
