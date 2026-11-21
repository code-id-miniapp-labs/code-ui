---
title: Accordion
description: Collapsible panel container that manages expanded/collapsed state across one or more items, supporting both data-driven (items) and declarative compound usage.
---

## Overview

`c-accordion` is a collapsible panel container that manages expanded and collapsed state across one or more items, supporting both data-driven (`items`) and declarative compound (`<c-accordion-item>`) usage.

- **Compound Components**:
  - **Parent**: `c-accordion`
  - **Child**: `c-accordion-item` (rendered automatically in `items` loops or placed declaratively inside the default slot)
- **Imperative Methods**: Exposes `setValue(val)`, `toggle(val)`, `expand(val)`, `collapse(val)`, `expandAll()`, and `collapseAll()`.

## Usage

### Basic

Use the `items` prop to render a data-driven accordion. Each item supports `value`, `label`, `description`, `content`, `icon`, `trailingIcon`, `disabled`, and `ui`.

::code-group

```html [index.wxml]
<c-accordion items="{{faqItems}}" />
```

```ts [index.ts]
Page({
  data: {
    faqItems: [
      {
        value: "item-1",
        label: "What is Code UI?",
        description: "Overview",
        content: "A Tailwind-styled component library for WeChat MiniProgram.",
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

::

### Variant

Use the `variant` prop to change the visual style of the accordion container and programmatic items (`"outline"`, `"subtle"`, `"soft"`, `"plain"`, or `"separated"`). Defaults to `"outline"`.

```html
<c-accordion items="{{faqItems}}" variant="outline" />
<c-accordion items="{{faqItems}}" variant="subtle" />
<c-accordion items="{{faqItems}}" variant="soft" />
<c-accordion items="{{faqItems}}" variant="plain" />
<c-accordion items="{{faqItems}}" variant="separated" />
```

### Size

Use the `size` prop to control the size of programmatic `<c-accordion-item>` instances (`"sm"`, `"md"`, or `"lg"`). Defaults to `"md"`.

```html
<c-accordion items="{{faqItems}}" size="sm" />
<c-accordion items="{{faqItems}}" size="md" />
<c-accordion items="{{faqItems}}" size="lg" />
```

### Icon

Pass `icon` and `trailingIcon` inside each `items` entry to customize the leading and trailing icons (`trailingIcon` defaults to `"chevronDown"`).

::code-group

```html [index.wxml]
<c-accordion items="{{iconItems}}" />
```

```ts [index.ts]
Page({
  data: {
    iconItems: [
      {
        value: "getting-started",
        label: "Getting Started",
        icon: "info",
        trailingIcon: "plus",
        content: "Install the package and configure the Vite plugin.",
      },
      {
        value: "theming",
        label: "Theming",
        icon: "palette",
        content: "Uses the default chevronDown trailing icon.",
      },
    ],
  },
});
```

::

### Default Value

Use `defaultValue` to set the initially expanded item(s) in uncontrolled mode.

```html
<!-- Single default expanded item -->
<c-accordion items="{{faqItems}}" defaultValue="item-1" />

<!-- Multiple default expanded items -->
<c-accordion items="{{faqItems}}" multiple="{{true}}" defaultValue="{{['item-1', 'item-2']}}" />
```

### Multiple

Set `multiple` to `true` to allow multiple items to remain expanded at the same time. Defaults to `false`.

```html
<c-accordion items="{{faqItems}}" multiple="{{true}}" />
```

### Collapsible

Set `collapsible` to `false` to prevent an open item from being collapsed when toggled again. Defaults to `true`.

```html
<c-accordion items="{{faqItems}}" defaultValue="item-1" collapsible="{{false}}" />
```

### Disabled

Set `disabled` on `<c-accordion>` to disable the entire accordion and all child items, or set `disabled: true` on individual entries in `items`.

::code-group

```html [index.wxml]
<!-- Disable the entire accordion -->
<c-accordion items="{{faqItems}}" disabled="{{true}}" />

<!-- Disable a single item -->
<c-accordion items="{{mixedItems}}" />
```

```ts [index.ts]
Page({
  data: {
    mixedItems: [
      {
        value: "active",
        label: "Available Section",
        content: "This item can be toggled.",
      },
      {
        value: "locked",
        label: "Disabled Section",
        content: "This item cannot be toggled.",
        disabled: true,
      },
    ],
  },
});
```

::

### Controlled

Use `value` (or its alias `modelValue`) to control the expanded item(s) externally from page state.

::code-group

```html [index.wxml]
<c-accordion
  id="controlled-accordion"
  items="{{faqItems}}"
  value="{{activeValues}}"
