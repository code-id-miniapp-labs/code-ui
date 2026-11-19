# App (`c-app`)

## Overview & Tier

Root application shell and host component for WeChat MiniProgram pages. It manages safe-area and top/bottom bar CSS variables, coordinates page-scaling transitions (`#cui-page-scale`) for host overlays/drawers, applies resolved theme mode (`light` / `dark`) and CSS variables, and renders the global `<c-toast>` notification stack.

- **Architecture Tier**: **Tier 3 Domain**
  - Uses `computedBehavior` and `createComponentOptions` from `../_shared/base` (no FSM machine in `packages/machines/app`).
  - Composes domain behaviors from `@code-id-labs/miniapp/behaviors/app` (`cuiAppParentBehavior`, `createAppHostBehavior`, `setupAppRelations`), `@code-id-labs/miniapp/behaviors/theme` (`createAppThemeBehavior`), and `@code-id-labs/miniapp/behaviors/toast` (`createToastHostBehavior`).
- **Related Components**:
  - Registers parent-side app relations (`setupAppRelations(relations, "parent")`) for child components that coordinate with the app host.
  - Internally renders `<c-toast>` instances inside its `toaster` container.

---

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `safeArea` (`safe-area`) | `String` | `"none"` | Safe-area padding strategy passed into layout resolution for root CSS variables. |
| `scaleBackground` (`scale-background`) | `String` | `"bg-black"` | Backdrop color or utility class applied to the `root` slot when scaled. Values starting with `#` or `rgb` are set as inline `background-color`; other values are appended as classes. |
| `scaleFactor` (`scale-factor`) | `Number` | `0.94` | Transform scale factor applied to `scaleWrapper` when scaled (unless overridden by host/gesture scale). |
| `maxToasts` (`max-toasts`) | `Number` | `2` | Maximum number of simultaneous toasts managed by the toast host behavior. |
| `topBarHeight` (`top-bar-height`) | `Number` | `0` | Explicit top bar height override (px) used in layout CSS variable calculation. |
| `bottomBarHeight` (`bottom-bar-height`) | `Number` | `0` | Explicit bottom bar height override (px) used in layout CSS variable calculation. |
| `autoDetectBars` (`auto-detect-bars`) | `Boolean` | `true` | Automatically detects connected top/bottom bar heights when explicit heights are not provided. |
| `colorMode` (`color-mode`) | `String` | `""` | Optional theme mode override (`"light"` or `"dark"`). Falls back to the resolved app theme mode when empty. |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot (`root`, `scaleWrapper`, `toaster`). |
| `className` (`class-name`) | `String` | `""` | Additional class string merged onto the `root` slot via `resolveSlots` (declared as `className` instead of `class`). |

---

## Slots

| Slot Name | Description |
| :--- | :--- |
| *(default)* | Main page content rendered inside `#cui-page-scale` (`scaleWrapper`), participating in scale transforms when `scaled` is active. |
| `overlay` | Overlay content rendered directly under `root`, outside `scaleWrapper`, so it stays unscaled above the page content and below the toast stack. |

> **MiniProgram Slot Constraints**: WeChat MiniProgram `<slot>` elements are static (no scoped slots or dynamic data passed into slots) and do not support fallback default content nested inside `<slot>`. Neither the default slot nor `overlay` defines fallback markup.

---

## Events

None. Internal `<c-toast>` `bind:dismiss` events are handled internally by `handleToastDismiss` from `toastHostBehavior`.

---

## Theme

Defined in `packages/core/src/theme/definitions/app.ts`:

### Slots

| Slot | Default Classes |
| :--- | :--- |
| `root` | `relative flex flex-col min-h-screen box-border text-default transition-colors duration-300` |
| `scaleWrapper` | `w-full flex-1 flex flex-col box-border bg-default text-default origin-top transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]` |
| `toaster` | `fixed z-[100] pointer-events-none` |

### Variants

| Variant | Values | Slot Overrides |
| :--- | :--- | :--- |
| `scaled` | `true` | `root`: `bg-black`<br>`scaleWrapper`: *(none)* |
| `scaled` | `false` | `root`: `bg-default`<br>`scaleWrapper`: *(none)* |

### Default Variants

```ts
{
  scaled: false,
}
```

> At runtime, the component also appends the effective theme mode (`"light"` or `"dark"`) to `root`, and applies `scaleBackground` (class or inline `background-color`) when scaled.

---

## Examples

### WXML

```xml
<c-app
  safe-area="all"
  color-mode="{{ colorMode }}"
  scale-factor="{{ 0.94 }}"
  scale-background="bg-black"
  max-toasts="{{ 2 }}"
  class-name="min-h-screen"
  ui="{{ appUi }}"
>
  <view class="p-4">
    <text>Main page content</text>
  </view>

  <view slot="overlay">
    <!-- Unscaled overlay content -->
  </view>
</c-app>
```

### Page TypeScript

```ts
Page({
  data: {
    colorMode: "light",
    appUi: {
      scaleWrapper: "px-4",
    },
  },
});
```
