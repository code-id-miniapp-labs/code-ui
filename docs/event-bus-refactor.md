# EventBus to Reactive Group Context Refactor Plan

**Status:** Proposed (revised)  
**Date:** 2026-11-05  
**Scope:** `packages/frameworks/miniapp/src/connect.ts`, `packages/core/src/types.ts`, `packages/machines/*`, `packages/frameworks/miniapp/src/behaviors/*`, `packages/context`, `packages/utils`

---

## 1. Executive Summary

`@code-ui` coordinates compound components (`accordion`, `tabs`, `stepper`, `radio-group`, `checkbox-group`) and form controls (`<c-form>`) with an imperative pub-sub `EventBus` (`createEventBus` in `@code-ui/utils`).

The EventBus works, but it forces every parent to broadcast full snapshots, every child to subscribe, rebind, and dispose manually, and every child to mirror group fields into local context. It also creates mount-order races: a child that registers after the parent emits misses the snapshot.

This plan replaces the EventBus with:

1. **A read-through group context** — a stable object owned by the parent machine that exposes live getter functions over the parent's existing `bindable` context and reactive `prop()` values, plus intent methods that dispatch parent events.
2. **Effect-driven connect** — `connectToComponent` computes snapshots inside an `alien-signals` `effect()`, so every signal read by the snapshot (including signals owned by another machine) becomes a dependency. Parent updates automatically invalidate child snapshots.

No writable `signal()` copies of parent state, no prop→signal `watch`, no `busDisposers`, no `applyGroupState`, no snapshot replay.

### 1.1 Correction to the earlier draft

The earlier draft proposed storing writable signals in the parent `refs` and syncing external props into them with `watch`:

```ts
refs: () => ({
  groupState: { value: signal(prop("value") ?? []), size: signal(prop("size")) },
}),
watch: ({ prop, refs }) => {
  refs.get("groupState").value(prop("value"));
},
```

That design reintroduces the exact problems the refactor is meant to remove:

- Two writers for one value (prop + signal mirror).
- `watch` is required only because of the duplicate copy.
- External prop → signal sync can race with internal writes.
- It violates `docs/fsm-machine-guide.md` rules 1, 2, and 4 (one writer, no prop mirroring, derived data in `computed`).

The parent machines already have everything needed:

- `prop(key)` is a per-key `alienComputed` over `userPropsSignal` (`packages/frameworks/miniapp/src/machine.ts`), so `updateProps` is already reactive.
- `bindable` lazily syncs controlled props on every `get()` (`packages/frameworks/miniapp/src/bindable.ts`), so `context.get("value")` always returns the latest controlled value.
- The current `accordion.machine.ts` already has **no `watch`**; `value` is a `bindable` and the remaining group props are `propBindable`.

Therefore the group context reads through existing owners instead of copying them.

---

## 2. Architectural Comparison

```
Current (push):
Parent Machine ──emit(snapshot)──▶ EventBus ──on(callback)──▶ Child Machine
                                   (disposers, replay, context mirroring)

Proposed (pull):
Parent Machine ──owns bindables/props──▶ GroupContext facade ◀──read── Child Machine computed
                                                     ▲
connectToComponent ──effect() tracks snapshot reads──┘
```

| Dimension | EventBus | Reactive Group Context |
|---|---|---|
| **Data flow** | Push: parent broadcasts snapshots. | Pull: children read live getters inside `computed`. |
| **Subscription handling** | Manual `bus.on()` / `busDisposers`. | Automatic: `connectToComponent` effect tracks reads. |
| **Teardown** | Manual cleanup in `watch` / `exit`. | Effect and machine scope disposal. |
| **Mount order** | Late children miss the snapshot unless replayed. | Late children read current values immediately. |
| **Granularity** | Every listener re-runs for every snapshot field. | Only computeds reading the changed signal invalidate. |
| **Child → Parent** | `bus.emit("item:toggle", value)`. | `groupContext.toggleItem(value)` → `send(...)`. |
| **Child state** | Mirrored into child context via `applyGroupState`. | Derived in child `computed`; no mirror. |
| **External controlled props** | Parent emits after prop changes. | `bindable.get()` syncs the controlled prop lazily. |

---

## 3. Inventory of Affected Components

