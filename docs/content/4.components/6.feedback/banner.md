---
title: Banner
description: Displays a fixed or inline announcement or notification banner with optional leading icon, image, badge, caption, title, description, action buttons, and dismiss or more controls.
---

## Overview

`c-banner` displays a fixed or inline announcement or notification banner with optional leading icon, image, badge, caption, title, description, action buttons, and dismiss or more controls.

- **Optional Parent**: `c-app` — when `autoInset` is enabled, fixed banners automatically coordinate inset CSS variables with an enclosing `c-app` container.
- **Internal Subcomponents**: `c-icon`, `c-badge`, and `c-button`.

::callout{icon="i-lucide-info" color="info"}
Root class customization uses `className` rather than `class`. Note that the runtime `imagePosition` property defaults to `"left"`, whereas the theme's `defaultVariants.imagePosition` defaults to `"none"`.
::

## Usage

### Basic

Use `title`, `description`, and `caption` to display banner content. Set `mode="inline"` when placing a banner inside normal page flow.

```html [index.wxml]
<c-banner
  mode="inline"
  caption="Announcement"
  title="System update available"
  description="Restart the MiniProgram to apply the latest changes."
/>
```

### Color

Use the `color` prop to change the banner color theme (`"primary"`, `"secondary"`, `"success"`, `"info"`, `"warning"`, `"error"`, `"danger"`, or `"neutral"`).

```html [index.wxml]
<c-banner mode="inline" color="primary" title="Primary banner" />
<c-banner mode="inline" color="secondary" title="Secondary banner" />
<c-banner mode="inline" color="success" title="Changes saved successfully" />
<c-banner mode="inline" color="info" title="New version is available" />
<c-banner mode="inline" color="warning" title="Your trial expires in 3 days" />
<c-banner mode="inline" color="error" title="Failed to sync offline data" />
<c-banner mode="inline" color="danger" title="Action required on your account" />
<c-banner mode="inline" color="neutral" title="Scheduled maintenance tonight" />
```

### Variant

Use the `variant` prop to switch between `"solid"`, `"outline"`, `"soft"`, and `"subtle"`.

```html [index.wxml]
<c-banner mode="inline" color="primary" variant="solid" title="Solid variant" />
<c-banner mode="inline" color="primary" variant="outline" title="Outline variant" />
<c-banner mode="inline" color="primary" variant="soft" title="Soft variant" />
<c-banner mode="inline" color="primary" variant="subtle" title="Subtle variant" />
```

### Size

