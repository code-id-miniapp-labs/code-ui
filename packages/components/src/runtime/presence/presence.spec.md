# `c-presence`

## Overview & Tier

- **Purpose**: Declarative mount/unmount animation primitive with `data-state`, `lazyMount`, `unmountOnExit`, and `bind:exitcomplete`.
- **Architecture Tier**: **Tier 2 — Interactive / Stateful**
  - Uses `presenceMachine` and `connectPresence` from `@code-id-labs/presence`.
  - Imports from `../_shared/base` and `../_shared/machine`.

---

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `present` | `boolean` | `false` | Whether the wrapped content should be present/visible. |
| `lazyMount` | `boolean` | `false` | Defers mounting until `present` becomes `true` for the first time. |
| `unmountOnExit` | `boolean` | `false` | Removes the element (`wx:if`) once exit animation completes. |
| `duration` | `number \| null` | `null` | Explicit exit animation duration in ms (`0` for immediate exit; `null` auto-queries CSS duration or waits for `bindanimationend`/`bindtransitionend`). |
| `ui` | `PresenceUI` | `{}` | Per-slot CSS class overrides (`{ root }`). |
| `className` | `string` | `""` | Custom root CSS class override. |

---

## Slots

| Slot | Behavior & Conditions |
| --- | --- |
| `(default)` | Rendered inside the animated root wrapper while `presence.mounted` is `true`. |

---

## Events

| Event | `detail` Payload | Description |
| --- | --- | --- |
| `bind:exitcomplete` (`onExitComplete`) | `undefined` | Fired when exit animation completes and the machine settles into `unmounted`. |

---

## True Unmounting Note for WeChat MiniProgram

Because WeChat MiniProgram `<slot>` children remain attached to the parent page even behind a child component's `wx:if`, use `usePresence()` (from `@code-id-labs/composables`) or `createPresenceBehavior()` (from `@code-id-labs/miniapp/behaviors/presence`) on the parent page/component together with `wx:if="{{drawer.mounted}}"` and `bind:exitcomplete` on `<c-drawer>`, `<c-modal>`, or `<c-action-sheet>` to truly detach heavy light-DOM slot trees.
