---
title: Toast
description: Transient notification component for displaying brief feedback messages with optional icons, titles, descriptions, action buttons, a close trigger, and an animated auto-dismiss progress bar.
---

## Overview

`c-toast` is a transient notification component for displaying brief feedback messages with optional icons, titles, descriptions, action buttons, a close trigger, and an animated auto-dismiss progress bar. Touching the toast pauses the auto-dismiss countdown, and releasing resumes it.

- Exports its programmatic API under the `"toast"` key (`dismiss()`, `pause()`, `resume()`, `handleAction(index)`).
- Integrates with the `c-app` container via `cuiAppChildBehavior`.

::callout{icon="i-lucide-info"}
`c-toast` declares `className` rather than `class` for merging additional CSS classes onto the `root` slot.
::

## Usage

### Basic

Use `title` and `description` to display a notification toast. By default, `c-toast` opens immediately (`defaultOpen: true`) at the top of the screen and auto-dismisses after `4000` ms.

```html [index.wxml]
<c-toast
  title="Changes saved"
  description="Your profile settings have been updated."
/>
```

### Color

Use the `color` prop to set the semantic color token (`"primary"`, `"secondary"`, `"success"`, `"info"`, `"warning"`, `"error"`, or `"neutral"`). Passing `"error"` maps to `"danger"` for theming, and `"loading"` maps to `"neutral"` while selecting the `"loading"` icon by default.

```html [index.wxml]
<c-toast color="primary" title="Primary notification" />
<c-toast color="success" title="Saved successfully" />
<c-toast color="warning" title="Storage almost full" />
<c-toast color="error" title="Failed to save changes" />
<c-toast color="loading" title="Syncing data..." />
```

### Variant

Use the `variant` prop to change the surface style in `"default"` mode. Available variants are `"outline"` (default), `"solid"`, `"soft"`, and `"subtle"`.

```html [index.wxml]
<c-toast color="primary" variant="outline" title="Outline" />
<c-toast color="primary" variant="solid" title="Solid" />
<c-toast color="primary" variant="soft" title="Soft" />
<c-toast color="primary" variant="subtle" title="Subtle" />
```

### Mode & Orientation

Use `mode` to switch between the `"default"` card layout (with tint, progress bar, actions, and close button) and the `"native"` compact dark overlay layout. In `"native"` mode, set `orientation="horizontal"` for a compact pill layout instead of the default `"vertical"` stack.

```html [index.wxml]
<c-toast
  mode="native"
  color="loading"
  title="Loading..."
/>

<c-toast
  mode="native"
  orientation="horizontal"
  icon="check"
  title="Copied to clipboard"
/>
```

### Placement

Use `placement` to position the toast at `"top"` (default), `"center"`, or `"bottom"`.

```html [index.wxml]
<c-toast placement="top" title="Top toast" />
<c-toast placement="center" title="Center toast" />
<c-toast placement="bottom" title="Bottom toast" />
```

### Icon

Use the `icon` prop to pass an icon name to `<c-icon>`. When `icon` is omitted, `c-toast` automatically selects `"check"` for `color="success"`, `"close"` for `color="error"` (or `"danger"`), and `"loading"` for `color="loading"`.

```html [index.wxml]
<c-toast
  icon="bell"
  color="info"
  title="New message"
  description="You have 3 unread notifications."
/>
```

### Actions

Pass an array of `ToastAction` objects to `actions` to render `<c-button>` controls in `"default"` mode (`mode !== "native"`). Each action supports `label`, `color`, `variant`, `size`, `icon`, `leadingIcon`, `trailingIcon`, `loading`, `loadingIcon`, `disabled`, `ui`, `className`, `id`, `closeOnClick`, and `onClick`.

::code-group

```html [index.wxml]
<c-toast
  title="File deleted"
  description="report.pdf was moved to trash."
  color="neutral"
  variant="soft"
  actions="{{toastActions}}"
/>
```

```ts [index.ts]
Page({
  data: {
    toastActions: [
      {
        label: "Undo",
        color: "primary",
        variant: "outline",
        size: "xs",
        closeOnClick: true,
        onClick() {
          console.log("Undo tapped");
        },
      },
    ],
  },
});
```

