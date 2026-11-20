# Select (`c-select`)

## Overview & Tier

`c-select` is a selection control for WeChat MiniProgram that supports two interaction modes:

- **Dropdown mode (`mode="default"`)**: Renders a trigger button paired with a `c-popover` listbox supporting single or multiple selection, leading/trailing icons, clear button, loading indicator, and scrollable option lists.
- **Picker mode (`mode="picker"`)**: Renders a bottom-sheet wheel picker inside `<root-portal>` using native `<picker-view>` / `<picker-view-column>` with Cancel/Confirm header controls and single- or multi-column selection.

**Architecture Tier**: **Tier 3 Domain**

- Powered by `@code-id-labs/select` (`selectMachine`, `connectSelect`), `createMachineBehavior` (`../_shared/machine`), and `computedBehavior` (`../_shared/base`).
- Integrates domain behaviors from `@code-id-labs/miniapp/behaviors/select` (`withSelect`), `@code-id-labs/miniapp/behaviors/form` (`withFormField`), and `@code-id-labs/miniapp/behaviors/theme` (`createAppThemeBehavior`).
- **Related components**:
  - `c-select-item` (child option component used both for data-driven `items` rendering and declarative compound children via `<slot />`).
  - `c-form` / `c-form-field` (parent form integration for `name`, `form`, `rules`, `validateOn`, `invalid`, and `fieldDisabled`).
  - `c-popover` and `c-icon` (internal UI primitives).

---

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `SelectScalarValue \| SelectScalarValue[] \| null` | `null` | Controlled selected value (`null` for uncontrolled). `SelectScalarValue` is `string \| number \| boolean`. |
| `defaultValue` | `SelectScalarValue \| SelectScalarValue[] \| null` | `null` | Initial selected value when uncontrolled. |
| `open` | `boolean \| null` | `null` | Controlled open state (`null` for uncontrolled). |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled. |
| `mode` | `"default" \| "picker"` | `"default"` | Interaction mode: floating dropdown menu (`"default"`) or bottom-sheet wheel picker (`"picker"`). |
| `multiple` | `boolean` | `false` | Enables multiple selection in `"default"` dropdown mode. |
| `items` | `SelectItemInput[] \| SelectItemInput[][]` | `[]` | Options data: flat array of primitives/objects, nested grouped arrays, or multi-column arrays in `"picker"` mode. Item objects support `type` (`"item" \| "label" \| "separator"`), `value`, `label`, `description`, `icon`, `trailingIcon`, `disabled`, `key`, `ui`, and `className`. |
| `childItems` | `SelectChildItemDescriptor[]` | `[]` | Normalized descriptors from declarative `<c-select-item>` children managed by the relation behavior. |
| `valueKey` | `string` | `"value"` | Property key used to read the option value from `items`. |
| `labelKey` | `string` | `"label"` | Property key used to read the option label from `items`. |
| `descriptionKey` | `string` | `"description"` | Property key used to read the option description from `items`. |
| `disabledKey` | `string` | `"disabled"` | Property key used to read the option disabled flag from `items`. |
| `disabled` | `boolean` | `false` | Disables interaction on the select trigger and items. |
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
| `className` | `string` | `""` | Additional class string applied to the `root` slot via `resolveSlots` (MiniProgram `class` override prop is declared as `className`). |

---

## Slots

All slots are statically declared in `Component` (`slots` map) and conditionally rendered in WXML. Because WeChat MiniProgram `<slot>` does not support scoped slot data or nested fallback markup, fallback UI is rendered with `wx:if` / `wx:elif` / `wx:else` checks against `slots.<name>`.

