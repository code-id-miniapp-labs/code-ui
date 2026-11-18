# Toast (`c-toast`)

## Overview & Tier

`c-toast` is a transient notification component for displaying brief feedback messages with optional icons, titles, descriptions, action buttons, a close trigger, and an animated auto-dismiss progress bar. Touching the toast pauses the auto-dismiss countdown and releasing resumes it.

- **Architecture Tier**: **Tier 2 — Interactive / Stateful**
  - Backed by `toastMachine` and `connectToast` from `@code-id-labs/toast` via `createMachineBehavior` (`../_shared/machine`), plus `computedBehavior` and `createComponentOptions` (`../_shared/base`).
  - Exports its machine API (`exportApi: true` under key `"toast"`) for programmatic control (`dismiss()`, `pause()`, `resume()`, `handleAction(index)`).
- **Container Relation**: Registers `cuiAppChildBehavior` and `setupAppRelations(relations, "child")` from `@code-id-labs/miniapp/behaviors/app` so it can be managed as a child of the `c-app` container.

---

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | `undefined` | Unique component identifier synced to the underlying toast machine. |
| `open` | `boolean \| null` | `null` | Controlled visibility state. When `null`, visibility is unmanaged/uncontrolled and starts from `defaultOpen`. |
| `defaultOpen` | `boolean` | `true` | Initial visibility state when `open` is `null`. |
| `duration` | `number` | `4000` | Auto-dismiss duration in milliseconds. Values `<= 0` hide the progress bar. |
| `mode` | `"default" \| "native"` | `"default"` | Visual presentation mode (`"default"` card layout with tint, progress, actions, and close button; `"native"` compact dark overlay layout). |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral" \| string` | `"neutral"` | Semantic color token. `"error"` maps to `"danger"` for theming; `"loading"` maps to `"neutral"` and selects the `"loading"` icon by default. |
| `variant` | `"solid" \| "outline" \| "soft" \| "subtle" \| string` | `"outline"` | Surface visual style variant. |
| `orientation` | `"horizontal" \| "vertical"` | `"vertical"` | Layout direction (used by `"native"` mode compound variants). |
| `placement` | `"top" \| "center" \| "bottom"` | `"top"` | Fixed screen placement. |
| `title` | `string` | `""` | Primary heading text. When non-empty, takes precedence over the `title` slot. |
| `description` | `string` | `""` | Secondary body text. When non-empty, takes precedence over the `description` slot. |
| `icon` | `string` | `""` | Icon name passed to `<c-icon>`. Defaults automatically for `color="success"` (`"check"`), `"danger"` / `"error"` (`"close"`), and `"loading"` (`"loading"`). |
| `actions` | `ToastAction[]` | `[]` | Action button descriptors rendered in `"default"` mode (`mode !== "native"`). Supports `label`, `color`, `variant`, `size`, `icon`, `leadingIcon`, `trailingIcon`, `loading`, `loadingIcon`, `disabled`, `ui`, `className`, `id`, `closeOnClick`, and `onClick`. |
| `progress` | `boolean \| { color?: string }` | `true` | Shows or hides the countdown progress bar in `"default"` mode. Pass `{ color }` to override the progress bar color (`"error"` maps to `"danger"`). |
| `progressPosition` | `"top" \| "bottom"` | `"bottom"` | Edge position of the progress bar. |
| `close` | `boolean \| ToastCloseProps \| null` | `true` | Shows, hides, or customizes the close `<c-button>` in `"default"` mode (`icon`, `color`, `variant`, `size`, `disabled`, `ui`, `className`). |
| `index` | `number` | `0` | Stack index used to compute `z-index` (`100 + index`), `data-index`, and `--cui-toast-index`. |
| `offset` | `number` | `0` | Vertical stack offset in pixels for `top` and `bottom` placements (`--cui-toast-offset`). |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional CSS class(es) merged onto the `root` slot (note: `c-toast` declares `className` rather than `class`). |

---

## Slots