Use the `size` prop to adjust padding, typography, and icon sizing (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`).

```html [index.wxml]
<c-banner mode="inline" size="xs" icon="info" title="Extra small banner" />
<c-banner mode="inline" size="sm" icon="info" title="Small banner" />
<c-banner mode="inline" size="md" icon="info" title="Medium banner" />
<c-banner mode="inline" size="lg" icon="info" title="Large banner" />
<c-banner mode="inline" size="xl" icon="info" title="Extra large banner" />
```

### Mode & Placement

Use `mode` (`"fixed"` or `"inline"`) and `placement` (`"top"`, `"bottom"`, or `"inline"`) to position the banner. For fixed banners, use `topOffset` or `bottomOffset` to override spacing, and `autoInset` to coordinate inset CSS variables with an enclosing `c-app`.

```html [index.wxml]
<!-- Fixed top banner coordinating insets with c-app -->
<c-banner
  mode="fixed"
  placement="top"
  topOffset="{{16}}"
  autoInset="{{true}}"
  title="Pinned to the top"
/>

<!-- Fixed bottom banner with custom offset -->
<c-banner
  mode="fixed"
  placement="bottom"
  bottomOffset="24rpx"
  title="Pinned to the bottom"
/>

<!-- Inline banner inside page flow -->
<c-banner
  mode="inline"
  placement="inline"
  title="Inline banner"
/>
```

### Icon & Badge

Pass `icon` to render a leading `c-icon`, and `badge` as a string or a `BannerBadgeProps` object (`label`, `color`, `variant`, `size`, `ui`, `className`).

::code-group

```html [index.wxml]
<!-- String badge with leading icon -->
<c-banner
  mode="inline"
  color="info"
  variant="soft"
  icon="info"
  badge="New"
  title="Release 2.4 is live"
/>

<!-- Customized BannerBadgeProps object -->
<c-banner
  mode="inline"
  color="neutral"
  variant="outline"
  badge="{{customBadge}}"
  title="Beta features enabled"
/>
```

```ts [index.ts]
Page({
  data: {
    customBadge: {
      label: "Beta",
      color: "warning",
      variant: "soft",
      size: "xs",
    },
  },
});
```

::

### Image

Use `image` with `imagePosition` (`"left"`, `"right"`, `"background"`, `"none"`), `imageShape` (`"square"`, `"rect"`, `"full"`), and `imageMode` to display media inside the banner.

```html [index.wxml]
<c-banner
  mode="inline"
  image="https://example.com/cover.jpg"
  imagePosition="left"
  imageShape="square"
  imageMode="aspectFill"
  title="Featured update"
  description="Explore the latest additions."
/>

<c-banner
  mode="inline"
  image="https://example.com/backdrop.jpg"
  imagePosition="background"
  title="Seasonal event"
  description="Limited-time rewards available now."
/>
```

### Close & More Controls

Use `close` and `more` to toggle the trailing controls or pass `BannerButtonProps` objects to customize the underlying `c-button` instances.

::code-group

```html [index.wxml]
<!-- Hide close button and enable default more button -->
<c-banner
  mode="inline"
  title="Details available"
  close="{{false}}"
  more="{{true}}"
  bind:more="onBannerMore"
/>

<!-- Custom button props for close and more -->
<c-banner
  mode="inline"
  title="Check out what changed"
  close="{{closeButtonProps}}"
  more="{{moreButtonProps}}"
  bind:dismiss="onBannerDismiss"
  bind:more="onBannerMore"
/>
```

```ts [index.ts]
Page({
  data: {
    closeButtonProps: {
      color: "neutral",
      variant: "ghost",
      size: "xs",
    },
    moreButtonProps: {
      label: "Details",
      variant: "ghost",
      size: "xs",
    },
  },

  onBannerMore() {
    wx.navigateTo({ url: "/pages/changelog/index" });
  },

  onBannerDismiss() {
    console.log("Banner dismissed");
  },
});
```

::

### Actions

Pass `actions` as an array of strings or `BannerAction` objects (`label`, `icon`, `leadingIcon`, `trailingIcon`, `loading`, `loadingIcon`, `disabled`, `color`, `variant`, `size`, `id`, `closeOnClick`, `ui`, `className`, `onClick`) to render an actions bar at the bottom of the banner.

::code-group

```html [index.wxml]
<c-banner
  mode="inline"
  color="primary"
  variant="soft"
  icon="info"
  title="System update available"
  description="Restart the MiniProgram to apply the latest changes."
  actions="{{bannerActions}}"
  bind:action="onBannerAction"
/>
```

```ts [index.ts]
Page({
  data: {
    bannerActions: [
      { label: "Learn more", variant: "ghost", leadingIcon: "book" },
      { label: "Update", color: "primary", closeOnClick: true, loading: false },
    ],
  },

  onBannerAction(e: WechatMiniprogram.CustomEvent<{ action: { label?: string }; index: number }>) {
    console.log("Action tapped:", e.detail.index, e.detail.action);
  },
});
```

::

### Controlled & Uncontrolled

Leave `open` as `null` (default) and use `defaultOpen` for uncontrolled state, or bind `open` with `bind:openChange` / `bind:dismiss` for controlled state.

::code-group

```html [index.wxml]
<!-- Uncontrolled -->
<c-banner
  mode="inline"
  defaultOpen="{{true}}"
  title="Dismissible notice"
  bind:openChange="onOpenChange"
/>

<!-- Controlled -->
<c-banner
  mode="inline"
  open="{{bannerOpen}}"
  title="Controlled notice"
  bind:openChange="onControlledOpenChange"
  bind:dismiss="onBannerDismiss"
/>
```

```ts [index.ts]
Page({
  data: {
    bannerOpen: true,
  },

  onOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean }>) {
    console.log("Open state changed:", e.detail.open);
  },

  onControlledOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean }>) {
    this.setData({ bannerOpen: e.detail.open });
  },

  onBannerDismiss() {
    this.setData({ bannerOpen: false });
  },
});
```

::

### Events

Listen to `bind:tap`, `bind:openChange`, `bind:dismiss`, `bind:action`, and `bind:more`. You can also set `hoverClass` to customize tap feedback on the root element.

::code-group

```html [index.wxml]
<c-banner
  id="promo-banner"
  mode="inline"
  hoverClass="opacity-90"
  title="Tap for details"
  more="{{true}}"
  actions="{{['View']}}"
  bind:tap="onBannerTap"
  bind:openChange="onOpenChange"
  bind:dismiss="onBannerDismiss"
  bind:action="onBannerAction"
  bind:more="onBannerMore"
