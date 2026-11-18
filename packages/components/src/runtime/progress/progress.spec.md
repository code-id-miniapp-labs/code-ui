# Progress (`c-progress`)

## Overview & Tier

- **Purpose:** Accessible progress indicator for tracking task completion, file uploads, or background loading in linear (`type="linear"`) or circular (`type="circular"`) form, supporting both determinate numeric values and indeterminate loading states.
- **Architecture Tier:** **Tier 2 — Interactive / Stateful** (powered by the `@code-ui/progress` machine via `createMachineBehavior`, importing from `../_shared/base` and `../_shared/machine`).
- **Compound Relations:** Standalone component (no parent/child compound components).
- **Public Imperative Methods:** Component instances expose `setValue(value: number | null)`, `setToMin()`, `setToMax()`, and `reset()` via `selectComponent`.

---

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `number \| null` | `null` | Current progress value. When `null` (or `indeterminate` is `true`), renders in indeterminate mode. |
| `defaultValue` | `number \| null` | `null` | Initial value used when `reset()` is called. |
| `min` | `number` | `0` | Minimum progress bound (`aria-valuemin`). |
| `max` | `number` | `100` | Maximum progress bound (`aria-valuemax`). |
| `indeterminate` | `boolean` | `false` | Forces indeterminate loading state regardless of `value`. |
| `type` | `"linear" \| "circular"` | `"linear"` | Visual presentation mode. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Bar direction when `type="linear"`. |
| `size` | `"2xs" \| "xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl"` | `"md"` | Track thickness / circle size and label typography scale. |
| `color` | `ThemeColor \| string` | `"primary"` | Theme color token (or `"neutral"`); in `circular` mode, CSS colors (`#...`, `rgb(...)`, `hsl(...)`, `oklch(...)`) are also applied directly via `color`. |
| `trackColor` | `string` | `"#e5e7eb"` | CSS color passed as `--cui-progress-track-color` in `circular` mode. |
| `striped` | `boolean` | `false` | Applies striped styling to the linear indicator range. |
| `animated` | `boolean` | `false` | Animates the linear indicator range. |
| `animation` | `"carousel" \| "carousel-inverse" \| "swing" \| "elastic" \| string` | `"carousel"` | Animation style name. |
| `inverted` | `boolean` | `false` | Reverses the progress fill direction (`rotate-180` on track in linear mode; `scaleX(-1)` in circular mode). |
| `circleRadius` | `number` | `42` | Circle radius configuration for `circular` mode. |
| `strokeWidth` | `number` | `8` | Ring stroke thickness in `px` (`--cui-progress-stroke-width`) for `circular` mode. |
| `label` | `string` | `""` | Text label rendered in the header above the linear bar when `type !== "circular"`. |
| `showValue` | `boolean` | `false` | Displays the formatted value readout (`valueAsString`) in the linear header or inside the circular ring overlay. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional CSS classes merged onto the `root` slot (runtime property name for `class` on `c-progress`). |

---

## Slots

WeChat MiniProgram `<slot>` elements are static (scoped slots are not supported) and do not support nested fallback content inside `<slot>...</slot>`, so `c-progress` uses `wx:if` / `wx:else` conditional rendering for fallbacks:

| Slot | Behavior & Constraints |
| :--- | :--- |
| `label` | Rendered in the header when `type !== "circular"` and the `label` prop is empty (`wx:if="{{label}}"` renders `<text>{{label}}</text>`, `wx:else` renders `<slot name="label" />`). Note: the header container is only rendered when `type !== "circular"` and at least one of `label`, `showValue`, `slots.label`, or `slots.valueText` is truthy. |
| `value-text` | Rendered in the header when `type !== "circular"` and `showValue` is `false` (`wx:if="{{showValue}}"` renders `<text>` with the formatted value, `wx:else` renders `<slot name="value-text" />`). |
| *(default)* | In `type="circular"` mode, rendered centered inside `circleContent` when `showValue` is `false` (when `showValue` is `true`, `circleOverlay` displays the formatted value instead). In `type !== "circular"` mode, rendered below the track. |

---

## Events

None — the MiniProgram runtime component does not emit `bind:*` events.

---

## Theme

Defined in `packages/core/src/theme/definitions/progress.ts`:

- **Slots:** `root`, `header`, `track`, `range`, `label`, `valueText`, `view`, `circle`, `circleTrack`, `circleRange`, `circleOverlay`, `circleContent`
- **Variants:**
  - `color`: theme colors (`DEFAULT_THEME_COLORS`) + `"neutral"` (with compound variant mapping `"error"` to `bg-danger` / `text-danger`)
  - `size`: `"2xs"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"`
  - `orientation`: `"horizontal"`, `"vertical"`
  - `type`: `"linear"`, `"circular"`
  - `indeterminate`: `true`, `false`
  - `striped`: `true`, `false`
  - `animated`: `true`, `false`
  - `inverted`: `true`, `false`
- **Default Variants:**
  - `color`: `"primary"`
  - `size`: `"md"`
  - `type`: `"linear"`
  - `orientation`: `"horizontal"`
  - `indeterminate`: `false`
  - `striped`: `false`
  - `animated`: `false`
  - `inverted`: `false`

---

## Examples

### WXML

```wxml
<!-- Determinate linear progress with label and value readout -->
<c-progress
  id="upload-progress"
  value="{{progress}}"
  label="Uploading file"
  showValue="{{true}}"
  color="primary"
  size="md"
/>

<!-- Indeterminate linear progress -->
<c-progress indeterminate="{{true}}" label="Syncing..." />

<!-- Striped & animated linear progress with custom slot overrides -->
<c-progress
  value="{{75}}"
  color="success"
  striped="{{true}}"
  animated="{{true}}"
  className="my-4"
  ui="{{ { track: 'bg-neutral-200', range: 'rounded-none' } }}"
/>

<!-- Circular progress with built-in value overlay -->
<c-progress
  type="circular"
  value="{{80}}"
  size="lg"
  showValue="{{true}}"
  strokeWidth="{{6}}"
/>

<!-- Circular progress with custom centered default slot -->
<c-progress type="circular" value="{{100}}" size="xl" color="success">
  <text class="text-xs font-medium">Done</text>
</c-progress>
```

### TypeScript (Page / Parent Component)

```ts
Page({
  data: {
    progress: 40,
  },

  onAdvance() {
    const comp = this.selectComponent("#upload-progress");
    comp?.setValue(85);
  },

  onReset() {
    const comp = this.selectComponent("#upload-progress");
    comp?.reset();
  },
});
```
