---
title: InputMenu
description: A searchable combobox and autocomplete input with a floating dropdown menu of selectable options.
---

## Overview

`c-input-menu` is a searchable combobox and autocomplete input with a floating dropdown menu of selectable options. It supports single and multiple (tag-based) selection, built-in or external search filtering, dynamic item creation, clearable values, and integration with `<c-form>` and `<c-form-field>`.

- **Related Components**:
  - `<c-form>`, `<c-form-field>` — Form validation, disabled state, and size propagation.
  - `<c-popover>` — Floating dropdown positioning, backdrop handling, and transitions.
  - `<c-input-menu-item>` — Child option, group heading, and separator component used for both data-driven `items` and declarative children.

## Usage

### Basic

Use `items` with `placeholder` to render a searchable single-select combobox, and `bind:change` to react to selection updates.

::code-group

```html [index.wxml]
<c-input-menu
  value="{{selectedFramework}}"
  items="{{frameworks}}"
  placeholder="Select a framework..."
  bind:change="onFrameworkChange"
/>
```

```ts [index.ts]
Page({
  data: {
    selectedFramework: null as string | null,
    frameworks: [
      { label: "Vue", value: "vue" },
      { label: "React", value: "react" },
      { label: "Svelte", value: "svelte" },
    ],
  },
  onFrameworkChange(e: WechatMiniprogram.CustomEvent<{ value: string | null }>) {
    this.setData({ selectedFramework: e.detail.value });
  },
});
```

```json [index.json]
{
  "usingComponents": {
    "c-input-menu": "@code-id-labs/components/input-menu/index"
  }
}
```

::

### Multiple

Set `multiple` to allow selecting multiple items rendered as removable tags. By default, `close-on-select` stays open (`!multiple`) so users can pick several options in one pass.

::code-group

```html [index.wxml]
<c-input-menu
  multiple
  value="{{selectedTags}}"
  items="{{tags}}"
  placeholder="Select tags..."
  bind:change="onTagsChange"
/>
```

```ts [index.ts]
Page({
  data: {
    selectedTags: ["ui"],
    tags: [
      { label: "UI", value: "ui" },
      { label: "MiniProgram", value: "miniapp" },
      { label: "TypeScript", value: "ts" },
    ],
  },
  onTagsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ selectedTags: e.detail.value });
  },
});
```

::

### Controlled

Control `value`, `search-term`, and `open` explicitly, or use `default-value`, `default-search-term`, and `default-open` for uncontrolled initial state.

::code-group

```html [index.wxml]
<c-input-menu
  value="{{selectedCity}}"
  search-term="{{query}}"
  open="{{menuOpen}}"
  items="{{cities}}"
  placeholder="Search city..."
  bind:change="onCityChange"
  bind:searchtermchange="onSearchChange"
  bind:openchange="onOpenChange"
/>
```

```ts [index.ts]
Page({
  data: {
    selectedCity: null as string | null,
    query: "",
    menuOpen: false,
    cities: [
      { label: "Tokyo", value: "tokyo" },
      { label: "Singapore", value: "singapore" },
      { label: "Jakarta", value: "jakarta" },
    ],
  },
  onCityChange(e: WechatMiniprogram.CustomEvent<{ value: string | null }>) {
    this.setData({ selectedCity: e.detail.value });
  },
  onSearchChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ query: e.detail.value });
  },
  onOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean }>) {
    this.setData({ menuOpen: e.detail.open });
  },
});
```

::

### Items & Custom Keys

`items` accepts scalar values, item objects, or nested arrays for grouped lists. Use `value-key`, `label-key`, `description-key`, and `disabled-key` to map custom object shapes.

::code-group

```html [index.wxml]
<!-- Grouped items -->
<c-input-menu items="{{groupedItems}}" placeholder="Select a fruit or vegetable..." />

<!-- Custom object keys -->
<c-input-menu
  items="{{members}}"
  value-key="id"
  label-key="fullName"
  description-key="role"
  disabled-key="archived"
  placeholder="Assign member..."
/>
```

```ts [index.ts]
Page({
  data: {
    groupedItems: [
      [
        { type: "label", label: "Fruits" },
        { label: "Apple", value: "apple" },
        { label: "Banana", value: "banana" },
      ],
      [
        { type: "label", label: "Vegetables" },
        { label: "Carrot", value: "carrot" },
      ],
    ],
    members: [
      { id: 1, fullName: "Alice Lin", role: "Maintainer", archived: false },
      { id: 2, fullName: "Bob Chen", role: "Guest", archived: true },
    ],
  },
});
```