::

### Close

Use `close` in `"default"` mode (`mode !== "native"`) to show (`true`, default), hide (`false` or `null`), or customize the close `<c-button>` with `ToastCloseProps` (`icon`, `color`, `variant`, `size`, `disabled`, `ui`, `className`).

::code-group

```html [index.wxml]
<c-toast
  title="Auto-dismiss only"
  close="{{false}}"
/>

<c-toast
  title="Custom close button"
  close="{{customClose}}"
/>
```

```ts [index.ts]
Page({
  data: {
    customClose: {
      icon: "close",
      color: "neutral",
      variant: "ghost",
      size: "xs",
    },
  },
});
```

::

### Duration & Progress

Use `duration` (default `4000` ms) to configure the auto-dismiss timer; setting `duration` to `0` or less hides the progress bar. Use `progress` to show (`true`, default), hide (`false`), or override the bar color (`{ color }`), and `progressPosition` (`"top"` or `"bottom"`, default) to place the bar along the top or bottom edge.

::code-group

```html [index.wxml]
<c-toast
  title="Uploading attachment"
  duration="{{6000}}"
  progress="{{progressConfig}}"
  progressPosition="top"
/>

<c-toast
  title="Persistent notice"
  duration="{{0}}"
  progress="{{false}}"
/>
```

```ts [index.ts]
Page({
  data: {
    progressConfig: {
      color: "primary",
    },
  },
});
```

::

### Stacking (`index` & `offset`)

Use `index` to control the stacking order (`z-index: 100 + index`, `data-index`, and `--cui-toast-index`) and `offset` to apply a vertical pixel offset (`--cui-toast-offset`) for `"top"` and `"bottom"` placements.

```html [index.wxml]
<c-toast
  placement="top"
  index="{{1}}"
  offset="{{72}}"
  title="Second notification"
/>
```

### Controlled Visibility & Programmatic API

Leave `open` as `null` (default) for uncontrolled visibility starting from `defaultOpen`, or pass a boolean `open` prop for controlled visibility. Touching a toast pauses the auto-dismiss countdown and releasing resumes it, and the component exports its `"toast"` API (`dismiss()`, `pause()`, `resume()`, `handleAction(index)`).

::code-group

```html [index.wxml]
<c-toast
  id="save-toast"
  open="{{toastOpen}}"
  defaultOpen="{{false}}"
  title="Draft saved"
/>
```

```ts [index.ts]
Page({
  data: {
    toastOpen: true,
  },
});
```

::

### Slots

`c-toast` provides named `title`, `description`, `icon`, `actions`, and `close` slots. When the `title` or `description` prop is non-empty, it takes precedence over the corresponding slot; `actions` and `close` slots are only available when `mode !== "native"`.

```html [index.wxml]
<c-toast>
  <view slot="title" class="font-semibold">Custom Title</view>
  <view slot="description" class="text-xs">Rendered via the description slot.</view>
</c-toast>
```

### Custom Styling (`ui` & `className`)

Use `className` to merge classes onto the `root` slot, and `ui` to override classes on individual theme slots (`root`, `tint`, `wrapper`, `title`, `description`, `iconWrapper`, `icon`, `actions`, `action`, `closeTrigger`, `closeButton`, `closeIcon`, `progress`, `progressBar`, `progressTrack`, `progressRange`).

::code-group

```html [index.wxml]
<c-toast
  title="Custom styled toast"
  description="With per-slot ui overrides."
  className="my-toast"
  ui="{{toastUi}}"
/>
```

