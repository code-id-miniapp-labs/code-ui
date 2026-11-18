# Radio (`c-radio`)

## Overview & Tier

`c-radio` is a single radio selection control that can be used standalone or as an item inside `c-radio-group`. It supports controlled/uncontrolled checked state, disabled/read-only/invalid states, `outline` and `card` variants, theme colors and sizes, and customizable slots.

- **Architecture Tier**: **Tier 3 (Domain)** — uses `createMachineBehavior` with `radioMachine` (`@code-id-labs/radio`) and the domain relation plugin `withRadioItem()` from `@code-id-labs/miniapp/behaviors/radio`.
- **Related Components**:
  - **Parent**: `c-radio-group` (via `withRadioItem()`, inheriting `groupSize`, `groupColor`, `groupVariant`, and group selection context).

---

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `""` | Value associated with the radio item (used to match against parent group selection and change details). |
| `checked` | `boolean \| null` | `null` | Controlled checked state. When `null`, state is managed by the parent group or `defaultChecked`. |
| `defaultChecked` | `boolean` | `false` | Initial checked state when uncontrolled. |
| `disabled` | `boolean` | `false` | Disables user interaction and applies disabled styling/ARIA state. |
| `readOnly` | `boolean` | `false` | Prevents changing the checked state on tap while remaining focusable/readable. |
| `invalid` | `boolean \| null` | `null` | Marks the radio as invalid and applies error styling/ARIA state. |
| `color` | `RadioColor` (`"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"`) | `""` | Theme color override. Falls back to parent `groupColor`, then `"primary"`. |
| `size` | `RadioSize` (`"xs" \| "sm" \| "md" \| "lg" \| "xl"`) | `""` | Size override. Falls back to parent `groupSize`, then `"md"`. |
| `variant` | `RadioVariant` (`"outline" \| "card"`) | `""` | Visual variant override. Falls back to parent `groupVariant`, then `"outline"`. |
| `label` | `string` | `""` | Text label displayed next to the radio control. Takes precedence over the `label` slot. |
| `description` | `string` | `""` | Secondary description text displayed below the label. Takes precedence over the `description` slot. |
| `ui` | `RadioUI` (`Partial<Record<"root" \| "base" \| "indicator" \| "wrapper" \| "label" \| "description", string>>`) | `{}` | Per-slot class overrides merged with the resolved theme classes. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (defined as `className` in component `properties`; no separate `class` prop is defined). |

---

## Slots

WeChat MiniProgram `<slot>` elements are static and do not support fallback content inside `<slot>...</slot>`. `c-radio` uses active slot detection (`slots` property flags) and conditional `wx:if` / `wx:elif` rendering:

| Slot | Behavior & Constraints |
| :--- | :--- |
| `indicator` | Replaces the inner radio dot inside `base`. Because MiniProgram slots have no fallback content, the default indicator `<view>` is conditionally rendered via `wx:if="{{!slots.indicator}}"`. |
| `label` | Custom label content inside `wrapper`. Rendered via `wx:elif="{{slots.label}}"` only when the `label` prop is empty. |
| `description` | Custom description content inside `wrapper`. Rendered via `wx:elif="{{slots.description}}"` only when the `description` prop is empty. |
| *(default)* | Rendered via `<slot wx:else />` only when none of `label`, `description`, `slots.label`, or `slots.description` are truthy. |

---

## Events

- **None** directly triggered via `triggerEvent` in `packages/components/src/runtime/radio/index.ts`.
  - Tapping the component (`bind:tap="handleTap"`) forwards directly to the machine API's `handleTap()`.
  - When used within `c-radio-group`, selection updates are coordinated with the parent group via `withRadioItem()`.
  - At the machine level (`RadioProps`), `onChange` accepts a callback receiving `{ value: string; checked: boolean }`.

---

## Theme

Defined in `packages/core/src/theme/definitions/radio.ts`:

- **Slots**: `root`, `base`, `indicator`, `wrapper`, `label`, `description`
- **Variants**:
  - `variant`: `"outline"`, `"card"`
  - `color`: configured `DEFAULT_THEME_COLORS` (including `"primary"`, `"danger"`, `"success"`, `"warning"`, `"info"`, etc.) and `"neutral"`
  - `size`: `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`
  - `checked`: `true`, `false`
  - `disabled`: `true`, `false`
  - `invalid`: `true`, `false`
- **Default Variants**:
  - `variant`: `"outline"`
  - `color`: `"primary"`
  - `size`: `"md"`
  - `checked`: `false`
  - `disabled`: `false`
  - `invalid`: `false`

---

## Examples

### WXML

```xml
<!-- Basic usage with label and description -->
<c-radio
  value="pro"
  label="Pro Plan"
  description="Includes unlimited projects and priority support."
  variant="card"
  color="primary"
  size="md"
/>

<!-- Controlled standalone usage with custom slot classes -->
<c-radio
  value="agree"
  checked="{{isSelected}}"
  label="Accept terms"
  ui="{{ { label: 'font-semibold' } }}"
  className="my-2"
/>

<!-- Custom default slot content -->
<c-radio value="custom">
  <view class="text-sm">Custom inline label content</view>
</c-radio>
```

### TypeScript (Page / Component)

```ts
Page({
  data: {
    isSelected: false,
  },
});
```
