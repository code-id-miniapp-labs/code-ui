# Stepper Item (`c-stepper-item`)

## Overview & Tier

- **Purpose**: Renders an individual step inside a `<c-stepper>` sequence, displaying a clickable step indicator (step number, icon, completed icon, or custom slot), title, description, extra content, and a connecting separator line.
- **Architecture Tier**: **Tier 3 Domain** (stateful child component backed by `@code-ui/stepper-item` FSM + connect layer and linked to `<c-stepper>` via `withStepperItem()` from `@code-ui/miniapp/behaviors/stepper`).
- **Related Components**: Parent `<c-stepper>` (provides step state, count, linear mode, orientation, color, and size context via component relations).

---

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `String` | `""` | Step title text. When non-empty, renders the built-in title element instead of the `title` slot. |
| `description` | `String` | `""` | Step description text. When non-empty, renders the built-in description element instead of the `description` slot. |
| `icon` | `String` | `""` | `<c-icon>` name shown in the indicator when incomplete/current and no `indicator` slot is provided. |
| `completedIcon` | `String` | `"check"` | `<c-icon>` name shown in the indicator when completed and no `completed-indicator` slot is provided. |
| `index` | `Number \| null` | `null` | Explicit 0-based step index override. Automatically assigned by `<c-stepper>` relations when omitted. |
| `value` | `String \| Number` | `""` | Custom step identifier. Falls back to the resolved `index` if empty. |
| `disabled` | `Boolean` | `false` | Disables interaction on this step item. |
| `completed` | `Boolean \| null` | `null` | Explicit completion override (`true` / `false`). |
| `status` | `String` | `""` | Explicit status override: `"completed"`, `"current"`, `"upcoming"`, or `"disabled"`. |
| `isLast` | `Boolean \| null` | `null` | Explicit override indicating the final step (hides the connecting separator). |
| `orientation` | `String` | `""` | Layout orientation override (`"horizontal"` or `"vertical"`). Falls back to parent orientation or `"horizontal"`. |
| `color` | `String` | `""` | Semantic color override. Falls back to parent color or `"primary"`. |
| `size` | `String` | `""` | Size override (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). Falls back to parent size or `"md"`. |
| `variant` | `String` | `""` | Variant property (accepted on the component; currently unused by the `stepper-item` theme). |
| `stepperId` | `String` | `""` | Parent stepper ID used for DOM element IDs (typically injected by parent relations). |
| `ui` | `Object` | `{}` | Per-slot Tailwind class overrides keyed by theme slot name. |
| `class` / `className` | `String` | `""` | Additional CSS classes merged onto the `root` slot (`class` maps to `className` via `createComponentOptions`). |

---

## Slots

WeChat MiniProgram `<slot>` is static and does not support scoped slots or fallback children inside `<slot>...</slot>`. Default content is therefore controlled via `wx:if` / `wx:else` and active slot detection (`slots.indicator`, `slots.completedIndicator`):

| Slot | Behavior |
| :--- | :--- |
| `completed-indicator` | Rendered inside `indicator` when the step is completed. When omitted (`!slots.completedIndicator`), falls back to `<c-icon name="{{completedIcon}}" />`. |
| `indicator` | Rendered inside `indicator` when the step is not completed. When omitted (`!slots.indicator`), falls back to `<c-icon name="{{icon}}" />` if `icon` is set, or the 1-based step number (`index + 1`). |
| `title` | Rendered inside `wrapper` only when the `title` prop is empty (`wx:else`). Setting the `title` prop suppresses this slot. |
| `description` | Rendered inside `wrapper` only when the `description` prop is empty (`wx:else`). Setting the `description` prop suppresses this slot. |
| `default` | Additional custom content rendered at the end of `wrapper` below the title and description. |

---

## Events

None (`<c-stepper-item>` does not emit custom `bind:*` events via `triggerEvent`; taps on `trigger` or `wrapper` are caught internally with `catch:tap="handleTap"` and forwarded to the machine and parent `<c-stepper>`).

---

## Theme

Defined in `packages/core/src/theme/definitions/stepper-item.ts` (`virtual:cui/theme/stepper-item`).

- **Slots**: `root`, `container`, `trigger`, `indicator`, `icon`, `separator`, `wrapper`, `title`, `description`
- **Variants**:
  - `orientation`: `"horizontal"`, `"vertical"`
  - `size`: `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`
  - `color`: Theme palette colors from `DEFAULT_THEME_COLORS` (e.g., `"primary"`, `"secondary"`, `"success"`, `"info"`, `"warning"`, `"error"`) plus `"neutral"`
  - `disabled`: `true`, `false`
- **Compound Variants**: `orientation` × `size` (adjusts `separator` positioning and `wrapper` spacing across all 5 sizes for both `"horizontal"` and `"vertical"`).
- **Default Variants**:
  - `orientation`: `"horizontal"`
  - `color`: `"primary"`
  - `size`: `"md"`
  - `disabled`: `false`

---

## Examples

### WXML

```xml
<c-stepper step="{{currentStep}}" bind:change="onStepChange">
  <c-stepper-item
    title="Account"
    description="Create your credentials"
    icon="user"
  />
  <c-stepper-item description="Verify identity">
    <view slot="title" class="text-xs font-semibold">Security</view>
    <text slot="indicator">!</text>
    <text slot="completed-indicator">OK</text>
  </c-stepper-item>
  <c-stepper-item
    title="Confirm"
    description="Review and submit"
    disabled="{{!canConfirm}}"
    ui="{{ { title: 'font-bold' } }}"
    class="px-1"
  >
    <view class="text-2xs text-dimmed mt-1">Optional summary note</view>
  </c-stepper-item>
</c-stepper>
```

### TS

```ts
Page({
  data: {
    currentStep: 0,
    canConfirm: true,
  },
  onStepChange(e: WechatMiniprogram.CustomEvent<{ step: number }>) {
    this.setData({ currentStep: e.detail.step });
  },
});
```