| Domain | Parent Machine | Child Machine | Native Behavior Bridge |
|---|---|---|---|
| **Accordion** | `packages/machines/accordion` | `packages/machines/accordion-item` | `packages/frameworks/miniapp/src/behaviors/accordion.ts` |
| **Tabs** | `packages/machines/tabs` | `packages/machines/tabs-item` | `packages/frameworks/miniapp/src/behaviors/tabs.ts` |
| **Stepper** | `packages/machines/stepper` | `packages/machines/stepper-item` | `packages/frameworks/miniapp/src/behaviors/stepper.ts` |
| **Radio Group** | `packages/machines/radio-group` | `packages/machines/radio` | `packages/frameworks/miniapp/src/behaviors/radio.ts` |
| **Checkbox Group** | `packages/machines/checkbox-group` | `packages/machines/checkbox` | `packages/frameworks/miniapp/src/behaviors/checkbox.ts` |
| **Form** | `packages/machines/form` | `input`, `switch`, `pin-input`, `textarea`, `slider`, `radio`, `checkbox` | `packages/machines/form/src/form.context.ts`, `packages/frameworks/miniapp/src/behaviors/form.ts`, `@code-ui/context` |

---

## 4. Target Design

### 4.1 Ownership rules

| Value | Owner | Exposed to children as |
|---|---|---|
| Controlled `value` | Parent `bindable` (`value: prop(...)`) | `() => context.get("value")` |
| Internal group value changes | Parent `bindable.set` | Same getter |
| `multiple`, `collapsible`, `size`, `variant`, `orientation` | Parent props (read via `prop()`) | `() => prop("...")` |
| Group disabled/invalid overridden by form validation | Parent context `stateBindable` | `() => context.get("...")` |
| Child open/checked state in standalone mode | Child context | Child `computed` |
| Child open/checked state in group mode | Parent group context | Child `computed` reading the facade |

Rules:

- The facade never caches a value. Every access reads the underlying `prop()` or `context.get()`.
- Parent props remain the only external input. Children never receive copies of group data.
- Group-owned overrides that do not exist in WXML props (for example `<c-form>` marking a group invalid) stay in a parent `bindable`/`stateBindable`. The facade reads that bindable; the prop is only the initial/default value.

### 4.2 Group context contract

Expose getter functions rather than writable signals. Getter functions cannot accidentally become a second writer, and they compose naturally with `computed`.

```ts
// packages/machines/accordion/src/accordion.types.ts
export interface AccordionGroupContext {
  readonly value: () => string[];
  readonly multiple: () => boolean;
  readonly collapsible: () => boolean;
  readonly disabled: () => boolean;
  readonly size: () => AccordionSize;
  readonly variant: () => AccordionVariant;

  toggleItem: (itemValue: string) => void;
  setValue: (value: string[]) => void;
  expandAll: () => void;
  collapseAll: () => void;
}
```

Do **not** type these as `Signal<T>`. A `Signal` is writable and callable with a value; the group context is read-only plus explicit intent methods.

### 4.3 Parent machine

The parent creates the facade in `refs`. It closes over the parent's `context` and `prop`, so no synchronization step is required.

```ts
// packages/machines/accordion/src/accordion.machine.ts
refs: ({ prop, context, send }) => ({
  groupContext: {
    value: () => context.get("value") ?? [],
    multiple: () => Boolean(prop("multiple")),
    collapsible: () => prop("collapsible") !== false,
    disabled: () => Boolean(prop("disabled")),
    size: () => (prop("size") || "md") as AccordionSize,
    variant: () => (prop("variant") || "outline") as AccordionVariant,

    toggleItem: (value) => send({ type: "VALUE.TOGGLE", value }),
    setValue: (value) => send({ type: "VALUE.SET", value }),
    expandAll: () => send({ type: "EXPAND_ALL" }),
    collapseAll: () => send({ type: "COLLAPSE_ALL" }),
  } satisfies AccordionGroupContext,
}),
```

Notes:

- `value` reads the parent `bindable`; controlled prop changes are picked up lazily on `get()`.
- Presentational fields read `prop()` directly. They are never mirrored into context or signals.
- If the parent machine mutates `disabled` (for example a validation override), store that one value in a `bindable` and read `context.get("disabled")` instead.
- **No `watch` is needed for props.** The parent `watch` is deleted unless it has another job (for example prop → FSM state sync in leaf machines).
- The parent no longer needs `bus`, `busDisposers`, `emitChange` bus broadcasts, `entry: ["setupBus"]`, or `exit: ["cleanupBus"]`. User-facing `onChange` / `onUpdateModelValue` callbacks stay on the `bindable.onChange` path.