::

### Declarative Items

Render `<c-input-menu-item>` children directly inside `<c-input-menu>` for declarative options, group labels (`type="label"`), and dividers (`type="separator"`).

::code-group

```html [index.wxml]
<c-input-menu placeholder="Pick a role..." bind:change="onRoleChange">
  <c-input-menu-item type="label" label="Workspace Roles" />
  <c-input-menu-item value="admin" label="Administrator" description="Full workspace access" />
  <c-input-menu-item value="editor" label="Editor" description="Can edit content" />
  <c-input-menu-item type="separator" />
  <c-input-menu-item value="viewer" label="Viewer" disabled />
</c-input-menu>
```

```ts [index.ts]
Page({
  onRoleChange(e: WechatMiniprogram.CustomEvent<{ value: string | null }>) {
    console.log("Selected role:", e.detail.value);
  },
});
```

```json [index.json]
{
  "usingComponents": {
    "c-input-menu": "@code-id-labs/components/input-menu/index",
    "c-input-menu-item": "@code-id-labs/components/input-menu-item/index"
  }
}
```

::

### Color

Use `color` to change the focus, open, and highlight ring accent color (`primary`, `secondary`, `neutral`, `danger`, `success`, `warning`, `info`), and `highlight` to always accentuate the border and ring.

::code-group

```html [index.wxml]
<c-input-menu color="primary" highlight items="{{items}}" placeholder="Primary highlight" />
<c-input-menu color="secondary" highlight items="{{items}}" placeholder="Secondary highlight" />
<c-input-menu color="neutral" highlight items="{{items}}" placeholder="Neutral highlight" />
<c-input-menu color="success" highlight items="{{items}}" placeholder="Success highlight" />
<c-input-menu color="info" highlight items="{{items}}" placeholder="Info highlight" />
<c-input-menu color="warning" highlight items="{{items}}" placeholder="Warning highlight" />
<c-input-menu color="danger" highlight items="{{items}}" placeholder="Danger highlight" />
```

```ts [index.ts]
Page({
  data: {
    items: ["Backlog", "In Progress", "Done"],
  },
});
```

::

### Variant

Use `variant` to change the trigger visual style (`outline`, `soft`, `subtle`, `ghost`, `none`).

::code-group

```html [index.wxml]
<c-input-menu variant="outline" items="{{items}}" placeholder="Outline (default)" />
<c-input-menu variant="soft" items="{{items}}" placeholder="Soft" />
<c-input-menu variant="subtle" items="{{items}}" placeholder="Subtle" />
<c-input-menu variant="ghost" items="{{items}}" placeholder="Ghost" />
<c-input-menu variant="none" items="{{items}}" placeholder="None" />
```

```ts [index.ts]
Page({
  data: {
    items: ["Backlog", "In Progress", "Done"],
  },
});
```

::

### Size

Use `size` to adjust the trigger height, text size, padding, tags, and icon sizing (`xs`, `sm`, `md`, `lg`, `xl`).

::code-group

```html [index.wxml]
<c-input-menu size="xs" items="{{items}}" placeholder="Extra small" />
<c-input-menu size="sm" items="{{items}}" placeholder="Small" />
<c-input-menu size="md" items="{{items}}" placeholder="Medium (default)" />
<c-input-menu size="lg" items="{{items}}" placeholder="Large" />
<c-input-menu size="xl" items="{{items}}" placeholder="Extra large" />
```

```ts [index.ts]
Page({
  data: {
    items: ["Backlog", "In Progress", "Done"],
  },
});
```

::

### Icon

Customize trigger and item icons with `icon`, `leading`, `leading-icon`, `trailing`, `trailing-icon`, `selected-icon`, `clear-icon`, `delete-icon`, and `create-icon`.

::code-group

```html [index.wxml]
<c-input-menu
  multiple
  clearable
  leading
  leading-icon="search"
  trailing-icon="chevrons-up-down"
  selected-icon="check-circle"
  clear-icon="x-circle"
  delete-icon="x"
  items="{{items}}"
  placeholder="Search items..."
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { label: "Bug", value: "bug", icon: "bug" },
      { label: "Feature", value: "feature", icon: "sparkles" },
    ],
  },
});
```

::

### Clearable

Enable `clearable` to show a clear button when a value is selected. Listen to `bind:clear` to run side effects when cleared.

::code-group

