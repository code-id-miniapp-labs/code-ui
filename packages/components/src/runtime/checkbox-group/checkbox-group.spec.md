# `c-checkbox-group` Specification

## Overview & Tier

- **Component**: `c-checkbox-group` (`packages/components/src/runtime/checkbox-group/`)
- **Purpose**: Manages a group of checkboxes with shared controlled or uncontrolled selection state (`value` / `defaultValue`), selection bounds (`min` / `max`), layout `orientation`, visual `variant` / `color` / `size`, optional `legend`, and form field integration. Supports both data-driven rendering via `items` and declarative compound composition via the default `<slot />`.
- **Architecture Tier**: **Tier 3 Domain**
  - Uses the stateful FSM in `@code-id-labs/checkbox-group` (`checkboxGroupMachine` + `connectCheckboxGroup`).
  - Integrates domain relation behaviors `withCheckboxGroup()` (from `@code-id-labs/miniapp/behaviors/checkbox`) and `withFormField()` (from `@code-id-labs/miniapp/behaviors/form`).
- **Related Components**:
  - **Child**: `c-checkbox` — rendered automatically via `wx:for` when `items` is provided, or placed directly inside `<c-checkbox-group>` as compound children linked through `withCheckboxGroup()`.
  - **Parent (optional)**: `c-form` / `c-form-field` — integrates validation, `disabled`, `readOnly`, `invalid`, and `fieldSize` via `withFormField()`.

---

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string[] \| null` | `null` | Controlled array of selected item values. |
| `defaultValue` | `string[] \| null` | `[]` | Initial selected values for uncontrolled mode. |
| `items` | `(string \| CheckboxGroupItemRaw)[]` | `[]` | Options rendered automatically as `<c-checkbox>` children via `wx:for`. Each object supports `value`, `label`, `description`, `disabled`, `color`, `variant`, `size`, and `ui`. |
| `legend` | `string` | `""` | Group legend text displayed above the fieldset. When empty, falls back to the `legend` slot. |
| `color` | `CheckboxGroupColor` (`"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info" \| string`) | `"primary"` | Theme color for the group and default color forwarded to rendered `items`. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Size variant (resolves to `fieldSize` from form context if unset, otherwise `"md"`). Forwarded to rendered `items`. |
| `variant` | `"outline" \| "card"` | `"outline"` | Visual style variant forwarded to rendered `items`. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Layout direction of the checkbox fieldset. |
| `disabled` | `boolean` | `false` | Disables all checkboxes in the group. |
| `readOnly` | `boolean` | `false` | Makes the group readOnly (prevents user toggling). |
| `required` | `boolean` | `false` | Marks the group as required (`aria-required` and required indicator on `legend`). |
| `invalid` | `boolean \| null` | `null` | Marks the group as invalid (`aria-invalid`). |
| `min` | `number \| null` | `null` | Minimum number of items that must remain selected. |
| `max` | `number \| null` | `null` | Maximum number of items that can be selected. |
| `name` | `string` | `""` | Form field name for `<c-form>` registration. |
| `form` | `string` | `""` | Target `<c-form>` id or name when multiple forms exist on the same page. |
| `formContext` | `FormHostContext \| null` | `undefined` | Optional explicit reactive form host context. |
| `ui` | `CheckboxGroupUI` (`Partial<Record<"root" \| "fieldset" \| "legend", string>>`) | `{}` | Per-slot class overrides merged into theme slot classes; also forwarded as default `ui` to rendered `items`. |
| `class` (`className`) | `string` | `""` | Additional root class string (`className` property in component definition) merged onto the `root` slot. |

---

## Slots

| Slot Name | Description |
| --- | --- |
| `default` | Rendered inside the `fieldset` container (`<slot />`) for declarative `<c-checkbox>` children. Because WeChat MiniProgram does not support scoped slots, slotted `<c-checkbox>` children receive group state through the `withCheckboxGroup` behavior relation rather than slot props. Note that `<slot />` remains present even when `items` is non-empty. |
| `legend` | Named slot (`<slot name="legend" />`) rendered only when the `legend` prop is empty (`wx:if="{{legend}}"` / `wx:else`), working around WeChat MiniProgram's lack of `<slot>` fallback content. |

---

## Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: string[] }` (`CheckboxGroupValueChangeDetails`) | Fired via the machine `onChange` callback when the selected values change (either from `items` `<c-checkbox>` taps or linked compound `<c-checkbox>` children). |

---

## Theme

Defined in `packages/core/src/theme/definitions/checkbox-group.ts`:

- **Slots**:
  - `root`: `"relative inline-flex flex-col gap-1.5"`
  - `fieldset`: `"flex flex-col gap-2"`
  - `legend`: `"block font-medium text-highlighted leading-snug select-none"`
- **Variants**:
  - `variant`: `"outline"`, `"card"`
  - `color`: theme colors (`DEFAULT_THEME_COLORS`, including `"primary"`, `"danger"`, `"success"`, `"warning"`, `"info"`) and `"neutral"`
  - `size`: `"xs"` (`legend: "text-xs"`), `"sm"` (`legend: "text-xs"`), `"md"` (`legend: "text-sm"`), `"lg"` (`legend: "text-base"`), `"xl"` (`legend: "text-lg"`)
  - `orientation`: `"vertical"` (`fieldset: "flex flex-col gap-2"`), `"horizontal"` (`fieldset: "flex flex-row flex-wrap gap-4"`)
  - `disabled`: `true`, `false`
  - `required`: `true` (`legend: "after:content-['*'] after:ms-0.5 after:text-<errorColor>"`, defaulting `errorColor` to `"danger"`), `false`
  - `invalid`: `true`, `false`
- **Default Variants**:
  - `variant`: `"outline"`
  - `color`: `"primary"`
  - `size`: `"md"`
  - `orientation`: `"vertical"`
  - `disabled`: `false`
  - `required`: `false`
  - `invalid`: `false`

---

## Examples

### Data-Driven (`items`) Usage

```xml
<c-checkbox-group
  legend="Notifications"
  items="{{notificationItems}}"
  value="{{selectedNotifications}}"
  variant="card"
  color="primary"
  bind:change="onNotificationsChange"
/>
```

```ts
Page({
  data: {
    selectedNotifications: ["email"],
    notificationItems: [
      { value: "email", label: "Email", description: "Receive daily digest emails" },
      { value: "sms", label: "SMS", description: "Receive urgent alerts via SMS" },
      { value: "push", label: "Push", disabled: true },
    ],
  },
  onNotificationsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ selectedNotifications: e.detail.value });
  },
});
```

### Declarative Compound (`<slot />` & `legend` Slot) Usage

```xml
<c-checkbox-group
  defaultValue="{{['react']}}"
  orientation="horizontal"
  required="{{true}}"
>
  <view slot="legend" class="font-semibold">Frameworks</view>
  <c-checkbox value="react" label="React" />
  <c-checkbox value="vue" label="Vue" />
  <c-checkbox value="svelte" label="Svelte" />
</c-checkbox-group>
```
