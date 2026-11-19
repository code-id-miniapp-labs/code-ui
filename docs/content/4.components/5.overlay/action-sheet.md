---
title: ActionSheet
description: Bottom action sheet dialog for presenting a list of selectable menu items, an optional header, and optional footer action buttons.
---

## Overview

`c-action-sheet` is a bottom action sheet dialog for presenting a list of selectable menu items, an optional header (`title`, `description`, close trigger), and optional footer action buttons.

- **Related Components**: Internally renders `<c-button>` for the default close trigger and `actions`, and `<c-icon>` for item icons and loading indicators.

## Usage

### Basic

Use `open`, `title`, `description`, `items`, and `actions` to render a standard bottom action sheet.

::code-group
```html [index.wxml]
<c-button label="Open Actions" bind:tap="onOpenSheet" />

<c-action-sheet
  open="{{sheetOpen}}"
  title="Choose an option"
  description="This action cannot be undone."
  items="{{sheetItems}}"
  actions="{{sheetActions}}"
  bind:backdropTap="onCloseSheet"
/>
```

```ts [index.ts]
Page({
  data: {
    sheetOpen: false,
    sheetItems: [
      { key: "share", label: "Share", icon: "share" },
      { key: "copy", label: "Copy Link", icon: "link" },
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
::

### Close Button

Set `close` to `true` to display the default header close `<c-button>`, or pass an `ActionSheetCloseProps` object (`icon`, `color`, `variant`, `size`, `disabled`, `ui`, `className`) to customize it. Listen to `bind:closeTriggerTap` in controlled mode.

::code-group
```html [index.wxml]
<!-- Default close button -->
<c-action-sheet
  open="{{openDefault}}"
  title="Options"
  close="{{true}}"
  items="{{items}}"
  bind:closeTriggerTap="onClose"
/>

<!-- Customized close button -->
<c-action-sheet
  open="{{openCustom}}"
  title="Options"
  close="{{closeConfig}}"
  items="{{items}}"
  bind:closeTriggerTap="onClose"
/>
```

```ts [index.ts]
Page({
  data: {
    openDefault: false,
    openCustom: false,
    items: [{ key: "edit", label: "Edit" }],
    closeConfig: {
      icon: "x",
      color: "neutral",
      variant: "ghost",
      size: "sm",
    },
  },

  onClose() {
    this.setData({ openDefault: false, openCustom: false });
  },
});
```
::

### Items

Each entry in `items` supports `key`, `label`, `description`, `icon`, `color`, `destructive`, `disabled`, `loading`, `loadingIcon`, `className`, and `style`.

::code-group
```html [index.wxml]
<c-action-sheet
  open="{{sheetOpen}}"
  title="File Actions"
  items="{{items}}"
  bind:backdropTap="onClose"
/>
```

```ts [index.ts]
Page({
  data: {
    sheetOpen: false,
    items: [
      {
        key: "rename",
        label: "Rename",
        description: "Change the display name",
        icon: "pencil",
      },
      {
        key: "archive",
        label: "Archive",
        icon: "archive",
        disabled: true,
      },
      {
        key: "delete",
        label: "Delete",
        description: "Permanently remove this item",
        icon: "trash",
        destructive: true,
      },
    ],
  },

  onClose() {
    this.setData({ sheetOpen: false });
  },
});
```
::

### Footer Actions

Use `actions` to render footer `<c-button>` controls below the menu list. Each action supports `label`, `onClick`, `icon`, `leadingIcon`, `trailingIcon`, `color`, `variant`, `size`, `closeOnClick`, `disabled`, `className`, and `ui`.

::code-group
```html [index.wxml]
<c-action-sheet
  open="{{sheetOpen}}"
  title="Publish Draft"
  items="{{items}}"
  actions="{{actions}}"
  bind:backdropTap="onClose"
/>
```

```ts [index.ts]
Page({
  data: {
    sheetOpen: false,
    items: [{ key: "preview", label: "Preview Post", icon: "eye" }],
    actions: [
      {
        label: "Cancel",
        color: "neutral",
        variant: "soft",
        onClick: () => {},
      },
      {
        label: "Publish",
        color: "primary",
        variant: "solid",
        leadingIcon: "send",
        closeOnClick: true,
        onClick: () => {
          console.log("Published");
        },
      },
    ],
  },

  onClose() {
    this.setData({ sheetOpen: false });
  },
});
```
::

### Loading

Show a loading spinner on individual `items` with `loading` and `loadingIcon`, or enable `loading` / `loadingAuto` on footer `actions` for asynchronous `onClick` handlers.

::code-group
```html [index.wxml]
<c-action-sheet
  open="{{sheetOpen}}"
  title="Sync Changes"
  items="{{items}}"
  actions="{{actions}}"
  bind:backdropTap="onClose"
