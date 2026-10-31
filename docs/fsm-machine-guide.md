# Efficient Component Machines

Reference for creating or refactoring machines in `packages/machines/<name>/src/<name>.machine.ts`.
Read this before adding `watch`, new context fields, or new state transitions.

## TL;DR — 10 rules

1. **One writer per value.** A value lives in exactly one place: prop, context, computed, state, or ref.
2. **Never mirror props into context inside `watch`.** `bindable` already re-reads props on `context.get` (`packages/frameworks/miniapp/src/bindable.ts:19-30,43`).
3. **Keep FSM state and context orthogonal.** State = mutually exclusive modes. Context = data. If one derives from the other, derive it with `computed`.
4. **Derived data belongs in `computed`, never in `watch` or duplicate context keys.**
5. **`watch` has only two jobs:** prop → FSM state sync, and imperative subscriptions (bus/form rebind). Nothing else.
6. **One notification path.** Centralize `emitChange`/payload construction; do not emit from `watch`, `entry`, and `onChange` separately.
7. **Delete dead events and duplicate transitions.** An event nobody sends (e.g. `CHECK`/`UNCHECK`) is dead weight and a maintenance trap.
8. **Actions run after the target state is applied.** Read `state.matches(...)` for the new value; do not duplicate what the transition target already does.
9. **Refs own handles.** Timers, buses, disposers, form bindings, and previous-value snapshots go in `refs`, with cleanup in `exit`.
10. **`connect` is a read-only adapter.** No writes, no machine logic. Precompute WXML arrays there.

## Data flow

```
props (signals) ──bindable──▶ context ──computed──▶ connect/API/UI
                                  ▲
events ──▶ guard → target → action ┘
watch: props/state ──▶ FSM state + external subscriptions
```

## Where should this value live?

| Value | Home | Notes |
|---|---|---|
| Controlled/uncontrolled input (`value`, `checked`, `open`) | `bindable` with `value: prop(...)` | Do not sync it manually |
| Internal mutable runtime data | context `bindable` | Only if no other owner exists |
| Data owned by a parent/group bus | context `stateBindable` | Bus is authoritative, not props |
| Derived flags (`isOpen`, `isChecked`, `isDisabled`) | `computed` | Cheap, pure reads |
| Mutually exclusive modes (`idle`/`focused`, `checked`/`unchecked`) | FSM `state` | Used by guards/transitions/tags |
| Presentational props (`size`, `variant`, `ui`, `items`) | read via `prop()` in `connect` | Do not copy into context |
| Handles, disposers, timers, previous snapshot | `refs` | Cleanup in `exit` |

Displayed API fields should be derived (computed or `.matches()`), not stored again.

## `watch` policy

`watch` is an effect: every signal read inside it becomes a dependency, and it re-runs on any of them. Keep its dependency surface tiny.

### Allowed

```ts
// ✅ props are not events: controlled prop must move the FSM state
watch: ({ prop, state }) => {
  const indeterminate = prop("indeterminate");
  if (isNotNull(indeterminate) && parseBooleanProp(indeterminate)) {
    if (!state.matches("indeterminate")) state.set("indeterminate");
    return;
  }
  const checked = prop("checked");
  if (isNotNull(checked) && !state.matches("indeterminate")) {
    const target = parseBooleanProp(checked) ? "checked" : "unchecked";
    if (!state.matches(target)) state.set(target);
  }
},
```

```ts
// ✅ imperative subscription keyed by a prop, explicitly disposed
watch: ({ prop, refs, context, state }) => {
  const next = prop("groupBus");
  if (next === refs.get("currentGroupBus")) return;
  refs.set("currentGroupBus", next);
  for (const dispose of refs.get("busDisposers") ?? []) dispose();
  refs.set(
    "busDisposers",
    next
      ? [next.on("group:change", (snapshot) => applyGroupState({ context, state }, snapshot))]
      : [],
  );
},
```

### Forbidden

```ts
// ❌ mirroring props; bindable already syncs this
watch: ({ prop, context }) => {
  if (context.get("size") !== prop("size")) context.set("size", prop("size"));
},

// ❌ deriving UI data
watch: ({ context, computed }) => {
  context.set("isOpen", computed("isChecked"));
},

// ❌ emitting notifications
watch: ({ context, refs }) => {
  refs.get("bus").emit("change", snapshot(context));
},
// ❌ calling applyGroupState / context.set inside watch
watch: ({ prop, context, state }) => {
  applyGroupState({ context, state }, { value: prop("groupValue") });
},

// ❌ evaluating prop() outside the bindable(() => ...) closure (freezes initial value)
const b = <T>(val: T, defaultValue: T) =>
  bindable<T>(() => ({ value: val, defaultValue }));
```

