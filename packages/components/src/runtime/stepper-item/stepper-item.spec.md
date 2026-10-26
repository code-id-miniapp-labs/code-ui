# Stepper Item Component Specification

## 1. Overview

- **Purpose:** Represents an individual step within a multi-step `<c-stepper>` sequence, displaying step status (completed, current, upcoming, disabled), indicator bubble (number, checkmark, or custom icon), title, description, and connecting separator line.
- **Category:** Interactive Stateful Child Component (`@code-ui/stepper-item` Zag.js-inspired FSM + Connect pattern + MiniProgram `relations` & EventBus).
- **Reference:** Zag.js `@zag-js/steps`, Ark UI Stepper, & Nuxt UI v4 `UStepper` item structure.
- **Target Platform:** WeChat MiniProgram (`weapp`) with responsive Tailwind styling via `virtual:cui/theme/stepper-item`.

---

## 2. Anatomy

Defined in `packages/machines/stepper-item/src/stepper-item.anatomy.ts` via `createAnatomy`:

- **`root`**: The outermost step item container (`<view>`).
- **`container`**: Relative positioning wrapper containing the interactive `trigger` and the connecting `separator` line.
- **`trigger`**: The clickable circular indicator button (`role="tab"`).
- **`indicator`**: Inner content container inside the trigger (displaying step index number, completed checkmark, or custom slot).
- **`icon`**: Dedicated icon wrapper inside the indicator.
- **`separator`**: The connecting divider line spanning between successive step indicators (`role="separator"`).
- **`wrapper`**: Container element holding the step `title` and `description` labels.
- **`title`**: The step title text or custom `<slot name="title" />`.
- **`description`**: The subtext / description text or custom `<slot name="description" />`.

---

## 3. State Machine Specification

_Implemented in `packages/machines/stepper-item/` (`@code-ui/stepper-item`)_

### Context (`StepperItemContext`)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `index` | `number \| null` | `null` | Explicit 0-based step index (assigned automatically if omitted). |
| `title` | `string` | `""` | Step title. |
| `description` | `string` | `""` | Step description subtext. |
| `icon` | `string` | `""` | Optional icon name. |
| `disabled` | `boolean` | `false` | Whether this specific step item is disabled. |
| `completed` | `boolean \| null` | `null` | Explicit completion override. |
| `status` | `StepperStatus \| ""` | `""` | Explicit status override (`"completed"`, `"current"`, `"upcoming"`, `"disabled"`). |
| `value` | `string \| number` | `""` | Custom step identifier or value. |
| `isLast` | `boolean \| null` | `null` | Whether this is the final step (suppresses separator). |
| `orientation` | `StepperOrientation \| ""` | `""` | Layout direction override. |
| `color` | `StepperColor \| ""` | `""` | Color variant override. |
| `size` | `StepperSize \| ""` | `""` | Size variant override. |
| `stepperId` | `string` | `""` | Parent stepper unique ID. |
| `groupStep` | `number` | `0` | Active step index broadcast from parent stepper. |
| `groupCount` | `number` | `0` | Total step count broadcast from parent stepper. |
| `groupLinear` | `boolean` | `false` | Linear mode flag broadcast from parent stepper. |
| `groupOrientation` | `StepperOrientation \| ""` | `""` | Orientation broadcast from parent stepper. |
| `groupDisabled` | `boolean` | `false` | Global disabled flag broadcast from parent stepper. |
| `groupColor` | `StepperColor \| ""` | `""` | Color broadcast from parent stepper. |
| `groupSize` | `StepperSize \| ""` | `""` | Size scale broadcast from parent stepper. |

### Computed Values