```ts [index.ts]
Page({
  data: {
    toastUi: {
      root: "px-5",
      title: "text-primary",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | `undefined` | Unique component identifier synced to the toast state. |
| `open` | `boolean \| null` | `null` | Controlled visibility state. When `null`, visibility is uncontrolled and starts from `defaultOpen`. |
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
| `className` | `string` | `""` | Additional CSS class(es) merged onto the `root` slot. |

## Slots

| Name | Description |
| :--- | :--- |
| `icon` | Custom icon content rendered inside `iconWrapper`. Falls back to `<c-icon>` when `icon` (or a color-derived default icon) resolves to a non-empty name. |
| `title` | Custom title content. Overridden by the `title` prop when non-empty. |
| `description` | Custom description content. Overridden by the `description` prop when non-empty. |
| `actions` | Custom actions content when `mode !== "native"`. Overridden by `<c-button>` items when `actions` is non-empty. |
| `close` | Custom close trigger content when `mode !== "native"`, wrapped in a tap container that dismisses the toast. Falls back to the default `<c-button>` when `close` is truthy. |

## Events

`<c-toast>` does not emit `bind:*` custom events via `triggerEvent`. Touch pause/resume, close taps, and action button taps are handled internally by forwarding to the toast API.

::callout{icon="i-lucide-triangle-alert" color="warning"}
The underlying `@code-id-labs/toast` `ToastProps` type defines programmatic callbacks (`onOpenChange`, `onDismiss`, `onAction`, and `ToastAction.onClick`), which are not wired as component properties in the runtime wrapper.
::

## Theme

Customize the `toast` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    toast: {
      slots: {
        root: "transition-all duration-300 pointer-events-auto box-border data-[state=dismissing]:opacity-0 data-[state=dismissing]:scale-95",
        tint: "absolute inset-0 pointer-events-none z-0",
        wrapper: "min-w-0 flex flex-col relative z-1",
        title: "text-sm font-semibold",
        description: "text-xs",
        iconWrapper: "relative z-1 flex shrink-0",
        icon: "shrink-0",
        actions: "flex items-center gap-2",
        action: "",
        closeTrigger: "shrink-0 cursor-pointer transition-colors relative z-1",
        closeButton: "p-0.5 rounded-md text-inherit",
        closeIcon: "w-4 h-4",
        progress:
          "absolute left-0 right-0 h-0.5 overflow-hidden pointer-events-none z-10",
        progressBar: "w-full h-full min-w-0 overflow-hidden",
        progressTrack: "bg-transparent h-full min-w-0 rounded-none",
        progressRange: "rounded-none h-full min-w-0 transition-none",
      },
      variants: {
        mode: {
          default: {
            root: "w-full max-w-sm md:max-w-md rounded-xl p-4 shadow-lg flex items-start gap-3 border relative overflow-hidden bg-default border-default text-highlighted",
            wrapper: "flex-1 min-w-0 flex flex-col gap-0.5 relative z-1",
            title: "text-sm font-semibold text-highlighted leading-tight",
            description: "text-sm text-muted mt-1 leading-normal",
            iconWrapper: "relative z-1 flex shrink-0",
            icon: "w-5 h-5 mt-0.5 shrink-0",
            actions: "mt-2.5 flex items-center gap-2",
            closeTrigger:
              "p-1 -m-1 rounded-md text-dimmed hover:text-default transition-colors shrink-0 relative z-1",
            progress: "h-0.5",
          },
          native: {
            root: "flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-900/75 backdrop-blur-[2px] border border-white/5 shadow-md text-center min-w-[120px] max-w-[200px] min-h-[100px] text-white",
            wrapper: "flex flex-col items-center justify-center text-center",
            title: "text-sm font-medium text-center text-white leading-snug",
            description: "text-xs text-white/85 text-center mt-1",
            iconWrapper: "flex items-center justify-center shrink-0",
            icon: "w-9 h-9 mb-1.5 text-white shrink-0",
          },
        },
        color: {
          primary: {},
          secondary: {},
          danger: {},
          success: {},
          warning: {},
          info: {},
          neutral: {},
        },
        variant: {
          outline: {},
          solid: {
            root: "text-white border-transparent",
            title: "text-white",
            description: "text-white/85",
            closeTrigger: "text-white/70 hover:text-white",
            icon: "text-white",
            progressRange: "bg-white",
          },
          soft: {
            root: "border-transparent",
          },
          subtle: {
            root: "border",
          },
        },
        orientation: {
          horizontal: {},
          vertical: {},
        },
        placement: {
          top: {
            root: "fixed top-0 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-sm md:max-w-md mt-[calc(var(--cui-toast-top-offset,env(safe-area-inset-top,0px))_+_var(--spacing)_*_4)] z-[100]",
          },
          center: {
            root: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-sm md:max-w-md z-[100]",
          },
          bottom: {
            root: "fixed bottom-0 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-sm md:max-w-md mb-[calc(var(--cui-toast-bottom-offset,env(safe-area-inset-bottom,0px))_+_var(--spacing)_*_4)] z-[100]",
          },
        },
        progressPosition: {
          top: {
            progress: "top-0",
          },
          bottom: {
            progress: "bottom-0",
          },
        },
      },
      compoundVariants: [
        {
          mode: "native",
          orientation: "horizontal",
          class: {
            root: "flex-row items-center justify-center px-4 py-2.5 rounded-full min-w-0 max-w-xs min-h-0 gap-2",
            wrapper: "flex-row items-center gap-1.5",
            title: "text-xs font-medium text-white",
            description: "text-xs text-white/85 mt-0",
            icon: "w-5 h-5 mb-0 shrink-0",
          },
        },
        {
          mode: "native",
          placement: "top",
          class: {
            root: "fixed top-0 left-1/2 -translate-x-1/2 w-auto mt-[calc(var(--cui-toast-top-offset,env(safe-area-inset-top,0px))_+_var(--spacing)_*_4)] z-[100]",
          },
        },
        {
          mode: "native",
          placement: "center",
          class: {
            root: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto z-[100]",
          },
        },
        {
          mode: "native",
          placement: "bottom",
          class: {
            root: "fixed bottom-0 left-1/2 -translate-x-1/2 w-auto mb-[calc(var(--cui-toast-bottom-offset,env(safe-area-inset-bottom,0px))_+_var(--spacing)_*_4)] z-[100]",
          },
        },
        {
          color: "primary",
          variant: "outline",
          mode: "default",
          class: {
            icon: "text-primary",
          },
        },
        {
          color: "secondary",
          variant: "outline",
          mode: "default",
          class: {
            icon: "text-secondary",
          },
        },
        {
          color: "danger",
          variant: "outline",
          mode: "default",
          class: {
            icon: "text-danger",
          },
        },
        {
          color: "success",
          variant: "outline",
          mode: "default",
          class: {
            icon: "text-success",
          },
        },
        {
          color: "warning",
          variant: "outline",
          mode: "default",
          class: {
            icon: "text-warning",
          },
        },
        {
          color: "info",
          variant: "outline",
          mode: "default",
          class: {
            icon: "text-info",
          },
        },
        {
          color: "neutral",
          variant: "outline",
          mode: "default",
          class: {
            icon: "text-highlighted",
          },
        },
        {
          color: "primary",
          variant: "solid",
          mode: "default",
          class: {
            root: "bg-primary border-transparent text-white",
          },
        },
        {
          color: "secondary",
          variant: "solid",
          mode: "default",
          class: {
            root: "bg-secondary border-transparent text-white",
          },
        },
        {
          color: "danger",
          variant: "solid",
          mode: "default",
          class: {
            root: "bg-danger border-transparent text-white",
          },
        },
        {
          color: "success",
          variant: "solid",
          mode: "default",
          class: {
            root: "bg-success border-transparent text-white",
          },
        },
        {
          color: "warning",
          variant: "solid",
          mode: "default",
          class: {
            root: "bg-warning border-transparent text-white",
          },
        },
        {
          color: "info",
          variant: "solid",
          mode: "default",
          class: {
            root: "bg-info border-transparent text-white",
          },
        },
        {
          color: "neutral",
          variant: "solid",
          mode: "default",
          class: {
            root: "bg-inverted text-inverted border-inverted",
            title: "text-inverted",
            description: "text-inverted",
            closeTrigger: "text-inverted",
            icon: "text-inverted",
            progressRange: "bg-default",
          },
        },
        {
          color: "primary",
          variant: "soft",
          mode: "default",
          class: {
            root: "bg-default border-transparent text-primary",
            tint: "bg-primary/10",
            title: "text-primary",
            description: "text-primary/80",
            icon: "text-primary",
            closeTrigger: "text-primary/70 hover:text-primary",
          },
        },
        {
          color: "secondary",
          variant: "soft",
          mode: "default",
          class: {
            root: "bg-default border-transparent text-secondary",
            tint: "bg-secondary/10",
            title: "text-secondary",
            description: "text-secondary/80",
            icon: "text-secondary",
            closeTrigger: "text-secondary/70 hover:text-secondary",
          },
        },
        {
          color: "danger",
          variant: "soft",
          mode: "default",
          class: {
            root: "bg-default border-transparent text-danger",
            tint: "bg-danger/10",
            title: "text-danger",
            description: "text-danger/80",
            icon: "text-danger",
            closeTrigger: "text-danger/70 hover:text-danger",
          },
        },
        {
          color: "success",
          variant: "soft",
          mode: "default",
          class: {
            root: "bg-default border-transparent text-success",
            tint: "bg-success/10",
            title: "text-success",
            description: "text-success/80",
            icon: "text-success",
            closeTrigger: "text-success/70 hover:text-success",
          },
        },
        {
          color: "warning",
          variant: "soft",
          mode: "default",
          class: {
            root: "bg-default border-transparent text-warning",
            tint: "bg-warning/10",
            title: "text-warning",
            description: "text-warning/80",
            icon: "text-warning",
            closeTrigger: "text-warning/70 hover:text-warning",
          },
        },
        {
          color: "info",
          variant: "soft",
          mode: "default",
          class: {
            root: "bg-default border-transparent text-info",
            tint: "bg-info/10",
            title: "text-info",
            description: "text-info/80",
            icon: "text-info",
            closeTrigger: "text-info/70 hover:text-info",
          },
        },
        {
          color: "neutral",
          variant: "soft",
          mode: "default",
          class: {
            root: "bg-elevated border-transparent text-highlighted",
            title: "text-highlighted",
            description: "text-toned",
            icon: "text-default",
            closeTrigger: "text-muted hover:text-highlighted",
          },
        },
        {
          color: "primary",
          variant: "subtle",
          mode: "default",
          class: {
            root: "bg-default border-primary/20 text-primary",
            tint: "bg-primary/10",
            title: "text-primary",
            description: "text-primary/80",
            icon: "text-primary",
            closeTrigger: "text-primary/70 hover:text-primary",
          },
        },
        {
          color: "secondary",
          variant: "subtle",
          mode: "default",
          class: {
            root: "bg-default border-secondary/20 text-secondary",
            tint: "bg-secondary/10",
            title: "text-secondary",
            description: "text-secondary/80",
            icon: "text-secondary",
            closeTrigger: "text-secondary/70 hover:text-secondary",
          },
        },
        {
          color: "danger",
          variant: "subtle",
          mode: "default",
          class: {
            root: "bg-default border-danger/20 text-danger",
            tint: "bg-danger/10",
            title: "text-danger",
            description: "text-danger/80",
            icon: "text-danger",
            closeTrigger: "text-danger/70 hover:text-danger",
          },
        },
        {
          color: "success",
          variant: "subtle",
          mode: "default",
          class: {
            root: "bg-default border-success/20 text-success",
            tint: "bg-success/10",
            title: "text-success",
            description: "text-success/80",
            icon: "text-success",
            closeTrigger: "text-success/70 hover:text-success",
          },
        },
        {
          color: "warning",
          variant: "subtle",
          mode: "default",
          class: {
            root: "bg-default border-warning/20 text-warning",
            tint: "bg-warning/10",
            title: "text-warning",
            description: "text-warning/80",
            icon: "text-warning",
            closeTrigger: "text-warning/70 hover:text-warning",
          },
        },
        {
          color: "info",
          variant: "subtle",
          mode: "default",
          class: {
            root: "bg-default border-info/20 text-info",
            tint: "bg-info/10",
            title: "text-info",
            description: "text-info/80",
            icon: "text-info",
            closeTrigger: "text-info/70 hover:text-info",
          },
        },
        {
          color: "neutral",
          variant: "subtle",
          mode: "default",
          class: {
            root: "bg-elevated border-default text-highlighted",
            title: "text-highlighted",
            description: "text-toned",
            icon: "text-default",
            closeTrigger: "text-muted hover:text-highlighted",
          },
        },
      ],
      defaultVariants: {
        mode: "default",
        color: "neutral",
        variant: "outline",
        orientation: "vertical",
        placement: "top",
        progressPosition: "bottom",
      },
    },
  },
});
```