WeChat MiniProgram `<slot>` elements are static and do not support nested fallback content inside `<slot>...</slot>`. `c-toast` uses `slots` feature flags (all defaulting to `false`) together with `wx:if` / `wx:else` conditional fallbacks. There is no unnamed default slot.

| Slot Name | Default Flag | Behavior & Fallback |
| :--- | :--- | :--- |
| `icon` | `false` | Rendered inside `iconWrapper` when `slots.icon` is enabled; otherwise falls back to `<c-icon>` when `icon` (or color-derived default icon) resolves to a non-empty name. |
| `title` | `false` | Prop-first fallback: if `title` is non-empty, renders `<view>` with `title`; otherwise renders `<slot name="title" />`. |
| `description` | `false` | Prop-first fallback: if `description` is non-empty, renders `<view>` with `description`; otherwise renders `<slot name="description" />`. |
| `actions` | `false` | Available only when `mode !== "native"`. Renders `<c-button>` items when `actions` is non-empty; otherwise renders `<slot name="actions" />` when `slots.actions` is enabled. |
| `close` | `false` | Available only when `mode !== "native"`. When `slots.close` is enabled, wraps `<slot name="close" />` in a tap container that dismisses the toast; otherwise renders the default `<c-button>` when `close` is truthy. |

---

## Events

**None** — The MiniProgram `<c-toast>` component does not emit `bind:*` custom events via `triggerEvent`. Touch pause/resume, close taps, and action button taps are handled internally by forwarding to the toast API.

> Note: The underlying `@code-id-labs/toast` machine `ToastProps` type defines programmatic callbacks (`onOpenChange`, `onDismiss`, `onAction`, and `ToastAction.onClick`), which are not wired as MiniProgram component properties in the runtime wrapper.

---

## Theme

Defined in `packages/core/src/theme/definitions/toast.ts`:

- **Slots**:
  `root`, `tint`, `wrapper`, `title`, `description`, `iconWrapper`, `icon`, `actions`, `action`, `closeTrigger`, `closeButton`, `closeIcon`, `progress`, `progressBar`, `progressTrack`, `progressRange`
- **Variants**:
  - `mode`: `"default"`, `"native"`
  - `color`: theme colors (`DEFAULT_THEME_COLORS`, configurable via `options.colors`) and `"neutral"`
  - `variant`: `"outline"`, `"solid"`, `"soft"`, `"subtle"`
  - `orientation`: `"horizontal"`, `"vertical"`
  - `placement`: `"top"`, `"center"`, `"bottom"`
  - `progressPosition`: `"top"`, `"bottom"`
- **Compound Variants**:
  - `mode: "native"` adjustments for `orientation: "horizontal"` (pill layout) and `placement` (`"top"`, `"center"`, `"bottom"`).
  - `mode: "default"` color × variant combinations across `outline`, `solid`, `soft`, and `subtle` (for both theme colors and `"neutral"`).
- **Default Variants**:
  - `mode`: `"default"`
  - `color`: `"neutral"`
  - `variant`: `"outline"`
  - `orientation`: `"vertical"`
  - `placement`: `"top"`
  - `progressPosition`: `"bottom"`

---

## Examples

### Basic Toast with Actions (WXML + TS)

```xml
<c-toast
  open="{{toastOpen}}"
  title="Changes saved"
  description="Your profile settings have been updated."
  color="success"
  variant="soft"
  placement="top"
  duration="{{4000}}"
  actions="{{toastActions}}"
/>
```

```ts
Page({
  data: {
    toastOpen: true,
    toastActions: [
      {
        label: "Undo",
        variant: "outline",
        closeOnClick: true,
        onClick() {
          console.log("Undo tapped");
        },
      },
    ],
  },
});
```

### Compact Native Mode & Custom `ui` Overrides

```xml
<c-toast
  mode="native"
  orientation="horizontal"
  placement="center"
  color="loading"
  title="Loading..."
  ui="{{ { root: 'px-5' } }}"
  className="my-toast"
/>
```