```html [index.wxml]
<c-input-menu
  clearable
  default-value="vue"
  items="{{items}}"
  placeholder="Pick a framework..."
  bind:clear="onClear"
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { label: "Vue", value: "vue" },
      { label: "React", value: "react" },
    ],
  },
  onClear() {
    console.log("Selection cleared");
  },
});
```

::

### Loading

Set `loading` to display a spinning indicator in the trailing area, and optionally customize the icon via `loading-icon`. Pair with `ignore-filter` for async server-side search.

::code-group

```html [index.wxml]
<c-input-menu
  loading="{{isLoading}}"
  loading-icon="loader-2"
  ignore-filter
  items="{{results}}"
  placeholder="Search users..."
  bind:searchtermchange="onSearchUsers"
/>
```

```ts [index.ts]
Page({
  data: {
    isLoading: false,
    results: [] as Array<{ label: string; value: string }>,
  },
  onSearchUsers(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ isLoading: true });
    // Fetch matching users for e.detail.value, then update results and isLoading
  },
});
```

::

### Disabled, Read-Only & Invalid

Use `disabled`, `read-only`, `required`, and `invalid` to control interaction and validation appearance.

::code-group

```html [index.wxml]
<c-input-menu disabled items="{{items}}" placeholder="Disabled" />
<c-input-menu read-only default-value="vue" items="{{items}}" placeholder="Read-only" />
<c-input-menu required invalid items="{{items}}" placeholder="Required & invalid" />
```

```ts [index.ts]
Page({
  data: {
    items: [
      { label: "Vue", value: "vue" },
      { label: "React", value: "react" },
    ],
  },
});
```

::

### Filtering & Search Behavior

Match against multiple item keys using `filter-fields`, customize the fallback text with `empty-text`, and control whether `search-term` resets via `reset-search-term-on-blur` and `reset-search-term-on-select`.

::code-group

```html [index.wxml]
<c-input-menu
  items="{{countries}}"
  filter-fields="{{ ['label', 'code'] }}"
  reset-search-term-on-blur="{{false}}"
  reset-search-term-on-select="{{false}}"
  empty-text="No countries found"
  placeholder="Search by name or code..."
/>
```

```ts [index.ts]
Page({
  data: {
    countries: [
      { label: "Indonesia", value: "id", code: "ID" },
      { label: "Japan", value: "jp", code: "JP" },
      { label: "Singapore", value: "sg", code: "SG" },
    ],
  },
});
```

::

### Create Item

Set `create-item` (`true`, `"always"`, or `{ position: "top" | "bottom", when: "empty" | "always" }`) to let users create new options from `search-term` and handle `bind:create`. Customize the row with `create-icon` and `create-item-text`.

::code-group

```html [index.wxml]
<c-input-menu
  multiple
  create-item="{{ { position: 'bottom', when: 'empty' } }}"
  create-icon="plus"
  create-item-text="Add"
  items="{{tags}}"
  value="{{selectedTags}}"
  placeholder="Add or create tags..."
  bind:change="onTagsChange"
  bind:create="onCreateTag"
/>
```

```ts [index.ts]
Page({
  data: {
    selectedTags: ["ui"],
    tags: [
      { label: "UI", value: "ui" },
      { label: "MiniProgram", value: "miniapp" },
    ],
  },
  onTagsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ selectedTags: e.detail.value });
  },
  onCreateTag(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const label = e.detail.value;
    const value = label.toLowerCase();
    this.setData({
      tags: [...this.data.tags, { label, value }],
      selectedTags: [...this.data.selectedTags, value],
    });
  },
});
```

::

### Open & Close Triggers

Configure when the dropdown opens and closes using `open-on-focus`, `open-on-click`, `open-on-input`, `close-on-select`, and `close-on-backdrop-click`.

::code-group

```html [index.wxml]
<c-input-menu
  open-on-focus
  open-on-click
  open-on-input
  close-on-select="{{false}}"
  close-on-backdrop-click="{{true}}"
  items="{{items}}"
  placeholder="Focus or tap to open..."
/>
```

```ts [index.ts]
Page({
  data: {
    items: ["Alpha", "Beta", "Gamma"],
  },
});
```

::

### Floating Content & Portal

Use `portal`, `arrow`, `duration`, and `content` (`side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`, `avoidCollisions`, `matchTriggerWidth`, `maxHeight`) to configure the underlying `<c-popover>`.

::code-group

```html [index.wxml]
<c-input-menu
  portal
  arrow
  duration="{{200}}"
  content="{{ { side: 'top', align: 'end', sideOffset: 8, maxHeight: 200 } }}"
  items="{{items}}"
  placeholder="Opens above..."
/>
```

