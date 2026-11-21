---
title: Stepper
description: Displays progress through a sequence of numbered or labeled steps in a multi-step workflow, wizard, or timeline.
---

`c-stepper` displays progress through a sequence of numbered or labeled steps in a multi-step workflow, wizard, or timeline. It supports horizontal scrollable and vertical layouts, linear progression enforcement, declarative `<c-stepper-item>` children, and data-driven `items` rendering.

## Usage

### Basic

Pass an `items` array with `title` and `description` fields, and optionally set an initial active index with `defaultStep` for uncontrolled mode.

::code-group

```html [index.wxml]
<c-stepper items="{{steps}}" defaultStep="{{1}}" />
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Address", description: "Add your address here" },
      { title: "Shipping", description: "Set your preferred shipping method" },
      { title: "Checkout", description: "Confirm your order" },
    ],
  },
});
```

::

### Declarative Compound

Compose `<c-stepper-item>` children directly inside `<c-stepper>`'s default slot instead of passing `items`.

```html [index.wxml]
<c-stepper defaultStep="{{0}}">
  <c-stepper-item title="Account" description="Sign in or register" />
  <c-stepper-item title="Shipping" description="Delivery address" />
  <c-stepper-item title="Payment" description="Confirm order" />
</c-stepper>
```

### Orientation

Use the `orientation` prop to switch between `"horizontal"` (default, inside a scrollable `<scroll-view>`) and `"vertical"` stacked layouts.

::code-group

```html [index.wxml]
<c-stepper items="{{steps}}" orientation="vertical" defaultStep="{{1}}" />
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Order Placed", description: "10:30 AM" },
      { title: "Shipped", description: "In transit" },
      { title: "Delivered", description: "Pending" },
    ],
  },
});
```

::

### Color

Use the `color` prop (`"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, or `"info"`) to change the semantic theme color forwarded to step items.

::code-group

```html [index.wxml]
<c-stepper items="{{steps}}" color="success" defaultStep="{{1}}" />
<c-stepper items="{{steps}}" color="neutral" defaultStep="{{1}}" />
<c-stepper items="{{steps}}" color="warning" defaultStep="{{1}}" />
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Step 1" },
      { title: "Step 2" },
      { title: "Step 3" },
    ],
  },
});
```

::

### Variant

Use the `variant` prop (`"subtle"`, `"solid"`, or `"outline"`) to control the visual style of step indicators.

::code-group

```html [index.wxml]
<c-stepper items="{{steps}}" variant="subtle" defaultStep="{{1}}" />
<c-stepper items="{{steps}}" variant="solid" defaultStep="{{1}}" />
<c-stepper items="{{steps}}" variant="outline" defaultStep="{{1}}" />
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Account" },
      { title: "Shipping" },
      { title: "Payment" },
    ],
  },
});
```

::

### Size

Use the `size` prop (`"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`) to adjust the step scale.

::code-group

```html [index.wxml]
<c-stepper items="{{steps}}" size="xs" defaultStep="{{1}}" />
<c-stepper items="{{steps}}" size="md" defaultStep="{{1}}" />
<c-stepper items="{{steps}}" size="xl" defaultStep="{{1}}" />
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Account" },
      { title: "Shipping" },
      { title: "Payment" },
    ],
  },
});
```

::

### Icon

Set `icon` and `completedIcon` on each item in `items` to display custom icons before and after a step is completed.

::code-group

```html [index.wxml]
<c-stepper items="{{steps}}" defaultStep="{{1}}" />
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Account", icon: "user", completedIcon: "check" },
      { title: "Shipping", icon: "truck", completedIcon: "check" },
      { title: "Checkout", icon: "credit-card" },
    ],
  },
});
```

::

### Linear

Set `linear` to enforce sequential progression so users cannot jump ahead past the next step.

::code-group

```html [index.wxml]
<c-stepper items="{{steps}}" linear="{{true}}" defaultStep="{{0}}" />
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Account" },
      { title: "Shipping" },
      { title: "Payment" },
    ],
  },
});
```

::

### Disabled

Set `disabled` on `<c-stepper>` to disable the entire stepper, or set `disabled: true` on individual entries in `items`.

::code-group

```html [index.wxml]
<!-- Disable the entire stepper -->
<c-stepper items="{{steps}}" disabled="{{true}}" />

<!-- Disable an individual step -->
<c-stepper items="{{partialSteps}}" defaultStep="{{1}}" />
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Account" },
      { title: "Shipping" },
      { title: "Payment" },
    ],
    partialSteps: [
      { title: "Order Placed", description: "10:30 AM" },
      { title: "Shipped", description: "In transit" },
      { title: "Delivered", description: "Pending", disabled: true },
    ],
  },
});
```