| Slot | Behavior & Conditional Fallback |
| --- | --- |
| *(default)* | Renders declarative `<c-select-item>` children inside the `"default"` dropdown `<scroll-view>` viewport (in addition to any `items` array entries). |
| `leading` | Custom leading content inside the trigger when `leading` (or leading icon) is active. Falls back to `<c-icon>` using `leadingIcon` (or selected item's `icon`). |
| `value` | Custom selected-value display inside the trigger. When not provided, renders `displayLabel` if a value is selected, or `placeholder` otherwise. |
| `loadingIcon` | Custom loading indicator inside the trailing container when `loading` is `true`. Falls back to `<c-icon name="{{loadingIcon}}">`. |
| `trailing` | Custom trailing content inside the trigger when not loading and not showing the clear button. Falls back to `<c-icon>` using `trailingIcon`. |
| `header` | In `"default"` mode, renders above the dropdown `<scroll-view>`. In `"picker"` mode, replaces the center `title` inside `pickerHeader` (falls back to `title` when `header` is `true`). |
| `footer` | In `"default"` mode, renders below the dropdown `<scroll-view>`. In `"picker"` mode, renders at the bottom of `pickerContent` inside `pickerFooter`. |
| `empty` | Custom empty state when neither `items` nor linked `<c-select-item>` children exist (`mode !== "picker"`), or when `pickerColumns` is empty (`mode="picker"`). Falls back to `emptyText`. |

---

## Events

Machine callback props (`onChange`, `onSelect`, `onOpenChange`, `onConfirm`, `onCancel`, `onColumnChange`, `onClear`) map to MiniProgram `bind:*` events, alongside native `<picker-view>` touch lifecycle events forwarded directly via `triggerEvent`.

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: SelectValue, item?: NormalizedSelectItem, items?: NormalizedSelectItem[] }` | Fired when the selected value changes. |
| `bind:select` | `{ value: SelectScalarValue, item?: NormalizedSelectItem, selected: boolean }` | Fired when an option item is tapped in `"default"` dropdown mode. |
| `bind:openchange` | `{ open: boolean }` | Fired when the dropdown or picker open state changes. |
| `bind:confirm` | `{ value: SelectValue, label: string \| string[], index: number[], items: SelectPickerColumnItem[] }` | Fired when the Confirm button is tapped in `"picker"` mode. |
| `bind:cancel` | `{ trigger?: string }` | Fired when `"picker"` mode is cancelled (e.g., Cancel button or backdrop tap). |
| `bind:columnchange` | `{ column: number, index: number, value: SelectScalarValue, label: string, item: SelectPickerColumnItem, values: SelectScalarValue[], items: SelectPickerColumnItem[] }` | Fired when a column wheel changes in `"picker"` mode. |
| `bind:clear` | `Record<string, any>` | Fired when the clear button is tapped. |
| `bind:pickstart` | *(none)* | Forwarded from `<picker-view bindpickstart>` when wheel scrolling starts in `"picker"` mode. |
| `bind:pickend` | *(none)* | Forwarded from `<picker-view bindpickend>` when wheel scrolling ends in `"picker"` mode. |

---

## Theme

Defined in `packages/core/src/theme/definitions/select.ts`:

- **Slots** (`28`):
  `root`, `base`, `leading`, `leadingIcon`, `value`, `placeholder`, `trailing`, `trailingIcon`, `iconInner`, `loadingIcon`, `content`, `viewport`, `header`, `footer`, `empty`, `pickerRoot`, `pickerBackdrop`, `pickerContent`, `pickerHeader`, `pickerCancel`, `pickerTitle`, `pickerConfirm`, `pickerBody`, `pickerView`, `pickerColumn`, `pickerItem`, `pickerItemDisabled`, `pickerFooter`
- **Variants**:
  - `color`: theme colors (`primary`, `secondary`, `danger`, `success`, `warning`, `info`, etc.) and `neutral`
  - `variant`: `"outline" | "soft" | "subtle" | "ghost" | "none"`
  - `size`: `"xs" | "sm" | "md" | "lg" | "xl"`
  - `open`: `true | false`
  - `leading`: `true | false`
  - `trailing`: `true | false`
  - `highlight`: `true | false`
  - `disabled`: `true | false`
  - `invalid`: `true | false`
- **Compound Variants**:
  - Applies `border-<color> ring-2 ring-<color>/20` (or `border-inverted ring-inverted/20` for `neutral`) on `base` when `highlight: true` or `open: true`.
  - Suppresses border/ring when `open: true` for `variant: "ghost"` and `variant: "none"`.
  - Applies error border/ring (`danger` by default) on `base` when `invalid: true`.
- **Default Variants**:
  - `variant: "outline"`
  - `color: "primary"`
  - `size: "md"`
  - `open: false`
  - `leading: false`
  - `trailing: true`
  - `highlight: false`
  - `disabled: false`
  - `invalid: false`

---

## Examples

### 1. Basic Dropdown (`mode="default"`)

```xml
<c-select
  placeholder="Select a fruit"
  items="{{fruits}}"
  value="{{selectedFruit}}"
  clearable="{{true}}"
  bind:change="onFruitChange"
/>
```

```ts
Page({
  data: {
    selectedFruit: null as string | null,
    fruits: [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
      { label: "Cherry", value: "cherry", disabled: true },
    ],
  },
  onFruitChange(e: WechatMiniprogram.CustomEvent<{ value: string | null }>) {
    this.setData({ selectedFruit: e.detail.value });
  },
});
```

### 2. Bottom-Sheet Wheel Picker (`mode="picker"`)

```xml
<c-select
  mode="picker"
  title="Choose Schedule"
  placeholder="Pick day & time"
  items="{{scheduleColumns}}"
  value="{{schedule}}"
  bind:confirm="onScheduleConfirm"
/>
```

```ts
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
});
```

### 3. Compound Declarative Items & Named Slots

```xml
<c-select placeholder="Select role" ui="{{selectUi}}" className="w-64">
  <view slot="header" class="text-xs text-muted">Available Roles</view>
  <c-select-item value="admin" label="Admin" description="Full access" />
  <c-select-item value="editor" label="Editor" />
  <view slot="empty">Nothing to pick</view>
</c-select>
```