```ts [index.ts]
Page({
  data: {
    items: ["Option 1", "Option 2", "Option 3", "Option 4"],
  },
});
```

::

### Form Integration

Configure `validate-on` and `bind:submit` on `<c-form>`, and pass `name`, `label`, `required`, and `rules` on `<c-form-field>` wrapping `<c-input-menu>` for automatic validation, `fieldDisabled`, and `size` inheritance.

::code-group

```html [index.wxml]
<c-form id="profileForm" validate-on="change" bind:submit="onSubmit">
  <c-form-field name="country" label="Country" required="{{true}}" rules="{{countryRules}}">
    <c-input-menu
      items="{{countries}}"
      placeholder="Select country..."
    />
  </c-form-field>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    countries: [
      { label: "Indonesia", value: "id" },
      { label: "Japan", value: "jp" },
    ],
    countryRules: [{ required: true, message: "Country is required" }],
  },
  onSubmit(e: WechatMiniprogram.CustomEvent) {
    console.log("Form values:", e.detail);
  },
});
```

::

### Slots

Customize the trigger and dropdown sections using the `leading`, `trailing`, `loadingIcon`, `header`, `footer`, `createItem`, and `empty` slots.

::code-group

```html [index.wxml]
<c-input-menu
  items="{{items}}"
  loading="{{isLoading}}"
  create-item
  placeholder="Search or create..."
>
  <text slot="leading" class="text-xs text-muted">To:</text>
  <text slot="trailing" class="text-xs text-primary">Browse</text>
  <text slot="loadingIcon" class="text-xs">...</text>
  <view slot="header" class="text-xs text-muted">Suggestions</view>
  <view slot="footer" class="text-xs text-muted">Tap an item to select</view>
  <view slot="createItem" class="text-xs text-primary">+ Add new entry</view>
  <view slot="empty" class="text-xs text-muted">No results available</view>
</c-input-menu>
```

```ts [index.ts]
Page({
  data: {
    isLoading: false,
    items: [
      { label: "Design", value: "design" },
      { label: "Engineering", value: "engineering" },
    ],
  },
});
```

::

### Events

Listen to `bind:change`, `bind:select`, `bind:openchange`, `bind:searchtermchange`, `bind:create`, `bind:clear`, `bind:focus`, and `bind:blur` for full lifecycle integration.

::code-group

```html [index.wxml]
<c-input-menu
  clearable
  create-item
  items="{{items}}"
  placeholder="Interact to emit events..."
  bind:change="onChange"
  bind:select="onSelect"
  bind:openchange="onOpenChange"
  bind:searchtermchange="onSearchTermChange"
  bind:create="onCreate"
  bind:clear="onClear"
  bind:focus="onFocus"
  bind:blur="onBlur"
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { label: "Vue", value: "vue" },
      { label: "React", value: "react" },
    ],
  },
  onChange(e: WechatMiniprogram.CustomEvent) {
    console.log("change:", e.detail.value, e.detail.item);
  },
  onSelect(e: WechatMiniprogram.CustomEvent) {
    console.log("select:", e.detail.value, e.detail.selected);
  },
  onOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean }>) {
    console.log("openchange:", e.detail.open);
  },
  onSearchTermChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("searchtermchange:", e.detail.value);
  },
  onCreate(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("create:", e.detail.value);
  },
  onClear() {
    console.log("clear");
  },
  onFocus(e: WechatMiniprogram.CustomEvent) {
    console.log("focus:", e.detail);
  },
  onBlur(e: WechatMiniprogram.CustomEvent) {
    console.log("blur:", e.detail);
  },
});
```

::

### Custom Styling

Override any theme slot with `ui` or append root classes using `class` / `class-name`.

::code-group

```html [index.wxml]
<c-input-menu
  items="{{items}}"
  class-name="w-full"
  ui="{{ { base: 'rounded-full', viewport: 'p-2' } }}"
  placeholder="Styled input menu..."
/>
```

```ts [index.ts]
Page({
  data: {
    items: ["Alpha", "Beta", "Gamma"],
  },
});
```

