# Avatar (`c-avatar`)

## Overview & Tier

- **Purpose**: Displays a circular avatar image with automatic fallback to a custom `icon` slot, a `<c-icon>` via the `icon` prop, a `default` slot, or computed initials/text when `src` is omitted or fails to load.
- **Architecture Tier**: **Tier 1 (Presentational)** (`../_shared/base` via `computedBehavior` and `createComponentOptions`, no FSM machine), with **Tier 3 (Domain)** relation integration via `cuiAvatarItemBehavior` and `setupAvatarGroupRelations(relations, "child")` from `@code-id-labs/miniapp/behaviors/avatar-group`.
- **Compound Components**: Child item of `c-avatar-group` (receives group layout/sizing data such as `groupSize`, `groupAttached`, `groupHidden`, `groupOrder`, `groupZIndex`, `groupIsEdge`, and `groupBaseClass` when linked).

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `String` | `""` | Image URL rendered in the `<image>` element. When empty or after an image load error, the fallback branch is rendered instead. |
| `alt` | `String` | `""` | Alternative text used to compute fallback initials (up to 2 characters from space-separated words, or verbatim if starting with `+` or `isGroupCounter` is `true`) when `text` is empty. |
| `mode` | `String` | `"aspectFill"` | WeChat `<image>` `mode` attribute controlling cropping/scaling. |
| `lazyLoad` | `Boolean` | `true` | Passed to the `<image>` `lazy-load` attribute. |
| `color` | `String` | `"neutral"` | Theme color variant (`"neutral"` or any color in `DEFAULT_THEME_COLORS`). |
| `icon` | `String` | `""` | Icon name passed to `<c-icon>` in the fallback branch when `slots.icon` is inactive. |
| `text` | `String` | `""` | Explicit fallback text; takes precedence over `alt` for `fallbackText` (formatted as up to 2 initials unless starting with `+` or `isGroupCounter` is `true`). |
| `size` | `String` | `"md"` | Size variant (`"3xs"`, `"2xs"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"`, `"3xl"`). Overridden by `groupSize` when inside `c-avatar-group`. |
| `ui` | `Object` | `{}` | Per-slot class overrides merged via `resolveSlots` for `root`, `image`, `fallback`, and `icon`. |
| `className` | `String` | `""` | Additional root class string passed to `resolveSlots` (note: this component declares `className` rather than `class` in `properties`). |
| `isGroupCounter` | `Boolean` | `false` | When `true`, renders `text`/`alt` verbatim without extracting initials (used for overflow counter avatars in groups). |

## Slots

Declared in component `slots`: `default: false`, `icon: false`.

| Slot | Behavior |
| --- | --- |
| `icon` | Named slot rendered in the fallback branch (`!src \|\| imageError`) when `slots.icon` is active. Takes precedence over the `icon` prop, `default` slot, and `fallbackText`. |
| `default` | Default slot rendered in the fallback branch when `slots.default` is active and neither `slots.icon` nor the `icon` prop is used. Takes precedence over `fallbackText`. |

**MiniProgram Static `<slot>` Constraints**:
- WeChat MiniProgram `<slot>` does not support inline fallback content inside `<slot>...</slot>`. Instead, `index.wxml` uses `wx:if` / `wx:elif` / `wx:else` driven by `slots.icon` and `slots.default` (`<slot wx:if="{{slots.icon}}" name="icon" />` → `<c-icon wx:elif="{{icon}}" ... />` → `<slot wx:elif="{{slots.default}}" />` → `<view wx:else class="{{classes.fallback}}">{{fallbackText}}</view>`).
- When `src` is non-empty and has not errored, only `<image>` is mounted; fallback slots are not rendered.

## Events

None. (The internal `binderror="onImageError"` handler on `<image>` switches `imageError` to `true` to activate the fallback branch without emitting a custom event.)

## Theme

Defined in `packages/core/src/theme/definitions/avatar.ts`:

- **Slots**:
  - `root`: `"relative overflow-hidden inline-flex items-center justify-center shrink-0 select-none rounded-full align-middle"`
  - `image`: `"absolute inset-0 h-full w-full rounded-full object-cover block"`
  - `fallback`: `"font-medium truncate text-sm"`
  - `icon`: `"shrink-0"`
- **Variants**:
  - `color`:
    - Each color in `DEFAULT_THEME_COLORS` (from `options.colors ?? DEFAULT_THEME_COLORS`): `root: "bg-${color}/10"`, `fallback: "text-${color}"`, `icon: "text-${color}"`
    - `neutral`: `root: "bg-elevated"`, `fallback: "text-muted"`, `icon: "text-muted"`
  - `size`:
    - `"3xs"`: `root: "size-4"`, `fallback: "text-[length:calc(var(--spacing)_*_2)]"`
    - `"2xs"`: `root: "size-5"`, `fallback: "text-3xs"`
    - `"xs"`: `root: "size-6"`, `fallback: "text-xs"`
    - `"sm"`: `root: "size-7"`, `fallback: "text-xs"`
    - `"md"`: `root: "size-8"`, `fallback: "text-sm"`
    - `"lg"`: `root: "size-9"`, `fallback: "text-md"`
    - `"xl"`: `root: "size-10"`, `fallback: "text-lg"`
    - `"2xl"`: `root: "size-11"`, `fallback: "text-xl"`
    - `"3xl"`: `root: "size-12"`, `fallback: "text-2xl"`
- **Default Variants**:
  - `size`: `"md"`
  - `color`: `"neutral"`

## Examples

### WXML

```xml
<!-- Image avatar with alt initials fallback -->
<c-avatar src="{{avatarUrl}}" alt="Jane Doe" size="lg" />

<!-- Initials / counter text fallback with color variant -->
<c-avatar text="Ada Lovelace" color="primary" />
<c-avatar text="+5" isGroupCounter="{{true}}" />

<!-- Icon prop fallback & custom ui / className overrides -->
<c-avatar
  icon="lucide:user"
  className="ring-2 ring-primary"
  ui="{{avatarUi}}"
/>

<!-- Named icon slot & default slot fallbacks -->
<c-avatar>
  <view slot="icon">★</view>
</c-avatar>
<c-avatar>
  <text>VIP</text>
</c-avatar>
```

### TypeScript (Page / Parent Component)

```ts
Page({
  data: {
    avatarUrl: "https://example.com/avatar.png",
    avatarUi: {
      root: "border border-default",
      fallback: "tracking-wide",
    },
  },
});
```
