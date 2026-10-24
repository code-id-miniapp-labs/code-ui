    # Skeleton Component Specification

## 1. Overview

- **Purpose:** A small visual indicator used to disply loading state
- **Category:** Presentational (No FMS required).
- **Reference:** Nuxt UI v4 / Tailwind UI Badge Patterns.

## 2. Visual Specification (The Theme)

_Implemented in `packages/core/src/theme/definitions/skeleton.ts`_

### Slots

- **root:** The skeleton container

### Variants

| Variant   | Options                  | Description                     |
| :-------- | :----------------------- | :------------------------------ |
| `variant` | `pulse`, `shine`, `none` | Animation of skeleton component |

## 3. Behavioral Specification

- **N/A:** This is a presentational component. It does not maintain internal state.

## 4. Component API (The Runtime)

_Implemented in `packages/components/src/runtime/skeleton/`_

### Props

| Prop        | Type     | Default | Description                           |
| :---------- | :------- | :------ | :------------------------------------ |
| `ui`        | `Object` | `{}`    | Nuxt UI v4 style overrides for slots. |
| `className` | `String` | `""`    | Custom classes for the root element.  |
| `variant`   | `String` | `pulse` | The variant of the component (pulse   | shine | none). |