/>
```

```ts [index.ts]
Page({
  data: {
    sheetOpen: false,
    items: [
      {
        key: "sync",
        label: "Syncing...",
        loading: true,
        loadingIcon: "loader-circle",
      },
    ],
    actions: [
      {
        label: "Save",
        color: "primary",
        loadingAuto: true,
        loadingIcon: "loader-circle",
        onClick: () => new Promise((resolve) => setTimeout(resolve, 1200)),
      },
    ],
  },

  onClose() {
    this.setData({ sheetOpen: false });
  },
});
```
::

### Dismissal & Transition

Control whether tapping an item (`close-on-item`) or the backdrop (`close-on-backdrop-click`) closes the sheet, and customize the close transition `duration` in milliseconds.

```html [index.wxml]
<c-action-sheet
  open="{{sheetOpen}}"
  title="Persistent Sheet"
  close="{{true}}"
  close-on-item="{{false}}"
  close-on-backdrop-click="{{false}}"
  duration="{{200}}"
  items="{{items}}"
  bind:closeTriggerTap="onClose"
/>
```

### Uncontrolled & Component API

Leave `open` as `null` (the default) and optionally pass `default-open` for uncontrolled mode, then control the sheet imperatively via `selectComponent` and the exported `actionSheet` API (`openActionSheet()`, `closeActionSheet()`, `setOpen()`, `select()`, `handleAction()`).

::code-group
```html [index.wxml]
<c-button label="Open via API" bind:tap="onOpen" />

<c-action-sheet
  id="sheet"
  default-open="{{false}}"
  title="Quick Actions"
  items="{{items}}"
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { key: "copy", label: "Copy" },
      { key: "share", label: "Share" },
    ],
  },

  onOpen() {
    const comp = this.selectComponent("#sheet");
    comp?.actionSheet?.openActionSheet();
  },

  onClose() {
    const comp = this.selectComponent("#sheet");
    comp?.actionSheet?.closeActionSheet();
  },
});
```
::

### Slots

Customize the header, body, close trigger, and footer using `header`, `title`, `description`, `close`, `default`, and `actions` slots. `title`, `description`, `default`, and `actions` slots render when their corresponding props (`title`, `description`, `items`, `actions`) are empty.

```html [index.wxml]
<!-- Custom title, description, close, default body, and actions slots -->
<c-action-sheet open="{{sheetOpen}}" bind:backdropTap="onClose" bind:closeTriggerTap="onClose">
  <view slot="title" class="text-sm font-semibold">Custom Title</view>
  <view slot="description" class="text-xs text-muted">Custom description text</view>
  <view slot="close" class="text-xs text-primary">Done</view>

  <view class="p-4 text-center text-sm">
    Custom body content rendered when items is empty.
  </view>

  <view slot="actions" class="w-full">
    <c-button label="Dismiss" variant="soft" block="{{true}}" bind:tap="onClose" />
  </view>
</c-action-sheet>

<!-- Replace the entire header block when title, description, close, and their sub-slots are omitted -->
<c-action-sheet open="{{customHeaderOpen}}" items="{{items}}" bind:backdropTap="onClose">
  <view slot="header" class="px-6 py-4 font-medium">Full Custom Header</view>
</c-action-sheet>
```

### Events & Open Types

Configure `openType` (`"getPhoneNumber"`, `"chooseAvatar"`, `"contact"`) on `items` or `actions` to forward native WeChat capability events (`bind:getphonenumber`, `bind:chooseavatar`, `bind:contact`), alongside `bind:backdropTap` and `bind:closeTriggerTap`.

::code-group
```html [index.wxml]
<c-action-sheet
  open="{{sheetOpen}}"
  title="Account & Support"
  close="{{true}}"
  items="{{items}}"
  actions="{{actions}}"
  bind:backdropTap="onClose"
  bind:closeTriggerTap="onClose"
  bind:getphonenumber="onGetPhoneNumber"
  bind:chooseavatar="onChooseAvatar"
  bind:contact="onContact"
/>
```

```ts [index.ts]
Page({
  data: {
    sheetOpen: false,
    items: [
      { key: "phone", label: "Use Phone Number", openType: "getPhoneNumber" },
      { key: "avatar", label: "Choose Avatar", openType: "chooseAvatar" },
    ],
    actions: [
      {
        label: "Customer Support",
        variant: "outline",
        openType: "contact",
      },
    ],
  },

  onClose() {
    this.setData({ sheetOpen: false });
  },

  onGetPhoneNumber(ev: WechatMiniprogram.CustomEvent) {
    console.log("Phone detail:", ev.detail);
  },

  onChooseAvatar(ev: WechatMiniprogram.CustomEvent) {
    console.log("Avatar detail:", ev.detail);
  },

  onContact(ev: WechatMiniprogram.CustomEvent) {
    console.log("Contact detail:", ev.detail);
  },
});
```
::

### UI Customization

Override individual slot classes per instance with `ui`, or add classes to the `root` slot via `class-name`.

```html [index.wxml]
<c-action-sheet
  open="{{sheetOpen}}"
  title="Styled Sheet"
  items="{{items}}"
  class-name="z-[60]"
  ui="{{ { content: 'rounded-t-2xl', header: 'py-5', itemLabel: 'font-medium' } }}"
  bind:backdropTap="onClose"