**Prerequisite:** `RefsParams<T>` currently passes only `{ prop, context }` (`packages/core/src/types.ts`). Add `send` to `RefsParams` and pass `this.send` from `MiniappMachine` so intent dispatchers can be created in `refs` without lifecycle hacks.

### 4.4 Native behavior linking

The behavior passes the facade reference once, when the child links. Since the facade reads live parent values, no subsequent prop pushes are required.

```ts
// packages/frameworks/miniapp/src/behaviors/accordion.ts
export function linkAccordionItemToParent(group: any, item: any) {
  const service = group.__codeUiMachine?.service;
  const groupContext = service?.refs?.get?.("groupContext");

  item.__codeUiMachine?.updateProps({
    accordionId: group.id || group.__codeUiId,
    groupContext,
    groupIndex: resolveChildIndex(group, item),
  });
}
```

Changes to the bridge:

- Delete snapshot encoding (`value`, `multiple`, `collapsible`, `disabled`, `size`, `variant`) from `sync...Children`.
- Delete the per-prop-change fan-out. `onPropChanged` only needs to handle values that are not reactive group context (for example re-counting `linkedCount` for data-driven rendering).
- Keep link/unlink ordering guards (`__codeUiPending...`, `onReady` re-sync) because the parent machine may start after the child attaches.
- Keep `linkedCount` / index bookkeeping; it is runtime topology, not group state.
- Re-syncing on `onReady` is fine; passing the same facade reference is a no-op thanks to `updateProps` shallow comparison.

### 4.5 Child machine

Children derive group state in `computed` and dispatch intents through the facade. Local context remains only as a standalone fallback.

```ts
// packages/machines/accordion-item/src/accordion-item.machine.ts
computed: {
  isOpen: ({ context, computed, prop }) => {
    const group = prop("groupContext") as AccordionGroupContext | undefined;
    if (!group) return Boolean(context.get("open"));
    return group.value().includes(computed("resolvedValue"));
  },

  isDisabled: ({ context, prop }) => {
    const group = prop("groupContext") as AccordionGroupContext | undefined;
    return Boolean(group?.disabled() || context.get("disabled"));
  },

  isCollapsible: ({ context, prop }) => {
    const group = prop("groupContext") as AccordionGroupContext | undefined;
    return group ? group.collapsible() : context.get("collapsible") !== false;
  },

  effectiveSize: ({ context, prop }) => {
    const group = prop("groupContext") as AccordionGroupContext | undefined;
    return context.get("size") || group?.size() || "md";
  },

  effectiveVariant: ({ context, prop }) => {
    const group = prop("groupContext") as AccordionGroupContext | undefined;
    return context.get("variant") || group?.variant() || "outline";
  },
},

implementations: {
  actions: {
    handleTapAction: ({ context, computed, prop }) => {
      const group = prop("groupContext") as AccordionGroupContext | undefined;
      if (group) {
        group.toggleItem(computed("resolvedValue"));
        return;
      }
      context.set("open", !computed("isOpen"));
    },
  },
},
```

Delete from children:

- `groupBus`, `groupValue`, `groupMultiple`, `groupCollapsible`, `groupDisabled`, `groupSize`, `groupVariant` props and context bindables.
- `currentGroupBus`, `busDisposers` refs.
- `applyGroupState()` and any `context.set` mirroring of group values.
- `bindGroupBus`, `setupGroupBus`, `cleanupGroupBus`, `watch` bus rebinding.
- Bus-driven body measurement. Measurement moves to the render path: the runtime already observes `cAccordionItem.isOpen` and calls `measure()`, which can stay.

### 4.6 Render invalidation: effect-driven connect

Read-through getters alone are not enough. A child machine currently only notifies subscribers when **its own** `userPropsSignal`, state, or context refs change (`packages/frameworks/miniapp/src/machine.ts`). A child `computed` reading parent signals would return fresh values, but nothing would call `setData`.

The fix is to make snapshot computation reactive:

```ts
// packages/frameworks/miniapp/src/connect.ts
import { effect } from "alien-signals";

export function connectToComponent(machine, instance, connect, key) {
  // ...delta batching unchanged...

  const update = () => {
    const snapshot = connect(machine.service, normalizeProps);
    // ...__codeUiApi, diffSnapshot, setData...
  };

  const dispose = effect(update);

  return () => {
    dispose();
    pendingDelta = {};
    isBatchScheduled = false;
  };
}
```

Why this works:

- `update()` runs inside an `alien-signals` effect. Every signal read during `connect()` becomes a dependency.
- Child `connect` → child `computed` → `groupContext.value()` → parent `bindable` signal. The parent signal is now a dependency of the child's render effect.
- Parent interactions call `context.set`, validation writes a parent bindable, and page `updateProps` changes the parent prop signal. All of them invalidate the dependent child snapshots directly.
- `diffSnapshot` and `nextTick` batching still deduplicate and coalesce `setData`; a no-op change produces an empty delta.

Constraints:

- `connect` remains read-only. Never call `send`, `context.set`, or `updateProps` from `connect`; that would create a feedback loop inside the render effect.
- Keep `machine.subscribe` unchanged for non-render consumers (for example `behaviors/app.ts`).
- Replace the render subscription in `connectToComponent`; do not run both paths, or every change will compute the snapshot twice.
- The effect is disposed in the component `detached` path before `machine.stop()`.
- Signals not read by `connect` are not tracked. This is the intended fine-grained behavior; keep snapshot shape stable so editing one field does not add unrelated dependencies.

### 4.7 Form context

`<c-form>` cannot use WeChat `relations` because fields may live under slots and arbitrary wrappers. Keep `@code-ui/context` as the injection mechanism, but replace `EventBus` with a reactive facade:

```ts
export interface FormContext {
  readonly values: () => Record<string, unknown>;
  readonly errors: () => Record<string, string | undefined>;
  readonly disabled: () => boolean;
  readonly readOnly: () => boolean;
  readonly size: () => string;

  registerField: (handle: FormFieldHandle) => () => void;
  notifyFieldChange: (name: string, value: unknown) => void;
  validateField: (name: string) => void;
  reset: () => void;
}
```

- The form machine creates the facade in `refs`, backed by its `bindable` context.
- Field handles are stored in a `refs` `Map`; `registerField` returns an unregister function, so detach cleanup stays local.
- `provide` / `onProvide` in `@code-ui/context` deliver the facade to late-mounted fields. The facade reference is stable; field machines read it in `computed`.
- Fields stop receiving `formBus` snapshots and stop mirroring `form*` values with `applyFieldErrors`-style context writes.
- Form validation writes only form-owned bindables (`errors`, `values`). Field computeds derive `invalid`, `disabled`, and `size`.
- `provideEventBus` / `injectEventBus` / `createEventBusKey` are removed from `@code-ui/context` once all consumers migrate.

---

## 5. Prerequisites

1. **`RefsParams.send`** — add `send` to `packages/core/src/types.ts` and pass `this.send` in `MiniappMachine` refs construction. Required for intent dispatchers in the facade.
2. **Effect-driven connect** — migrate `connectToComponent` from `machine.subscribe(update)` to `effect(update)` and dispose the effect on detach. Update `packages/frameworks/miniapp/tests/connect.test.ts` to trigger real signal changes instead of manually invoking a captured subscriber.
3. **Cross-machine reactivity test** — add a test with two `MiniappMachine` instances: parent owns a `bindable`, child `computed` reads it through a facade; change the parent and assert the child snapshot/`setData` updates without `updateProps`.
4. **No-op delta guard** — keep/extend tests asserting `diffSnapshot` returns `null` when nothing rendered changed.

---

## 6. Migration Phasing & Roadmap

### Phase 1: Framework foundations

- [ ] Add `send` to `RefsParams` and pass it from `MiniappMachine`.
- [ ] Replace the render subscription in `connectToComponent` with `effect(update)`.
- [ ] Verify `machine.subscribe` consumers are unaffected.
- [ ] Add cross-machine reactivity and effect-disposal tests.

### Phase 2: Accordion (`accordion` & `accordion-item`)

- [ ] Define `AccordionGroupContext` in `accordion.types.ts`.
- [ ] Build `groupContext` in `accordion.machine.ts` `refs`; delete bus refs, bus actions, and bus broadcasts.
- [ ] Update `behaviors/accordion.ts` to pass `groupContext` once and delete snapshot fan-out.
- [ ] Remove bus props/context/refs, `applyGroupState`, and bus `watch` from `accordion-item.machine.ts`.
- [ ] Move body measurement to the existing `isOpen` observer path.
- [ ] Verify: `pnpm --filter @code-ui/accordion test`, `pnpm --filter @code-ui/accordion-item test`, plus the miniapp accordion behavior test.

### Phase 3: Tabs & Stepper