- **`resolvedIndex`**: Step index (defaults to `groupIndex` or `0` if not set).
- **`resolvedIsLast`**: `true` if `isLast === true`, or `groupIsLast === true`, or `resolvedIndex >= groupCount - 1`.
- **`isCompleted`**: `true` if explicit `completed`, or explicit `status === "completed"`, or `resolvedIndex < groupStep`.
- **`isCurrent`**: `true` if explicit `status === "current"`, or `resolvedIndex === groupStep`.
- **`isUpcoming`**: `true` if neither completed nor current, or `resolvedIndex > groupStep`.
- **`isDisabled`**: `true` if explicit `disabled`, or `groupDisabled`, or in linear mode when `resolvedIndex > groupStep + 1`.
- **`status`**: Resolved semantic status: `"completed" | "current" | "upcoming" | "disabled"`.
- **`effectiveOrientation`**: `orientation || groupOrientation || "horizontal"`.
- **`effectiveColor`**: `color || groupColor || "primary"`.
- **`effectiveSize`**: `size || groupSize || "md"`.

### Event Bus Synchronization
Each `<c-stepper-item>` subscribes to the parent stepper machine's `stepper:change` event via `refs.bus`:
- Automatically synchronizes `groupStep`, `groupCount`, `groupLinear`, `groupOrientation`, `groupDisabled`, `groupColor`, and `groupSize`.
- On user tap, dispatches `bus.emit("item:tap", { index: resolvedIndex, value })` to the parent stepper machine, which validates progression via its state guards (`canNavigateStep`).

---

## 4. Visual Specification (Theme)

_Implemented in `packages/core/src/theme/definitions/stepper-item.ts`_

Nuxt UI v4-inspired styling using Tailwind Variants (`tv`) and Tailwind CSS data-attribute selectors (`group-data-[state=completed]`, `group-data-[state=current]`).

### Slots

```ts
slots: {
  root: "group relative flex min-w-0",
  container: "relative flex shrink-0",
  trigger: "rounded-full text-center align-middle flex items-center justify-center font-semibold group-data-[state=completed]:text-white group-data-[state=current]:text-white group-data-[state=active]:text-white text-neutral-400 bg-neutral-100 transition-colors cursor-pointer select-none focus:outline-none",
  indicator: "flex items-center justify-center size-full",
  icon: "shrink-0 leading-none",
  separator: "absolute rounded-full group-data-[disabled]:opacity-75 bg-neutral-200 transition-colors pointer-events-none",
  wrapper: "flex flex-col min-w-0 cursor-pointer select-none",
  title: "block font-medium text-neutral-500 group-data-[state=completed]:text-neutral-900 transition-colors truncate max-w-full w-full",
  description: "block text-neutral-400 transition-colors truncate max-w-full w-full mt-0.5",
}
```

### Variants

#### `orientation`

- **`horizontal`**:
  - `root`: `"flex-col items-center flex-1 min-w-16 shrink-0"`
  - `container`: `"justify-center w-full"`
  - `separator`: `"top-[calc(50%-2rpx)] h-[4rpx]"`
  - `wrapper`: `"items-center text-center mt-2 w-full px-0.5"`
  - `title`: `"text-center"`
  - `description`: `"text-center"`

- **`vertical`**:
  - `root`: `"flex-row items-start gap-3 w-full text-start pb-6 last:pb-0"`
  - `container`: `"flex-col items-center self-stretch"`
  - `trigger`: `"shrink-0"`
  - `separator`: `"start-[calc(50%-2rpx)] bottom-[8rpx] w-[4rpx]"`
  - `wrapper`: `"items-start text-left flex-1 mt-0"`
  - `title`: `"text-left whitespace-normal break-words"`
  - `description`: `"text-left whitespace-normal break-words"`

#### `size` Matrix (MiniProgram `rpx` calibrated)

| Size | Trigger | Icon | Title | Description | Wrapper Margin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `xs` | `size-5 text-[20rpx]` | `size-2.5` | `text-[20rpx]` | `text-[18rpx]` | `mt-1` |
| `sm` | `size-6 text-xs` | `size-3` | `text-xs` | `text-[20rpx]` | `mt-1.5` |
| `md` | `size-7 text-xs` | `size-3.5` | `text-xs font-semibold` | `text-[22rpx]` | `mt-2` |
| `lg` | `size-8 text-sm` | `size-4` | `text-sm font-semibold` | `text-xs` | `mt-2.5` |
| `xl` | `size-10 text-base` | `size-5` | `text-base font-semibold` | `text-sm` | `mt-3` |

