---
title: Select
description: A selection control for WeChat MiniProgram supporting floating dropdown menus and bottom-sheet wheel pickers.
---

## Overview

`c-select` is a selection control for WeChat MiniProgram that supports two selection modes:

- **Dropdown mode (`mode="default"`)**: Renders a trigger button paired with a `c-popover` listbox supporting single or multiple selection, leading/trailing icons, a clear button, a loading indicator, and scrollable option lists.
- **Picker mode (`mode="picker"`)**: Renders a bottom-sheet wheel picker inside `<root-portal>` using native `<picker-view>` / `<picker-view-column>` with Cancel/Confirm header controls and single- or multi-column selection.

Related components:

- `c-select-item`: Child option component used both for data-driven `items` rendering and declarative compound children.
- `c-form` / `c-form-field`: Parent form integration for `name`, `form`, `rules`, `validateOn`, `invalid`, and `fieldDisabled`.
- `c-popover` and `c-icon`: Internal UI primitives used by the dropdown and trigger.

## Usage

### Basic

Use `items` and `placeholder` to render a standard dropdown select. Set `defaultValue` for an uncontrolled initial selection, or bind `value` and `bind:change` for controlled state.

::code-group

```html [index.wxml]
<c-select
  placeholder="Select a fruit"
  items="{{fruits}}"
  defaultValue="apple"
/>
```

```ts [index.ts]
Page({
  data: {
    fruits: [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
      { label: "Cherry", value: "cherry", disabled: true },
    ],
  },
});
```

::

### Multiple

Set `multiple="{{true}}"` to allow selecting multiple options in `"default"` dropdown mode. By default `closeOnSelect` resolves to `!multiple`, keeping the dropdown open while toggling items; set `closeOnSelect="{{true}}"` to override this behavior.

::code-group

```html [index.wxml]
<c-select
  multiple="{{true}}"
  placeholder="Select fruits"
  items="{{fruits}}"
  value="{{selectedFruits}}"
  bind:change="onFruitsChange"
/>
```

```ts [index.ts]
Page({
  data: {
    selectedFruits: ["apple"],
    fruits: [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
      { label: "Cherry", value: "cherry" },
    ],
  },
  onFruitsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ selectedFruits: e.detail.value });
  },
});
```

::

### Picker Mode

Set `mode="picker"` to render a bottom-sheet wheel picker using `<picker-view>`. Pass a 2D array to `items` for multi-column selection, and customize the header with `title`, `cancelBtn`, `confirmBtn`, `header`, and `itemHeight`.

::code-group

```html [index.wxml]
<c-select
  mode="picker"
  title="Choose Schedule"
  placeholder="Pick day & time"
  cancelBtn="Back"
  confirmBtn="Done"
  itemHeight="{{44}}"
  items="{{scheduleColumns}}"
  value="{{schedule}}"
  bind:confirm="onScheduleConfirm"
  bind:columnchange="onColumnChange"
  bind:cancel="onScheduleCancel"
/>
```

```ts [index.ts]
Page({
  data: {
    schedule: null as string[] | null,
    scheduleColumns: [
      [
        { label: "Mon", value: "mon" },
        { label: "Tue", value: "tue" },
      ],
      [
        { label: "Morning", value: "am" },
        { label: "Afternoon", value: "pm" },
      ],
    ],
  },
  onScheduleConfirm(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ schedule: e.detail.value });
  },
  onColumnChange(e: WechatMiniprogram.CustomEvent<{ column: number; value: string }>) {
    console.log("Column changed:", e.detail.column, e.detail.value);
  },
  onScheduleCancel(e: WechatMiniprogram.CustomEvent<{ trigger?: string }>) {
    console.log("Cancelled via:", e.detail.trigger);
  },
});
```

::

### Items & Grouping

Item objects in `items` support `type` (`"item" | "label" | "separator"`), `description`, `icon`, `trailingIcon`, `disabled`, `key`, `ui`, and `className`. Nested arrays are also supported for grouped options, and you can map custom object fields using `valueKey`, `labelKey`, `descriptionKey`, and `disabledKey`.

::code-group