::

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number \| boolean \| (string \| number \| boolean)[] \| null` | `null` | Controlled selected value (`null` = uncontrolled). |
| `defaultValue` | `string \| number \| boolean \| (string \| number \| boolean)[] \| null` | `null` | Initial selected value when uncontrolled. |
| `searchTerm` | `string \| null` | `null` | Controlled search query (`null` = uncontrolled). |
| `defaultSearchTerm` | `string` | `""` | Initial search query when uncontrolled. |
| `open` | `boolean \| null` | `null` | Controlled dropdown open state (`null` = uncontrolled). |
| `defaultOpen` | `boolean` | `false` | Initial dropdown open state when uncontrolled. |
| `multiple` | `boolean` | `false` | Allow selecting multiple items (rendered as removable tags). |
| `items` | `InputMenuItemInput[] \| InputMenuItemInput[][]` | `[]` | Options array (flat list or grouped nested arrays of scalars or `InputMenuItem` objects). |
| `childItems` | `InputMenuChildItemDescriptor[]` | `[]` | Declarative `<c-input-menu-item>` descriptors synchronized by parent-child relations. |
| `valueKey` | `string` | `"value"` | Property key used to read an item's value. |
| `labelKey` | `string` | `"label"` | Property key used to read an item's display label. |
| `descriptionKey` | `string` | `"description"` | Property key used to read an item's description. |
| `disabledKey` | `string` | `"disabled"` | Property key used to read an item's disabled flag. |
| `filterFields` | `string[]` | `["label"]` | Item fields matched against `searchTerm` when filtering. |
| `ignoreFilter` | `boolean` | `false` | Disable built-in filtering (e.g. for custom or async server-side filtering). |
| `resetSearchTermOnBlur` | `boolean` | `true` | Reset `searchTerm` when the menu closes or the input blurs. |
| `resetSearchTermOnSelect` | `boolean` | `true` | Reset `searchTerm` when an item is selected. |
| `createItem` | `boolean \| "always" \| { position?: "top" \| "bottom"; when?: "empty" \| "always" }` | `false` | Enable creating a new item from the current `searchTerm`. |
| `openOnFocus` | `boolean` | `false` | Open the dropdown when the input receives focus. |
| `openOnClick` | `boolean` | `false` | Open the dropdown when the trigger container is tapped. |
| `openOnInput` | `boolean` | `true` | Open the dropdown when typing into the input. |
| `closeOnSelect` | `boolean \| null` | `null` | Close the dropdown when an item is selected (`null` = `!multiple`). |
| `closeOnBackdropClick` | `boolean` | `true` | Close the dropdown when tapping the overlay backdrop. |
| `clearable` | `boolean` | `false` | Show a clear button to reset the selected value when populated. |
| `disabled` | `boolean` | `false` | Disable interaction with the input menu. |
| `readOnly` | `boolean` | `false` | Make the input menu read-only. |
| `required` | `boolean` | `false` | Mark the field as required. |
| `invalid` | `boolean \| null` | `null` | Controlled invalid state (`null` inherits form field validation state). |
| `fieldDisabled` | `boolean` | `false` | Disabled state propagated from a wrapping `<c-form-field>`. |
| `name` | `string` | `""` | Form field name passed to the underlying `<input>` and form host. |
| `form` | `string` | `""` | Target `<c-form>` id or name. |
| `rules` | `FormRule[]` | `[]` | Field-level validation rules for `<c-form>`. |
| `validateOn` | `FormValidateOn \| null` | `null` | Field-level override for `<c-form>` validation triggers. |
| `variant` | `"outline" \| "soft" \| "subtle" \| "ghost" \| "none"` | `"outline"` | Visual style variant of the input trigger. |
| `color` | `"primary" \| "secondary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info" \| string` | `"primary"` | Accent color used for focus, open, and highlight rings. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Component size (falls back to `fieldSize` or `"md"`). |
| `highlight` | `boolean` | `false` | Accentuate the trigger border and ring with `color`. |
| `placeholder` | `string` | `""` | Native `<input>` placeholder text. |
| `placeholderClass` | `string` | `""` | Native `<input>` `placeholder-class`. |
| `placeholderStyle` | `string` | `""` | Native `<input>` `placeholder-style`. |
| `maxlength` | `number` | `140` | Native `<input>` maximum input length. |
| `cursorSpacing` | `number` | `0` | Native `<input>` `cursor-spacing`. |
| `confirmType` | `string` | `"done"` | Native `<input>` keyboard confirm button label. |
| `confirmHold` | `boolean` | `false` | Keep keyboard open on confirm (always active when `multiple` is `true`). |
| `adjustPosition` | `boolean` | `true` | Automatically push page up when the soft keyboard appears. |
| `holdKeyboard` | `boolean` | `false` | Keep keyboard open on tap (always active when `multiple` is `true`). |
| `icon` | `string` | `""` | Icon name passed to `useComponentIcons`. |
| `leading` | `boolean` | `false` | Show the leading icon slot/container. |
| `leadingIcon` | `string` | `""` | Explicit leading icon name (falls back to selected item's `icon` in single mode). |
| `trailing` | `boolean` | `true` | Show the trailing icon slot/container. |
| `trailingIcon` | `string` | `"chevronDown"` | Trailing dropdown toggle icon name. |
| `selectedIcon` | `string` | `"check"` | Default check icon name passed to selected `<c-input-menu-item>` options. |
| `clearIcon` | `string` | `"close"` | Icon name for the clear button. |
| `deleteIcon` | `string` | `"close"` | Icon name for tag delete buttons in `multiple` mode. |
| `createIcon` | `string` | `""` | Optional icon name displayed in the default create-item row. |
| `createItemText` | `string` | `"Create"` | Prefix text rendered in the default create-item row (`<createItemText> "<searchTerm>"`). |
| `loading` | `boolean` | `false` | Display the loading indicator in the trailing area. |
| `loadingIcon` | `string` | `"loading"` | Icon name for the trailing loading indicator. |
| `portal` | `boolean` | `false` | Render the floating dropdown content via portal mode on `<c-popover>`. |
| `arrow` | `boolean` | `false` | Show an arrow indicator on `<c-popover>`. |
| `duration` | `number` | `150` | Dropdown close transition duration in milliseconds. |
| `content` | `InputMenuContentConfig` | `{}` | Floating menu layout options (`side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`, `avoidCollisions`, `matchTriggerWidth`, `maxHeight`; runtime defaults: `"bottom"`, `"start"`, `4`, `0`, `8`, `true`, `true`, `240`). |
| `emptyText` | `string` | `"No matching items"` | Fallback message shown when no items match and `createItem` is not shown. |
| `ui` | `Record<string, string>` | `{}` | Per-slot CSS class overrides merged with the resolved theme classes. |
| `className` / `class` | `string` | `""` | Additional CSS class(es) applied to the `root` slot (`className` property). |

## Slots

| Name | Description |
| --- | --- |
| *(default)* | Declarative compound children (such as `<c-input-menu-item>`) rendered inside the dropdown `<scroll-view>` viewport alongside or instead of data-driven `items`. |
| `leading` | Custom leading content inside the trigger input area. |
| `trailing` | Custom trailing content inside the trigger (hidden while `loading` or `clearable` clear button is active). |
| `loadingIcon` | Custom loading indicator shown in the trailing area when `loading` is `true`. |
| `header` | Optional header section rendered above the dropdown `<scroll-view>`. |
| `footer` | Optional footer section rendered below the dropdown `<scroll-view>`. |
| `createItem` | Custom content for the dynamic create-item option when `createItem` is enabled and visible. |
| `empty` | Custom empty-state content shown when no dropdown items match and `createItem` is not visible. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `bind:change` | `{ value: InputMenuValue; item?: NormalizedInputMenuItem; items?: NormalizedInputMenuItem[] }` | Fired when the selected value changes. |
| `bind:select` | `{ value: InputMenuScalarValue; item?: NormalizedInputMenuItem; selected: boolean }` | Fired when an item in the dropdown is selected. |
| `bind:openchange` | `{ open: boolean }` | Fired when the dropdown open state changes. |
| `bind:searchtermchange` | `{ value: string }` | Fired when `searchTerm` changes. |
| `bind:create` | `{ value: string }` | Fired when the create-item option is tapped or confirmed. |
| `bind:clear` | `Record<string, any>` | Fired when the clear button is tapped. |
| `bind:focus` | `{ value: InputMenuValue; searchTerm: string }` | Fired when the native `<input>` gains focus. |
| `bind:blur` | `{ value: InputMenuValue; searchTerm: string }` | Fired when the native `<input>` loses focus. |

## Item (`c-input-menu-item`)

`c-input-menu-item` renders a single option, group heading (`type="label"`), or divider (`type="separator"`) inside `<c-input-menu>`. It supports leading and trailing icons, primary label and secondary description text, custom slots, and automatic selection coordination with its parent `<c-input-menu>`. When not explicitly overridden on the item, `color`, `size`, and `selectedIcon` are inherited from the parent `<c-input-menu>`.

### Usage

::code-group

```html [index.wxml]
<c-input-menu value="{{selectedFruit}}" bind:change="onChange">
  <c-input-menu-item type="label" label="Fruits" />
  <c-input-menu-item
    value="apple"
    label="Apple"
    description="Crisp and sweet"
    icon="apple"
  />
  <c-input-menu-item
    value="banana"
    label="Banana"
    disabled="{{true}}"
  />
  <c-input-menu-item type="separator" />
  <c-input-menu-item
    value="cherry"
    color="success"
    size="lg"
    ui="{{itemUi}}"
    className="my-1"
  >
    <view slot="leading">🍒</view>
    <text>Custom Cherry Option</text>
    <view slot="trailing">Pick</view>
  </c-input-menu-item>
