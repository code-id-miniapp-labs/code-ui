# Card (`c-card`)

## Overview & Tier

- **Purpose**: A structured container component for grouping content into optional `header`, `body`, and `footer` sections with consistent borders, padding, and surface styling.
- **Architecture Tier**: **Tier 1 — Presentational / Container** (`../_shared/base` only via `computedBehavior` and `createComponentOptions`; no state machine in `packages/machines/`).
- **Compound Components**: Standalone component (no parent/child relation links).

---

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `"outline" \| "solid" \| "soft" \| "subtle"` (`String`) | `"outline"` | Visual style variant controlling background, border, and text contrast. |
| `size` | `"sm" \| "md" \| "lg"` (`String`) | `"md"` | Padding size applied to `header`, `body`, and `footer` slots. |
| `title` | `String` | `""` | Optional heading text rendered in the `header` section. |
| `description` | `String` | `""` | Optional subtitle/description text rendered below `title` in the `header` section. |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot name (`root`, `header`, `title`, `description`, `body`, `footer`). |
| `className` | `String` | `""` | Additional classes merged onto the `root` slot (note: declared as `className` in `properties`, not `class`). |

---

## Slots

Runtime slot tracking is configured with `slots: { default: false, header: false, footer: false }` so empty wrappers are omitted from WXML via `wx:if`:

| Slot | Wrapper Condition | Behavior & MiniProgram Constraints |
| :--- | :--- | :--- |
| `header` (`<slot name="header" />`) | `title \|\| description \|\| slots.header` | Rendered at the top of the `header` container before `title` and `description` `<text>` nodes. Uses sibling conditional rendering (`wx:if`) rather than nesting fallback content inside `<slot>`, because WeChat MiniProgram `<slot>` is static and discards fallback children. |
| `default` (`<slot />`) | `slots.default` | Rendered inside the `body` container. If no default slot content is provided, the `body` `<view>` is not rendered. |
| `footer` (`<slot name="footer" />`) | `slots.footer` | Rendered inside the `footer` container. If no `footer` slot content is provided, the `footer` `<view>` is not rendered. |

---

## Events

None. `card` does not attach interaction handlers or emit custom `bind:*` events.

---

## Theme

Defined in `packages/core/src/theme/definitions/card.ts`:

### Slots

- `root`: `"rounded-md overflow-hidden flex flex-col"`
- `header`: `"flex flex-col gap-1 border-b border-default"`
- `title`: `"text-base font-semibold text-highlighted"`
- `description`: `"text-sm text-muted"`
- `body`: `"flex-1 text-sm text-default"`
- `footer`: `"flex items-center gap-2 border-t border-default"`

### Variants

- `variant`:
  - `outline`: `root: "bg-default border border-default shadow-xs"`
  - `solid`: `root: "bg-inverted text-inverted border border-inverted"`, `header: "border-accented"`, `title: "text-inverted"`, `description: "text-dimmed"`, `body: "text-inverted"`, `footer: "border-accented"`
  - `soft`: `root: "bg-muted border border-transparent"`
  - `subtle`: `root: "bg-muted border border-default"`
- `size`:
  - `sm`: `header: "p-3"`, `body: "p-3"`, `footer: "p-3"`
  - `md`: `header: "p-4"`, `body: "p-4"`, `footer: "p-4"`
  - `lg`: `header: "p-6"`, `body: "p-6"`, `footer: "p-6"`

### Default Variants

- `variant`: `"outline"`
- `size`: `"md"`

---

## Examples

### WXML

```xml
<!-- Basic card with title, description, and body -->
<c-card title="Project Overview" description="Active MiniProgram components">
  <view>Main card body content.</view>
</c-card>

<!-- Custom header, footer, variant, size, and ui overrides -->
<c-card
  variant="subtle"
  size="lg"
  className="w-full"
  ui="{{ cardUi }}"
>
  <view slot="header" class="font-bold">Custom Header</view>
  <view>Card body content</view>
  <view slot="footer">Footer actions</view>
</c-card>
```

### Page / Component TS

```ts
Page({
  data: {
    cardUi: {
      body: "text-highlighted",
      footer: "justify-end",
    },
  },
});
```