```html [index.wxml]
<c-select
  placeholder="Select an option"
  items="{{groupedItems}}"
  valueKey="id"
  labelKey="name"
  descriptionKey="hint"
  disabledKey="locked"
/>
```

```ts [index.ts]
Page({
  data: {
    groupedItems: [
      { type: "label", name: "Produce" },
      { id: "apple", name: "Apple", hint: "Crisp and sweet", icon: "star" },
      { type: "separator" },
      { type: "label", name: "Bakery" },
      { id: "bread", name: "Sourdough", locked: true },
    ],
  },
});
```

::

### Compound Items

Declare `<c-select-item>` children directly inside `<c-select>` for full markup control, or combine them with `items`.

```html [index.wxml]
<c-select placeholder="Select role" defaultValue="editor">
  <c-select-item type="label" label="Team Roles" />
  <c-select-item value="admin" label="Admin" description="Full access" icon="shield" />
  <c-select-item type="separator" />
  <c-select-item value="editor" label="Editor" />
  <c-select-item value="guest" label="Guest" disabled="{{true}}" />
</c-select>
```

### Color

Use `color` to change the focus/highlight ring color (`primary`, `secondary`, `neutral`, `danger`, `success`, `warning`, `info`) and the Confirm button color in `"picker"` mode.

```html [index.wxml]
<c-select color="primary" highlight="{{true}}" placeholder="Primary" items="{{items}}" />
<c-select color="secondary" highlight="{{true}}" placeholder="Secondary" items="{{items}}" />
<c-select color="neutral" highlight="{{true}}" placeholder="Neutral" items="{{items}}" />
<c-select color="success" highlight="{{true}}" placeholder="Success" items="{{items}}" />
<c-select color="warning" highlight="{{true}}" placeholder="Warning" items="{{items}}" />
<c-select color="danger" highlight="{{true}}" placeholder="Danger" items="{{items}}" />
<c-select color="info" highlight="{{true}}" placeholder="Info" items="{{items}}" />
```

### Variant

Use `variant` to change the trigger visual style between `"outline"`, `"soft"`, `"subtle"`, `"ghost"`, and `"none"`.

```html [index.wxml]
<c-select variant="outline" placeholder="Outline" items="{{items}}" />
<c-select variant="soft" placeholder="Soft" items="{{items}}" />
<c-select variant="subtle" placeholder="Subtle" items="{{items}}" />
<c-select variant="ghost" placeholder="Ghost" items="{{items}}" />
<c-select variant="none" placeholder="None" items="{{items}}" />
```

### Size

