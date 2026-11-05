# Stepper Component Specification

## 1. Overview

- **Purpose:** Displays progress through a sequence of numbered or labeled steps in a multi-step process, workflow, wizard, or checkout flow.
- **Category:** Interactive Compound Stateful Component (Zag.js-inspired FSM + Connect pattern + MiniProgram `relations` + reactive `groupContext`).
- **Reference:** Zag.js `@zag-js/steps`, Ark UI Stepper, & Nuxt UI v4 `UStepper`.
- **Target Platform:** WeChat MiniProgram (`weapp`) with responsive Tailwind styling via `virtual:cui/theme/stepper` and `virtual:cui/theme/stepper-item`.

### Solving Slot `item` Customization (Compound Component Pattern)
In WeChat MiniProgram WXML, **scoped slots do not exist** (e.g. `<template #item="{ item, index }">` cannot pass loop variables upward from a child component's template into caller slots).

To solve this natively and elegantly, `@code-ui` implements the **Compound Component Pattern (`<c-stepper>` + `<c-stepper-item>`)**:
- Each `<c-stepper-item>` is an isolated native MiniProgram component with its own local scope and standard slots:
  - `<slot name="indicator" />`: Custom icon, badge, avatar, or graphic.
  - `<slot name="title" />`: Custom title typography or badge.
  - `<slot name="description" />`: Custom description or status tag.
  - Default `<slot />`: Custom body content inside the step.
- `<c-stepper>` and `<c-stepper-item>` coordinate reactively via WeChat MiniProgram `relations` (`cuiStepperBehavior` and `cuiStepperItemBehavior`), managing registration, step index calculation, linear progression validation, and state broadcasting.
- For convenience, `<c-stepper>` also supports data-driven `items="{{steps}}"` array mode (auto-rendering `<c-stepper-item>` instances), as well as headless usage via `@code-ui/composables` `useChild`.

---

## 2. Anatomy

Defined in `packages/machines/stepper/src/stepper.anatomy.ts` via `createAnatomy`:

- **`root`**: The outermost container wrapper (`<view>`).
- **`header`**: The inner wrapper holding the step items (`horizontal` flex row inside `<scroll-view>` or `vertical` column).
- **`list`**: The scrollable container (`<scroll-view>` for horizontal auto-slide) or static list (`<view>` for vertical).
- **`content`**: The panel container displaying the active step's content or form fields (`<view wx:if="{{stepper.hasContent || hasContent}}">`).

*(For `<c-stepper-item>` child anatomy, refer to [`stepper-item.spec.md`](../stepper-item/stepper-item.spec.md)).*

---

## 3. State Machine Specification

_Implemented in `packages/machines/stepper/` (`@code-ui/stepper`)_

### Context (`StepperContext`)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Generated ID | Unique component instance ID. |
| `step` | `number` | `0` | Controlled active step index (0-based). |
| `defaultStep` | `number` | `0` | Initial uncontrolled step index. |
| `count` | `number` | `0` | Total number of registered steps. |
| `linear` | `boolean` | `false` | When `true`, enforces sequential flow (cannot jump past incomplete steps). |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Layout direction. |
| `color` | `string` | `"primary"` | Semantic theme color passed to children. |
| `size` | `string` | `"md"` | Size scale (`xs`, `sm`, `md`, `lg`, `xl`). |
| `disabled` | `boolean` | `false` | Global disabled state. |
| `hasContent` | `boolean` | `false` | Whether the content panel slot is active. |
| `items` | `StepperItem[]` | `[]` | Optional items array (when used in data-driven mode). |

### Machine States & Events

- **States:** `idle`, `focused`.
- **Events:**
  - `STEP.SET`: Directly set active step index (`{ type: "STEP.SET", step: number }`).
  - `STEP.NEXT`: Advance to next step (`step + 1`, clamped to `count - 1`).
  - `STEP.PREV`: Return to previous step (`step - 1`, clamped to `0`).
  - `STEP.RESET`: Reset to default initial step (`0`).
  - `STEP.SCROLL_TO`: Request scroll position update to a given step index.
  - `COUNT.SET`: Update registered step count from dynamically linked `<c-stepper-item>` children.
  - `ITEMS.SET`: Update static items list (data-driven mode).

### Linear Progression Rules
- When `linear: true`:
  - `index <= currentStep`: Completed / current — clickable (user can review past steps).
  - `index === currentStep + 1`: Next navigable step (allowed to advance).
  - `index > currentStep + 1`: Disabled / future — non-clickable until intermediate steps are reached.
- When `linear: false`:
  - Any non-disabled step can be clicked at any time.

### Connect API (`connectStepper`)

Zag.js-compliant API exposing state getters and action methods:

- **State Flags:**
  - `step`: Current 0-based active index.
  - `count`: Total steps count.
  - `percent`: Progression percentage (`(step / Math.max(count - 1, 1)) * 100`).
  - `hasNext`: Whether there is a next step (`step < count - 1`).
  - `hasPrev`: Whether there is a previous step (`step > 0`).
  - `isFirst`: Whether on the first step (`step === 0`).
  - `isLast`: Whether on the last step (`step === count - 1`).
  - `isCompleted`: Whether all steps have been completed (`step >= count - 1`).
  - `scrollLeft`: Computed horizontal scroll offset for auto-slide navigation.

- **Methods:**
  - `setStep(index: number)`: Jump to step index.
  - `nextStep()`: Advance forward.
  - `prevStep()`: Go backward.
  - `resetStep()`: Reset to initial.
  - `goToStep(index: number)`: Safe navigation respecting linear rules.
  - `scrollTo(index: number)`: Manually scroll list to specific step.
  - `scrollToStep(index: number)`: Smooth scroll to specific step.

- **Props Getters:**
  - `getRootProps()`
  - `getListProps()`
  - `getContentProps()`

---

## 4. MiniApp Behaviors & Relations (`@code-ui/miniapp`)

Communication between `<c-stepper>` and `<c-stepper-item>` in declarative mode is orchestrated by WeChat MiniProgram `relations` and a shared reactive `StepperGroupContext`.

### Architecture: How Declarative Items Connect to the Machine

```text
<c-stepper> / stepperMachine
  refs.groupContext
    getters: step(), count(), linear(), orientation(),
             color(), size(), variant(), disabled()
    commands: setStep(step), next(), previous(), reset()
          │
          │ MiniProgram relations inject groupContext,
          │ groupIndex, and stepperId into child props
          ▼
<c-stepper-item> / stepperItemMachine
  computed values read groupContext getters reactively
  tap → groupContext.setStep(resolvedIndex)
      → parent STEP.SET event → canNavigateStep guard
```

### 1. The Shared Reactive Context (`groupContext`)

The parent machine creates a `StepperGroupContext` in `refs.groupContext`:
- **Reactive getters**: `step()` reads the active step, `count()` reads computed `totalCount`, and `linear()`, `orientation()`, `color()`, `size()`, `variant()`, and `disabled()` read parent props. Child computed values consume these getters directly rather than copying parent state.
- **Commands**: `setStep(step)`, `next()`, `previous()`, and `reset()` send `STEP.SET`, `STEP.NEXT`, `STEP.PREV`, and `STEP.RESET` to the parent machine.
- **Item taps**: After its own `canTap` guard, the child calls `groupContext.setStep(resolvedIndex)`. The parent validates the resulting `STEP.SET` event with `canNavigateStep`.

### 2. Auto-Registration & Dynamic Indexing
When developers declare items declaratively:
```xml
<c-stepper value="{{currentStep}}" linear>
  <c-stepper-item title="Step 1" />
  <c-stepper-item title="Step 2" />
  <c-stepper-item title="Step 3" />
</c-stepper>
```
1. `withStepper()` and `withStepperItem()` link parent and child components through `cuiStepperChild` / `cuiStepperParent` relations.
2. `syncStepperChildren` resolves children from relation nodes, template components, or the tracked linked children, then updates the parent machine's `linkedCount` prop.
3. Each child machine receives `stepperId`, the shared `groupContext`, and its 0-based `groupIndex` through `updateProps`. An explicit child `index` takes precedence over `groupIndex`.
4. Child computed values read the shared context reactively; parent state is not copied into child props.
5. Unless explicitly overridden by `isLast`, the child derives `resolvedIsLast` from its resolved index and `groupContext.count()`, suppressing the final separator. Unlinking clears the child's injected props and resynchronizes the remaining children.

---

## 5. Visual Specification (Theme)

_Implemented in `packages/core/src/theme/definitions/stepper.ts`_

Nuxt UI v4-style theme definition keeping only the slots `<c-stepper>` renders. Item-level slots are separated into [`stepper-item.ts`](file:///Users/rdjanuar/Project/personal/code-ui/packages/core/src/theme/definitions/stepper-item.ts).

### `<c-stepper>` Theme Slots
- **`root`**: `"w-full flex flex-col gap-4"`
- **`header`**: `"w-full flex"`
- **`list`**: `"w-full"`
- **`content`**: `"size-full mt-4"`

### Variants

#### `orientation`
- **`horizontal`**:
  - `root`: `"flex-col"`
  - `header`: `"flex-row items-start flex-nowrap w-full min-w-full px-2.5 py-1"`
  - `list`: `"w-full overflow-x-auto scroll-px-2.5 py-1"`
- **`vertical`**:
  - `root`: `"flex-col"`
  - `header`: `"flex-col gap-4"`
  - `list`: `"flex flex-col items-start w-full"`

#### `disabled`
- **`true`**: `root: "opacity-50 pointer-events-none"`
- **`false`**: `{}`

---

## 6. MiniProgram Runtime API

### `<c-stepper>` (`packages/components/src/runtime/stepper/`)

#### Properties

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui` | `Object` | `{}` | Nuxt UI v4 slot class overrides (`root`, `header`, `list`, `content`). |
| `class` / `className` | `String` | `""` | Custom classes on root element. |
| `modelValue` / `value` / `step` | `Number` | `0` | Active step index (0-based, supports two-way binding). |
| `defaultStep` | `Number` | `0` | Initial uncontrolled step index. |
| `items` | `Array` | `[]` | Optional array of steps for data-driven mode: `[{ title, description, icon, disabled, value }]`. |
| `linear` | `Boolean` | `false` | Whether progression is strictly sequential. |
| `orientation` | `String` | `"horizontal"` | Layout direction (`"horizontal"` or `"vertical"`). |
| `color` | `String` | `"primary"` | Semantic color theme broadcast to children (`primary`, `neutral`, `success`, `warning`, `danger`, `info`). |
| `size` | `String` | `"md"` | Size scale broadcast to children (`xs`, `sm`, `md`, `lg`, `xl`). |
| `disabled` | `Boolean` | `false` | Whether the entire stepper is disabled. |
| `hasContent` | `Boolean` | `false` | Whether the active step content panel is displayed. |

#### Slots
- **`default`**: Main slot for `<c-stepper-item>` child components (rendered when `hasItems` is false).
- **`content`**: Dedicated named slot for active step content / panels.

#### Mutual Exclusion: `hasItems` vs Default `<slot />`
- `hasItems` evaluates `Array.isArray(items) && items.length > 0`.
- In WXML, `<block wx:if="{{hasItems}}">` and `<slot wx:else />` are strictly mutually exclusive:
  - **Declarative Compound Mode**: `hasItems` is `false`, `<slot wx:else />` displays `<c-stepper-item>` children.
  - **Data-Driven Mode**: `hasItems` is `true`, auto-renders `<c-stepper-item wx:for="{{stepper.steps}}">` with orientation, color, and size passed down.

#### Events
| Event | Detail | Description |
| :--- | :--- | :--- |
| `bind:change` | `{ step: number, value: any, previousStep: number }` | Emitted when active step changes. |
| `bind:update:modelValue` | `number` | Sync event for `v-model:modelValue`. |
| `bind:complete` | `{ step: number }` | Emitted when the final step is reached or completed. |

#### Component Methods (via `this.selectComponent()`)
- `goToStep(index: number)`: Navigates to index respecting linear rules.
- `setStep(index: number)`: Sets step index directly.
- `nextStep()`: Advances to next step.
- `prevStep()`: Goes back to previous step.
- `resetStep()`: Resets to step 0.
- `completeStep()`: Advances to completion state.
- `scrollTo(index: number)`: Updates scroll-left to position index in view.
- `scrollToStep(index: number)`: Triggers animated scroll to target index.

#### Template (`packages/components/src/runtime/stepper/index.wxml`)
```xml
<view id="{{stepper.rootProps.id}}" class="{{classes.root}}" data-scope="stepper" data-part="root" data-orientation="{{stepper.orientation || orientation}}" data-disabled="{{stepper.disabled || disabled}}">
  <!-- Horizontal Orientation: Scrollable List with Auto-Slide Navigation -->
  <scroll-view wx:if="{{(stepper.orientation || orientation) !== 'vertical'}}" id="{{stepper.listProps.id}}" class="cui-stepper-list {{classes.list}}" role="tablist" scroll-x="{{stepper.listProps['scroll-x']}}" scroll-with-animation="{{stepper.listProps['scroll-with-animation']}}" scroll-left="{{stepper.scrollLeft}}" enhanced="{{stepper.listProps['enhanced']}}" show-scrollbar="{{stepper.listProps['show-scrollbar']}}" aria-orientation="horizontal" data-scope="stepper" data-part="list" data-orientation="horizontal">
    <view class="cui-stepper-header {{classes.header}}">
      <block wx:if="{{hasItems}}">
        <c-stepper-item wx:for="{{stepper.steps}}" wx:key="index" id="{{item.itemProps.id}}" index="{{item.index}}" title="{{item.title}}" description="{{item.description}}" icon="{{item.icon}}" status="{{item.status}}" disabled="{{item.isDisabled}}" value="{{item.value}}" isLast="{{item.isLast}}" orientation="{{stepper.orientation || orientation}}" color="{{stepper.color || color}}" size="{{stepper.size || size}}" ui="{{item.ui || ui}}" data-index="{{item.index}}" bind:tap="handleItemTap" />
      </block>
      <slot wx:else />
    </view>
  </scroll-view>
  <!-- Vertical Orientation: Static List -->
  <view wx:else id="{{stepper.listProps.id}}" class="{{classes.list}}" role="tablist" aria-orientation="vertical" data-scope="stepper" data-part="list" data-orientation="vertical">
    <block wx:if="{{hasItems}}">
      <c-stepper-item wx:for="{{stepper.steps}}" wx:key="index" index="{{item.index}}" title="{{item.title}}" description="{{item.description}}" icon="{{item.icon}}" status="{{item.status}}" disabled="{{item.isDisabled}}" value="{{item.value}}" isLast="{{item.isLast}}" orientation="{{stepper.orientation || orientation}}" color="{{stepper.color || color}}" size="{{stepper.size || size}}" ui="{{item.ui || ui}}" data-index="{{item.index}}" bind:tap="handleItemTap" />
    </block>
    <slot wx:else />
  </view>
  <!-- Step Content Panel -->
  <view wx:if="{{stepper.hasContent || hasContent}}" id="{{stepper.contentProps.id}}" class="{{classes.content}}" role="tabpanel" data-scope="stepper" data-part="content">
    <slot name="content" />
  </view>
</view>
```

---

## 7. Usage Examples

### Example 1: Declarative Compound Component with Custom Slots
```xml
<c-stepper value="{{currentStep}}" bind:change="handleStepChange" linear color="primary" size="md" hasContent="{{true}}">
  <c-stepper-item title="Personal Info" description="Enter your details">
    <view slot="indicator">👤</view>
  </c-stepper-item>

  <c-stepper-item description="Verify contact details">
    <view slot="title" class="flex items-center gap-1.5">
      <text class="font-medium text-xs">Security</text>
      <text class="text-[9px] bg-amber-100 text-amber-700 font-bold px-1 rounded">Required</text>
    </view>
  </c-stepper-item>

  <c-stepper-item title="Completed" description="All done!" />

  <!-- Active Step Content Panel -->
  <view slot="content" class="p-4 bg-white rounded-xl border border-neutral-200 mt-4 text-center">
    <view wx:if="{{currentStep === 0}}">Form Step 1 Content...</view>
    <view wx:elif="{{currentStep === 1}}">Form Step 2 Content...</view>
    <view wx:elif="{{currentStep === 2}}">Confirmation Content...</view>
  </view>
</c-stepper>
```

### Example 2: Data-Driven Mode
```xml
<c-stepper
  value="{{currentStep}}"
  items="{{stepsList}}"
  linear
  color="success"
  size="sm"
  bind:change="handleStepChange"
/>
```

### Example 3: Vertical Stepper (Timeline / Tracking)
```xml
<c-stepper value="{{activeOrderStep}}" orientation="vertical" color="primary" size="sm">
  <c-stepper-item title="Order Placed" description="Oct 24, 10:30 AM · Paid with WeChat Pay" />
  <c-stepper-item title="Processing" description="Oct 24, 02:15 PM · Warehouse Shanghai" />
  <c-stepper-item title="Shipped" description="Oct 25, 08:00 AM · In transit" />
  <c-stepper-item title="Delivered" description="Estimated Oct 26, afternoon" />
</c-stepper>
```
