# FormField (`c-form-field`)

## Overview & Tier

`c-form-field` is a form field layout and validation wrapper component. It renders an optional label, required indicator, hint, description, wrapped form control container, and validation error or help text, while integrating with an enclosing form host and child form controls.

- **Architecture Tier**: **Tier 3 — Domain**
  - Uses `@code-id-labs/form-field` (`formFieldMachine`, `connectFormField`) via `../_shared/machine` (`createMachineBehavior`, `createProperties`) and `../_shared/base` (`computedBehavior`, `createComponentOptions`).
  - Integrates domain form behaviors from `@code-id-labs/miniapp/behaviors/form` (`withFormField({ native: false })`, `withFormFieldWrapper()`), with `exportApi: true`.
- **Related Components**:
  - **Parent**: Form container (e.g. `c-form`) providing form host context (`formContext` or injected via `form`).
  - **Children**: Form input/control components placed in the default slot, which receive field state and validation context from `withFormFieldWrapper()`.

---

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `String` | `""` | Field identifier used for form registration, validation, and `data-name`. |
| `form` | `String` | `""` | Target form identifier when connecting to a form host by name. |
| `formContext` | `Object` | `undefined` | Explicit `FormHostContext` object (overrides injected form host). |
| `label` | `String` | `""` | Label text displayed above the field container. |
| `required` | `Boolean` | `false` | Marks the field as required and renders an asterisk (`*`) indicator next to the label. |
| `disabled` | `Boolean` | `false` | Disables the field (also inherits disabled state from the connected form host). |
| `rules` | `Array` | `[]` | Array of `FormRule` validation rules applied to this field. |
| `error` | `String` | `""` | Explicit error message; overrides form validation errors when set. |
| `description` | `String` | `""` | Descriptive text rendered below the label row. |
| `hint` | `String` | `""` | Trailing hint text rendered opposite the label. |
| `icon` | `String` | `""` | Icon name rendered via `c-icon` next to the label (leading by default, or trailing when `trailing` is `true`). |
| `leading` | `Boolean` | `false` | Forces `icon` into the leading position before the label. |
| `leadingIcon` | `String` | `""` | Leading icon name rendered via `c-icon` before the label. |
| `trailing` | `Boolean` | `false` | Positions `icon` at the trailing end after the label / required asterisk. |
| `trailingIcon` | `String` | `""` | Trailing icon name rendered via `c-icon` after the label / required asterisk. |
| `help` | `String` | `""` | Helper text rendered below the container when no error is displayed. |
| `helperText` | `String` | `""` | Alias/fallback for `help` (used when `help` is empty). |
| `size` | `String` | `"md"` | Size variant for spacing and typography: `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`. |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `String` | `""` | Additional class string applied to the `root` slot (maps to `class` override in `resolveSlots`). |

---

## Slots

All slots are declared in the component's `slots` map (`default`, `label`, `hint`, `description`, `error`, `help`, all defaulting to `false`) for active slot detection.

| Slot | Description |
| --- | --- |
| `(default)` | Main form control area inside the `container` wrapper (`<view class="{{classes.container}}">`). |
| `label` | Custom label content inside `labelInner` (before the `*` required indicator). |
| `leading` | Custom leading content rendered before the label (overrides `leadingIcon` / leading `icon`). |
| `trailing` | Custom trailing content rendered after the label / required asterisk (overrides `trailingIcon` / trailing `icon`). |
| `hint` | Custom trailing content inside `labelWrapper`. |
| `description` | Custom description content inside `wrapper`, below `labelWrapper`. |
| `error` | Custom error content rendered below `container`. |
| `help` | Custom helper content rendered below `container`. |

### MiniProgram Static `<slot>` Notes