::

### Content Slot

Provide the `content` slot to render panel content for the active step.

::code-group

```html [index.wxml]
<c-stepper step="{{activeStep}}" items="{{steps}}" bind:change="onStepChange">
  <view slot="content" class="p-4 rounded-lg border">
    <view wx:if="{{activeStep === 0}}">Account form</view>
    <view wx:elif="{{activeStep === 1}}">Shipping form</view>
    <view wx:else>Payment summary</view>
  </view>
</c-stepper>
```

```ts [index.ts]
Page({
  data: {
    activeStep: 0,
    steps: [
      { value: "account", title: "Account" },
      { value: "shipping", title: "Shipping" },
      { value: "payment", title: "Payment" },
    ],
  },
  onStepChange(e: WechatMiniprogram.CustomEvent<{ step: number; value: string | number; previousStep: number }>) {
    this.setData({ activeStep: e.detail.step });
  },
});
```

::

### Controlled & Events

Bind `step` (or `value` / `modelValue`) to control the active step externally, and listen to `bind:change`, `bind:complete`, and `bind:update:modelValue`.

::code-group

```html [index.wxml]
<c-stepper
  step="{{activeStep}}"
  items="{{steps}}"
  bind:change="onStepChange"
  bind:complete="onComplete"
  bind:update:modelValue="onModelUpdate"
/>
```

```ts [index.ts]
Page({
  data: {
    activeStep: 0,
    steps: [
      { value: "account", title: "Account" },
      { value: "shipping", title: "Shipping" },
      { value: "payment", title: "Payment" },
    ],
  },
  onStepChange(e: WechatMiniprogram.CustomEvent<{ step: number; value: string | number; previousStep: number }>) {
    this.setData({ activeStep: e.detail.step });
  },
  onComplete(e: WechatMiniprogram.CustomEvent<{ step: number }>) {
    console.log("Completed at step:", e.detail.step);
  },
  onModelUpdate(e: WechatMiniprogram.CustomEvent<number>) {
    this.setData({ activeStep: e.detail });
  },
});
```

::

### Imperative Controls

Access component methods via `this.selectComponent(...)` to navigate programmatically (`prevStep()`, `nextStep()`, `setStep()`, `goToStep()`, `resetStep()`, `completeStep()`, `scrollTo()`, and `scrollToStep()`).

::code-group

```html [index.wxml]
<c-stepper id="checkout-stepper" items="{{steps}}" linear="{{true}}" />

<view class="flex gap-2 mt-4">
  <c-button label="Prev" bind:tap="onPrevTap" />
  <c-button label="Next" bind:tap="onNextTap" />
  <c-button label="Complete" bind:tap="onCompleteTap" />
  <c-button label="Reset" bind:tap="onResetTap" />
</view>
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Account" },
      { title: "Shipping" },
      { title: "Payment" },
    ],
  },
  onPrevTap() {
    this.selectComponent("#checkout-stepper")?.prevStep();
  },
  onNextTap() {
    this.selectComponent("#checkout-stepper")?.nextStep();
  },
  onCompleteTap() {
    this.selectComponent("#checkout-stepper")?.completeStep();
  },
  onResetTap() {
    this.selectComponent("#checkout-stepper")?.resetStep();
  },
});
```

::

### Custom Styling

Use `ui` to override `root`, `header`, `list`, and `content` slot classes (as well as fallback item `ui` in `items` mode), and `class` to append classes to the `root` element.

::code-group

```html [index.wxml]
<c-stepper
  items="{{steps}}"
  class="p-4"
  ui="{{stepperUi}}"
>
  <view slot="content">Active step details</view>
</c-stepper>
```

```ts [index.ts]
Page({
  data: {
    steps: [
      { title: "Account" },
      { title: "Shipping", ui: { title: "font-semibold" } },
      { title: "Payment" },
    ],
    stepperUi: {
      root: "gap-6",
      content: "p-4 rounded-lg border",
    },
  },
});
```

::

## State Machine

Click any active transition or event button below to simulate the `stepper` state machine live:

::machine-visualizer{name="stepper"}
::

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
| `class` | `string` | `""` | Custom CSS classes applied to the `root` element. |

### Imperative Methods

Accessed via `this.selectComponent(...)`:

- `setStep(index: number)` / `goToStep(index: number)`: Navigate to step `index` (enforces `linear`, `disabled`, and bounds checks).
- `nextStep()`: Advance to the next step.
- `prevStep()`: Return to the previous step.
- `resetStep()`: Reset to the initial step.
- `completeStep()`: Mark all steps as completed.
- `scrollTo(index: number)` / `scrollToStep(index: number)`: Scroll the horizontal list to bring step `index` into view.

