# Stepper (`c-stepper`)

## Overview & Tier

- **Purpose**: Displays progress through a sequence of numbered or labeled steps in a multi-step workflow, wizard, or timeline. Supports horizontal scrollable auto-slide and vertical layouts, linear progression enforcement, declarative compound children, and data-driven `items` rendering.
- **Architecture Tier**: **Tier 3 Domain** (Interactive stateful component backed by `@code-ui/stepper` and domain relation behavior `withStepper` from `@code-ui/miniapp/behaviors/stepper`).
- **Related Components**:
  - Parent: `<c-stepper>` (`packages/components/src/runtime/stepper/`)
  - Child: `<c-stepper-item>` (`packages/components/src/runtime/stepper-item/`) — coordinated via MiniProgram `relations` in declarative mode or rendered automatically via `wx:for` in data-driven mode.

---

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `step` | `number \| null` | `null` | Controlled active step index (0-based). |
| `value` | `number \| null` | `null` | Controlled active step alias. |
| `modelValue` | `number \| null` | `null` | Controlled two-way binding step alias. |
| `defaultStep` | `number` | `0` | Initial active step index for uncontrolled mode. |
| `count` | `number` | `0` | Total number of steps when not using `items` or linked children. |
| `linkedCount` | `number` | `0` | Dynamically linked child count (managed via parent-child relations). |
| `linkedItems` | `StepperItem[]` | `[]` | Metadata for dynamically linked children (managed via parent-child relations). |
| `items` | `StepperItem[]` | `[]` | Step items for data-driven mode. Each item supports `{ id?, value?, disabled?, title?, description?, icon?, completedIcon?, ui? }`. |
| `linear` | `boolean` | `false` | When `true`, enforces sequential navigation and disables jumping ahead past the next step. |
| `disabled` | `boolean` | `false` | Disables the entire stepper and all step items. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Layout direction (`"horizontal"` uses a scrollable `<scroll-view>`; `"vertical"` renders a stacked list). |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"` | `"primary"` | Semantic theme color forwarded to child items. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Size scale forwarded to child items. |
| `variant` | `"subtle" \| "solid" \| "outline"` | `"subtle"` | Visual style variant forwarded to child items. |
| `ui` | `Record<string, string>` | `{}` | Slot class overrides for `root`, `header`, `list`, and `content` (also used as fallback `ui` for data-driven items when item-level `ui` is omitted). |
| `class` | `string` | `""` | Custom CSS classes applied to the `root` element (mapped internally to `className`). |

### Imperative Methods (via `this.selectComponent(...)`)

- `setStep(index: number)` / `goToStep(index: number)`: Navigate to step `index` (enforces `linear`, `disabled`, and bounds checks).
- `nextStep()`: Advance to the next step.
- `prevStep()`: Return to the previous step.
- `resetStep()`: Reset to the initial step.
- `completeStep()`: Mark all steps as completed.
- `scrollTo(index: number)` / `scrollToStep(index: number)`: Scroll the horizontal list to bring step `index` into view.

---

## Slots

| Slot | Description |
| :--- | :--- |
| `default` | Renders `<c-stepper-item>` children in declarative compound mode. Mutually exclusive with `items`: rendered only when `items` is empty (`wx:else`). |
| `content` | Named slot for the active step's panel content. Its container (`[data-part="content"]`, `aria-role="tabpanel"`) is rendered conditionally only when content is provided (`wx:if="{{slots.content}}"`). |

### MiniProgram Static `<slot>` Constraints

- **No scoped slots**: WeChat MiniProgram does not support scoped slots (`#item="{ item }"`). Per-step customization in declarative mode is achieved by composing `<c-stepper-item>` children directly in the `default` slot, where each child owns its own `indicator`, `title`, `description`, and `default` slots.
- **No slot fallback content**: WeChat `<slot>` discards nested fallback markup. `index.wxml` uses `wx:if="{{hasItems}}"` / `wx:else` to switch between data-driven `<c-stepper-item>` rendering and `<slot />`, and `wx:if="{{slots.content}}"` to mount the `content` wrapper only when the `content` slot is populated.

---

## Events

| Event | Detail Payload | Description |
| :--- | :--- | :--- |
| `bind:change` | `{ step: number, value: string \| number, previousStep: number }` | Fired when the active step changes. |
| `bind:complete` | `{ step: number }` | Fired when the final step is reached or completed. |
| `bind:update:modelValue` | `number` | Fired when the active step updates for `modelValue` synchronization. |

---

## Theme

Defined in `packages/core/src/theme/definitions/stepper.ts`:

### Slots

- `root`: `"w-full flex flex-col gap-4"`
- `header`: `"w-full flex"`
- `list`: `"w-full"`
- `content`: `"size-full mt-4"`

### Variants

- `orientation`:
  - `horizontal`:
    - `root`: `"flex-col"`
    - `header`: `"flex-row items-start flex-nowrap w-full min-w-full px-2.5 py-1"`
    - `list`: `"w-full overflow-x-auto scroll-px-2.5 py-1"`
  - `vertical`:
    - `root`: `"flex-col"`
    - `header`: `"flex-col gap-4"`
    - `list`: `"flex flex-col items-start w-full"`
- `disabled`:
  - `true`: `root: "opacity-50 pointer-events-none"`
  - `false`: `{}`

*(Note: `color`, `size`, and `variant` are forwarded to `<c-stepper-item>` for item-level styling.)*

### Default Variants

- `orientation`: `"horizontal"`
- `disabled`: `false`

---

## Examples

### Declarative Compound Mode (WXML + TS)

```xml
<c-stepper
  id="checkout-stepper"
  step="{{activeStep}}"
  linear
  color="primary"
  size="md"
  bind:change="onStepChange"
  bind:complete="onComplete"
>
  <c-stepper-item title="Account" description="Sign in or register" />
  <c-stepper-item title="Shipping" description="Delivery address" />
  <c-stepper-item title="Payment" description="Confirm order" />

  <view slot="content" class="p-4 rounded-lg border">
    <view wx:if="{{activeStep === 0}}">Account form</view>
    <view wx:elif="{{activeStep === 1}}">Shipping form</view>
    <view wx:else>Payment summary</view>
  </view>
</c-stepper>
```

```ts
Page({
  data: {
    activeStep: 0,
  },
  onStepChange(e: WechatMiniprogram.CustomEvent<{ step: number; value: string | number; previousStep: number }>) {
    this.setData({ activeStep: e.detail.step });
  },
  onComplete(e: WechatMiniprogram.CustomEvent<{ step: number }>) {
    console.log("Completed at step:", e.detail.step);
  },
  onNextTap() {
    const stepper = this.selectComponent("#checkout-stepper");
    stepper?.nextStep();
  },
});
```

### Data-Driven Mode (WXML + TS)

```xml
<c-stepper
  step="{{activeStep}}"
  items="{{steps}}"
  orientation="vertical"
  variant="solid"
  color="success"
  bind:change="onStepChange"
/>
```

```ts
Page({
  data: {
    activeStep: 1,
    steps: [
      { value: "placed", title: "Order Placed", description: "10:30 AM" },
      { value: "shipped", title: "Shipped", description: "In transit" },
      { value: "delivered", title: "Delivered", description: "Pending", disabled: true },
    ],
  },
  onStepChange(e: WechatMiniprogram.CustomEvent<{ step: number; value: string | number; previousStep: number }>) {
    this.setData({ activeStep: e.detail.step });
  },
});
```