- WeChat MiniProgram does not support scoped slots or fallback default content nested inside `<slot>...</slot>`.
- Instead of `<slot name="...">fallback</slot>`, `index.wxml` renders `<slot name="..." />` alongside conditional `<text wx:if="{{...}}">` elements for prop-driven text (`label`, `hint`, `description`, `formField.displayError`, `displayHelp`).
- Wrapper containers (`wrapper` and `labelWrapper`) check both the text props and tracked slot flags (`slots.label`, `slots.description`, `slots.hint`) so named slots still display when the corresponding string prop is omitted.
- Because `label`, `hint`, and `description` render `<slot name="..." />` and `<text wx:if="{{...}}">` as siblings, omit the string prop when supplying the corresponding named slot to avoid duplicate output.
- `<slot name="error" />` and `<slot name="help" />` are always present in the template; prop-driven error/help `<text>` elements use `wx:if="{{formField.displayError}}"` and `wx:elif="{{displayHelp}}"`.

---

## Events

None. (`c-form-field` does not emit custom `bind:*` component events.)

---

## Theme

Defined in `packages/core/src/theme/definitions/form-field.ts` (`formFieldTheme(options)` where `errorColor = options.errorColor ?? "danger"`).

### Slots

| Slot | Default Classes |
| --- | --- |
| `root` | `"flex flex-col gap-1.5 w-full"` |
| `wrapper` | `"flex flex-col gap-0.5"` |
| `labelWrapper` | `"flex items-center justify-between gap-1.5"` |
| `labelInner` | `"flex items-center gap-1"` |
| `label` | `"block text-sm font-medium text-highlighted"` |
| `container` | `"relative w-full"` |
| `description` | `"text-xs text-muted"` |
| `error` | `` `text-xs text-${errorColor} font-medium mt-0.5` `` |
| `hint` | `"text-xs text-dimmed"` |
| `help` | `"text-xs text-muted mt-0.5"` |
| `required` | `` `text-xs text-${errorColor} font-bold` `` |

### Variants

- **`size`**:
  - `"xs"`: `root: "gap-1"`, `label: "text-xs"`, `description: "text-2xs"`, `error: "text-2xs"`, `help: "text-2xs"`, `hint: "text-2xs"`
  - `"sm"`: `root: "gap-1"`, `label: "text-xs"`, `description: "text-xs"`, `error: "text-xs"`, `help: "text-xs"`, `hint: "text-xs"`
  - `"md"`: `root: "gap-1.5"`, `label: "text-sm"`, `description: "text-xs"`, `error: "text-xs"`, `help: "text-xs"`, `hint: "text-xs"`
  - `"lg"`: `root: "gap-2"`, `label: "text-base"`, `description: "text-sm"`, `error: "text-sm"`, `help: "text-sm"`, `hint: "text-sm"`
  - `"xl"`: `root: "gap-2.5"`, `label: "text-lg"`, `description: "text-base"`, `error: "text-sm"`, `help: "text-sm"`, `hint: "text-sm"`
- **`disabled`**:
  - `true`: `root: "opacity-60 pointer-events-none"`
  - `false`: `root: ""`
- **`required`**:
  - `true`: `{}`
  - `false`: `{}`

### Default Variants

```ts
{
  size: "md",
  disabled: false,
  required: false,
}
```

---

## Examples

### Basic Usage (WXML)

```xml
<c-form-field
  name="email"
  label="Email"
  hint="Required"
  description="We will never share your email."
  help="Use your work email address."
  required="{{true}}"
  error="{{emailError}}"
  size="md"
>
  <c-input value="{{email}}" placeholder="you@example.com" bind:change="onEmailChange" />
</c-form-field>
```

### Custom Slots & Class Overrides (WXML + TS)

```xml
<c-form-field
  name="username"
  required="{{true}}"
  ui="{{ { label: 'text-primary' } }}"
  className="mb-4"
>
  <view slot="label" class="font-semibold">Username</view>
  <text slot="hint" class="text-xs text-muted">3-20 chars</text>
  <c-input value="{{username}}" bind:change="onUsernameChange" />
</c-form-field>
```

```ts
Page({
  data: {
    email: "",
    emailError: "",
    username: "",
  },
  onEmailChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ email: e.detail.value, emailError: "" });
  },
  onUsernameChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ username: e.detail.value });
  },
});
```