/>
```

```ts [index.ts]
Page({
  onBannerTap(e: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    console.log("Root tapped:", e.detail.id);
  },

  onOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean; id?: string }>) {
    console.log("Open state:", e.detail.open);
  },

  onBannerDismiss(e: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    console.log("Dismissed:", e.detail.id);
  },

  onBannerAction(e: WechatMiniprogram.CustomEvent<{ index: number; id?: string }>) {
    console.log("Action index:", e.detail.index);
  },

  onBannerMore(e: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    console.log("More tapped:", e.detail.id);
  },
});
```

::

### Slots

Use named slots (`leading`, `badge`, `caption`, `title`, `description`, `image`, `close`, `more`, `buttonArea`, `actions`) and the default slot when their corresponding prop is not set.

```html [index.wxml]
<c-banner mode="inline" variant="outline">
  <view slot="leading" class="text-primary">★</view>
  <view slot="badge" class="text-xs font-semibold">Custom Badge</view>
  <text slot="caption">Custom Caption</text>
  <text slot="title">Custom Title</text>
  <text slot="description">Custom description rendered via slot.</text>
  <view class="text-xs text-muted">Trailing default slot content</view>
  <view slot="close" class="text-xs">Dismiss</view>
  <view slot="actions" class="flex gap-2 pt-2">
    <c-button size="xs" label="Custom Action" />
  </view>
</c-banner>
```

### Custom Styling

Use `ui` to override classes on specific theme slots and `className` to add classes to the root element.

```html [index.wxml]
<c-banner
  mode="inline"
  className="shadow-md"
  ui="{{ { background: 'rounded-xl', title: 'font-bold tracking-wide' } }}"
  title="Custom styled banner"
  description="Per-slot overrides via ui and root className."
