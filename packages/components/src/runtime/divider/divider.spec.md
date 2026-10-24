# Divider Component Specification

## 1. Overview

- **Purpose:** A small visual indicator used to place between section
- **Category:** Presentational (No FSM required).
- **Reference:** Nuxt UI v$ / Tailwind UI separator pattenrs.

## . Visual Specification (The theme)

_Implemented in `packages/core/src/theme/definitions/divider.ts`_

## Slots

- **root:**: the root of node
- **container:**: the container of label & border divider
- **icon:**: Icon as usual define by <c-icon />
- **label:**: the label for component

### Variants

| Variant | Options                                                                   | Description                                          |
| :------ | :------------------------------------------------------------------------ | :--------------------------------------------------- |
| `color` | `primary`, `secondary`, `success`, `info`, `warning`, `danger`, `neutral` | Semantic coloring for the badge background and text. |
| `size`  | `xs`, `sm`, `md`, `lg`, `xl`                                              | Controls padding and font size.                      |
| `type`  | `solid`, `dashed`, `dotted`                                               | visual for border style                              | `orientation` | `horizontal`, `vertical` | The orientation of the separator. | `position` | `center`, `start`, `end` | The position of the content. |

### Compound Variants

- **Default State:** `color: neutral`, `size: xs`, `type: solid`.

## 3. Behavioral Specification

- **N/A:** This is a presentational component. It does not maintain internal state.

## 4. Component API (The Runtime)

_Implemented in `packages/components/src/runtime/divider/`_

### Props

| Prop        | Type     | Default   | Description                             |
| :---------- | :------- | :-------- | :-------------------------------------- |
| `ui`        | `Object` | `{}`      | Nuxt UI v4 style overrides for slots.   |
| `className` | `String` | `""`      | Custom classes for the root element.    |
| `color`     | `string` | `primary` | The semantic color variant.             |
| `size`      | `string` | `md`      | The size variant.                       |
| `type`      | `string` | `solid`   | The styling variant for border          |
| `label`     | `string` | `""`      | The text to display inside the divider. | `orientation` | `string` | `horizontal` | The orientation of the separator. | `position` | `center` | The position of the content. |

### Slots/Children

- **Default Slot:** Custom content can be passed instead of `label`.
- **leading When true, the icon will be displayed on the left side.
- **trailing When true, the icon will be displayed on the right side.
