# ActionSheet (`c-action-sheet`)

## Overview & Tier

- **Purpose**: Bottom action sheet dialog for presenting a list of selectable menu items, an optional header (`title`, `description`, close trigger), and optional footer action buttons.
- **Architecture Tier**: **Tier 2 Interactive** (uses `@code-ui/action-sheet` machine + connect layer via `createMachineBehavior`, runtime `../_shared/base` + `../_shared/machine`, and theme definitions from `@code-ui/core`).
- **Related Components**: Not a compound parent/child relation component. Internally renders `<c-button>` for the default close trigger and `actions`, and `<c-icon>` for item icons and loading indicators.

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean \| null` | `null` | Controlled open state. When `null`, visibility is managed uncontrolled via `defaultOpen` and the exported API. |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled. |
| `title` | `string` | `""` | Header title text. Takes precedence over the `title` slot when non-empty. |
| `description` | `string` | `""` | Header description text. Takes precedence over the `description` slot when non-empty. |
| `close` | `boolean \| ActionSheetCloseProps \| null` | `false` | Displays a close `<c-button>` in the header when `true` or passed an `ActionSheetCloseProps` config (`icon`, `color`, `variant`, `size`, `disabled`, `ui`, `className`). |
| `items` | `ActionSheetItem[]` | `[]` | Menu item definitions (`key`, `label`, `description`, `icon`, `loadingIcon`, `color`, `destructive`, `disabled`, `loading`, `openType`, `className`, `style`). |
| `actions` | `ActionSheetAction[]` | `[]` | Footer action button definitions (`label`, `onClick`, `icon`, `leadingIcon`, `trailingIcon`, `loading`, `loadingAuto`, `loadingIcon`, `color`, `variant`, `size`, `closeOnClick`, `disabled`, `openType`, `className`, `ui`). |
| `closeOnItem` | `boolean` | `true` | Whether tapping an enabled item automatically closes the sheet. |
| `closeOnBackdropClick` | `boolean` | `true` | Whether tapping the backdrop closes the sheet. |
| `duration` | `number` | `300` | Close transition duration in milliseconds. |
| `ui` | `ActionSheetUI` (`Record<string, string>`) | `{}` | Per-slot class overrides merged into the resolved theme slots. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (`class` override in `resolveSlots`). |

> **Callback & ID options (`ActionSheetProps`)**: `id`, `ids`, `onOpenChange`, `onSelect`, `onAction`, and `onClose` are supported by the underlying machine props contract (for example via `onClick` on `actions` or component API integration), while the MiniProgram `properties` map exposes the table props above.

### Exported Component API

When accessed via `selectComponent`, the component exports the `actionSheet` API:

- `open: boolean` — Whether the sheet is currently open.
- `visible: boolean` — Whether the sheet is currently mounted/visible.
- `loadingActionIndex: number | null` — Index of a footer action currently in an async loading state, or `null`.
- `setOpen(open: boolean): void` — Open or close the sheet.
- `openActionSheet(): void` — Open the sheet.
- `closeActionSheet(): void` — Close the sheet.
- `select(index: number): void` — Programmatically select an item by index.
- `handleAction(index: number): void` — Programmatically trigger a footer action by index.

## Slots

WeChat MiniProgram `<slot>` elements are static and do not support scoped slots or fallback default children inside `<slot>...</slot>`. `c-action-sheet` uses conditional `wx:if` / `wx:else` rendering and slot-presence flags (`slots.*`) to switch between prop-driven rendering and custom slots:

- **`default`**: Body content rendered only when `items` is empty (`resolvedItems.length === 0`).
- **`header`**: Replaces the entire header block only when `title`, `description`, `close`, and all header sub-slots (`title`, `description`, `close`) are absent.
- **`title`**: Custom header title content; rendered only when the `title` prop is empty.
- **`description`**: Custom header description content; rendered only when the `description` prop is empty.
- **`close`**: Custom close trigger content wrapped in a tappable container (`catchtap`); takes precedence over the `close` prop's `<c-button>`.
- **`actions`**: Footer actions area rendered only when `actions` is empty (`resolvedActions.length === 0`).

## Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:backdropTap` | Original MiniProgram tap event | Fired when the backdrop is tapped. |
| `bind:closeTriggerTap` | Original MiniProgram tap event | Fired when the header close trigger is tapped. |
| `bind:getphonenumber` | `ev.detail` | Forwarded from items or footer actions configured with WeChat `open-type="getPhoneNumber"`. |
| `bind:chooseavatar` | `ev.detail` | Forwarded from items or footer actions configured with WeChat `open-type="chooseAvatar"`. |
| `bind:contact` | `ev.detail` | Forwarded from items or footer actions configured with WeChat `open-type="contact"`. |

## Theme

Defined in `packages/core/src/theme/definitions/action-sheet.ts`:

- **Slots**:
  `root`, `backdrop`, `content`, `header`, `title`, `description`, `closeTrigger`, `closeButton`, `closeIcon`, `body`, `item`, `itemHover`, `itemText`, `itemTitle`, `itemLabel`, `itemLabelDestructive`, `itemDescription`, `itemIcon`, `itemIconDestructive`, `itemLoadingIcon`, `gap`, `actions`, `action`
- **Variants**:
  - `open`: `true` | `false` — Controls `backdrop` visibility/pointer events and `content` slide translation (`compoundVariants`).
  - `disabled`: `true` | `false` — Applies disabled cursor, pointer-events, and opacity styles to `item`, `itemTitle`, and `itemDescription`.
- **Default Variants**:
  `{ open: false, disabled: false }`

## Examples

### WXML

```xml
<c-button label="Open Actions" bind:tap="onOpenSheet" />

<c-action-sheet
  id="sheet"
  open="{{sheetOpen}}"
  title="Choose an option"
  description="This action cannot be undone."
  close="{{true}}"
  items="{{sheetItems}}"
  actions="{{sheetActions}}"
  bind:backdropTap="onCloseSheet"
  bind:closeTriggerTap="onCloseSheet"
/>
```

### Page TS

```ts
Page({
  data: {
    sheetOpen: false,
    sheetItems: [
      { key: "share", label: "Share", icon: "share" },
      {
        key: "delete",
        label: "Delete",
        description: "Permanently remove this item",
        icon: "trash",
        destructive: true,
      },
    ],
    sheetActions: [
      {
        label: "Cancel",
        variant: "soft",
        onClick: () => {},
      },
    ],
  },

  onOpenSheet() {
    this.setData({ sheetOpen: true });
  },

  onCloseSheet() {
    this.setData({ sheetOpen: false });
  },
});
```
