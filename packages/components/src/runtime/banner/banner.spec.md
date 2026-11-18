# `c-banner`

## Overview & Tier

- **Purpose**: Displays a fixed or inline announcement/notification banner with optional leading icon, image, badge, caption, title, description, action buttons, and dismiss/more controls.
- **Architecture Tier**: **Tier 2 — Interactive / Stateful**
  - Uses `bannerMachine` and `connectBanner` from `@code-ui/banner`, importing from `../_shared/base` and `../_shared/machine`.
  - Also integrates with `@code-ui/miniapp/behaviors/app` (`cuiAppChildBehavior`, `setupAppRelations(..., "child")`, `withAppBannerInset()`) so fixed banners can coordinate inset offsets with an ancestor `c-app` container.
- **Related Components**:
  - **Parent (optional)**: `c-app` (via MiniProgram child relation when `autoInset` is enabled).
  - **Internal subcomponents**: `c-icon`, `c-badge`, and `c-button`.

---

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
| `imagePosition` | `BannerImagePosition` | `"left"` | Image placement (`"left"`, `"right"`, `"background"`, `"none"`). Note: theme `defaultVariants.imagePosition` is `"none"`, while the runtime property defaults to `"left"`. |
| `imageShape` | `BannerImageShape` | `"rect"` | Image container shape (`"square"`, `"rect"`, `"full"`). |
| `imageMode` | `string` | `"aspectFill"` | WeChat `<image>` `mode` attribute. |
| `close` | `boolean \| BannerButtonProps \| null` | `true` | Dismiss button config; `true` renders the default close icon button, `false`/`null` hides it, or pass `BannerButtonProps` to customize `c-button`. |
| `more` | `boolean \| BannerButtonProps \| null` | `false` | More button config; `true` renders the default `chevronRight` icon button, `false`/`null` hides it, or pass `BannerButtonProps` to customize `c-button`. |
| `hoverClass` | `string` | `"none"` | WeChat `<view>` `hover-class` applied to the root element. |
| `topOffset` | `number \| string \| null` | `null` | Custom top offset when `mode="fixed"` and `placement="top"` (`px`, `rpx`, `%`, or number converted to `px`). Falls back to `--cui-banner-top-offset` / `--cui-top-bar-height`. |
| `bottomOffset` | `number \| string \| null` | `null` | Custom bottom offset when `mode="fixed"` and `placement="bottom"` (`px`, `rpx`, `%`, or number converted to `px`). Falls back to `--cui-banner-bottom-offset` / `--cui-bottom-bar-height` / `env(safe-area-inset-bottom, 0px)`. |
| `autoInset` | `boolean` | `true` | Coordinates banner inset CSS variables with an enclosing `c-app` component. |
| `ui` | `BannerUI` (`Record<string, string>`) | `{}` | Per-slot CSS class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Custom root CSS class override (defined as `className` rather than `class`; passed to `resolveSlots` alongside `ui`). |

---

## Slots

WeChat MiniProgram `<slot>` elements are static (no scoped slots, and default fallback markup nested inside `<slot>` is discarded by the platform). Accordingly, `c-banner` uses conditional `wx:if` / `wx:else` blocks so prop-driven content takes precedence over named slots:

| Slot | Behavior & Conditions |
| --- | --- |
| `(default)` | Always rendered at the end of the `content` container after `description`. |
| `leading` | Rendered only when `icon` is empty (`wx:else` after `<c-icon wx:if="{{icon}}">`). |
| `badge` | Rendered only when `resolvedBadge` is null (`wx:else` after `resolvedBadge`). |
| `caption` | Rendered only when `caption` is empty. |
| `title` | Rendered only when `title` is empty. |
| `description` | Rendered only when `description` is empty. |
| `image` | Rendered via `wx:else` when `!(image && (imagePosition === 'right' || imagePosition === 'none'))`. |
| `close` | Tracked via `slots.close`. When present, wraps `<slot name="close" />` in a `catchtap` dismiss wrapper instead of rendering the default `c-button`. |
| `more` | Tracked via `slots.more`. When present, wraps `<slot name="more" />` in a `catchtap` more wrapper instead of rendering the default `c-button`. |
| `buttonArea` | Rendered via `wx:else` only when `resolvedMore`, `resolvedClose`, `slots.close`, and `slots.more` are all falsy. |
| `actions` | Rendered via `wx:else` only when `resolvedActions.length === 0`. |

---

## Events

Events defined by the banner contract (`BannerProps` callbacks / MiniProgram `bind:*` listeners):

| Event | `detail` Payload | Description |
| --- | --- | --- |
| `bind:tap` (`onTap`) | `{ id?: string }` | Fired when the banner root is tapped (excluding `catchtap` trigger controls). |
| `bind:openChange` (`onOpenChange`) | `{ open: boolean; id?: string }` | Fired when the banner open state changes. |
| `bind:dismiss` (`onDismiss`) | `{ id?: string }` | Fired when the banner is dismissed (e.g. via the close button or an action with `closeOnClick: true`). |
| `bind:action` (`onAction`) | `{ action: BannerAction; index: number; id?: string }` | Fired when an action button in `actions` is tapped. |
| `bind:more` (`onMore`) | `{ id?: string }` | Fired when the `more` trigger button is tapped. |

---

## Theme

Defined in [`packages/core/src/theme/definitions/banner.ts`](file:///Users/rdjanuar/Project/personal/code-ui/packages/core/src/theme/definitions/banner.ts):

- **Slots**:
  `root`, `background`, `body`, `content`, `badge`, `caption`, `title`, `description`, `imageArea`, `image`, `icon`, `buttonArea`, `close`, `closeIcon`, `more`, `moreIcon`, `actions`, `action`, `actionButton`, `actionIcon`
- **Variants**:
  - `mode`: `"fixed"`, `"inline"`
  - `placement`: `"top"`, `"bottom"`, `"inline"`
  - `color`: theme colors (`DEFAULT_THEME_COLORS`) + `"neutral"`
  - `variant`: `"solid"`, `"outline"`, `"soft"`, `"subtle"`
  - `size`: `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`
  - `imageShape`: `"square"`, `"rect"`, `"full"`
  - `imagePosition`: `"none"`, `"left"`, `"right"`, `"background"`
- **Default Variants**:
  - `color`: `"primary"`
  - `variant`: `"solid"`
  - `mode`: `"fixed"`
  - `placement`: `"top"`
  - `size`: `"md"`
  - `imagePosition`: `"none"`
  - `imageShape`: `"rect"`

---

## Examples

### WXML

```xml
<c-banner
  open="{{bannerOpen}}"
  mode="inline"
  color="primary"
  variant="soft"
  icon="info"
  badge="New"
  title="System update available"
  description="Restart the MiniProgram to apply the latest changes."
  actions="{{bannerActions}}"
  bind:action="onBannerAction"
  bind:dismiss="onBannerDismiss"
/>
```

### TypeScript (Page)

```ts
Page({
  data: {
    bannerOpen: true,
    bannerActions: [
      { label: "Learn more", variant: "ghost" },
      { label: "Update", color: "primary", closeOnClick: true },
    ],
  },

  onBannerAction(e: WechatMiniprogram.CustomEvent<{ index: number }>) {
    console.log("Action tapped:", e.detail.index);
  },

  onBannerDismiss() {
    this.setData({ bannerOpen: false });
  },
});
```
