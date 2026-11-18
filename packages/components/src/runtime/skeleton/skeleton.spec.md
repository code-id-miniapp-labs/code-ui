# Skeleton

## Overview & Tier

- **Purpose:** A visual placeholder component used to indicate a loading state while content is being fetched or rendered.
- **Architecture Tier:** **Tier 1 Presentational** — imports only `computedBehavior` and `createComponentOptions` from `../_shared/base`, with no FSM machine or domain relation behavior.
- **Related Components:** None (standalone component).

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui` | `Object` | `{}` | Per-slot class overrides (e.g. `{ root: "..." }`). |
| `className` | `String` | `""` | Additional CSS classes applied to the `root` element (declared as `className` in `properties` and passed as the `class` override to `resolveSlots`; no separate `class` prop is declared). |
| `variant` | `String` | `"pulse"` | Loading animation variant: `"pulse"`, `"shine"`, or `"none"`. |

## Slots

- **Default slot (`<slot />`):** Projected directly inside the root `<view class="{{classes.root}}">`.
- **Named slots:** None.
- **MiniProgram constraints:** `slots: { default: false }` is configured in `index.ts`. WeChat MiniProgram `<slot>` is static (no scoped slot props and no fallback content inside `<slot>`), and `index.wxml` renders `<slot />` unconditionally without fallback markup.

## Events

None.

## Theme

Defined in `packages/core/src/theme/definitions/skeleton.ts`:

- **`slots`**:
  - `root`: `"bg-accented rounded-sm"`
- **`variants`**:
  - `variant`:
    - `pulse`: `{ root: "animate-pulse" }`
    - `shine`: `{ root: "cui-skeleton-shine" }`
    - `none`: `{ root: "" }`
- **`defaultVariants`**:
  - `variant`: `"pulse"`

## Examples

### WXML

```xml
<!-- Default pulse skeleton -->
<c-skeleton className="h-4 w-48" />

<!-- Shine variant with rounded avatar shape via ui -->
<c-skeleton variant="shine" ui="{{ skeletonUi }}" />

<!-- Static animation with slotted placeholder children -->
<c-skeleton variant="none" className="p-4">
  <view class="h-4 w-32" />
</c-skeleton>
```

### TypeScript

```ts
Page({
  data: {
    skeletonUi: {
      root: "h-12 w-12 rounded-full",
    },
  },
});
```
