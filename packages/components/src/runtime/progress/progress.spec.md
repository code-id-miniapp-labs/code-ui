# Progress Component Specification

## 1. Overview

- **Purpose:** Accessible progress indicators for tracking task completion, file uploads, step progress, or background loading across both linear bars and circular rings.
- **Category:** Interactive / Stateful Machine (Zag.js-inspired FSM + Connect pattern).
- **Core Engine:** Built with `@code-ui/progress` machine, following `@zag-js/progress` and Nuxt UI `UProgress` styling.
- **Modes Supported:** Both **Linear** (`type="linear"`, default) and **Circular** (`type="circular"`). Supports determinate numeric values and indeterminate animated loading states (`value={null}`).

---

## 2. Anatomy

Defined in `packages/machines/progress/src/progress.anatomy.ts` via `createAnatomy("progress")`:

- **root:** The outer container wrapper (`data-part="root"`).
- **track:** The linear background track container (`data-part="track"`).
- **range:** The active indicator filling the track or circle (`data-part="range"`).
- **label:** Accessible text label describing what is progressing (`data-part="label"`).
- **valueText:** Visual formatted readout of current value or percentage (`data-part="value-text"`).
- **view:** The SVG wrapper container for circular mode (`data-part="view"`).
- **circle:** The root SVG element for circular progress (`data-part="circle"`).
- **circleTrack:** The background circle path for circular progress (`data-part="circle-track"`).
- **circleRange:** The active indicator circle path for circular progress (`data-part="circle-range"`).

---

## 3. State Machine Specification

_Implemented in `packages/machines/progress/`_

### Context (`ProgressContext`)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `number \| null` | `null` | The progress value. When `null`, the component enters indeterminate state. |
| `min` | `number` | `0` | Minimum allowed value. |
| `max` | `number` | `100` | Maximum allowed value. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Direction/orientation of the progress bar. |
| `type` | `"linear" \| "circular"` | `"linear"` | Visual display type. |

### Computed Values (`ProgressComputed`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `isIndeterminate` | `boolean` | `true` when `value` is `null` or `undefined`. |
| `percent` | `number` | Percentage progress from 0 to 100 clamped, or `-1` if indeterminate. |
| `isComplete` | `boolean` | `true` when `percent >= 100`. |
| `progressState` | `"indeterminate" \| "loading" \| "complete"` | Semantic status flag. |
| `valueAsString` | `string` | Formatted percentage string (e.g. `"45%"`) or custom formatted translation. |
| `circleRadius` | `number` | Radius used for SVG circle rendering (default `42`). |
| `circleCircumference` | `number` | Calculated SVG circle circumference (`2 * π * r`). |
| `circleDashOffset` | `number` | SVG stroke dashoffset reflecting progress. |

### Machine API (`ProgressApi` via `connectProgress`)

- **State Properties:** `state`, `value`, `min`, `max`, `percent`, `isIndeterminate`, `isComplete`, `valueAsString`, `orientation`, `type`, `size`, `color`, `striped`, `animated`, `inverted`.
- **Methods:**
  - `setValue(value: number | null)`: Updates the progress value and triggers `onValueChange`.
  - `setToMin()`: Jumps progress to minimum threshold.
  - `setToMax()`: Jumps progress to maximum threshold.
  - `reset()`: Resets progress back to `defaultValue` or `null`.
- **Prop Getters:** `rootProps`, `trackProps`, `rangeProps`, `labelProps`, `valueTextProps`, `viewProps`, `circleProps`, `circleTrackProps`, `circleRangeProps`.

---

## 4. Visual Specification (Theme)

_Implemented in `packages/core/src/theme/definitions/progress.ts`_

### Slots & Styling

- **`root`**: Flexible layout adapting to `horizontal`, `vertical`, or `circular` mode.
- **`track`**: Rounded overflow-hidden neutral background (`bg-neutral-200`).
- **`range`**: Smooth width transition (`duration-300 ease-out`), striped gradients, and keyframe animations.
- **`circle` / `circleTrack` / `circleRange`**: Full SVG stroke rendering with dasharray/dashoffset calculations and rotation.

### Variants

- **`color`**: `primary`, `neutral`, `success`, `warning`, `danger`, `info`.
- **`size`**: `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`.
- **`type`**: `linear`, `circular`.
- **`orientation`**: `horizontal`, `vertical`.
- **`indeterminate`**: `true`, `false` (triggers `progress-carousel` keyframe or circular spin).
- **`striped`**: `true`, `false` (45-degree diagonal stripes).
- **`animated`**: `true`, `false` (smooth striped animation).
- **`inverted`**: `true`, `false`.

---

## 5. MiniApp Runtime Component Usage

```wxml
<!-- Basic Linear Determinate Progress -->
<c-progress value="{{60}}" label="Upload Progress" showValue />

<!-- Indeterminate Loading Bar -->
<c-progress value="{{null}}" label="Loading data..." />

<!-- Striped & Animated -->
<c-progress value="{{75}}" color="success" striped animated />

<!-- Circular Progress -->
<c-progress type="circular" value="{{80}}" showValue size="lg" color="primary" />

<!-- Circular Progress with custom center slot -->
<c-progress type="circular" value="{{100}}" size="xl" color="success">
  <c-icon name="i-lucide-check" class="text-success text-2xl" />
</c-progress>
```