## Slots

| Slot | Description |
| :--- | :--- |
| `default` | Renders `<c-stepper-item>` children in declarative compound mode (mutually exclusive with `items`). |
| `content` | Named slot for the active step's panel content. |

## Events

| Event | Detail Payload | Description |
| :--- | :--- | :--- |
| `bind:change` | `{ step: number, value: string \| number, previousStep: number }` | Fired when the active step changes. |
| `bind:complete` | `{ step: number }` | Fired when the final step is reached or completed. |
| `bind:update:modelValue` | `number` | Fired when the active step updates for `modelValue` synchronization. |

## Item (`c-stepper-item`)

`<c-stepper-item>` renders an individual step inside a `<c-stepper>` sequence, displaying a clickable step indicator (step number, icon, completed icon, or custom slot), title, description, extra content, and a connecting separator line.

### Usage

Customize individual steps with props like `icon`, `disabled`, and `ui`, or override parts of a step using the `title`, `description`, `indicator`, `completed-indicator`, and `default` slots.

::code-group

```html [index.wxml]
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

```ts [index.ts]
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

::

### Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | `""` | Step title text. Takes precedence over the `title` slot when non-empty. |
| `description` | `string` | `""` | Step description text. Takes precedence over the `description` slot when non-empty. |
| `icon` | `string` | `""` | `<c-icon>` name shown in the indicator when incomplete or current and no `indicator` slot is provided. |
| `completedIcon` | `string` | `"check"` | `<c-icon>` name shown in the indicator when completed and no `completed-indicator` slot is provided. |
| `index` | `number \| null` | `null` | Explicit 0-based step index override. Automatically assigned by `<c-stepper>` when omitted. |
| `value` | `string \| number` | `""` | Custom step identifier. Falls back to the resolved `index` if empty. |
| `disabled` | `boolean` | `false` | Disables interaction on this step item. |
| `completed` | `boolean \| null` | `null` | Explicit completion override (`true` / `false`). |
| `status` | `string` | `""` | Explicit status override: `"completed"`, `"current"`, `"upcoming"`, or `"disabled"`. |
| `isLast` | `boolean \| null` | `null` | Explicit override indicating the final step (hides the connecting separator). |
| `orientation` | `string` | `""` | Layout orientation override (`"horizontal"` or `"vertical"`). Falls back to parent orientation or `"horizontal"`. |
| `color` | `string` | `""` | Semantic color override. Falls back to parent color or `"primary"`. |
| `size` | `string` | `""` | Size override (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). Falls back to parent size or `"md"`. |
| `variant` | `string` | `""` | Variant property (accepted on the component; currently unused by the `stepper-item` theme). |
| `stepperId` | `string` | `""` | Parent stepper ID used for element IDs (typically injected by `<c-stepper>`). |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by slot name (`root`, `container`, `trigger`, `indicator`, `icon`, `separator`, `wrapper`, `title`, `description`). |
| `class` / `className` | `string` | `""` | Additional CSS classes merged onto the `root` slot. |

### Slots

| Slot | Description |
| :--- | :--- |
| `completed-indicator` | Custom content rendered inside `indicator` when the step is completed. Defaults to `<c-icon name="{{completedIcon}}" />`. |
| `indicator` | Custom content rendered inside `indicator` when the step is not completed. Defaults to `<c-icon name="{{icon}}" />` if `icon` is set, or the 1-based step number. |
| `title` | Custom title content rendered inside `wrapper` when the `title` prop is empty. |
| `description` | Custom description content rendered inside `wrapper` when the `description` prop is empty. |
| `default` | Additional custom content rendered at the end of `wrapper` below the title and description. |

## Theme

Customize the `stepper` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    stepper: {
      slots: {
        root: "w-full flex flex-col gap-4",
        header: "w-full flex",
        list: "w-full",
        content: "size-full mt-4",
      },
      variants: {
        orientation: {
          horizontal: {
            root: "flex-col",
            header: "flex-row items-start flex-nowrap w-full min-w-full px-2.5 py-1",
            list: "w-full overflow-x-auto scroll-px-2.5 py-1",
          },
          vertical: {
            root: "flex-col",
            header: "flex-col gap-4",
            list: "flex flex-col items-start w-full",
          },
        },
        disabled: {
          true: {
            root: "opacity-50 pointer-events-none",
          },
          false: {},
        },
      },
      defaultVariants: {
        orientation: "horizontal",
        disabled: false,
      },
    }
  }
})
```