If a value is already in a `bindable`, **do not** `context.set` it from `watch`:
1. **Lazy prop sync**: `bindable` tracks `lastSeenProp` and syncs prop changes lazily on `get` without invoking `onChange` (while still letting imperative bus listeners call `context.set` when the prop itself hasn't changed).
2. **Untracked writes & state guards in `watch`**:
   - `bindable.set` (`context.set`, `state.set`) executes its internal signal reads inside `setActiveSub(undefined)` (`untracked`), so writing to context or state never subscribes the caller to that signal.
   - `MiniappMachine` passes an untracked `state` view (`get`, `matches`, `hasTag`) to `watch`, so guarding transitions with `if (!state.matches(target)) state.set(target)` or `state.hasTag("open")` inside `watch` **never** subscribes `watch` to FSM state changes. `watch` only re-runs when the `prop(...)` (or `computed(...)`) signals it reads change.
3. **Group/Form bus lifecycle**:
   - Initialize `currentGroupBus: prop("groupBus")` in `refs`, subscribe in `entry` (which runs inside `untracked`), and in `watch` only rebind when `prop("groupBus") !== refs.get("currentGroupBus")` (without `if (nextBus && ...)` so unlinking to `undefined` still disposes the previous listener). Return early in `watch` when `nextBus` is active so `watch` only depends on `prop("groupBus")`.
   - Child machines (`checkbox`, `radio`) whose `group*` values (`groupValue`, `groupDisabled`, `groupInvalid`, `groupColor`, `groupSize`, `groupVariant`) are driven by `groupBus` must use `stateBindable` (initialized from `prop("group*")`), **not** `propBindable`. `groupBus` is authoritative because states like `groupInvalid` and `groupDisabled` can be updated by `<c-form>` validation on the parent group without the parent's WXML props changing.

## `watch` vs `effects` (`track`)

Keep the roles of `watch` and `effects` distinct:

| Mechanism | When to use | Examples |
|---|---|---|
| `watch: ({ prop, state, refs }) => void` | **Leaf / interactive machines**: prop → FSM state sync (`checked`, `indeterminate`, `open`, `error`) and imperative bus rebinding (`formBus`, `groupBus`). | `checkbox`, `radio`, `switch`, `drawer`, `input`, `textarea`, `pin-input`, `accordion-item`, `stepper-item`, `form-field` |
| `states.<state>.effects: ["..."]` | **State-scoped side effects**: timers, animations, or async work active only while in a specific state; returns a cleanup function disposed on state exit. | `button` (`autoResetEffect` in `success`/`error`), `drawer` (`waitForCloseAnimation` in `closing`) |
| Root `effects: ["track..."]` with `track([deps], fn)` | **Parent coordinator machines**: broadcasting parent prop/context changes (`disabled`, `readOnly`, `size`, `color`, `variant`, controlled `value`/`step`, `rules`) over an `EventBus` to registered children. | `form` (`trackFormState`), `form-field` (`trackFieldProps`), `checkbox-group` (`trackGroupProps`), `radio-group` (`trackGroupProps`), `stepper` (`trackControlledStep`) |

Never move prop → FSM state sync or bus rebinding out of `watch` into `effects`; keep `watch` as the single place for prop-driven state sync and bus rebinding.

## State vs context

Keep one source of truth:

```ts
// ❌ three sources for one tri-state
context: { checked: boolean; indeterminate: boolean }
state: "checked" | "unchecked" | "indeterminate"

// ✅ state owns the mode; booleans are derived
computed: {
  isChecked: ({ state }) => state.matches("checked"),
  isIndeterminate: ({ state }) => state.matches("indeterminate"),
}
```

Controlled props still need `watch` to move the FSM state (props are not events), but no context mirror is needed.

For modes that are pure data (e.g. group membership), keep a context value and derive the public flag:

```ts
computed: {
  isChecked: ({ context, state }) => {
    const groupValue = context.get("groupValue");
    return Array.isArray(groupValue)
      ? groupValue.includes(context.get("value"))
      : state.matches("checked");
  },
}
```

## Events, transitions, actions

- Put an event at the root (`on`) only when all states handle it identically; otherwise put it on the states.
- Remove events with no sender. Keep the event union and transition table in sync.
- Share transition arrays or use guards instead of copying the same branches per state.
- Guards must be cheap and side-effect free.
- Action order is: exit actions → transition actions → entry actions, **after** the target state is applied. Read `state.matches(...)` for the new value.
- Do not re-write a transition target inside an action (`target: "checked"` + `setCheckedTrue()` is duplication).
- Collapse actions that differ only by a constant:

```ts
// ❌ three near-identical actions
emitControlledCheck, emitControlledUncheck, emitCheckboxChange

// ✅ one action + value
emitChange: ({ state, context, prop, refs }) => {
  const checked = state.matches("checked");
  const value = context.get("value") || prop("value") || checked;
  prop("onCheckedChange")?.({ value, checked });
  prop("onChange")?.({ value, checked });
  prop("component")?.triggerEvent?.("change", { value, checked });
  refs.get("formField")?.emitInput(checked);
  refs.get("formField")?.emitChange(checked);
},
```

## Notifications and framework glue

- Build the payload once: one helper (`emitChange(prop, refs, value)`), called from `onChange` and initial entry only.
- Do not also emit from `watch`; parent prop changes already reach children through the domain behavior (`onPropChanged` → `sync...Children`) and child prop watchers.
- Emit **full snapshots**, not deltas. Children must be able to apply a snapshot without querying the parent.
- `bindable.onChange` is the right place for user-initiated changes. It already fires once per `set`.
- WeChat events (`triggerEvent("change")`, `update:modelValue`) belong at this boundary, not scattered across transitions.

## Lifecycle and side effects

- `entry`: initial subscription/setup, initial bus snapshot.
- `exit`: dispose subscriptions, timers, observers. Always reset refs to empty.
- `watch` may manage subscriptions that depend on props, but cleanup must be explicit and idempotent.
- Prefer `track([deps], fn)` for machine-lifetime effects that do not need `watch` reruns; it reruns only when the listed deps change.
- Do not perform DOM queries / `getRelationNodes` in every action; measure only when needed.

## Refactoring playbook

1. **Inventory writers.** `grep -n "context.set\|state.set\|refs.set" <machine>.ts`.
2. **Classify each value.** Assign one owner using the table above. Mark duplicates.
3. **Delete mirrored context keys and their setters.**
4. **Convert derivations to `computed`.** Update `connect` to read them.
5. **Reduce `watch`** to prop→state sync + unavoidable subscriptions. Delete `syncingFromProps`/`prev*` guards that only exist to protect mirroring.
6. **Dedupe transitions and actions.** Remove unreachable events; share branches; collapse constant-only actions.
7. **Centralize notification payloads.** One helper, one initial emit, no emit in `watch`.
8. **Update tests** (`context.get` assertions usually become `computed(...)`/`api.*`).
9. **Verify:** `pnpm test`, `pnpm --filter @code-ui/<name> typecheck`, `npx oxlint packages/machines/<name>/src packages/machines/<name>/tests`.

## Anti-pattern catalog

| Anti-pattern | Symptom | Fix |
|---|---|---|
| Prop mirror in `watch` | `context.set` for every prop, `syncingFromProps` refs | Delete; rely on `bindable` |
| `propBindable` for `group*` bus state | Stale WXML `groupInvalid` / `groupValue` props overwrite `groupBus` updates during validation | Use `stateBindable` initialized from `prop("group*")`; let `groupBus` (`applyGroupState`) own updates |
| Reading `field.getValue()` during batched controlled input | Controlled prop `watch` flushes on `endBatch()`, so `field.getValue()` returns pre-toggle state during `emitInput`/`emitChange` | Pass `payload.value` (`valueOverride`) directly to `validateSingleField` / `applyFieldErrors` |
| Moving `watch` logic into `effects` | Using `effects: ["trackProps"]` for prop → state sync or bus rebind | Keep prop → state sync & bus rebinding in `watch`; use `effects` only for state-scoped timers/animations or parent bus broadcasts |
| Eager `prop()` outside `bindable` | `const b = (val, def) => bindable(() => ({ value: val }))` | Pass key and read `prop(key)` inside `bindable(() => ...)` |
| Object literal fallback in `bindable.value` | `value: prop("encoding") ?? {}` creates a new `{}` on every `syncProp()`, overwriting `context.set` | Pass `value: prop("encoding")` and put `{}` in `defaultValue` |
| Truthy guard on bus rebind | `if (bus && bus !== currentBus)` leaks listener on unlink | Check `if (nextBus !== currentBus)` so `undefined` disposes old listener |
| Duplicate tri-state | state + `checked` + `indeterminate` kept in sync | One owner; derive the rest |
| Emit from multiple places | `onChange` + `watch` + `entry` all emit | Single `emitChange` |
| Presentational props in context | `size`, `variant`, `ui`, `items` bindables | Read via `prop()` in `connect` |
| Dead events | `CHECK`/`UNCHECK` typed but never sent | Delete event + transitions |
| Constant-only actions | `emitTrue` / `emitFalse` clones | One parameterized action |
| Derivation in `watch` | `context.set("isOpen", ...)` | `computed` |
| Shared `busDisposers` ref for two domains | form cleanup disposes group listeners | Separate refs per subscription |

Evidence from this repo:

- Accordion: deleted manual prop mirroring; **309 → 240 lines**, same behavior.
- Checkbox: made state the single source; **573 → 457 lines**, same behavior.

## Minimal skeleton

```ts
import { createMachine } from "@code-ui/core";
import { createEventBus } from "@code-ui/utils";
import type { ExampleMachine, ExampleSchema } from "./example.types";
import { defaultExampleProps } from "./example.props";

export const exampleMachine: ExampleMachine = createMachine<ExampleSchema>({
  props: ({ props }) => ({ ...defaultExampleProps, ...props }),

  initialState: () => "idle",

  refs: () => ({
    bus: createEventBus(),
    busDisposers: [],
  }),

  context: ({ prop, bindable }) => ({
    // controlled/uncontrolled value: bindable syncs props lazily
    value: bindable<string>(() => ({
      value: prop("value"),
      defaultValue: prop("defaultValue") ?? "",
    })),
    // internal data only when no other owner exists
    lastValue: bindable<string>(() => ({ defaultValue: "" })),
  }),

  computed: {
    isDisabled: ({ context }) => Boolean(context.get("disabled")),
  },

  // ONLY prop → state and imperative subscriptions
  watch: ({ prop, state, refs, context }) => {
    // props are not events; move the FSM state explicitly
    if (prop("open") !== undefined) {
      const target = prop("open") ? "open" : "closed";
      if (!state.matches(target)) state.set(target);
    }

    // subscription lifecycle keyed by prop
    const nextBus = prop("bus");
    if (nextBus !== refs.get("currentBus")) {
      for (const dispose of refs.get("busDisposers")) dispose();
      refs.set("currentBus", nextBus);
      refs.set("busDisposers", nextBus ? [nextBus.on("change", () => {})] : []);
    }
  },

  entry: ["setup"],
  exit: ["cleanup"],

  on: {
    SET_VALUE: {
      guard: "isInteractive",
      actions: ["setValue"],
    },
  },

  states: {
    idle: { tags: ["idle"] },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => !computed("isDisabled"),
    },
    actions: {
      setValue: ({ context, event }) => {
        if (event.type !== "SET_VALUE") return;
        context.set("value", event.value);
      },
      setup: ({ refs, context }) => {
        // subscribe once; store disposers in refs
      },
      cleanup: ({ refs }) => {
        for (const dispose of refs.get("busDisposers")) dispose();
        refs.set("busDisposers", []);
      },
    },
  },
});
```

## Review checklist

- [ ] Each value has exactly one owner.
- [ ] No `context.set` inside `watch` for values already bound to props.
- [ ] No `context.set` for computed-only data.
- [ ] `watch` reads only props it needs (plus state for sync).
- [ ] No notifications emitted from `watch`.
- [ ] Every event in the union has a sender.
- [ ] Transition targets and actions do not duplicate each other.
- [ ] Subscriptions have cleanup in `exit` and on rebind.
- [ ] `connect` only reads and precomputes; no writes.
- [ ] Tests cover: initial/default, controlled `updateProps`, user events + guards, programmatic API, group/form bus, `stop()` cleanup.

## Testing pattern

```ts
import { MiniappMachine } from "@code-ui/miniapp";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

it("syncs controlled props into state", async () => {
  const machine = new MiniappMachine(exampleMachine, { open: false });
  machine.start();

  machine.updateProps({ open: true });
  await flush();

  expect(machine.state.get()).toBe("open");
  machine.stop();
});
```

Prefer asserting `api.*` / `computed(...)` over raw context keys; context is an implementation detail.
