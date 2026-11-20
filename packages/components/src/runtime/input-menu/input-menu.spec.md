# Input Menu (`c-input-menu`)

## Overview & Tier

`c-input-menu` is a searchable combobox / autocomplete input with a floating dropdown menu of selectable options. It supports single and multiple (tag-based) selection, built-in or external search filtering, dynamic item creation, clearable values, and `<c-form>` / `<c-form-field>` integration.

- **Architecture Tier**: **Tier 3 — Domain**
  - Backed by the `@code-id-labs/input-menu` state machine (`inputMenuMachine`, `connectInputMenu`) and domain behaviors `withFormField()` (`@code-id-labs/miniapp/behaviors/form`) and `withInputMenu()` (`@code-id-labs/miniapp/behaviors/input-menu`).
- **Related Components**:
  - **Host / Form**: `<c-form>`, `<c-form-field>` (form validation, disabled/size propagation).
  - **Internal Overlay**: `<c-popover>` (dropdown positioning, backdrop handling, transitions).
  - **Child Item**: `<c-input-menu-item>` (rendered internally for data-driven `items` and supported as declarative compound children in the default slot).

---

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
| `childItems` | `InputMenuChildItemDescriptor[]` | `[]` | Declarative `<c-input-menu-item>` descriptors managed by MiniProgram relation behavior. |
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
| `createIcon` | `string` | `""` | Optional icon name displayed in the default createItem row. |
| `createItemText` | `string` | `"Create"` | Prefix text rendered in the default createItem row (`<createItemText> "<searchTerm>"`). |
| `loading` | `boolean` | `false` | Display the loading indicator in the trailing area. |
| `loadingIcon` | `string` | `"loading"` | Icon name for the trailing loading indicator. |
| `portal` | `boolean` | `false` | Render the floating dropdown content via portal mode on `<c-popover>`. |
| `arrow` | `boolean` | `false` | Show an arrow indicator on `<c-popover>`. |
| `duration` | `number` | `150` | Dropdown close transition duration in milliseconds. |
| `content` | `InputMenuContentConfig` | `{}` | Floating menu layout options (`side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`, `avoidCollisions`, `matchTriggerWidth`, `maxHeight`; runtime defaults: `"bottom"`, `"start"`, `4`, `0`, `8`, `true`, `true`, `240`). |
| `emptyText` | `string` | `"No matching items"` | Fallback message shown when no items match and `createItem` is not shown. |
| `ui` | `Record<string, string>` | `{}` | Per-slot CSS class overrides merged with the resolved theme classes. |
| `className` / `class` | `string` | `""` | Additional CSS class(es) applied to the `root` slot (`className` property). |

---

## Slots

| Slot | Description |
| --- | --- |
| *(default)* | Declarative compound children (such as `<c-input-menu-item>`) rendered inside the dropdown `<scroll-view>` viewport alongside or instead of data-driven `items`. |
| `leading` | Custom leading content inside the trigger input area. |
| `trailing` | Custom trailing content inside the trigger (hidden while `loading` or `clearable` clear button is active). |
| `loadingIcon` | Custom loading indicator shown in the trailing area when `loading` is `true`. |
| `header` | Optional header section rendered above the dropdown `<scroll-view>`. |
| `footer` | Optional footer section rendered below the dropdown `<scroll-view>`. |
| `createItem` | Custom content for the dynamic createItem option when `createItem` is enabled and visible. |
| `empty` | Custom empty-state content shown when no dropdown items match and `createItem` is not visible. |

> **MiniProgram `<slot>` Notes:**
> - WeChat `<slot>` is static (scoped slots are not supported) and silently drops inline fallback children nested inside `<slot>...</slot>`.
> - Fallback UI (`leading`, `trailing`, `loadingIcon`, `createItem`, `empty`) and optional containers (`header`, `footer`) are conditionally rendered via `wx:if` / `wx:elif` / `wx:else` using active slot flags (`slots.*` / `icons.has*Slot`).

---

## Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: InputMenuValue; item?: NormalizedInputMenuItem; items?: NormalizedInputMenuItem[] }` | Fired when the selected value changes. |
| `bind:select` | `{ value: InputMenuScalarValue; item?: NormalizedInputMenuItem; selected: boolean }` | Fired when an item in the dropdown is selected. |
| `bind:openchange` | `{ open: boolean }` | Fired when the dropdown open state changes. |
| `bind:searchtermchange` | `{ value: string }` | Fired when `searchTerm` changes. |
| `bind:create` | `{ value: string }` | Fired when the createItem option is tapped or confirmed. |
| `bind:clear` | `Record<string, any>` | Fired when the clear button is tapped. |
| `bind:focus` | `{ value: InputMenuValue; searchTerm: string }` | Fired when the native `<input>` gains focus. |
| `bind:blur` | `{ value: InputMenuValue; searchTerm: string }` | Fired when the native `<input>` loses focus. |

---

## Theme

Defined in `packages/core/src/theme/definitions/input-menu.ts`:

- **`slots`**:
  - `root`, `base`, `leading`, `leadingIcon`, `tagsWrapper`, `tagsItem`, `tagsItemIcon`, `tagsItemText`, `tagsItemDelete`, `tagsItemDeleteIcon`, `nativeInput`, `trailing`, `trailingIcon`, `iconInner`, `loadingIcon`, `content`, `viewport`, `header`, `footer`, `empty`, `createItem`, `createItemIcon`, `createItemLabel`
- **`variants`**:
  - `color`: theme colors (`primary`, `secondary`, `success`, `info`, `warning`, `danger`, `neutral`)
  - `variant`: `"outline"` | `"soft"` | `"subtle"` | `"ghost"` | `"none"`
  - `size`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
  - `multiple`: `boolean`
  - `open`: `boolean`
  - `focused`: `boolean`
  - `leading`: `boolean`
  - `trailing`: `boolean`
  - `highlight`: `boolean`
  - `disabled`: `boolean`
  - `invalid`: `boolean`
- **`defaultVariants`**:
  - `variant: "outline"`, `color: "primary"`, `size: "md"`, `multiple: false`, `open: false`, `focused: false`, `leading: false`, `trailing: true`, `highlight: false`, `disabled: false`, `invalid: false`

---

## Examples

### Single Select with Data-Driven Items

```xml
<c-input-menu
  value="{{selectedFramework}}"
  items="{{frameworks}}"
  placeholder="Select a framework..."
  clearable
  bind:change="onFrameworkChange"
/>
```

```ts
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

### Multiple Tags with Dynamic Creation

```xml
<c-input-menu
  multiple
  createItem="{{ { position: 'bottom', when: 'empty' } }}"
  items="{{tags}}"
  value="{{selectedTags}}"
  placeholder="Add tags..."
  bind:change="onTagsChange"
  bind:create="onCreateTag"
/>
```

```ts
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

### Declarative Compound Children

```xml
<c-input-menu placeholder="Pick a role..." bind:change="onRoleChange">
  <c-input-menu-item value="admin" label="Administrator" description="Full workspace access" />
  <c-input-menu-item value="editor" label="Editor" description="Can edit content" />
  <c-input-menu-item value="viewer" label="Viewer" disabled />
</c-input-menu>
```