Use `size` (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`) to adjust trigger height, padding, font size, and icon dimensions. When empty, `size` inherits `fieldSize` or falls back to `"md"`.

```html [index.wxml]
<c-select size="xs" placeholder="Extra small" items="{{items}}" />
<c-select size="sm" placeholder="Small" items="{{items}}" />
<c-select size="md" placeholder="Medium" items="{{items}}" />
<c-select size="lg" placeholder="Large" items="{{items}}" />
<c-select size="xl" placeholder="Extra large" items="{{items}}" />
```

### Highlight & Invalid

Use `highlight` to always show the colored border and ring, or `invalid` to display error styling outside or alongside form validation.

```html [index.wxml]
<c-select color="primary" highlight="{{true}}" placeholder="Highlighted" items="{{items}}" />
<c-select invalid="{{true}}" placeholder="Invalid selection" items="{{items}}" />
```

### Disabled & Read Only

Use `disabled` to disable interaction and apply disabled styling, or `readOnly` to mark the select as read-only.

```html [index.wxml]
<c-select disabled="{{true}}" placeholder="Disabled" items="{{items}}" />
<c-select readOnly="{{true}}" defaultValue="apple" items="{{items}}" />
```

### Clearable

Set `clearable="{{true}}"` to render a clear button in the trailing area when a value is selected. Customize the icon with `clearIcon` and listen to `bind:clear`.

::code-group

```html [index.wxml]
<c-select
  placeholder="Select a fruit"
  items="{{fruits}}"
  value="{{selectedFruit}}"
  clearable="{{true}}"
  clearIcon="close"
  bind:change="onFruitChange"
  bind:clear="onFruitClear"
/>
```

```ts [index.ts]
Page({
  data: {
    selectedFruit: "apple" as string | null,
    fruits: [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
    ],
  },
  onFruitChange(e: WechatMiniprogram.CustomEvent<{ value: string | null }>) {
    this.setData({ selectedFruit: e.detail.value });
  },
  onFruitClear() {
    this.setData({ selectedFruit: null });
  },
});
```

::

### Loading

Set `loading="{{true}}"` to display a spinning indicator in the trailing area. Customize the icon with `loadingIcon`.

```html [index.wxml]
<c-select
  loading="{{true}}"
  loadingIcon="loading"
  placeholder="Loading options..."
  items="{{items}}"
/>
```

### Icon

Configure trigger and option icons using `icon`, `leading`, `leadingIcon`, `trailing`, `trailingIcon`, and `selectedIcon`. In single-select mode, `leadingIcon` falls back to the selected item's `icon` when empty.

```html [index.wxml]
<c-select
  leading="{{true}}"
  leadingIcon="search"
  trailingIcon="chevronDown"
  selectedIcon="check"
  placeholder="Choose item"
  items="{{items}}"
/>
```

### Content & Portal

In `"default"` mode, customize floating menu placement and sizing with `content` (`side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`, `avoidCollisions`, `matchTriggerWidth`, `maxHeight`), show a pointer via `arrow`, render inside a portal with `portal`, or adjust `duration` and `closeOnBackdropClick`.

::code-group

```html [index.wxml]
<c-select
  placeholder="Select option"
  items="{{items}}"
  portal="{{true}}"
  arrow="{{true}}"
  duration="{{200}}"
  closeOnBackdropClick="{{true}}"
  content="{{menuContent}}"
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
    ],
    menuContent: {
      side: "top",
      align: "end",
      sideOffset: 8,
      matchTriggerWidth: false,
      maxHeight: 200,
    },
  },
});
```

::

### Empty State

Customize the empty state message with `emptyText` when `items` and declarative children are empty, or override it with the `empty` slot.

```html [index.wxml]
<c-select placeholder="No data" items="{{ [] }}" emptyText="Nothing available" />
```

### Slots

`c-select` provides named slots (`leading`, `value`, `trailing`, `loadingIcon`, `header`, `footer`, `empty`) alongside the default slot for `<c-select-item>` children.

```html [index.wxml]
<c-select placeholder="Select role" leading="{{true}}" loading="{{isLoading}}">
  <text slot="leading" class="text-xs text-muted">Role:</text>
  <view slot="header" class="text-xs text-muted">Available Roles</view>
  <c-select-item value="admin" label="Admin" description="Full access" />
  <c-select-item value="editor" label="Editor" />
  <view slot="footer" class="text-xs text-muted">Contact admin for access</view>
  <view slot="empty">Nothing to pick</view>
</c-select>
```

### Controlled & Events

Control both `value` and `open` (or use `defaultOpen` for uncontrolled initial open state), and subscribe to `bind:change`, `bind:select`, `bind:openchange`, `bind:clear`, or picker wheel events (`bind:confirm`, `bind:cancel`, `bind:columnchange`, `bind:pickstart`, `bind:pickend`).

::code-group

```html [index.wxml]
<c-select
  placeholder="Controlled select"
  items="{{fruits}}"
  value="{{selectedFruit}}"
  open="{{isOpen}}"
  bind:change="onChange"
  bind:select="onSelect"
  bind:openchange="onOpenChange"