/>
```

```ts [index.ts]
Page({
  data: {
    activeValues: ["item-1"],
    faqItems: [
      { value: "item-1", label: "First", content: "First panel content." },
      { value: "item-2", label: "Second", content: "Second panel content." },
    ],
  },

  openSecond() {
    this.setData({ activeValues: ["item-2"] });
  },
});
```

::

### Slots

When `items` is empty, `c-accordion` renders `<c-accordion-item>` children placed inside its default `<slot />`. When `items` is non-empty, `c-accordion` renders programmatic `<c-accordion-item>` instances from `items` instead.

```html
<c-accordion variant="separated" multiple="{{true}}">
  <c-accordion-item value="a" label="Section A" content="Content for A" />
  <c-accordion-item value="b" label="Section B" content="Content for B" />
</c-accordion>
```

### Custom Styling

Use `ui` for per-slot class overrides (`root`, as well as fallback `ui` for programmatic items when `item.ui` is omitted) and `className` to append additional classes to the root element.

::code-group

```html [index.wxml]
<c-accordion
  items="{{styledItems}}"
  className="mt-4"
  ui="{{accordionUi}}"
/>
```

```ts [index.ts]
Page({
  data: {
    accordionUi: {
      root: "rounded-lg",
    },
    styledItems: [
      {
        value: "item-1",
        label: "Inherits parent fallback ui",
        content: "Uses accordionUi when item.ui is omitted.",
      },
      {
        value: "item-2",
        label: "Custom item ui",
        content: "Overrides slot classes for this specific item.",
        ui: {
          trigger: "bg-elevated",
        },
      },
    ],
  },
});
```

::

### Events & Imperative Methods

Listen to `bind:change` to handle expanded item changes (`e.detail` receives `{ value: string[]; expanded: string[] }`) and `bind:update:modelValue` for `modelValue` updates (`string | string[]`).

You can also control expanded state imperatively via `this.selectComponent(...)` using `setValue(val)`, `toggle(val)`, `expand(val)`, `collapse(val)`, `expandAll()`, and `collapseAll()`.

::code-group

```html [index.wxml]
<c-accordion
  id="faq-accordion"
  items="{{faqItems}}"
  multiple="{{true}}"
/>
```

```ts [index.ts]
Page({
  data: {
    faqItems: [
      { value: "item-1", label: "First", content: "First panel content." },
      { value: "item-2", label: "Second", content: "Second panel content." },
    ],
  },

  toggleFirst() {
    const accordion = this.selectComponent("#faq-accordion");
    accordion?.toggle("item-1");
  },

  expandAllItems() {
    const accordion = this.selectComponent("#faq-accordion");
    accordion?.expandAll();
  },

  collapseAllItems() {
    const accordion = this.selectComponent("#faq-accordion");
    accordion?.collapseAll();
  },
});
```

::

## State Machine

Click any active transition or event button below to simulate the `accordion-item` state machine live:

::machine-visualizer{name="accordion-item"}
::

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
| `className` | `string` | `""` | Additional root class string passed into slot class resolution. |

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Renders declarative `<c-accordion-item>` children when `items` is empty. When `items` is non-empty, `c-accordion` renders `<c-accordion-item>` instances from `items` instead. |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `bind:change` | `AccordionValueChangeDetails`: `{ value: string[]; expanded: string[] }` | Fired when the expanded item values change. |
| `bind:update:modelValue` | `string \| string[]` | Fired when the model value updates. |

## Theme

Customize the `accordion` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    accordion: {
      slots: {
        root: "w-full flex flex-col",
      },
      variants: {
        variant: {
          outline: {
            root: "border border-default divide-y divide-default rounded-md overflow-hidden",
          },
          subtle: {
            root: "bg-muted divide-y divide-default rounded-md overflow-hidden",
          },
          soft: {
            root: "bg-elevated divide-y divide-default rounded-md overflow-hidden",
          },
          plain: {
            root: "divide-y divide-default",
          },
          separated: {
            root: "gap-2",
          },
        },
        disabled: {
          true: {
            root: "opacity-50 pointer-events-none",
          },
          false: {},
        },
      },
      defaultVariants: {
        variant: "outline",
        disabled: false,
      },
    }
  }
})
```

## Item (`c-accordion-item`)

