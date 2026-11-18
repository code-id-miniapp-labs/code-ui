# `c-accordion-item`

## Overview & Tier

`c-accordion-item` is an interactive collapsible panel item consisting of a clickable header trigger (with optional leading icon/slot, label, description, and trailing icon/slot) and an animated expandable content body.

- **Architecture Tier**: Tier 3 Domain (`@code-id-labs/accordion-item` FSM machine via `createMachineBehavior` + `withAccordionItem()` relation behavior from `@code-id-labs/miniapp/behaviors/accordion`).
- **Compound Relationships**:
  - **Parent**: `c-accordion` (`accordion`) — links via `withAccordionItem()`, inheriting `groupSize`, `groupVariant`, and group open-state coordination when used as a child. Can also be used standalone (`defaultOpen` / `open` / `collapsible`).
  - **Internal Child**: `c-icon` — renders the `icon` and `trailingIcon` when custom `leading` / `trailing` slots are not provided.
- **Exposed Component Methods**: `measure()`, `handleTap()`, `toggle()`, `open()`, `close()`.

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string \| number` | `""` | Unique value identifying this item (used for coordination inside `c-accordion`). |
| `label` | `string` | `""` | Header title text. When non-empty, takes precedence over the `label` slot. |
| `description` | `string` | `""` | Secondary text rendered below the label. When non-empty, takes precedence over the `description` slot. |
| `content` | `string` | `""` | Body text content (also tracked for content height re-measurement). When non-empty, takes precedence over the `content` slot. |
| `icon` | `string` | `""` | Leading icon name passed to `c-icon` when no `leading` slot is provided. |
| `trailingIcon` | `string` | `"chevronDown"` | Trailing icon name passed to `c-icon` when no `trailing` slot is provided. |
| `disabled` | `boolean` | `false` | Disables tap interaction and applies disabled styling. |
| `open` | `boolean \| null` | `null` | Controlled open state. Keep `null` for uncontrolled or parent-managed mode. |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled in standalone mode. |
| `collapsible` | `boolean` | `true` | Whether the item can be collapsed when active in standalone mode. |
| `contentHeight` | `number \| null` | `null` | Explicit or measured content height in pixels (`null` lets the item measure automatically). |
| `size` | `"sm" \| "md" \| "lg" \| ""` | `""` | Size variant override; inherits from parent `c-accordion` (`groupSize`) or defaults to `"md"`. |
| `variant` | `"outline" \| "subtle" \| "soft" \| "plain" \| "separated" \| ""` | `""` | Visual variant override; inherits from parent `c-accordion` (`groupVariant`) or defaults to `"outline"`. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (note: declared as `className` rather than `class` in MiniProgram `properties`). |

## Slots

Because WeChat MiniProgram `<slot>` elements are static (no scoped slots, and nested fallback markup inside `<slot>` is silently discarded when unmatched), `c-accordion-item` uses `wx:if` / `wx:else` / `wx:elif` conditional rendering for prop-vs-slot fallbacks and detects slot presence via `computedBehavior`.

| Slot | Behavior & Constraints |
| :--- | :--- |
| `default` | Always rendered inside the body container (`.cui-accordion-body`), after `content` prop / `content` slot. Use for rich body markup. |
| `leading` | Rendered inside the leading container when provided; otherwise falls back conditionally (`wx:elif`) to `<c-icon>` using the `icon` prop. |
| `label` | Conditional fallback: rendered only when the `label` prop is empty (`wx:else`). |
| `description` | Conditional fallback: rendered only when the `description` prop is empty (`wx:else`). |
| `trailing` | Rendered inside the trailing container when provided; otherwise falls back conditionally (`wx:elif`) to `<c-icon>` using `trailingIcon` (default `"chevronDown"`). |
| `content` | Conditional fallback: rendered inside the body container only when the `content` prop is empty (`wx:else`). |

## Events

No `this.triggerEvent(...)` calls are defined directly in `packages/components/src/runtime/accordion-item/index.ts`.

- **Internal DOM Binding**: The trigger element binds `bind:tap="handleTap"` internally to toggle the item.
- **Machine Callback Props** (from `AccordionItemProps`): `onTap`, `onChange`, and `onOpenChange` are typed to receive `AccordionItemOpenChangeDetails` (`{ value: string; open: boolean }`) when passed through the machine/behavior layer.

## Theme

Defined in `packages/core/src/theme/definitions/accordion-item.ts`.

### `slots`

| Slot | Base Classes |
| :--- | :--- |
| `root` | `"w-full text-sm group"` |
| `header` | `"flex"` |
| `trigger` | `"flex w-full items-center justify-between py-3.5 px-4 text-start font-medium text-highlighted select-none focus:outline-none transition-colors"` |
| `leading` | `"flex items-center shrink-0 me-2.5"` |
| `leadingIcon` | `"size-4 shrink-0 text-muted"` |
| `label` | `"flex-1 font-medium text-highlighted truncate"` |
| `description` | `"text-xs text-muted mt-0.5 truncate"` |
| `trailing` | `"flex items-center shrink-0 ms-2.5 transition-transform duration-200"` |
| `trailingIcon` | `"size-4 shrink-0 text-dimmed"` |
| `content` | `"overflow-hidden text-toned transition-[height,opacity] duration-200 ease-out will-change-[height,opacity]"` |
| `body` | `"box-border px-4 pb-3.5 pt-0 text-toned leading-relaxed overflow-hidden min-h-0"` |

### `variants`

- **`size`**:
  - `sm`: scales down `trigger` (`"py-2.5 px-3 text-xs"`), `leadingIcon` / `trailingIcon` (`"size-3.5"`), `label` (`"text-xs"`), `description` (`"text-2xs"`), and `body` (`"px-3 pb-2.5 text-xs"`).
  - `md`: default sizing (`trigger`: `"py-3.5 px-4 text-sm"`, icons: `"size-4"`, `label`: `"text-sm"`, `description`: `"text-xs"`, `body`: `"px-4 pb-3.5 text-sm"`).
  - `lg`: scales up `trigger` (`"py-4 px-5 text-base"`), icons (`"size-5"`), `label` (`"text-base"`), `description` (`"text-xs"`), and `body` (`"px-5 pb-4 text-base"`).
- **`variant`**:
  - `outline`, `subtle`, `soft`, `plain`: empty item-level overrides (styled at the parent `c-accordion` level).
  - `separated`: adds `"border border-default rounded-md shadow-2xs bg-default overflow-hidden"` to `root`.
- **`disabled`**:
  - `true`: adds `"opacity-50 pointer-events-none cursor-not-allowed"` to `root` and `"cursor-not-allowed"` to `trigger`.
  - `false`: `{}`.
- **`open`**:
  - `true`: adds `"rotate-180"` to `trailing`.
  - `false`: `{}`.

### `defaultVariants`

```ts
{
  size: "md",
  variant: "outline",
  disabled: false,
  open: false,
}
```

## Examples

### WXML

```xml
<!-- Compound usage inside c-accordion -->
<c-accordion defaultValue="faq-1">
  <c-accordion-item
    value="faq-1"
    icon="info"
    label="Getting Started"
    description="Basic setup instructions"
    content="Install the package and register c-accordion-item in your page JSON."
  />

  <!-- Custom slots & ui/className overrides -->
  <c-accordion-item
    value="faq-2"
    variant="separated"
    size="lg"
    className="mt-2"
    ui="{{itemUi}}"
  >
    <view slot="label">Custom Header</view>
    <view>Rich body content rendered via the default slot.</view>
  </c-accordion-item>
</c-accordion>

<!-- Standalone controlled usage -->
<c-accordion-item
  id="standalone-item"
  label="Standalone Panel"
  open="{{isOpen}}"
  content="Controlled externally."
/>
```

### Page TS

```ts
Page({
  data: {
    isOpen: false,
    itemUi: {
      trigger: "bg-elevated",
      body: "text-highlighted",
    },
  },

  toggleStandalone() {
    const item = this.selectComponent("#standalone-item");
    item?.toggle();
  },
});
```
