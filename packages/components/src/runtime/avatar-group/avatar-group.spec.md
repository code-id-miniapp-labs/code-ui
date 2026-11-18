# `c-avatar-group` (`avatar-group`)

## Overview & Tier

- **Purpose**: Displays a stacked horizontal group of overlapping avatars with an optional overflow counter (`+<overflowCount>`) rendered via `<c-avatar>` when the number of child avatars exceeds `max`.
- **Architecture Tier**:
  - **Tier 1 (Presentational)** base runtime: imports `computedBehavior` and `createComponentOptions` from `../_shared/base` (no FSM machine).
  - **Tier 3 (Domain Relations)**: integrates `cuiAvatarGroupBehavior` and `setupAvatarGroupRelations(relations, "parent")` from `@code-id-labs/miniapp/behaviors/avatar-group` to coordinate parent/child avatar state (`totalCount`, `overflowCount`).
- **Related Components**:
  - Child: `c-avatar` (passed into the default slot, and also rendered internally as the overflow counter `<c-avatar isGroupCounter="{{true}}" />` when `overflowCount > 0`).

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `String` | `"md"` | Size variant applied to the group theme and forwarded to the overflow `<c-avatar>`. One of `"3xs"`, `"2xs"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"`, `"3xl"`. |
| `max` | `Number` | `0` | Maximum number of avatars to display before rendering the `+<overflowCount>` counter (`0` disables overflow truncation). |
| `ui` | `Object` | `{}` | Per-slot CSS class overrides merged by `resolveSlots` (keys: `root`, `base`, `counter`). |
| `className` | `String` | `""` | Custom CSS class name passed as the 3rd argument to `resolveSlots` (note: this component declares `className` rather than `class`). |

> Note: `class` is not declared in `properties` on `avatar-group`; use `className` (or `ui.root`) for custom root styling.

## Slots

- **Default slot (`<slot />`)**: Accepts child `<c-avatar>` elements (`slots: { default: false }` in `index.ts`).
- **Layout & Rendering Behavior**:
  - The root `<view>` uses `flex-row-reverse justify-end items-center` and renders the overflow `<c-avatar wx:if="{{overflowCount > 0}}" ... />` before `<slot />` in WXML so the overflow counter appears at the visual end of the reversed stack.
- **MiniProgram Static `<slot>` Constraints**:
  - WeChat MiniProgram `<slot>` is static and does not support scoped slots or passing parent data into slot children, nor does it support fallback content nested inside `<slot>`.
  - Parent-child coordination (counting children, computing `overflowCount`, and propagating group settings) is handled via component relations (`setupAvatarGroupRelations`) and `cuiAvatarGroupBehavior` rather than slot props.

## Events

None.

## Theme

Defined in `packages/core/src/theme/definitions/avatar-group.ts`:

### Slots

| Slot | Base Classes | Usage in Runtime |
| --- | --- | --- |
| `root` | `"inline-flex flex-row-reverse justify-end items-center"` | Applied to the outer `<view>` container. |
| `base` | `"relative rounded-full ring-bg ring-2 first:me-0"` | Passed as `className` to the overflow `<c-avatar>`. |
| `counter` | `"font-semibold tracking-tight"` | Passed as `ui={{ { fallback: classes.counter } }}` (`counterUi`) to the overflow `<c-avatar>`. |

### Variants

- `size`:
  - `"3xs"`: `base`: `"ring -me-0.5"`, `counter`: `"text-3xs ps-0.5"`
  - `"2xs"`: `base`: `"ring -me-0.5"`, `counter`: `"text-3xs ps-0.5"`
  - `"xs"`: `base`: `"ring -me-0.5"`, `counter`: `"text-3xs ps-0.5"`
  - `"sm"`: `base`: `"ring-2 -me-1"`, `counter`: `"text-2xs ps-0.5"`
  - `"md"`: `base`: `"ring-2 -me-1.5"`, `counter`: `"text-xs ps-1"`
  - `"lg"`: `base`: `"ring-2 -me-1.5"`, `counter`: `"text-xs ps-1"`
  - `"xl"`: `base`: `"ring-3 -me-2"`, `counter`: `"text-sm ps-1.5"`
  - `"2xl"`: `base`: `"ring-3 -me-2"`, `counter`: `"text-base ps-1.5"`
  - `"3xl"`: `base`: `"ring-3 -me-2"`, `counter`: `"text-lg ps-1.5"`

### Default Variants

- `size`: `"md"`

## Examples

### WXML

```xml
<!-- Basic stacked avatar group with max overflow counter -->
<c-avatar-group size="md" max="{{2}}">
  <c-avatar src="https://example.com/a.jpg" alt="Alice" />
  <c-avatar src="https://example.com/b.jpg" alt="Bob" />
  <c-avatar src="https://example.com/c.jpg" alt="Charlie" />
</c-avatar-group>

<!-- With custom className and per-slot ui overrides -->
<c-avatar-group size="lg" max="{{3}}" className="my-4" ui="{{groupUi}}">
  <c-avatar text="A" />
  <c-avatar text="B" />
  <c-avatar text="C" />
  <c-avatar text="D" />
</c-avatar-group>
```

### TS (Page / Parent Component)

```ts
Page({
  data: {
    groupUi: {
      root: "gap-0",
      counter: "bg-primary text-inverted",
    },
  },
});
```
