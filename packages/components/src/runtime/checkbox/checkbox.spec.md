# Checkbox (`c-checkbox`)

## Overview & Tier

- **Purpose**: A form-capable checkbox control supporting checked, unchecked, and indeterminate states, optional label/description text, custom indicator icons or slots, and standalone or grouped selection.
- **Architecture Tier**: **Tier 3 — Domain**
  - Driven by `@code-ui/checkbox` (`checkboxMachine` + `connectCheckbox`) via `createMachineBehavior` (`../_shared/machine`).
  - Integrates domain relation behaviors `withFormField()` (`@code-ui/miniapp/behaviors/form`) and `withCheckboxItem()` (`@code-ui/miniapp/behaviors/checkbox`), exporting its machine API (`exportApi: true`).
- **Related Components**:
  - **Parent**: `<c-checkbox-group>` (provides `groupContext`, `groupSize`, `groupColor`, `groupVariant` via `withCheckboxItem`) and `<c-form>` / form field containers (provides `formContext`, `fieldSize`, `fieldDisabled` via `withFormField`).
  - **Child**: `<c-icon>` (rendered internally for the default check and indeterminate indicator icons).

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` | `boolean \| null` | `null` | Controlled checked state. |
| `defaultChecked` | `boolean` | `false` | Initial checked state when uncontrolled. |
| `indeterminate` | `boolean \| null` | `null` | Controlled indeterminate state. |
| `defaultIndeterminate` | `boolean` | `false` | Initial indeterminate state when uncontrolled. |
| `disabled` | `boolean` | `false` | Disables user interaction. |
| `readOnly` | `boolean` | `false` | Makes the checkbox non-editable while preserving display state. |
| `required` | `boolean` | `false` | Marks the checkbox as required (adds required indicator styling on `label`). |
| `invalid` | `boolean \| null` | `null` | Marks the checkbox as invalid (applies error styling). |
| `value` | `string` | `""` | Value submitted with the parent group or form when checked. |
| `name` | `string` | `""` | Field name used for form registration. |
| `form` | `string` | `""` | Target `<c-form>` id/name when multiple forms exist on the same page. |
| `formContext` | `FormHostContext \| null \| undefined` | `undefined` | Optional explicit reactive form host context. |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info" \| string` | `""` | Visual color token. Falls back to `groupColor`, then `"primary"`. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `""` | Size token. Falls back to `groupSize`, then `fieldSize`, then `"md"`. |
| `variant` | `"outline" \| "card"` | `""` | Visual variant. Falls back to `groupVariant`, then `"outline"`. |
| `label` | `string` | `""` | Primary label text rendered next to the checkbox. |
| `description` | `string` | `""` | Secondary helper/description text rendered below the label. |
| `icon` | `string` | `"check"` | Icon name passed to `<c-icon>` when checked (and no `indicator` slot is supplied). |
| `indeterminateIcon` | `string` | `"minus"` | Icon name passed to `<c-icon>` when indeterminate (and no `indicator` slot is supplied). |
| `ui` | `Partial<Record<"root" \| "base" \| "indicator" \| "icon" \| "wrapper" \| "label" \| "description", string>>` | `{}` | Per-slot class overrides merged with the resolved theme classes. |
| `className` | `string` | `""` | Additional root class override passed to `resolveSlots` (this component uses `className` rather than `class` in its `properties` definition). |

## Slots

All slots are declared in the MiniProgram `slots` map (`default`, `indicator`, `label`, `description` defaulting to `false`) so active slot presence is tracked at runtime. Because WeChat MiniProgram `<slot>` is static and discards nested fallback markup when unmatched, fallback content is rendered conditionally with `wx:if` / `wx:elif`:

| Slot | Behavior & Constraints |
| --- | --- |
| `indicator` | Replaces the default `<c-icon>` indicator inside the checkbox box. When `!slots.indicator`, `<c-icon>` renders `indeterminateIcon` if indeterminate, or `icon` if checked. |
| `label` | Custom label content inside the text wrapper. Rendered via `wx:elif="{{slots.label}}"` only when the `label` prop is empty. |
| `description` | Custom description content inside the text wrapper. Rendered via `wx:elif="{{slots.description}}"` only when the `description` prop is empty. |
| `(default)` | Rendered via `<slot wx:else />` only when `label`, `description`, `slots.label`, and `slots.description` are all absent/falsy. |

## Events

No custom `this.triggerEvent(...)` calls are declared directly in `packages/components/src/runtime/checkbox/index.ts`; tap interaction on the root element (`bind:tap="handleTap"`) forwards to `cCheckbox.handleTap()`, and state updates are communicated through the `@code-ui/checkbox` machine contract (`CheckboxProps.onChange`) and parent group/form bindings:

| Event / Callback | Detail Payload | Description |
| --- | --- | --- |
| `onChange` (`bind:change` via machine behavior) | `{ value: string, checked: boolean }` (`CheckboxCheckedChangeDetails`) | Fired when the checked state changes. |

## Theme

Defined in `packages/core/src/theme/definitions/checkbox.ts`:

- **Slots**:
  - `root`
  - `base`
  - `indicator`
  - `icon`
  - `wrapper`
  - `label`
  - `description`
- **Variants**:
  - `variant`: `"outline"` | `"card"`
  - `color`: `DEFAULT_THEME_COLORS` (including `"primary"`, `"danger"`, `"success"`, `"warning"`, `"info"`) + `"neutral"`
  - `size`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
  - `checked`: `true` | `false`
  - `indeterminate`: `true` | `false`
  - `disabled`: `true` | `false`
  - `invalid`: `true` | `false`
  - `required`: `true` | `false`
- **Default Variants**:
  - `variant`: `"outline"`
  - `color`: `"primary"`
  - `size`: `"md"`
  - `checked`: `false`
  - `indeterminate`: `false`
  - `disabled`: `false`
  - `invalid`: `false`
  - `required`: `false`

## Examples

### Basic & Card Variant (WXML)

```xml
<!-- Uncontrolled with label & description -->
<c-checkbox
  defaultChecked="{{true}}"
  label="Accept terms"
  description="You agree to the terms of service."
/>

<!-- Controlled card variant with custom slot styling -->
<c-checkbox
  variant="card"
  color="primary"
  size="lg"
  checked="{{agreed}}"
  indeterminate="{{partial}}"
  label="Select all notifications"
  ui="{{ { root: 'mb-2', label: 'font-semibold' } }}"
  className="w-full"
  bind:change="onCheckboxChange"
/>

<!-- Custom indicator and label slots -->
<c-checkbox checked="{{agreed}}">
  <text slot="indicator">✓</text>
  <view slot="label">Custom <text class="text-primary">Label</text></view>
</c-checkbox>
```

### Page Script (TS)

```ts
Page({
  data: {
    agreed: false,
    partial: true,
  },

  onCheckboxChange(e: WechatMiniprogram.CustomEvent<{ value: string; checked: boolean }>) {
    this.setData({
      agreed: e.detail.checked,
      partial: false,
    });
  },
});
```