</c-input-menu>
```

```ts [index.ts]
Page({
  data: {
    selectedFruit: "apple",
    itemUi: {
      base: "rounded-lg",
      label: "font-semibold",
    },
  },
  onChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ selectedFruit: e.detail.value });
  },
});
```

::

### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number` | `""` | Option value identifier used for selection matching. |
| `type` | `'item' \| 'label' \| 'separator'` | `"item"` | Item kind: selectable option (`'item'`), group heading (`'label'`), or divider (`'separator'`). |
| `label` | `string` | `""` | Primary option text (or heading text when `type="label"`). |
| `description` | `string` | `""` | Secondary descriptive text rendered below `label` when `type="item"`. |
| `icon` | `string` | `""` | Leading `<c-icon>` name rendered when no `leading` slot is provided. |
| `trailingIcon` | `string` | `""` | Trailing `<c-icon>` name shown when selected; falls back to parent `selectedIcon` or `"check"`. |
| `color` | `string` | `""` | Theme color variant override; falls back to parent `color` or `"primary"`. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| ''` | `""` | Size variant override; falls back to parent `size` or `"md"`. |
| `disabled` | `boolean` | `false` | Disables interaction and applies disabled styling. |
| `selected` | `boolean \| null` | `null` | Direct selected state override. When `null`, selection is controlled by the parent `<c-input-menu>`. |
| `index` | `number \| null` | `null` | Explicit item index override. |
| `managed` | `boolean` | `false` | Internal flag indicating the item is rendered by the parent's `items` loop. |
| `ui` | `Record<string, string>` | `{}` | Per-instance class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional CSS classes merged onto the `root` slot (acts as the component's `class` override property). |

### Slots

| Name | Description |
| --- | --- |
| *(default)* | Replaces the entire label and description wrapper content when `type="item"`. |
| `leading` | Replaces the default leading `<c-icon name="{{icon}}" />` inside the leading container. |
| `label` | Custom label content (when `type="label"` and `label` is empty, or when `type="item"` without default slot content or `label`). |
| `description` | Custom description content when `type="item"` without default slot content or `description`. |
| `trailing` | Replaces the default selected trailing `<c-icon>` inside the trailing container. |

### Methods

`c-input-menu-item` does not emit direct `bind:*` events; tapping an item notifies its parent `<c-input-menu>` automatically. Component instances also expose `select()` to programmatically trigger selection.

## Theme

Customize the `input-menu` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    inputMenu: {
      slots: {
        root: "relative w-full",
        base: "relative w-full min-h-0 flex items-center overflow-hidden box-border rounded-md border text-highlighted transition-colors focus:outline-none",
        leading: "shrink-0 flex items-center justify-center text-dimmed",
        leadingIcon:
          "inline-flex items-center justify-center shrink-0 leading-none",
        tagsWrapper: "flex-1 min-w-0 flex items-center gap-2",
        tagsItem:
          "inline-flex items-center gap-1 rounded bg-elevated text-highlighted font-medium max-w-full min-w-0 box-border",
        tagsItemIcon:
          "inline-flex items-center justify-center shrink-0 leading-none text-dimmed",
        tagsItemText: "truncate",
        tagsItemDelete:
          "inline-flex items-center justify-center shrink-0 rounded-xs text-dimmed cursor-pointer active:opacity-70",
        tagsItemDeleteIcon:
          "inline-flex items-center justify-center shrink-0 leading-none",
        nativeInput:
          "flex-1 min-w-0 min-h-0 bg-transparent border-0 p-0 m-0 font-sans text-inherit leading-normal placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:text-dimmed",
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
        createItem:
          "relative flex items-center w-full select-none cursor-pointer rounded-md transition-colors box-border text-highlighted active:bg-elevated",
        createItemIcon: "shrink-0 text-dimmed",
        createItemLabel: "flex-1 min-w-0 truncate font-medium text-highlighted",
      },
      variants: {
        color: Object.assign(
          Object.fromEntries(colors.map((color) => [color, {}])),
          { neutral: {} },
        ),
        variant: {
          outline: {
            base: "bg-default text-highlighted border-accented",
          },
          soft: {
            base: "bg-elevated text-highlighted border-transparent",
            tagsItem: "bg-default",
          },
          subtle: {
            base: "bg-elevated text-highlighted border-accented",
            tagsItem: "bg-default",
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
            tagsItem: "px-1.5 py-0.5 text-[10px]",
            tagsItemIcon: "size-3",
            tagsItemDeleteIcon: "size-3",
            createItem: "px-1.5 py-1 text-xs gap-1.5",
            createItemIcon: "size-3.5",
          },
          sm: {
            base: "h-8 text-xs px-2.5 gap-1.5",
            leadingIcon: "size-4",
            trailingIcon: "size-4",
            tagsItem: "px-1.5 py-0.5 text-xs",
            tagsItemIcon: "size-3.5",
            tagsItemDeleteIcon: "size-3.5",
            createItem: "px-2 py-1.5 text-xs gap-1.5",
            createItemIcon: "size-4",
          },
          md: {
            base: "h-9 text-sm px-3 gap-1.5",
            leadingIcon: "size-4",
            trailingIcon: "size-4",
            tagsItem: "px-2 py-0.5 text-xs",
            tagsItemIcon: "size-3.5",
            tagsItemDeleteIcon: "size-3.5",
            createItem: "px-2.5 py-1.5 text-sm gap-2",
            createItemIcon: "size-4",
          },
          lg: {
            base: "h-10 text-base px-3.5 gap-2",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
            tagsItem: "px-2 py-1 text-xs",
            tagsItemIcon: "size-4",
            tagsItemDeleteIcon: "size-4",
            createItem: "px-3 py-2 text-base gap-2",
            createItemIcon: "size-5",
          },
          xl: {
            base: "h-11 text-lg px-4 gap-2",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
            tagsItem: "px-2.5 py-1 text-sm",
            tagsItemIcon: "size-4",
            tagsItemDeleteIcon: "size-4",
            createItem: "px-3.5 py-2.5 text-lg gap-2.5",
            createItemIcon: "size-5",
          },
        },
        multiple: {
          // Grow with wrapped tags: `h-auto` replaces the fixed `h-*` from `size`,
          // while compound `min-h-*` below keeps the empty state at input height.
          true: {
            base: "h-auto py-1",
            tagsWrapper: "flex-wrap gap-y-1",
            nativeInput: "min-w-[60px] h-[1.5em]",
          },
          false: {},
        },
        open: {
          true: {
            root: "z-50",
            trailingIcon: "rotate-180",
          },
          false: {},
        },
        focused: {
          true: {},
          false: {},
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
        ...colors.map((color) => ({
          color,
          highlight: true as const,
          class: {
            base: `border-${color} ring-2 ring-${color}/20`,
          },
        })),
        {
          color: "neutral" as const,
          highlight: true as const,
          class: {
            base: "border-inverted ring-2 ring-inverted/20",
          },
        },
        ...colors.map((color) => ({
          color,
          open: true as const,
          class: {
            base: `border-${color} ring-2 ring-${color}/20`,
          },
        })),
        {
          color: "neutral" as const,
          open: true as const,
          class: {
            base: "border-inverted ring-2 ring-inverted/20",
          },
        },
        ...colors.map((color) => ({
          color,
          focused: true as const,
          class: {
            base: `border-${color} ring-2 ring-${color}/20`,
          },
        })),
        {
          color: "neutral" as const,
          focused: true as const,
          class: {
            base: "border-inverted ring-2 ring-inverted/20",
          },
        },
        {
          variant: "ghost" as const,
          open: true as const,
          class: {
            base: "border-transparent ring-0",
          },
        },
        {
          variant: "ghost" as const,
          focused: true as const,
          class: {
            base: "border-transparent ring-0",
          },
        },
        {
          variant: "none" as const,
          open: true as const,
          class: {
            base: "border-0 ring-0",
          },
        },
        {
          variant: "none" as const,
          focused: true as const,
          class: {
            base: "border-0 ring-0",
          },
        },
        {
          invalid: true as const,
          class: {
            base: `border-${errorColor} ring-2 ring-${errorColor}/20`,
          },
        },
      ],
      defaultVariants: {
        variant: "outline",
        color: "primary",
        size: "md",
        multiple: false,
        open: false,
        focused: false,
        leading: false,
        trailing: true,
        highlight: false,
        disabled: false,
        invalid: false,
      },
    }
  }
})
```