/>
```

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean \| null` | `null` | Controlled open state. Leave `null` to use uncontrolled mode (`defaultOpen`). |
| `defaultOpen` | `boolean` | `true` | Initial open state when `open` is `null`. |
| `actions` | `(BannerAction \| string)[]` | `[]` | Action buttons rendered in the bottom actions bar. `BannerAction` supports `label`, `icon`, `leadingIcon`, `trailingIcon`, `loading`, `loadingIcon`, `disabled`, `color`, `variant`, `size`, `id`, `closeOnClick`, `ui`, `className`, and `onClick`. |
| `color` | `BannerColor` | `"primary"` | Color theme (`"primary"`, `"secondary"`, `"success"`, `"info"`, `"warning"`, `"error"`, `"danger"`, `"neutral"`). |
| `variant` | `BannerVariant` | `"solid"` | Visual style (`"solid"`, `"outline"`, `"soft"`, `"subtle"`). |
| `size` | `BannerSize` | `"md"` | Size preset (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). |
| `placement` | `BannerPlacement` | `"top"` | Vertical placement (`"top"`, `"bottom"`, `"inline"`). |
| `mode` | `BannerMode` | `"fixed"` | Layout positioning mode (`"fixed"`, `"inline"`). |
| `title` | `string` | `""` | Banner heading text. |
| `description` | `string` | `""` | Supporting description text. |
| `caption` | `string` | `""` | Short caption text rendered above `title`. |
| `badge` | `string \| BannerBadgeProps \| null` | `null` | Badge rendered above `caption`; accepts a label string or `BannerBadgeProps` (`label`, `color`, `variant`, `size`, `ui`, `className`). |
| `icon` | `string` | `""` | Leading icon name passed to `c-icon`. |
| `image` | `string` | `""` | Image URL passed to `<image>`. |
| `imagePosition` | `BannerImagePosition` | `"left"` | Image placement (`"left"`, `"right"`, `"background"`, `"none"`). |
| `imageShape` | `BannerImageShape` | `"rect"` | Image container shape (`"square"`, `"rect"`, `"full"`). |
| `imageMode` | `string` | `"aspectFill"` | WeChat `<image>` `mode` attribute. |
| `close` | `boolean \| BannerButtonProps \| null` | `true` | Dismiss button config; `true` renders the default close icon button, `false`/`null` hides it, or pass `BannerButtonProps` to customize `c-button`. |
| `more` | `boolean \| BannerButtonProps \| null` | `false` | More button config; `true` renders the default `chevronRight` icon button, `false`/`null` hides it, or pass `BannerButtonProps` to customize `c-button`. |
| `hoverClass` | `string` | `"none"` | WeChat `<view>` `hover-class` applied to the root element. |
| `topOffset` | `number \| string \| null` | `null` | Custom top offset when `mode="fixed"` and `placement="top"` (`px`, `rpx`, `%`, or number converted to `px`). Falls back to `--cui-banner-top-offset` / `--cui-top-bar-height`. |
| `bottomOffset` | `number \| string \| null` | `null` | Custom bottom offset when `mode="fixed"` and `placement="bottom"` (`px`, `rpx`, `%`, or number converted to `px`). Falls back to `--cui-banner-bottom-offset` / `--cui-bottom-bar-height` / `env(safe-area-inset-bottom, 0px)`. |
| `autoInset` | `boolean` | `true` | Coordinates banner inset CSS variables with an enclosing `c-app` component. |
| `ui` | `BannerUI` (`Record<string, string>`) | `{}` | Per-slot CSS class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Custom root CSS class override passed alongside `ui`. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Rendered at the end of the `content` container after `description`. |
| `leading` | Custom leading content rendered when `icon` is empty. |
| `badge` | Custom badge content rendered when `badge` is not set. |
| `caption` | Custom caption content rendered when `caption` is empty. |
| `title` | Custom title content rendered when `title` is empty. |
| `description` | Custom description content rendered when `description` is empty. |
| `image` | Custom image area content rendered when `image` is empty or `imagePosition` is neither `"right"` nor `"none"`. |
| `close` | Custom dismiss control wrapped in a dismiss tap handler instead of the default `c-button`. |
| `more` | Custom more control wrapped in a more tap handler instead of the default `c-button`. |
| `buttonArea` | Custom trailing button area rendered when no `close` or `more` controls or slots are active. |
| `actions` | Custom actions bar rendered when `actions` is empty. |

## Events

| Event | `detail` Payload | Description |
| --- | --- | --- |
| `bind:tap` (`onTap`) | `{ id?: string }` | Fired when the banner root is tapped (excluding trigger controls). |
| `bind:openChange` (`onOpenChange`) | `{ open: boolean; id?: string }` | Fired when the banner open state changes. |
| `bind:dismiss` (`onDismiss`) | `{ id?: string }` | Fired when the banner is dismissed (e.g. via the close button or an action with `closeOnClick: true`). |
| `bind:action` (`onAction`) | `{ action: BannerAction; index: number; id?: string }` | Fired when an action button in `actions` is tapped. |
| `bind:more` (`onMore`) | `{ id?: string }` | Fired when the `more` trigger button is tapped. |

