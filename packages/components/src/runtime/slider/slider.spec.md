# Slider (`c-slider`)

## Overview & Tier

`c-slider` is an interactive slider input component supporting single-value and range (multi-thumb) selection, horizontal and vertical orientations, step increments, inverted direction, track marks, and form field integration.

- **Architecture Tier**: Tier 2 Interactive (FSM-backed via `@code-ui/slider`), with Tier 3 Domain form field integration (`withFormField` from `@code-ui/miniapp/behaviors/form`).
- **Compound Structure**: Standalone component (not a parent/child compound component). Integrates with a parent form host when `formContext` is provided.

---

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number \| number[] \| string \| null` | `null` | Controlled slider value. Use a `number` for single-thumb mode or `number[]` for range mode. |
| `defaultValue` | `number \| number[] \| string \| null` | `null` | Initial value for uncontrolled usage. |
| `min` | `number` | `0` | Minimum allowed value. |
| `max` | `number` | `100` | Maximum allowed value. |
| `step` | `number` | `1` | Step increment between selectable values. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Axis orientation of the slider track. |
| `inverted` | `boolean` | `false` | Reverses the visual direction along the track. |
| `minStepsBetweenThumbs` | `number` | `0` | Minimum step distance enforced between thumbs in range mode. |
| `marks` | `boolean \| SliderMark[]` | `false` | Displays scale marks along the track. `true` auto-generates marks from `min`, `max`, and `step`; an array of `{ value: number; label?: string }` renders custom marks. |
| `label` | `string` | `""` | Text label rendered in the header wrapper. Overrides the `label` slot when non-empty. |
| `showValue` | `boolean` | `false` | Displays the formatted value (`valueText`) in the header wrapper. Overrides the `value` slot when `true`. |
| `color` | `string` | `"primary"` | Theme color variant (any configured theme color or `"neutral"`). |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Size variant. Falls back to form `fieldSize` or `"md"` when empty. |
| `disabled` | `boolean` | `false` | Disables pointer/touch interaction and applies disabled styling. |
| `readOnly` | `boolean` | `false` | Prevents value changes without applying disabled appearance. |
| `invalid` | `boolean` | `false` | Applies invalid/error styling. |
| `required` | `boolean` | `false` | Marks the slider as required for form validation. |
| `name` | `string` | `""` | Field name used for form integration. |
| `form` | `string` | `""` | Associated form identifier. |
| `rules` | `FormRule[]` | `undefined` | Form validation rules (`SliderProps`). |
| `validateOn` | `FormValidateOn` | `undefined` | Form validation trigger timing (`SliderProps`). |
| `formContext` | `FormHostContext \| null` | `undefined` | Parent form host context for form binding. |
| `fieldDisabled` | `boolean` | `false` | Disabled flag propagated from a parent form field. |
| `ui` | `SliderUI` (`Record<string, string>`) | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Custom class applied to the `root` slot (forwarded as the `class` argument to `resolveSlots`; declared as `className` in component `properties`). |

---

## Slots

| Name | Behavior & Constraints |
| --- | --- |
| *(default)* | None. `c-slider` does not render an unnamed `<slot />`. |
| `label` | Named slot rendered in the header wrapper when `label` prop is empty (`<text wx:if="{{label}}">...</text><slot wx:else name="label" />`). Because MiniProgram `<slot>` does not support fallback default content, the `label` prop and `label` slot are mutually exclusive. |
| `value` | Named slot rendered in the header wrapper when `showValue` is `false` (`<text wx:if="{{showValue}}">...</text><slot wx:else name="value" />`). Setting `showValue="{{true}}"` suppresses this slot. |
| `thumb` | Named slot rendered inside each thumb element when active slot detection (`slots.thumb`) is enabled. Because MiniProgram `<slot>` is static (no scoped slots), per-thumb `value` or `index` data cannot be passed into the slot. |

---

## Events

No `this.triggerEvent(...)` calls are declared directly in `packages/components/src/runtime/slider/index.ts`; touch and tap interactions on the control are handled via WXS gesture bindings and forwarded to the slider machine API.

In `packages/machines/slider/src/slider.types.ts`, `SliderProps` defines the following callback payloads:

| Callback / Event | Payload (`detail`) | Description |
| --- | --- | --- |
| `onChange` | `{ value: number \| number[]; values: number[] }` (`SliderChangeDetails`) | Fired when the slider value changes. |
| `onChangeEnd` | `{ value: number \| number[]; values: number[] }` (`SliderChangeDetails`) | Fired when a drag or tap interaction finishes committing a value. |
| `onFocus` | `{ index: number; value: number }` | Thumb focus callback type defined in `SliderProps`. |
| `onBlur` | `{ index: number; value: number }` | Thumb blur callback type defined in `SliderProps`. |

---

## Theme

Defined in `packages/core/src/theme/definitions/slider.ts`:

### `slots`

- `root`
- `wrapper`
- `label`
- `valueText`
- `control`
- `track`
- `range`
- `thumb`
- `markerGroup`
- `marker`
- `markerTick`
- `markerTickActive`
- `markerLabel`
- `markerLabelActive`

### `variants`

- `color`: configured `DEFAULT_THEME_COLORS` + `"neutral"`
- `size`: `"xs" | "sm" | "md" | "lg" | "xl"`
- `orientation`: `"horizontal" | "vertical"`
- `disabled`: `true | false`
- `invalid`: `true | false`
- `dragging`: `true | false`
- `hasMarkers`: `true | false`

### `defaultVariants`

```ts
{
  color: "primary",
  size: "md",
  orientation: "horizontal",
  disabled: false,
  invalid: false,
  dragging: false,
  hasMarkers: false,
}
```

---

## Examples

### WXML

```xml
<!-- Basic slider with label and value display -->
<c-slider
  label="Volume"
  showValue="{{true}}"
  defaultValue="{{volume}}"
  min="{{0}}"
  max="{{100}}"
  step="{{5}}"
  color="primary"
  size="md"
/>

<!-- Range slider with custom marks and slot overrides -->
<c-slider
  defaultValue="{{priceRange}}"
  min="{{0}}"
  max="{{100}}"
  step="{{10}}"
  marks="{{marks}}"
  ui="{{sliderUi}}"
  className="mt-4"
>
  <text slot="label" class="font-semibold">Price Range</text>
  <text slot="value" class="text-xs text-muted">{{priceRange[0]}} - {{priceRange[1]}}</text>
</c-slider>
```

### TypeScript

```ts
Page({
  data: {
    volume: 40,
    priceRange: [20, 80],
    marks: [
      { value: 0, label: "$0" },
      { value: 50, label: "$50" },
      { value: 100, label: "$100" },
    ],
    sliderUi: {
      track: "h-2.5",
      range: "bg-primary",
    },
  },
});
```
