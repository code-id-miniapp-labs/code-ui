# RadioGroup (`c-radio-group`)

## Overview & Tier

- **Purpose**: Accessible single-selection radio group container supporting both data-driven rendering (`items`) and declarative compound composition (`<c-radio>` children), with optional form-field integration.
- **Architecture Tier**: **Tier 3 — Domain / Interactive Compound Component**
  - Driven by the `@code-ui/radio-group` state machine (`radioGroupMachine` + `connectRadioGroup`) via `createMachineBehavior` (`exportApi: true`).
  - Integrates domain relation behaviors `withRadioGroup()` (`@code-ui/miniapp/behaviors/radio`) and `withFormField()` (`@code-ui/miniapp/behaviors/form`).
- **Related Components**:
  - Child: `c-radio` (automatically rendered via `wx:for` when `items` is provided, or placed declaratively inside the default `<slot />`).
  - Parent (optional): `c-form` / `c-form-field` via `withFormField()`.

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| null` | `null` | Controlled selected value. |
| `defaultValue` | `string \| null` | `null` | Initial selected value for uncontrolled mode. |
| `items` | `(string \| RadioGroupItemRaw)[]` | `[]` | Options rendered automatically as `<c-radio>` items (`RadioGroupItemRaw`: `{ value, label?, description?, disabled?, color?, variant?, size?, ui? }`). |
| `legend` | `string` | `""` | Group legend text. When non-empty, renders the text instead of the `legend` slot. |
| `name` | `string` | `""` | Form field name for form registration. |
| `form` | `string` | `""` | Target `<c-form>` id/name when multiple forms exist on the same page. |
| `formContext` | `FormHostContext \| null` | `undefined` | Optional explicit reactive form host context. |
| `disabled` | `boolean` | `false` | Disables all radio items in the group. |
| `readOnly` | `boolean` | `false` | Prevents changing the selected value while keeping focus/display. |
| `required` | `boolean` | `false` | Marks the group as required (`aria-required` and required indicator on `legend`). |
| `invalid` | `boolean \| null` | `null` | Marks the group as invalid (`aria-invalid`). |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"` | `"primary"` | Accent color passed to theme and data-driven `<c-radio>` items. |
| `variant` | `"outline" \| "card"` | `"outline"` | Visual style variant passed to theme and data-driven `<c-radio>` items. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Size token; falls back to parent form field size (`fieldSize`) or `"md"`. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Layout direction of the `fieldset` container. |
| `ui` | `RadioGroupUI` (`Partial<Record<"root" \| "fieldset" \| "legend", string>>`) | `{}` | Per-slot class overrides; also forwarded as default `ui` to data-driven `<c-radio>` items unless overridden per item. |
| `className` | `string` | `""` | Additional root class override (Note: declared as `className` in MiniApp `properties`, rather than `class`). |

Additional machine/form props accepted via `RadioGroupProps`: `id`, `ids`, `rules`, `validateOn`, `fieldDisabled`.

## Slots

| Slot | Behavior & MiniProgram Constraints |
| --- | --- |
| `default` (`<slot />`) | Renders inside the `fieldset` container for declarative `<c-radio>` children. Because WeChat MiniProgram `<slot>` is static (no scoped slots), data-driven `items` render `<c-radio>` components via `wx:for` inside `fieldset` rather than passing item data through `<slot>`. |
| `legend` (`<slot name="legend" />`) | Custom legend content. Uses conditional rendering (`<view wx:if="{{legend}}">...</view><slot wx:else name="legend" />`) because MiniProgram `<slot>` does not support fallback default content. When `legend` prop is set, the `legend` slot is not rendered. |

## Events

| Event | `detail` Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: string }` (`RadioGroupValueChangeDetails`) | Fired when the selected value changes (maps to `onChange` in `RadioGroupProps`). Internally, data-driven `<c-radio>` items emit `bind:change` with `{ value: string }` (`RadioGroupItemTapDetail`) to update selection. |

## Theme

Defined in `packages/core/src/theme/definitions/radio-group.ts`:

- **Slots**:
  - `root`: `"relative inline-flex flex-col gap-1.5"`
  - `fieldset`: `"flex flex-col gap-2"`
  - `legend`: `"block font-medium text-highlighted leading-snug"`
- **Variants**:
  - `variant`: `"outline"`, `"card"`
  - `color`: `DEFAULT_THEME_COLORS` + `"neutral"`
  - `size`: `"xs"` (`legend: "text-xs"`), `"sm"` (`legend: "text-xs"`), `"md"` (`legend: "text-sm"`), `"lg"` (`legend: "text-base"`), `"xl"` (`legend: "text-lg"`)
  - `orientation`: `"vertical"` (`fieldset: "flex flex-col gap-2"`), `"horizontal"` (`fieldset: "flex flex-row flex-wrap gap-4"`)
  - `checked`: `true`, `false`
  - `disabled`: `true`, `false`
  - `required`: `true` (`legend: "after:content-['*'] after:ms-0.5 after:text-${errorColor}"`, where `errorColor` defaults to `"danger"`), `false`
  - `invalid`: `true`, `false`
- **Default Variants**:
  - `variant: "outline"`
  - `color: "primary"`
  - `size: "md"`
  - `orientation: "vertical"`
  - `checked: false`
  - `disabled: false`
  - `required: false`
  - `invalid: false`

## Examples

### Data-Driven Mode (`items`)

```xml
<c-radio-group
  legend="Billing Cycle"
  value="{{billing}}"
  items="{{billingItems}}"
  orientation="horizontal"
  variant="card"
  bind:change="onBillingChange"
/>
```

```ts
Page({
  data: {
    billing: "monthly",
    billingItems: [
      { value: "monthly", label: "Monthly", description: "$12 / month" },
      { value: "yearly", label: "Yearly", description: "$120 / year" },
    ],
  },
  onBillingChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ billing: e.detail.value });
  },
});
```

### Compound Declarative Mode (`<c-radio>` + `legend` slot)

```xml
<c-radio-group defaultValue="email" bind:change="onNotifyChange">
  <view slot="legend">Notification Channel</view>
  <c-radio value="email" label="Email" />
  <c-radio value="sms" label="SMS" />
</c-radio-group>
```

```ts
Page({
  onNotifyChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    console.log("Selected:", e.detail.value);
  },
});
```