## Theme

Customize the `banner` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    banner: {
      slots: {
        root: "relative w-full z-50 transition-colors pointer-events-auto box-border data-[state=dismissing]:opacity-0 data-[state=dismissing]:-translate-y-2",
        background:
          "relative flex flex-col justify-center mx-auto w-full transition-colors",
        body: "flex items-center justify-between w-full gap-3",
        content: "flex flex-col min-w-0 flex-1 justify-center gap-0.5",
        badge: "inline-flex items-center self-start",
        caption: "text-neutral leading-tight truncate",
        title: "font-medium leading-tight line-clamp-2",
        description: "opacity-90 leading-tight",
        imageArea: "shrink-0 overflow-hidden flex items-center justify-center",
        image: "w-full h-full object-cover",
        icon: "shrink-0",
        buttonArea:
          "flex flex-col justify-between items-center self-start shrink-0 gap-2",
        close:
          "rounded-md transition-opacity opacity-75 hover:opacity-100 shrink-0 cursor-pointer flex items-center justify-center text-inherit",
        closeIcon: "w-4 h-4",
        more: "rounded-md transition-opacity opacity-75 hover:opacity-100 shrink-0 cursor-pointer flex items-center justify-center text-inherit",
        moreIcon: "w-4 h-4",
        actions:
          "flex items-center justify-around divide-x w-full border-t mt-2 pt-2",
        action: "flex-1",
        actionButton: "text-inherit",
        actionIcon: "w-3.5 h-3.5",
      },
      variants: {
        mode: {
          fixed: {
            root: "fixed left-0 right-0 z-[90]",
          },
          inline: {
            root: "relative w-full z-0 rounded-md overflow-hidden",
            background: "rounded-md overflow-hidden",
          },
        },
        placement: {
          top: {
            root: "top-0",
          },
          bottom: {
            root: "bottom-0 data-[state=dismissing]:translate-y-2",
          },
          inline: {
            root: "relative",
          },
        },
        color: Object.assign(
          Object.fromEntries(colors.map((color) => [color, {}])),
          { neutral: {} },
        ),
        variant: {
          solid: {},
          outline: {},
          soft: {
            root: "bg-default",
          },
          subtle: {
            root: "bg-default",
          },
        },
        size: {
          xs: {
            background: "py-1.5 px-2.5 md:px-4 gap-2",
            title: "text-xs",
            description: "text-2xs",
            caption: "text-3xs",
            icon: "w-3.5 h-3.5",
            close: "p-0.5 -mr-0.5",
            more: "p-0.5 -mr-0.5",
          },
          sm: {
            background: "py-2 px-3 md:px-5 gap-2",
            title: "text-xs sm:text-sm",
            description: "text-2xs",
            caption: "text-2xs",
            icon: "w-4 h-4",
            close: "p-1 -mr-1",
            more: "p-1 -mr-1",
          },
          md: {
            background: "py-2.5 px-3 md:px-6 gap-2.5",
            title: "text-sm",
            description: "text-xs",
            caption: "text-sm",
            icon: "w-4.5 h-4.5",
            close: "p-1 -mr-1",
            more: "p-1 -mr-1",
          },
          lg: {
            background: "py-3 px-3.5 md:px-6 gap-3",
            title: "text-base",
            description: "text-sm",
            caption: "text-xs",
            icon: "w-5 h-5",
            close: "p-1.5 -mr-1",
            more: "p-1.5 -mr-1",
          },
          xl: {
            background: "py-3.5 px-4 md:px-8 gap-3.5",
            title: "text-lg",
            description: "text-base",
            caption: "text-sm",
            icon: "w-6 h-6",
            close: "p-1.5 -mr-1",
            more: "p-1.5 -mr-1",
          },
        },
        imageShape: {
          square: {
            imageArea: "w-14 h-14 rounded-lg overflow-hidden shrink-0",
          },
          rect: {
            imageArea: "w-20 h-14 rounded-lg overflow-hidden shrink-0",
          },
          full: {
            imageArea: "w-24 aspect-square shrink-0 overflow-hidden rounded-lg",
          },
        },
        imagePosition: {
          none: {
            imageArea: "hidden",
            image: "hidden",
          },
          left: {
            imageArea: "shrink-0 overflow-hidden",
          },
          right: {
            imageArea: "shrink-0 overflow-hidden",
          },
          background: {
            root: "overflow-hidden",
            imageArea: "absolute inset-0 w-full h-full",
            image: "w-full h-full opacity-40 object-cover",
            content: "relative z-10",
          },
        },
      },
      compoundVariants: [
        ...colors.map((color) => ({
          color,
          variant: "solid" as const,
          class: {
            background:
              color === "warning"
                ? "bg-warning text-neutral-950"
                : `bg-${color} text-white`,
            icon: color === "warning" ? "text-neutral-950" : "text-white",
            close:
              color === "warning"
                ? "text-neutral-950/80 hover:text-neutral-950"
                : "text-white/80 hover:text-white",
            more:
              color === "warning"
                ? "text-neutral-950/80 hover:text-neutral-950"
                : "text-white/80 hover:text-white",
            actions:
              color === "warning"
                ? "border-neutral-950/15 divide-neutral-950/15"
                : "border-white/20 divide-white/20",
          },
        })),
        {
          color: "neutral" as const,
          variant: "solid" as const,
          class: {
            background: "bg-inverted text-inverted",
            icon: "text-inverted",
            close: "text-inverted/80 hover:text-inverted",
            more: "text-inverted/80 hover:text-inverted",
            actions: "border-accented/30 divide-accented/30",
          },
        },

        ...colors.map((color) => ({
          color,
          variant: "outline" as const,
          class: {
            background: `bg-default border border-${color}/30 text-highlighted`,
            icon: `text-${color}`,
            close: "text-muted hover:text-default",
            more: "text-muted hover:text-default",
            actions: `border-${color}/20 divide-${color}/20`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "outline" as const,
          class: {
            background: "bg-default border border-default text-highlighted",
            icon: "text-highlighted",
            close: "text-muted hover:text-default",
            more: "text-muted hover:text-default",
            actions: "border-default divide-default",
          },
        },

        ...colors.map((color) => ({
          color,
          variant: "soft" as const,
          class: {
            background: `bg-${color}/10 text-${color}`,
            icon: `text-${color}`,
            close: `text-${color}/70 hover:text-${color}`,
            more: `text-${color}/70 hover:text-${color}`,
            actions: `border-${color}/20 divide-${color}/20`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "soft" as const,
          class: {
            background: "bg-elevated text-highlighted",
            icon: "text-default",
            close: "text-muted hover:text-default",
            more: "text-muted hover:text-default",
            actions: "border-default divide-default",
          },
        },

        ...colors.map((color) => ({
          color,
          variant: "subtle" as const,
          class: {
            background: `bg-${color}/10 border-b border-${color}/20 text-${color}`,
            icon: `text-${color}`,
            close: `text-${color}/70 hover:text-${color}`,
            more: `text-${color}/70 hover:text-${color}`,
            actions: `border-${color}/20 divide-${color}/20`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "subtle" as const,
          class: {
            background:
              "bg-elevated border-b border-default text-highlighted",
            icon: "text-default",
            close: "text-muted hover:text-default",
            more: "text-muted hover:text-default",
            actions: "border-default divide-default",
          },
        },
      ],
      defaultVariants: {
        color: "primary",
        variant: "solid",
        mode: "fixed",
        placement: "top",
        size: "md",
        imagePosition: "none",
        imageShape: "rect",
      },
    }
  }
})
```