- [ ] Define `TabsGroupContext` (active value signal getter + `selectTab`, `next`, `previous`, `setValue`).
- [ ] Define `StepperGroupContext` (current step getter + `next`, `previous`, `setStep`, `submit`).
- [ ] Build facades in each parent machine; delete bus refs/actions.
- [ ] Update `behaviors/{tabs,stepper}.ts` to pass the facade once.
- [ ] Clean `tabs-item` and `stepper-item`: remove bus subscriptions, mirroring, and rebind `watch`.

### Phase 4: Selection groups (`checkbox-group` & `radio-group`)

- [ ] Define `CheckboxGroupContext` (checked values getter + `toggle`/`setValue`) and `RadioGroupContext` (selected value getter + `select`/`setValue`).
- [ ] Build facades in parent machines; keep form-owned overrides (`invalid`, `disabled`) in parent `stateBindable`s.
- [ ] Update `behaviors/{checkbox,radio}.ts` to pass the facade once.
- [ ] Simplify `checkbox.machine.ts` and `radio.machine.ts`: derive `isChecked`, group `disabled`, `size`, `variant`, `invalid` in `computed`; delete `stateBindable` group mirrors and bus listeners.

### Phase 5: Form context

Inventory (2026-11-05, measured from the current tree):

- **Form machine** (`form.machine.ts`, 1160 lines) uses the bus for three jobs:
  - *Inbound from fields*: `register`, `unregister`, `input`, `change`, `blur`, `focus`, `field:rules`. The handlers already exist as plain functions (`registerFormField`, `unregisterFormField`, `handleFieldInteraction`) and as FSM events (`FIELD.REGISTER`, `FIELD.INPUT`, ...), so a facade can wrap them with `send`.
  - *Outbound to fields*: `field:error`, `reset`, `clear-errors`, `form:state`. `form:state` is already duplicated by `registration.onFormStateChange`, and validation results by `registration.onValidationChange`, so most form → field traffic is already direct.
  - *Outbound to the app*: `validate`, `submit`, `error`. These are also delivered through `onValidate` / `onSubmit` / `onError` props.
- **Public surface**: `FormProps.bus` (inject your own bus) and `FormApi.bus` are public. Removing them is a breaking change in the 0.x line.
- **Field → form plumbing is centralized** in `bindFormField` / `setupFormFieldSync` (`form.context.ts`). Input, textarea, switch, slider, pin-input and checkbox only call `setupFormFieldSync({ bus: prop("formBus") })` and re-bind in `watch`. `radio-group` and `checkbox-group` call it the same way.
- **`form-field` wrapper** is the only machine that subscribes to outbound events directly (`field:error`, `reset`, `clear-errors`, `form:state`) and the only one that emits `field:state` / `field:rules` itself.
- **Tests**: about 40 occurrences of `formBus: bus` / `createEventBus<FormBusEvents>()` across `form`, `input`, `textarea`, `switch`, `slider`, `pin-input`, `checkbox`, `checkbox-group`, `radio-group`, `form-field`, plus `behavior.test.ts` in the miniapp package.

Naming: `FormContext` is already the form machine's *context type*. The facade needs a different name (proposed: `FormHostContext`).

Decisions needed before implementation:

