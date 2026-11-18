# Icon (`c-icon`)

## Overview & Tier

- **Purpose**: Renders an icon from the `@code-ui/core/icons` registry (as a CSS icon class on a `<view>`) or an image/SVG asset path or URL (via `<image mode="aspectFit">`), with support for named or custom sizes, theme or raw CSS colors, and spin animation.
- **Architecture Tier**: **Tier 1 — Presentational** (no FSM machine; runtime imports only `computedBehavior` and `createComponentOptions` from `../_shared/base`).
- **Compound Relationships**: None (standalone leaf component).

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `String` | `""` | Icon identifier resolved via `getIcon(name)` (falls back to raw `name`), or an image/SVG path or URL (`/`, `./`, `../`, `http(s)://`, `data:image/`, or `.svg`/`.png`/`.jpg`/`.jpeg`/`.webp`/`.gif`). Renders nothing when empty. |
| `size` | `String` | `""` | Named size variant (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`) or custom CSS size. Bare numeric strings (e.g. `"24"`) are normalized to `"24px"`; other CSS values (e.g. `"2rem"`, `"32rpx"`) are applied directly as inline `width`, `height`, and `font-size`. |
| `color` | `String` | `""` | Theme color variant name (e.g. `"neutral"`, or any configured theme color) or a raw CSS color (`#...`, `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`, `oklch(...)`, `var(...)`) applied via inline `color` style. |
| `spin` | `Boolean` | `false` | Enables continuous rotation animation (`animate-spin`) when `true`. |
| `ui` | `Object` | `{}` | Per-slot class overrides merged via `resolveSlots`, e.g. `{ root: "..." }`. |
| `className` | `String` | `""` | Additional root class string passed to `resolveSlots` (note: this component declares `className` rather than `class` in `properties`). |

## Slots

None. `index.wxml` contains no `<slot>` elements and renders exclusively via conditional `<image wx:if="{{isPath}}">` or `<view wx:elif="{{resolvedName}}">`.

## Events

None. The component does not emit custom `bind:*` events.

## Theme

Defined in `packages/core/src/theme/definitions/icon.ts`:

- **Slots**:
  - `root`: `"shrink-0 size-[1em]"`
- **Variants**:
  - `size`:
    - `xs`: `{ root: "size-3.5" }`
    - `sm`: `{ root: "size-4" }`
    - `md`: `{ root: "size-5" }`
    - `lg`: `{ root: "size-6" }`
    - `xl`: `{ root: "size-7" }`
  - `color`:
    - `<color>` (for each color in `options.colors ?? DEFAULT_THEME_COLORS`): `{ root: "text-${color}" }`
    - `neutral`: `{ root: "text-neutral" }`
  - `spin`:
    - `true`: `{ root: "animate-spin" }`
- **Default Variants**: None (`defaultVariants` is not configured; `root` defaults to `size-[1em]`).

## Examples

### WXML

```xml
<!-- Registry / class-based icon with named size and theme color -->
<c-icon name="lucide:home" size="md" color="primary" />

<!-- Spinning loader with custom numeric size (normalized to 24px) and raw CSS color -->
<c-icon name="lucide:loader-2" size="24" color="#0ea5e9" spin="{{true}}" />

<!-- Image / SVG path with custom root classes -->
<c-icon name="/assets/icons/logo.svg" size="lg" ui="{{ { root: 'opacity-80' } }}" className="ml-2" />
```

### TS

```ts
Page({
  data: {
    loading: true,
    iconUi: { root: "opacity-80" },
  },
});
```
