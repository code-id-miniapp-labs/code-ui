# Accordion (`c-accordion`)

## Overview & Tier

- **Purpose**: Collapsible panel container that manages expanded/collapsed state across one or more items, supporting both data-driven (`items`) and declarative compound usage.
- **Architecture Tier**: **Tier 3 Domain** — uses the `@code-id-labs/accordion` state machine (`createMachineBehavior`) together with the domain relation behavior `withAccordion()` from `@code-id-labs/miniapp/behaviors/accordion`.
- **Compound Components**:
  - Parent: `c-accordion`
  - Child: `c-accordion-item` (used both in programmatic `items` loops and as declarative children inside the default `<slot />`)
- **Imperative Methods**: Exposes `setValue(val)`, `toggle(val)`, `expand(val)`, `collapse(val)`, `expandAll()`, and `collapseAll()` (and exports the machine API via `exportApi: true`).

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number \| (string \| number)[] \| null` | `null` | Controlled expanded item value(s). |
| `defaultValue` | `string \| number \| (string \| number)[] \| null` | `null` | Initial expanded item value(s) when uncontrolled. |
| `modelValue` | `string \| number \| (string \| number)[] \| null` | `null` | Alias for `value`. |
| `multiple` | `boolean` | `false` | Allows multiple items to be open at the same time. |
| `collapsible` | `boolean` | `true` | Allows an open item to be collapsed when toggled. |
| `disabled` | `boolean` | `false` | Disables the accordion and all child items. |
| `items` | `AccordionItemData[]` | `[]` | Programmatic item definitions rendered via `<c-accordion-item>`. Supports `value`, `label`, `description`, `content`, `icon`, `trailingIcon` (defaults to `"chevronDown"`), `disabled`, and `ui`. |
| `linkedCount` | `number` | `0` | Count of linked declarative `<c-accordion-item>` children. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size passed to programmatic `<c-accordion-item>` instances and set as `data-size`. |
| `variant` | `"outline" \| "subtle" \| "soft" \| "plain" \| "separated"` | `"outline"` | Visual style variant of the accordion container and programmatic items. |
| `ui` | `Record<string, any>` | `{}` | Per-slot class overrides (also used as fallback `ui` for programmatic items when `item.ui` is omitted). |
| `className` | `string` | `""` | Additional root class string (runtime `class` prop equivalent passed into `resolveSlots`). |

## Slots

- **Default `<slot />`**: Declared with `slots: { default: false }` and rendered conditionally via `<block wx:if="{{hasItems}}">...</block><slot wx:else />`.
  - When `items` is non-empty (`hasItems` is `true`), `c-accordion` renders `<c-accordion-item>` elements directly and the default `<slot />` is omitted.
  - When `items` is empty, declarative `<c-accordion-item>` children placed in the default `<slot />` are rendered and linked through `withAccordion()`.
- **MiniProgram `<slot>` Constraints**: WeChat MiniProgram `<slot>` is static (no scoped slots or dynamic data passed into slot content) and does not support fallback markup nested inside `<slot>...</slot>`, so conditional `wx:if` / `wx:else` rendering is used to switch between programmatic items and the default slot.

## Events

- No direct `triggerEvent` calls are declared in `packages/components/src/runtime/accordion/index.ts`; child `<c-accordion-item>` instances emit `bind:change` internally to `handleItemClick` (`detail: { value?: string | number }`), which forwards to `toggle(value)`.
- At the machine contract level (`AccordionProps`), `onChange` receives `AccordionValueChangeDetails` (`{ value: string[]; expanded: string[] }`) and `onUpdateModelValue` receives `string | string[]` (bridged by the runtime machine/domain behavior).

## Theme

Defined in `packages/core/src/theme/definitions/accordion.ts`:

- **Slots**:
  - `root`: `"w-full flex flex-col"`
- **Variants**:
  - `variant`:
    - `outline`: `{ root: "border border-default divide-y divide-default rounded-md overflow-hidden" }`
    - `subtle`: `{ root: "bg-muted divide-y divide-default rounded-md overflow-hidden" }`
    - `soft`: `{ root: "bg-elevated divide-y divide-default rounded-md overflow-hidden" }`
    - `plain`: `{ root: "divide-y divide-default" }`
    - `separated`: `{ root: "gap-2" }`
  - `disabled`:
    - `true`: `{ root: "opacity-50 pointer-events-none" }`
    - `false`: `{}`
- **Default Variants**:
  - `variant`: `"outline"`
  - `disabled`: `false`

## Examples

### Data-Driven (`items`)

```xml
<c-accordion
  items="{{faqItems}}"
  variant="outline"
  size="md"
  default-value="item-1"
  multiple="{{false}}"
  collapsible="{{true}}"
/>
```

```ts
Page({
  data: {
    faqItems: [
      {
        value: "item-1",
        label: "What is Code UI?",
        description: "Overview",
        content: "A headless component library for WeChat MiniProgram.",
      },
      {
        value: "item-2",
        label: "Is it themeable?",
        content: "Yes, pass variants or ui slot overrides.",
      },
    ],
  },
});
```

### Declarative Compound (`<c-accordion-item>`)

```xml
<c-accordion variant="separated" multiple="{{true}}">
  <c-accordion-item value="a" label="Section A" content="Content for A" />
  <c-accordion-item value="b" label="Section B" content="Content for B" />
</c-accordion>
```