1. **Public `bus`.** Remove `FormProps.bus` / `FormApi.bus` (breaking), or keep a read-only compatibility `bus` that the form feeds from its own state until the next major?
2. **Form → field reset / clear-errors.** Options: (a) keep them as imperative calls on the registration (`registration.reset()`, `registration.clearError()`), or (b) make `form-field` derive its error from `host.errors(name)` in `computed` and drop its `ERROR.SET` / `RESET` events. (b) is cleaner but changes the wrapper's FSM (`valid` / `invalid`).
3. **Injection for deep-slot fields.** Keep `@code-ui/context` with a `FormHostKey` (scoped per `formId` like today's `getFormBusKey`).

Suggested staging (each stage keeps `pnpm test` green):

- **5a — Facade, field → form path (additive).**
  - [ ] Add `FormHostContext` (`disabled()`, `readOnly()`, `register`, `unregister`, `notify(trigger, payload)`, `setFieldRules`, `errors(name)`) to `form.types.ts`.
  - [ ] Build it in `form.machine.ts` `refs`, backed by `send` (`FIELD.REGISTER`, `FIELD.UNREGISTER`, `FIELD.INPUT|CHANGE|BLUR|FOCUS`, new `FIELD.RULES`).
  - [ ] `bindFormField` / `setupFormFieldSync` accept `host` and prefer it over `bus`; add `FormHostKey` with scoped provide/inject.
  - [ ] Add a `formContext` prop to the six field machines and both group machines; pass it from `behaviors/form.ts` (`linkFieldToParentBus` → `linkFieldToParentHost`).
- **5b — Form → field state through `computed`.**
  - [ ] Derive `formDisabled` / `formReadOnly` from `host.disabled()` / `host.readOnly()` in each field's `computed` and delete the `onStateChange` context mirrors and the `field:state` / `form:state` bus listeners in `setupFormFieldSync`.
  - [ ] Apply decision 2 to `form-field`.
- **5c — Remove the bus.**
  - [ ] Port the ~40 test usages to the facade, delete `FormBusEvents`, `provideFormBus`, `injectFormBus`, `createEventBusKey`, `provideEventBus`, `injectEventBus`, and `busDisposers` in `form.machine.ts`.
  - [ ] Apply decision 1.

Original checklist (superseded by the staging above):

- [ ] Add `FormContext` facade to `packages/machines/form/src/form.context.ts`; remove `EventBus` types.
- [ ] Build the facade in `form.machine.ts` `refs`; keep field registrations in a `Map`.
- [ ] Migrate `behaviors/form.ts` from `formBus` injection to facade injection via `@code-ui/context`.
- [ ] Migrate field machines (`input`, `switch`, `pin-input`, `textarea`, `slider`, `radio`, `checkbox`) to read form state through the facade in `computed`.
- [ ] Delete `provideEventBus` / `injectEventBus` / `createEventBusKey` from `@code-ui/context` after all consumers move.
- [ ] Verify form integration tests, including validation, reset, and deep-slot field registration.

---

## 7. Directional Rules of Thumb

Following `docs/fsm-machine-guide.md`:

1. **Child → Parent (user intent):**
   - Call a facade intent method: `groupContext.toggleItem(value)`.
   - The facade dispatches `send({ type: "VALUE.TOGGLE", value })`.
   - Do not use `watch`; interactions are discrete events.

2. **Parent → Child (state distribution):**
   - Read facade getters inside child `computed`.
   - Do not use `watch`, `applyGroupState`, or `context.set` mirroring.
   - The parent remains the single writer.

3. **Page → Parent (controlled props):**
   - `bindable` lazily syncs controlled props on `get()`. No prop→signal `watch` is required.
   - Keep controlled props declared in `defaultProps` so WeChat registers observers and calls `updateProps`.

4. **Group-owned overrides (form validation, disabled):**
   - Store the value in the parent `bindable`/`stateBindable`.
   - Expose it through the facade. Never create a parallel writable signal.

5. **Render propagation:**
   - `connectToComponent` effect tracks read-through dependencies across machines.
   - Snapshot functions stay read-only and return stable shapes.

---

## 8. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| `connect` writes a signal and loops | Keep `connect` read-only; add a lint/review check; no `send`/`set` in connect. |
| Effect fan-out increases CPU | Cross-machine effects still pass through `diffSnapshot`; changed slices only reach `setData`. Run `machine.bench.ts` and add a no-op delta test. |
| Facade caches a stale value | Facade methods must read `prop()` / `context.get()` on every call; never store the result in `refs`. |
| Controlled/uncontrolled regressions | Rely on existing `bindable` semantics; keep `isEqual` for arrays; cover controlled `updateProps` in tests. |
| Form override overwritten by stale WXML props | Form-owned values use `stateBindable` in the parent, not `propBindable` in children. |
| Late child mount | Facade reference is passed at link time; getters read current values immediately. |
| Detach order | Dispose the connect effect before `machine.stop()`; unregister form fields in detach. |
| Backwards compatibility | `groupBus`/`formBus` props and `EventBus` exports can be removed in a major release; keep deprecation shims only if required. |

---

## 9. Expected Impact

1. **Code deletion:** Removes bus setup, disposal, snapshot encoding, replay, and child mirroring across parent/child machines and behaviors. Expected net reduction of roughly 400–600 lines once all domains migrate.
2. **Bundle size:** Drops `createEventBus` and bus-related branches from compound machines and domain behaviors.
3. **No missed updates:** Children read the current parent state at any mount order; no replay logic.
4. **Fine-grained rendering:** Only snapshots whose read-set changed recompute through the connect effect; `diffSnapshot` still prevents redundant `setData`.
5. **One writer per value:** Parent props/context remain authoritative; child state is derived; the `watch` surface shrinks to genuine prop → FSM state sync and imperative subscriptions.
