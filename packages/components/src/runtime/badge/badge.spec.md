# Badge Component Specification

## 1. Overview

- **Purpose:** A small visual indicator used to display status, counts, labels, or notifications.
- **Category:** Presentational (No FSM required).
- **Reference:** Nuxt UI v4 / Tailwind UI Badge patterns.

## 2. Visual Specification (The Theme)

_Implemented in `packages/core/src/theme/definitions/badge.ts`_

### Slots

- **root:** The main badge container.
- **text:** The label or number inside the badge.

### Variants

| Variant   | Options                                                      | Description                                                            |
| :-------- | :----------------------------------------------------------- | :--------------------------------------------------------------------- |
| `color`   | `primary`, `success`, `warning`, `danger`, `neutral`, `info` | Semantic coloring for the badge background and text.                   |
| `size`    | `xs`, `sm`, `md`                                             | Controls padding and font size.                                        |
| `variant` | `solid`, `outline`, `ghost`                                  | Background fill style (Solid fill, Border only, or Subtle background). |

### Compound Variants

- **Default State:** `color: primary`, `size: md`, `variant: solid`.
- **Outline logic:** When `variant: outline`, the background is transparent, and a border of the selected `color` is applied.
- **Ghost logic:** When `variant: ghost`, a very light version of the `color` is used for the background.

## 3. Behavioral Specification

- **N/A:** This is a presentational component. It does not maintain internal state.

## 4. Component API (The Runtime)

_Implemented in `packages/components/src/runtime/badge/`_

### Props

| Prop      | Type     | Default   | Description                                |
| :-------- | :------- | :-------- | :----------------------------------------- |
| `ui`      | `Object` | `{}`      | Nuxt UI v4 style overrides for slots.      |
| `class`   | `String` | `""`      | Custom classes for the root element.       |
| `color`   | `string` | `primary` | The semantic color variant.                |
| `size`    | `string` | `md`      | The size variant.                          |
| `variant` | `string` | `solid`   | The styling variant (solid/outline/ghost). |
| `label`   | `string` | `""`      | The text to display inside the badge.      |

### Slots/Children

- **Default Slot:** Custom content can be passed instead of `label`.
- **leading When true, the icon will be displayed on the left side.
- **trailing When true, the icon will be displayed on the right side.