#### `color` Theme Matrix
Dynamically mapped for all semantic colors (`primary`, `secondary`, `success`, `info`, `warning`, `danger`, `neutral`):
- `trigger`: `group-data-[state=completed]:bg-${color}-500 group-data-[state=current]:bg-${color}-500 outline-${color}-500/25`
- `title`: `group-data-[state=current]:text-${color}-600`
- `separator`: `group-data-[state=completed]:bg-${color}-500`

#### Compound Variants (`orientation` $\times$ `size`)

##### 5 Horizontal Sizes:
- `xs`: `{ separator: "start-[calc(50%+28rpx)] end-[calc(-50%+28rpx)]" }`
- `sm`: `{ separator: "start-[calc(50%+32rpx)] end-[calc(-50%+32rpx)]" }`
- `md`: `{ separator: "start-[calc(50%+40rpx)] end-[calc(-50%+40rpx)]" }`
- `lg`: `{ separator: "start-[calc(50%+44rpx)] end-[calc(-50%+44rpx)]" }`
- `xl`: `{ separator: "start-[calc(50%+56rpx)] end-[calc(-50%+56rpx)]" }`

##### 5 Vertical Sizes:
- `xs`: `{ separator: "top-[48rpx]" }`
- `sm`: `{ separator: "top-[56rpx]" }`
- `md`: `{ separator: "top-[64rpx]" }`
- `lg`: `{ separator: "top-[74rpx]" }`
- `xl`: `{ separator: "top-[92rpx]" }`

---

## 5. MiniProgram Runtime API

### Component (`packages/components/src/runtime/stepper-item/`)

#### Properties

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui` | `Object` | `{}` | Slot overrides for item parts (`trigger`, `indicator`, `icon`, `separator`, `wrapper`, `title`, `description`). |
| `class` / `className` | `String` | `""` | Custom classes on the step item root `<view>`. |
| `index` | `Number` | `null` | 0-based step index (assigned automatically by parent relations if omitted). |
| `title` | `String` | `""` | Step title text. |
| `description` | `String` | `""` | Step description text. |
| `icon` | `String` | `""` | Custom icon name. |
| `disabled` | `Boolean` | `false` | Disables this individual step item. |
| `completed` | `Boolean` | `null` | Explicit completed override. |
| `status` | `String` | `""` | Explicit status override (`"completed"`, `"current"`, `"upcoming"`, `"disabled"`). |
| `value` | `String \| Number` | `""` | Custom step value. |
| `isLast` | `Boolean` | `null` | Whether this is the final step. |
| `orientation` | `String` | `""` | Orientation override (`"horizontal"` or `"vertical"`). |
| `color` | `String` | `""` | Semantic color override. |
| `size` | `String` | `""` | Size override (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). |
| `customIndicator` | `Boolean` | `false` | When `true`, suppresses default number/icon rendering to allow pure custom markup via `<slot name="indicator" />`. |

#### Slots

- **`indicator`**: Custom markup inside the circular indicator bubble (e.g. custom icon, avatar, emoji).
- **`title`**: Custom markup for the step title (e.g. title with badge or tags).
- **`description`**: Custom markup for the step description.
- **`default`**: Additional custom content appended inside the step wrapper.

#### Events

| Event | Detail | Description |
| :--- | :--- | :--- |
| `bind:click` | `{ index: number, value: any, status: string }` | Emitted when this step item trigger is clicked. |

#### Template (`packages/components/src/runtime/stepper-item/index.wxml`)

```xml
<view
  id="{{cStepperItem.itemProps.id}}"
  class="cui-stepper-item {{classes.root}}"
  data-scope="stepper"
  data-part="item"
  data-index="{{cStepperItem.resolvedIndex}}"
  data-state="{{cStepperItem.status}}"
  data-orientation="{{cStepperItem.orientation}}"
  data-disabled="{{cStepperItem.itemProps['data-disabled']}}"