/>
```

```ts [index.ts]
Page({
  data: {
    selectedFruit: null as string | null,
    isOpen: false,
    fruits: [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
    ],
  },
  onChange(e: WechatMiniprogram.CustomEvent<{ value: string | null }>) {
    this.setData({ selectedFruit: e.detail.value });
  },
  onSelect(e: WechatMiniprogram.CustomEvent<{ value: string; selected: boolean }>) {
    console.log("Selected item:", e.detail.value, e.detail.selected);
  },
  onOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean }>) {
    this.setData({ isOpen: e.detail.open });
  },
});
```

::

### Form Integration

Wrap `<c-select>` inside `<c-form-field>` within `<c-form>` to integrate with form validation, error display, and disabled state inheritance (`fieldDisabled`). Configure `validate-on` and `bind:submit` on `<c-form>`, and pass `name`, `label`, `required`, and `rules` on `<c-form-field>`.

::code-group

```html [index.wxml]
<c-form id="profileForm" validate-on="change" bind:submit="onSubmit">
  <c-form-field
    name="country"
    label="Country"
    required="{{true}}"
    rules="{{countryRules}}"
  >
    <c-select
      placeholder="Select country"
      items="{{countries}}"
    />
  </c-form-field>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    countries: [
      { label: "Indonesia", value: "id" },
      { label: "Singapore", value: "sg" },
    ],
    countryRules: [{ required: true, message: "Please select a country" }],
  },
  onSubmit(e: WechatMiniprogram.CustomEvent) {
    console.log("Form submitted:", e.detail);
  },
});
```

::

### Custom Styling

Use `class-name` (`className`) to style the `root` slot and `ui` to override individual theme slots.

::code-group

```html [index.wxml]
<c-select
  placeholder="Custom styled"
  items="{{items}}"
  class-name="w-64"
  ui="{{selectUi}}"
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
    ],
    selectUi: {
      base: "rounded-full",
      placeholder: "italic",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `SelectScalarValue \| SelectScalarValue[] \| null` | `null` | Controlled selected value (`null` for uncontrolled). `SelectScalarValue` is `string \| number \| boolean`. |
| `defaultValue` | `SelectScalarValue \| SelectScalarValue[] \| null` | `null` | Initial selected value when uncontrolled. |
| `open` | `boolean \| null` | `null` | Controlled open state (`null` for uncontrolled). |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled. |
| `mode` | `"default" \| "picker"` | `"default"` | Selection mode: floating dropdown menu (`"default"`) or bottom-sheet wheel picker (`"picker"`). |
| `multiple` | `boolean` | `false` | Enables multiple selection in `"default"` dropdown mode. |
| `items` | `SelectItemInput[] \| SelectItemInput[][]` | `[]` | Options data: flat array of primitives/objects, nested grouped arrays, or multi-column arrays in `"picker"` mode. Item objects support `type` (`"item" \| "label" \| "separator"`), `value`, `label`, `description`, `icon`, `trailingIcon`, `disabled`, `key`, `ui`, and `className`. |
| `childItems` | `SelectChildItemDescriptor[]` | `[]` | Normalized descriptors from declarative `<c-select-item>` children. |
| `valueKey` | `string` | `"value"` | Property key used to read the option value from `items`. |
| `labelKey` | `string` | `"label"` | Property key used to read the option label from `items`. |
| `descriptionKey` | `string` | `"description"` | Property key used to read the option description from `items`. |
| `disabledKey` | `string` | `"disabled"` | Property key used to read the option disabled flag from `items`. |
| `disabled` | `boolean` | `false` | Disables selection on the trigger and items. |
| `readOnly` | `boolean` | `false` | Marks the select as read-only. |
| `required` | `boolean` | `false` | Marks selection as required for form metadata. |
| `invalid` | `boolean \| null` | `null` | Controlled invalid state (`null` defers to form validation). |
| `fieldDisabled` | `boolean` | `false` | Disabled state inherited from a parent form field wrapper. |
| `name` | `string` | `""` | Form field name. |
| `form` | `string` | `""` | Target `<c-form>` id or name. |
| `rules` | `FormRule[]` | `[]` | Field-level form validation rules. |
| `validateOn` | `FormValidateOn \| null` | `null` | Field-level override for form validation triggers. |
| `closeOnSelect` | `boolean \| null` | `null` | Closes dropdown when an item is selected (`null` resolves to `!multiple`). |
| `closeOnBackdropClick` | `boolean` | `true` | Closes the dropdown or picker sheet when tapping the backdrop. |
| `clearable` | `boolean` | `false` | Shows a clear button in the trailing area when a value is selected. |
| `duration` | `number` | `150` | Close transition duration in milliseconds (forwarded to `c-popover`). |
| `variant` | `"outline" \| "soft" \| "subtle" \| "ghost" \| "none"` | `"outline"` | Visual style variant of the trigger. |
| `color` | `"primary" \| "secondary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info" \| string` | `"primary"` | Accent color for open/highlight rings and picker confirm button. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Trigger size; falls back to `fieldSize` or `"md"` when empty. |
| `highlight` | `boolean` | `false` | Highlights the trigger border and focus ring using `color`. |
| `placeholder` | `string` | `""` | Placeholder text displayed when no value is selected. |
| `icon` | `string` | `""` | Icon name passed to the icon resolver. |
| `leading` | `boolean` | `false` | Displays the leading icon/slot container on the trigger. |
| `leadingIcon` | `string` | `""` | Leading icon name (defaults to the selected item's `icon` in single-select mode when empty). |
| `trailing` | `boolean` | `true` | Displays the trailing icon/slot container on the trigger. |
| `trailingIcon` | `string` | `"chevronDown"` | Trailing icon name. |
| `selectedIcon` | `string` | `"check"` | Default check icon passed to data-driven `<c-select-item>` entries. |
| `clearIcon` | `string` | `"close"` | Icon name for the clear button when `clearable` is active. |
| `loading` | `boolean` | `false` | Displays a loading indicator in the trailing area. |
| `loadingIcon` | `string` | `"loading"` | Icon name used when `loading` is `true`. |
| `portal` | `boolean` | `false` | Renders the dropdown menu in a portal in `"default"` mode (forwarded to `c-popover`). |
| `arrow` | `boolean` | `false` | Shows an arrow on the floating dropdown menu in `"default"` mode. |
| `content` | `SelectContentConfig` | `{}` | Floating menu placement and sizing config (`side`: `"bottom"`, `align`: `"start"`, `sideOffset`: `4`, `alignOffset`: `0`, `collisionPadding`: `8`, `avoidCollisions`: `true`, `matchTriggerWidth`: `true`, `maxHeight`: `240`). |
| `title` | `string` | `""` | Title text in the picker header (`mode="picker"`) when the `header` slot is not used. |
| `cancelBtn` | `string \| boolean \| null` | `"Cancel"` | Cancel button text in picker mode (`false`, `null`, or `""` hides the button; `true` falls back to `"Cancel"`). |
| `confirmBtn` | `string \| boolean \| null` | `"Confirm"` | Confirm button text in picker mode (`false`, `null`, or `""` hides the button; `true` falls back to `"Confirm"`). |
| `header` | `boolean` | `true` | Shows or hides the header bar in `"picker"` mode. |
| `itemHeight` | `number` | `44` | Height in `px` for each row inside `<picker-view>` in `"picker"` mode. |
| `emptyText` | `string` | `"No options"` | Fallback text rendered when no options exist and the `empty` slot is not provided. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides merged over theme slot classes. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (pass `class-name` in WXML). |

## Slots

| Slot | Description |
| --- | --- |
| `default` | Renders declarative `<c-select-item>` children inside the `"default"` dropdown `<scroll-view>` viewport (in addition to any `items` array entries). |
| `leading` | Custom leading content inside the trigger when `leading` (or leading icon) is active. Falls back to `<c-icon>` using `leadingIcon` (or selected item's `icon`). |
| `value` | Custom selected-value display inside the trigger. Renders `displayLabel` if a value is selected, or `placeholder` otherwise. |
| `loadingIcon` | Custom loading indicator inside the trailing container when `loading` is `true`. Falls back to `<c-icon name="{{loadingIcon}}">`. |
| `trailing` | Custom trailing content inside the trigger when not loading and not showing the clear button. Falls back to `<c-icon>` using `trailingIcon`. |
| `header` | In `"default"` mode, renders above the dropdown `<scroll-view>`. In `"picker"` mode, replaces the center `title` inside `pickerHeader` (falls back to `title` when `header` is `true`). |
| `footer` | In `"default"` mode, renders below the dropdown `<scroll-view>`. In `"picker"` mode, renders at the bottom of `pickerContent` inside `pickerFooter`. |
| `empty` | Custom empty state when no options exist in either mode. Falls back to `emptyText`. |

## Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: SelectValue, item?: NormalizedSelectItem, items?: NormalizedSelectItem[] }` | Fired when the selected value changes. |
| `bind:select` | `{ value: SelectScalarValue, item?: NormalizedSelectItem, selected: boolean }` | Fired when an option item is tapped in `"default"` dropdown mode. |
| `bind:openchange` | `{ open: boolean }` | Fired when the dropdown or picker open state changes. |
| `bind:confirm` | `{ value: SelectValue, label: string \| string[], index: number[], items: SelectPickerColumnItem[] }` | Fired when the Confirm button is tapped in `"picker"` mode. |
| `bind:cancel` | `{ trigger?: string }` | Fired when `"picker"` mode is cancelled (e.g., Cancel button or backdrop tap). |
| `bind:columnchange` | `{ column: number, index: number, value: SelectScalarValue, label: string, item: SelectPickerColumnItem, values: SelectScalarValue[], items: SelectPickerColumnItem[] }` | Fired when a column wheel changes in `"picker"` mode. |
| `bind:clear` | `Record<string, any>` | Fired when the clear button is tapped. |
| `bind:pickstart` | — | Forwarded from `<picker-view>` when wheel scrolling starts in `"picker"` mode. |
| `bind:pickend` | — | Forwarded from `<picker-view>` when wheel scrolling ends in `"picker"` mode. |

## Item (`c-select-item`)

`c-select-item` renders an individual option, group label, or visual separator inside a `c-select` dropdown menu. It supports leading/trailing icons, primary label and secondary description text, selected-state indicators, disabled styling, and per-slot theme overrides. Tapping a selectable item updates the parent `c-select` selection automatically without emitting separate events from `c-select-item`.

### Item Usage

::code-group

```html [index.wxml]
<!-- Declarative compound usage inside c-select -->
<c-select value="{{selectedFruit}}" placeholder="Pick a fruit" bind:change="onFruitChange">
  <c-select-item type="label" label="Citrus" />
  <c-select-item
    value="orange"
    label="Orange"
    description="Sweet and tangy"
    icon="sun"
  />
  <c-select-item
    value="lemon"
    label="Lemon"
    disabled="{{true}}"
  />

  <c-select-item type="separator" />

  <c-select-item type="label" label="Berries" />
  <c-select-item
    value="strawberry"
    label="Strawberry"
    ui="{{ { label: 'font-semibold' } }}"
    class-name="my-custom-item"
  />
</c-select>

<!-- Custom slots -->
<c-select value="{{selectedUser}}" bind:change="onUserChange">
  <c-select-item value="u1">
    <c-avatar slot="leading" size="xs" text="AJ" />
    <view class="flex flex-col">
      <text class="text-sm font-medium">Alex Johnson</text>
      <text class="text-xs text-muted">alex@example.com</text>
    </view>
    <text slot="trailing" class="text-xs text-primary">Selected</text>
  </c-select-item>
</c-select>
```

```ts [index.ts]
Page({
  data: {
    selectedFruit: "orange",
    selectedUser: "u1",
  },
  onFruitChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ selectedFruit: e.detail.value });
  },
  onUserChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ selectedUser: e.detail.value });
  },
});
```

::

### Item Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number` | `""` | Option value identifier used for selection matching. |
| `type` | `"item" \| "label" \| "separator"` | `"item"` | Item kind: selectable option (`"item"`), non-selectable group heading (`"label"`), or divider line (`"separator"`). |
| `label` | `string` | `""` | Primary option text (when `type === "item"`) or heading text (when `type === "label"`). |
| `description` | `string` | `""` | Secondary descriptive text rendered below `label` for `"item"` entries. |
| `icon` | `string` | `""` | Leading icon name rendered via `c-icon` when the `leading` slot is not provided. |
| `trailingIcon` | `string` | `""` | Trailing icon name rendered via `c-icon` when selected and no `trailing` slot is provided. Falls back to parent `selectedIcon`, then `"check"`. |
| `color` | `SelectItemColor` (`string`) | `""` | Theme color token (e.g. `"primary"`, `"neutral"`). Falls back to parent `color`, then `"primary"`. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Size variant. Falls back to parent `size`, then `"md"`. |
| `disabled` | `boolean` | `false` | Disables selection and applies disabled styling when `true`. |
| `selected` | `boolean \| null` | `null` | Direct selected state override when used standalone or overriding parent selection state. |
| `index` | `number \| null` | `null` | Explicit item index override. |
| `managed` | `boolean` | `false` | Internal flag indicating the item is rendered by parent `c-select` via `wx:for`. |
| `ui` | `Record<string, string>` | `{}` | Per-slot utility class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional class string applied to the `root` slot (pass `class-name` in WXML). |

### Item Slots

| Slot | Description |
| --- | --- |
| `default` | Custom body content inside the item wrapper. Replaces both `label` and `description` when provided. |
| `label` | Custom primary label content for `"item"` and `"label"` types when the `label` prop is not used. |
| `description` | Custom secondary description content below the label for `"item"` entries when the `description` prop is not used. |
| `leading` | Custom leading content; falls back to `<c-icon>` using `icon`. |
| `trailing` | Custom trailing content; falls back to `<c-icon>` using `trailingIcon` (or parent `selectedIcon` / `"check"`) when selected. |

> **Note**: When `type === "separator"`, no slots are rendered.

## Theme

Customize the `select` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    select: {
      slots: {
        root: "relative w-full",
        base: "relative w-full min-h-0 flex items-center justify-between overflow-hidden box-border rounded-md border text-highlighted transition-colors cursor-pointer select-none focus:outline-none",
        leading: "shrink-0 flex items-center justify-center text-dimmed",
        leadingIcon:
          "inline-flex items-center justify-center shrink-0 leading-none",
        value: "flex-1 min-w-0 truncate text-left text-inherit",
        placeholder: "flex-1 min-w-0 truncate text-left text-dimmed",
        trailing: "shrink-0 flex items-center justify-center gap-1 text-dimmed",
        trailingIcon:
          "inline-flex items-center justify-center shrink-0 leading-none transition-transform duration-200",
        iconInner: "w-full h-full block",
        loadingIcon: "w-full h-full block animate-spin",
        content: "",
        viewport: "w-full p-1 flex flex-col gap-1 box-border",
        header: "px-2.5 py-2 border-b border-muted",
        footer: "px-2.5 py-2 border-t border-muted",
        empty: "py-6 px-3 text-center text-sm text-muted",
        pickerRoot:
          "fixed inset-0 z-picker flex items-end justify-center overflow-hidden overscroll-contain box-border",
        pickerBackdrop:
          "fixed inset-0 bg-black/40 transition-opacity duration-250",
        pickerContent:
          "relative z-10 flex flex-col w-full bg-default rounded-t-md shadow-2xl transition-transform duration-250 ease-out box-border overflow-hidden pb-[env(safe-area-inset-bottom)]",
        pickerHeader:
          "flex items-center justify-between px-4 py-3 border-b border-muted shrink-0 box-border w-full",
        pickerCancel:
          "text-sm text-muted px-1 py-0.5 cursor-pointer select-none active:opacity-70",
        pickerTitle:
          "flex-1 min-w-0 text-center text-base font-semibold text-highlighted truncate px-2",
        pickerConfirm:
          "text-sm font-semibold px-1 py-0.5 cursor-pointer select-none active:opacity-70",
        pickerBody: "w-full bg-default box-border overflow-hidden",
        pickerView: "w-full",
        pickerColumn: "",
        pickerItem:
          "flex items-center justify-center text-sm text-highlighted truncate px-3 text-center",
        pickerItemDisabled:
          "flex items-center justify-center text-sm text-dimmed opacity-40 truncate px-3 text-center",
        pickerFooter:
          "px-4 py-3 border-t border-muted shrink-0 box-border w-full",
      },
      variants: {
        color: {
          primary: {
            pickerConfirm: "text-primary",
          },
          secondary: {
            pickerConfirm: "text-secondary",
          },
          danger: {
            pickerConfirm: "text-danger",
          },
          success: {
            pickerConfirm: "text-success",
          },
          warning: {
            pickerConfirm: "text-warning",
          },
          info: {
            pickerConfirm: "text-info",
          },
          neutral: {
            pickerConfirm: "text-highlighted",
          },
        },
        variant: {
          outline: {
            base: "bg-default text-highlighted border-accented",
          },
          soft: {
            base: "bg-elevated text-highlighted border-transparent",
          },
          subtle: {
            base: "bg-elevated text-highlighted border-accented",
          },
          ghost: {
            base: "bg-transparent text-highlighted border-transparent",
          },
          none: {
            base: "bg-transparent text-highlighted border-0",
          },
        },
        size: {
          xs: {
            base: "h-7 text-xs px-2 gap-1",
            leadingIcon: "size-3",
            trailingIcon: "size-3",
          },
          sm: {
            base: "h-8 text-xs px-2.5 gap-1.5",
            leadingIcon: "size-4",
            trailingIcon: "size-4",
          },
          md: {
            base: "h-9 text-sm px-3 gap-1.5",
            leadingIcon: "size-4",
            trailingIcon: "size-4",
          },
          lg: {
            base: "h-10 text-base px-3.5 gap-2",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
          },
          xl: {
            base: "h-11 text-lg px-4 gap-2",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
          },
        },
        open: {
          true: {
            root: "z-50",
            trailingIcon: "rotate-180",
            pickerBackdrop: "opacity-100 pointer-events-auto",
            pickerContent: "translate-y-0",
          },
          false: {
            pickerBackdrop: "opacity-0 pointer-events-none",
            pickerContent: "translate-y-full",
          },
        },
        leading: {
          true: { base: "" },
          false: { base: "" },
        },
        trailing: {
          true: { base: "" },
          false: { base: "" },
        },
        highlight: {
          true: { base: "" },
          false: { base: "" },
        },
        disabled: {
          true: {
            root: "opacity-60 cursor-not-allowed",
            base: "cursor-not-allowed bg-elevated text-dimmed pointer-events-none",
          },
          false: {},
        },
        invalid: {
          true: { base: "" },
          false: {},
        },
      },
      compoundVariants: [
        {
          color: "primary",
          highlight: true,
          class: {
            base: "border-primary ring-2 ring-primary/20",
          },
        },
        {
          color: "secondary",
          highlight: true,
          class: {
            base: "border-secondary ring-2 ring-secondary/20",
          },
        },
        {
          color: "danger",
          highlight: true,
          class: {
            base: "border-danger ring-2 ring-danger/20",
          },
        },
        {
          color: "success",
          highlight: true,
          class: {
            base: "border-success ring-2 ring-success/20",
          },
        },
        {
          color: "warning",
          highlight: true,
          class: {
            base: "border-warning ring-2 ring-warning/20",
          },
        },
        {
          color: "info",
          highlight: true,
          class: {
            base: "border-info ring-2 ring-info/20",
          },
        },
        {
          color: "neutral",
          highlight: true,
          class: {
            base: "border-inverted ring-2 ring-inverted/20",
          },
        },
        {
          color: "primary",
          open: true,
          class: {
            base: "border-primary ring-2 ring-primary/20",
          },
        },
        {
          color: "secondary",
          open: true,
          class: {
            base: "border-secondary ring-2 ring-secondary/20",
          },
        },
        {
          color: "danger",
          open: true,
          class: {
            base: "border-danger ring-2 ring-danger/20",
          },
        },
        {
          color: "success",
          open: true,
          class: {
            base: "border-success ring-2 ring-success/20",
          },
        },
        {
          color: "warning",
          open: true,
          class: {
            base: "border-warning ring-2 ring-warning/20",
          },
        },
        {
          color: "info",
          open: true,
          class: {
            base: "border-info ring-2 ring-info/20",
          },
        },
        {
          color: "neutral",
          open: true,
          class: {
            base: "border-inverted ring-2 ring-inverted/20",
          },
        },
        {
          variant: "ghost",
          open: true,
          class: {
            base: "border-transparent ring-0",
          },
        },
        {
          variant: "none",
          open: true,
          class: {
            base: "border-0 ring-0",
          },
        },
        {
          invalid: true,
          class: {
            base: "border-danger ring-2 ring-danger/20",
          },
        },
      ],
      defaultVariants: {
        variant: "outline",
        color: "primary",
        size: "md",
        open: false,
        leading: false,
        trailing: true,
        highlight: false,
        disabled: false,
        invalid: false,
      },
    },
  },
});
```