/>
```

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
| `portal` | `boolean` | `true` | Renders the action sheet overlay and content inside WeChat `<root-portal>`. |
| `ui` | `ActionSheetUI` (`Record<string, string>`) | `{}` | Per-slot class overrides merged into the resolved theme slots. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot. |

::callout{icon="i-lucide-lightbulb" color="info"}
**Callback & ID options (`ActionSheetProps`)**: `id`, `ids`, `onOpenChange`, `onSelect`, `onAction`, and `onClose` are supported by the underlying component props contract (for example via `onClick` on `actions` or component API integration), while the MiniProgram `properties` map exposes the table props above.
::

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

| Name | Description |
| --- | --- |
| `default` | Custom body content rendered when `items` is empty. |
| `header` | Custom header content replacing the entire header block when `title`, `description`, `close`, and all header sub-slots (`title`, `description`, `close`) are absent. |
| `title` | Custom header title content rendered when the `title` prop is empty. |
| `description` | Custom header description content rendered when the `description` prop is empty. |
| `close` | Custom close trigger content wrapped in a tappable container; takes precedence over the `close` prop's `<c-button>`. |
| `actions` | Custom footer actions content rendered when `actions` is empty. |

## Events

| Name | Detail | Description |
| --- | --- | --- |
| `bind:backdropTap` | `TouchEvent` | Fired when the backdrop is tapped. |
| `bind:closeTriggerTap` | `TouchEvent` | Fired when the header close trigger is tapped. |
| `bind:getphonenumber` | `ev.detail` | Forwarded from items or footer actions configured with `open-type="getPhoneNumber"`. |
| `bind:chooseavatar` | `ev.detail` | Forwarded from items or footer actions configured with `open-type="chooseAvatar"`. |
| `bind:contact` | `ev.detail` | Forwarded from items or footer actions configured with `open-type="contact"`. |

## Theme

Customize the `action-sheet` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    actionSheet: {
      slots: {
        root: "fixed inset-0 z-action-sheet flex items-end justify-center overflow-hidden overscroll-contain box-border",
        backdrop:
          "cui-action-sheet-backdrop-enter fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
        content:
          "cui-action-sheet-content-enter relative z-10 flex flex-col w-full max-h-[85vh] bg-elevated rounded-t-lg shadow-2xl transition-transform duration-300 ease-out box-border overflow-hidden translate-y-0",
        header:
          "relative flex flex-col items-center justify-center px-6 py-4 bg-default text-center border-b border-muted shrink-0 w-full box-border",
        title:
          "w-full max-w-full break-words text-xs font-semibold uppercase tracking-wider text-dimmed text-center leading-snug",
        description:
          "w-full max-w-full break-words text-xs text-muted text-center mt-1 leading-normal",
        closeTrigger:
          "absolute right-3.5 top-3.5 z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-elevated text-muted shrink-0 cursor-pointer active:opacity-70 transition-opacity",
        closeButton: "p-0 w-full h-full rounded-full text-inherit",
        closeIcon: "w-4 h-4",
        body: "flex flex-col w-full bg-default overflow-y-auto max-h-[60vh] overscroll-contain box-border",
        item: "relative flex items-center justify-center w-full min-h-14 md:min-h-12 px-6 py-3.5 bg-default border-t border-muted first:border-t-0 text-base cursor-pointer select-none box-border outline-none active:bg-muted transition-colors",
        itemHover: "opacity-70",
        itemText:
          "flex flex-col items-center justify-center text-center flex-1 w-full min-w-0 pointer-events-none",
        itemTitle: "flex items-center justify-center gap-2 w-full",
        itemLabel:
          "text-base font-normal text-highlighted text-center leading-snug",
        itemLabelDestructive: "text-danger font-medium",
        itemDescription: "text-xs text-dimmed text-center mt-1 leading-snug",
        itemIcon: "w-5 h-5 shrink-0 text-muted pointer-events-none",
        itemIconDestructive: "text-danger",
        itemLoadingIcon: "animate-spin text-primary",
        gap: "w-full h-2 bg-elevated shrink-0",
        actions:
          "flex items-center justify-center gap-2 w-full p-3 bg-default pb-[calc(var(--spacing)_*_3_+_env(safe-area-inset-bottom))] box-border",
        action: "flex-1",
      },
      variants: {
        open: {
          true: {
            backdrop: "opacity-100 pointer-events-auto",
          },
          false: {
            backdrop: "opacity-0 pointer-events-none",
          },
        },
        disabled: {
          true: {
            item: "cursor-not-allowed pointer-events-none",
            itemTitle: "opacity-50",
            itemDescription: "opacity-75",
          },
          false: {},
        },
        closable: {
          true: {
            header: "px-14 min-h-14",
          },
          false: {},
        },
      },
      compoundVariants: [
        {
          open: false,
          class: {
            content: "translate-y-full",
          },
        },
        {
          open: true,
          class: {
            content: "translate-y-0",
          },
        },
      ],
      defaultVariants: {
        open: false,
        disabled: false,
        closable: false,
      },
    }
  }
})
```
