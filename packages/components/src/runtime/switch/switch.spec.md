# Switch (`c-switch`)

## Overview & Tier

- **Purpose**: An interactive toggle switch for switching between checked and unchecked states, with support for labels, descriptions, thumb/loading icons, controlled/uncontrolled state, and form field integration.
- **Architecture Tier**: **Tier 2 Interactive** (uses `@code-ui/switch` via `switchMachine` and `connectSwitch` with `createMachineBehavior`) + **Tier 3 Domain** (attaches `withFormField()` from `@code-ui/miniapp/behaviors/form` for `<c-form>` / `<c-form-field>` integration).
- **Related Components**: Standalone interactive component (not a compound parent/child pair). Integrates optionally with form containers via `withFormField()`. Uses `<c-icon>` internally when rendering `checkedIcon`, `uncheckedIcon`, or `loadingIcon` props without custom slots.

---

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `checked` | `Boolean \| null` | `null` | Controlled checked state. When `null`, operates in uncontrolled mode. |
| `defaultChecked` | `Boolean` | `false` | Initial checked state when used in uncontrolled mode. |
| `disabled` | `Boolean` | `false` | Disables user interaction and applies disabled styling. |
| `readOnly` | `Boolean` | `false` | Makes the switch read-only. |
| `required` | `Boolean` | `false` | Marks the switch as required in a form and renders a required asterisk on the label. |
| `invalid` | `Boolean \| null` | `null` | Marks the switch as invalid (applies error ring/color styling). |
| `loading` | `Boolean` | `false` | Displays a loading indicator inside the thumb and disables interaction. |
| `color` | `String` | `"primary"` | Theme color when checked (`"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, `"info"`). |
| `size` | `String` | `""` | Switch size (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`). Falls back to form `fieldSize` or `"md"` when empty. |
| `label` | `String` | `""` | Text label rendered beside the switch track. |
| `description` | `String` | `""` | Helper description text rendered beneath the label. |
| `checkedIcon` | `String` | `""` | `<c-icon>` name rendered inside the thumb when checked. |
| `uncheckedIcon` | `String` | `""` | `<c-icon>` name rendered inside the thumb when unchecked. |
| `loadingIcon` | `String` | `"loading"` | `<c-icon>` name rendered inside the thumb when `loading` is `true`. |
| `name` | `String` | `""` | Form field name for form registration. |
| `value` | `String` | `"on"` | Form submission value when checked. |
| `form` | `String` | `""` | Target `<c-form>` id/name when multiple forms exist on the same page. |
| `formContext` | `Object \| null` | `undefined` | Optional explicit reactive form host context. |
| `ui` | `Object` | `{}` | Per-slot CSS class overrides keyed by theme slot name (`SwitchUI`). |
| `className` | `String` | `""` | Custom CSS class(es) merged onto the `root` slot (serves as the component's `class` override prop). |

---

## Slots

Because WeChat MiniProgram `<slot>` elements are static (no scoped slots and no native fallback default content inside `<slot>...</slot>`), text props and named slots use conditional rendering (`wx:if` / `wx:else`), and active slots are tracked via the `slots` configuration (`default`, `thumb`, `label`, `description`, `loadingIcon`).

| Slot Name | Behavior |
| :--- | :--- |
| *(default)* | Rendered at the end of the root `<view>`. |
| `loadingIcon` | Rendered inside the thumb when `loading` is active and the `loadingIcon` slot is provided; overrides the `loadingIcon` prop's `<c-icon>`. |
| `thumb` | Rendered inside the thumb when not loading and neither `checkedIcon` (when checked) nor `uncheckedIcon` (when unchecked) is active. |
| `label` | Rendered inside the label container when the `label` prop is empty and the `label` slot is provided. |
| `description` | Rendered inside the description container when the `description` prop is empty and the `description` slot is provided. |

> **Note**: The outer `wrapper` container renders only when `label`, `description`, `slots.label`, or `slots.description` is truthy.

---

## Events

No `bind:*` events are emitted directly in `packages/components/src/runtime/switch/index.ts`.

- Tap interaction is handled internally via `catchtap="handleTap"`, which delegates to the exported machine API (`cSwitch.handleTap()`).
- In `packages/machines/switch/src/switch.types.ts`, `SwitchProps` defines `onChange?: (details: { checked: boolean }) => void` for the machine layer, and the component sets `exportApi: true` under key `cSwitch` exposing `setChecked(checked: boolean)`, `toggle()`, `resetChecked()`, and `handleTap()`.

---

## Theme

Defined in `packages/core/src/theme/definitions/switch.ts`:

- **Slots**:
  - `root`: Outer flex container (`relative inline-flex items-start select-none`)
  - `base`: Switch track (`inline-flex mt-0.5 items-center shrink-0 rounded-full border-2 border-transparent ...`)
  - `container`: Track alignment wrapper (`flex items-center`)
  - `thumb`: Sliding thumb (`pointer-events-none rounded-full bg-white shadow-lg ...`)
  - `icon`: Thumb icon styling (`shrink-0 transition-[color,opacity] ...`)
  - `loadingIcon`: Spinning loading icon (`w-full h-full animate-spin`)
  - `wrapper`: Label & description column (`ms-2 flex flex-col justify-center`)
  - `label`: Label text (`block font-medium text-highlighted leading-snug`)
  - `description`: Description text (`text-muted mt-0.5 leading-snug`)
- **Variants**:
  - `color`: Theme colors (`DEFAULT_THEME_COLORS`) plus `"neutral"`
  - `size`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
  - `disabled`: `true` | `false`
  - `checked`: `true` | `false`
  - `loading`: `true` | `false`
  - `required`: `true` | `false`
  - `invalid`: `true` | `false`
- **Default Variants**:
  - `color`: `"primary"`
  - `size`: `"md"`
  - `disabled`: `false`
  - `checked`: `false`
  - `loading`: `false`
  - `required`: `false`
  - `invalid`: `false`

---

## Examples

### Basic & Labelled Usage (WXML)

```xml
<!-- Uncontrolled with label and description -->
<c-switch
  defaultChecked="{{true}}"
  label="Notifications"
  description="Receive push alerts for updates."
/>

<!-- Controlled with color, size, and icons -->
<c-switch
  id="marketing-switch"
  checked="{{enabled}}"
  color="success"
  size="lg"
  checkedIcon="check"
  uncheckedIcon="x"
  label="Marketing emails"
  ui="{{ { label: 'font-semibold' } }}"
  className="my-2"
/>

<!-- Custom label slot -->
<c-switch slots="{{ { label: true } }}">
  <view slot="label">Custom <text class="font-bold">Rich Label</text></view>
</c-switch>
```

### Page / Component Script (TS)

```ts
Page({
  data: {
    enabled: false,
  },

  onToggleMarketing() {
    const sw = this.selectComponent("#marketing-switch");
    sw?.cSwitch?.toggle();
    this.setData({ enabled: !this.data.enabled });
  },
});
```
