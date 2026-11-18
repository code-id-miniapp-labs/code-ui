# Divider (`c-divider`)

## Overview & Tier

A presentational separator component used to visually divide sections or content horizontally or vertically, with optional text, icons, or custom slot content.

- **Tier**: Tier 1 Presentational (uses `computedBehavior` and `createComponentOptions` from `../_shared/base`; no FSM machine).
- **Compound Components**: None (standalone component; renders `<c-icon>` internally when `leadingIcon` or `trailingIcon` is used without the corresponding slot).

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot name (`root`, `container`, `border`, `icon`, `label`). |
| `class` | `String` | `""` | Custom classes applied to the `root` slot (takes precedence over `className` when non-empty). |
| `className` | `String` | `""` | Fallback custom classes applied to the `root` slot when `class` is empty. |
| `color` | `String` | `"neutral"` | Semantic border color variant (`neutral` or any configured theme color from `DEFAULT_THEME_COLORS`). |
| `size` | `String` | `"md"` | Border thickness and content text size (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). |
| `type` | `String` | `"solid"` | Border line style (`"solid"`, `"dashed"`, `"dotted"`). |
| `label` | `String` | `""` | Text displayed in the divider content area. Takes precedence over the default slot. |
| `orientation` | `String` | `"horizontal"` | Divider direction (`"horizontal"`, `"vertical"`). |
| `position` | `String` | `"center"` | Position of the content container along the divider (`"start"`, `"center"`, `"end"`). |
| `leadingIcon` | `String` | `""` | Icon name passed to `<c-icon>` before the label. Ignored if the `leading` slot is provided. |
| `trailingIcon` | `String` | `""` | Icon name passed to `<c-icon>` after the label. Ignored if the `trailing` slot is provided. |

## Slots

| Slot | Description |
| :--- | :--- |
| `(default)` | Custom content rendered inside the `label` wrapper when `label` is empty. |
| `leading` | Custom content rendered before the label inside `container`, replacing `leadingIcon`. |
| `trailing` | Custom content rendered after the label inside `container`, replacing `trailingIcon`. |

**MiniProgram `<slot>` Constraints & Conditional Fallbacks:**
- MiniProgram `<slot>` is static (no scoped slots / dynamic slot props) and does not support fallback content nested inside `<slot>...</slot>`.
- Active slot detection (`slots.default`, `slots.leading`, `slots.trailing`) controls whether the content `container` and conditional wrappers render.
- When `label` is set, `<text>{{label}}</text>` is rendered and the default `<slot />` is omitted via `wx:if` / `wx:else`.
- When `leading` or `trailing` slots are active, they take precedence over `leadingIcon` or `trailingIcon` via `wx:if` / `wx:elif`.

## Events

None.

## Theme

Defined in `packages/core/src/theme/definitions/divider.ts`:

- **Slots**:
  - `root`: `"flex items-center"`
  - `container`: `"flex items-center gap-2 shrink-0"`
  - `border`: `"flex-1"`
  - `icon`: `"shrink-0"`
  - `label`: `"shrink-0"`
- **Variants**:
  - `color`: `neutral` plus all configured theme colors (`DEFAULT_THEME_COLORS` by default).
  - `size`: `xs`, `sm`, `md`, `lg`, `xl` (controls `container` font size and, via `compoundVariants`, `border` thickness per `orientation`).
  - `type`: `solid`, `dashed`, `dotted`.
  - `orientation`: `horizontal`, `vertical`.
  - `position`: `center`, `start`, `end` (line split handled in WXML; `container` margins applied via `compoundVariants` per `orientation`).
- **Default Variants** (theme definition):
  - `color`: `"neutral"`
  - `size`: `"xs"` (note: the runtime component prop defaults `size` to `"md"`)
  - `type`: `"solid"`
  - `orientation`: `"horizontal"`
  - `position`: `"center"`

## Examples

### WXML

```xml
<!-- Basic horizontal divider -->
<c-divider />

<!-- Labeled divider with leading icon and dashed border -->
<c-divider
  label="OR"
  type="dashed"
  size="sm"
  position="center"
  leadingIcon="lucide:sparkles"
/>

<!-- Custom slot content and vertical orientation -->
<view class="h-12 flex items-center">
  <text>Left</text>
  <c-divider orientation="vertical" color="primary" class="mx-4" />
  <text>Right</text>
</view>

<!-- Custom default and named slots -->
<c-divider position="start" ui="{{ { label: 'font-semibold' } }}">
  <view slot="leading">*</view>
  <text>Section Title</text>
</c-divider>
```

### TypeScript (Page / Component)

```ts
Page({
  data: {
    dividerUi: {
      border: "border-primary",
      label: "text-primary",
    },
  },
});
```