>
  <view
    class="cui-stepper-item__container {{classes.container}}"
    data-scope="stepper"
    data-part="container"
  >
    <view
      id="{{cStepperItem.triggerProps.id}}"
      class="{{classes.trigger}}"
      role="tab"
      aria-selected="{{cStepperItem.isCurrent}}"
      aria-disabled="{{cStepperItem.triggerProps['aria-disabled']}}"
      data-scope="stepper"
      data-part="trigger"
      data-index="{{cStepperItem.resolvedIndex}}"
      data-state="{{cStepperItem.status}}"
      data-orientation="{{cStepperItem.orientation}}"
      data-disabled="{{cStepperItem.triggerProps['data-disabled']}}"
      bind:tap="handleTap"
    >
      <view
        id="{{cStepperItem.indicatorProps.id}}"
        class="{{classes.indicator}}"
        aria-hidden="true"
        data-scope="stepper"
        data-part="indicator"
        data-index="{{cStepperItem.resolvedIndex}}"
        data-state="{{cStepperItem.status}}"
      >
        <slot name="indicator" />
        <block wx:if="{{!customIndicator}}">
          <c-icon
            wx:if="{{cStepperItem.isCompleted && !(cStepperItem.icon || icon)}}"
            name="check"
            className="{{classes.icon}}"
          />
          <c-icon
            wx:elif="{{cStepperItem.icon || icon}}"
            name="{{cStepperItem.icon || icon}}"
            className="{{classes.icon}}"
          />
          <text wx:else>{{cStepperItem.resolvedIndex + 1}}</text>
        </block>
      </view>
    </view>

    <view
      wx:if="{{!cStepperItem.resolvedIsLast}}"
      id="{{cStepperItem.separatorProps.id}}"
      class="{{classes.separator}}"
      role="separator"
      aria-orientation="{{cStepperItem.orientation}}"
      data-scope="stepper"
      data-part="separator"
      data-index="{{cStepperItem.resolvedIndex}}"
      data-orientation="{{cStepperItem.orientation}}"
      data-state="{{cStepperItem.isCompleted ? 'completed' : 'incomplete'}}"
    />
  </view>

  <view
    class="{{classes.wrapper}}"
    data-scope="stepper"
    data-part="wrapper"
    bind:tap="handleTap"
  >
    <text
      wx:if="{{cStepperItem.title || title}}"
      id="{{cStepperItem.titleProps.id}}"
      class="{{classes.title}}"
      data-scope="stepper"
      data-part="title"
      data-state="{{cStepperItem.status}}"
    >{{cStepperItem.title || title}}</text>
    <slot wx:else name="title" />

    <text
      wx:if="{{cStepperItem.description || description}}"
      id="{{cStepperItem.descriptionProps.id}}"
      class="{{classes.description}}"
      data-scope="stepper"
      data-part="description"
      data-state="{{cStepperItem.status}}"
    >{{cStepperItem.description || description}}</text>
    <slot wx:else name="description" />

    <slot />
  </view>
</view>
```

---

## 6. Usage Examples

### Example 1: Standard Step Item
```xml
<c-stepper-item title="Personal Info" description="Enter your name & email" />
```

### Example 2: Step with Custom Icon Slot
```xml
<c-stepper-item title="Profile" description="Add avatar & bio">
  <c-icon slot="indicator" name="i-lucide-user" />
</c-stepper-item>
```

### Example 3: Step with Title Badge
```xml
<c-stepper-item description="Verify phone & email">
  <view slot="title" class="flex items-center gap-1.5">
    <text class="font-medium text-xs">Security</text>
    <text class="text-[9px] bg-amber-100 text-amber-700 font-bold px-1 py-0.5 rounded">
      Required
    </text>
  </view>
</c-stepper-item>
```

### Example 4: Vertical Timeline Item
```xml
<c-stepper-item
  title="Shipped with SF Express"
  description="Oct 25, 08:00 AM · In transit"
/>
```