`c-accordion-item` is a collapsible panel item consisting of a clickable header trigger (with optional leading icon or slot, label, description, and trailing icon or slot) and an animated expandable content body.

- **Parent Coordination & Standalone Mode**: Links with a parent `c-accordion` to inherit `size`, `variant`, and coordinated open state, or works standalone using `defaultOpen`, `open`, and `collapsible`.
- **Internal Icon Fallback**: Renders `c-icon` for `icon` and `trailingIcon` when custom `leading` or `trailing` slots are not provided.
- **Imperative Methods**: Exposes `measure()`, `handleTap()`, `toggle()`, `open()`, and `close()`.

### Usage

::code-group

```html [index.wxml]
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

```ts [index.ts]
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

::

### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
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
| `size` | `"sm" \| "md" \| "lg" \| ""` | `""` | Size variant override; inherits from parent `c-accordion` or defaults to `"md"`. |
| `variant` | `"outline" \| "subtle" \| "soft" \| "plain" \| "separated" \| ""` | `""` | Visual variant override; inherits from parent `c-accordion` or defaults to `"outline"`. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot. |

### Slots

| Slot | Description |
| --- | --- |
| `(default)` | Rendered inside the body container after the `content` prop or `content` slot. Use for rich body markup. |
| `leading` | Custom leading content rendered inside the leading container. When omitted, falls back to `<c-icon>` using the `icon` prop. |
| `label` | Custom header title content rendered when the `label` prop is empty. |
| `description` | Custom secondary header content rendered when the `description` prop is empty. |
| `trailing` | Custom trailing content rendered inside the trailing container. When omitted, falls back to `<c-icon>` using `trailingIcon` (default `"chevronDown"`). |
| `content` | Custom body content rendered inside the body container when the `content` prop is empty. |

### Events

| Event | Payload | Description |
| --- | --- | --- |
| `bind:tap` | `AccordionItemOpenChangeDetails`: `{ value: string; open: boolean }` | Fired when the item trigger is tapped. |
| `bind:change` | `AccordionItemOpenChangeDetails`: `{ value: string; open: boolean }` | Fired when the item state changes. |
| `bind:openChange` | `AccordionItemOpenChangeDetails`: `{ value: string; open: boolean }` | Fired when the item open state toggles. |

### Theme

```ts
import { defineTheme, type ThemeOptions } from "../../theme";

export default function accordionItemTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "w-full text-sm group",
      header: "flex",
      trigger:
        "flex w-full items-center justify-between py-3.5 px-4 text-start font-medium text-highlighted select-none focus:outline-none transition-colors",
      leading: "flex items-center shrink-0 me-2.5",
      leadingIcon: "size-4 shrink-0 text-muted",
      label: "flex-1 font-medium text-highlighted truncate",
      description: "text-xs text-muted mt-0.5 truncate",
      trailing:
        "flex items-center shrink-0 ms-2.5 transition-transform duration-200",
      trailingIcon: "size-4 shrink-0 text-dimmed",
      content:
        "overflow-hidden text-toned transition-[height,opacity] duration-200 ease-out will-change-[height,opacity]",
      body: "box-border px-4 pb-3.5 pt-0 text-toned leading-relaxed overflow-hidden min-h-0",
    },
    variants: {
      size: {
        sm: {
          trigger: "py-2.5 px-3 text-xs",
          leadingIcon: "size-3.5",
          label: "text-xs",
          description: "text-2xs",
          trailingIcon: "size-3.5",
          body: "px-3 pb-2.5 text-xs",
        },
        md: {
          trigger: "py-3.5 px-4 text-sm",
          leadingIcon: "size-4",
          label: "text-sm",
          description: "text-xs",
          trailingIcon: "size-4",
          body: "px-4 pb-3.5 text-sm",
        },
        lg: {
          trigger: "py-4 px-5 text-base",
          leadingIcon: "size-5",
          label: "text-base",
          description: "text-xs",
          trailingIcon: "size-5",
          body: "px-5 pb-4 text-base",
        },
      },
      variant: {
        outline: {},
        subtle: {},
        soft: {},
        plain: {},
        separated: {
          root: "border border-default rounded-md shadow-2xs bg-default overflow-hidden",
        },
      },
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none cursor-not-allowed",
          trigger: "cursor-not-allowed",
        },
        false: {},
      },
      open: {
        true: {
          trailing: "rotate-180",
        },
        false: {},
      },
    },
    defaultVariants: {
      size: "md",
      variant: "outline",
      disabled: false,
      open: false,
    },
  });
}
```
