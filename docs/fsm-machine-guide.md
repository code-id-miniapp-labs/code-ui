# Efficient Component Machines

Reference for creating or refactoring machines in `packages/machines/<name>/src/<name>.machine.ts`.
Read this before adding `watch`, new context fields, or new state transitions.

## TL;DR — 13 rules

1. **One writer per value.** A value lives in exactly one place: prop, context, computed, state, or ref.
2. **Never mirror props into context inside `watch`.** `bindable` already re-reads props lazily on `context.get` (see `bindable` in `packages/frameworks/miniapp/src/bindable.ts`).
3. **Keep FSM state and context orthogonal.** State = mutually exclusive modes. Context = data. If one derives from the other, derive it with `computed`.
4. **Derived data belongs in `computed`, never in `watch` or duplicate context keys.**
5. **`watch` has only two jobs:** genuine prop/computed → FSM state sync, and narrowly necessary external subscriptions. Never manual form registration or rebinding.
6. **One notification path.** Centralize `emitChange`/payload construction; do not emit from `watch`, `entry`, and `onChange` separately.
7. **Delete dead events and duplicate transitions.** An event nobody sends (e.g. `CHECK`/`UNCHECK`) is dead weight and a maintenance trap.
8. **Actions run after the target state is applied.** Read `state.matches(...)` for the new value; do not duplicate what the transition target already does.
9. **Refs own handles and stable facades.** Form bindings, parent group/form facades, disposers, and previous-value snapshots belong in `refs`. Dispose machine-lifetime handles in `exit`; state-scoped effects own their own timer cleanup.
10. **`connect` is a read-only adapter.** No writes, no machine logic. Precompute WXML arrays there.
11. **Zero prop-echoing in `connect` (Do not re-export component props on `Api`).** Component props already live in `this.data` via WeChat `properties: createProperties(defaultProps)` and are accessible in WXML templates directly as `{{title}}`, `{{color}}`, etc. `connect()` must never return static/component props on `Api`. Return only FSM state, state-derived booleans, dynamic prop getters, dynamic arrays (e.g. `actions`), and imperative methods.

12. **Keep snapshots stable.** `connect()` runs in a reactive effect and its output goes through `diffSnapshot` → `setData`. Return plain data only, reuse unchanged slices, and keep per-frame values out of context when WXS can own them (see [Performance and snapshot hygiene](#performance-and-snapshot-hygiene)).
13. **The machine is the only place for logic.** Runtime `index.ts` stays a thin adapter (no timers, DOM measurement, or custom `observers`). Timers live in state-scoped `effects`; measurement is declarative or done in WXS (see `AGENTS.md`, rule 6).

## When to create a machine

Do not write a machine for components with no interaction state. Over-engineering costs bundle size and per-update CPU.

| Component kind | Machine? | Examples |
|---|---|---|
| Presentational / container (only theme + props) | No. Theme in `packages/core`, runtime imports `../_shared/base` only | `card`, `chip`, `badge`, `avatar`, `divider`, `skeleton`, `icon`, `kbd`, `alert` |
| Has interactive or timed state (open/closed, loading, drag, timers) | Yes | `button`, `drawer`, `pin-input`, `toast`, `tabs`, `dialog` |
| Form control or parent/child relation | Yes, plus reactive facades and domain relation behaviors | `checkbox`, `radio`, `stepper`, `form`, `input` |

Rule of thumb: if the component has no mutually exclusive modes, no timers, and no events that change what it renders, it does not need a machine. If `progress` only renders a value from props, keep it presentational.

## Data flow

```
props (signals) ──bindable──▶ context ──computed──▶ connect effect ──▶ API/UI
                                  ▲       ▲
events ──▶ guard → target → action ┘       │
parent-owned signals ──▶ facade getters ──┘
child intents ──▶ facade methods ──▶ parent send ──▶ parent actions
watch: props/computed ──▶ FSM state (or narrowly necessary external subscriptions)
```

## Where should this value live?

| Value | Home | Notes |
|---|---|---|
| Controlled/uncontrolled input (`value`, `checked`, `open`) | `bindable` with `value: prop(...)` | Do not sync it manually |
| Array/reference input (`value: number[]`) | `bindable` with `isEqual: isEqual` | Prevents factory re-evaluations from triggering false updates |
| Internal mutable runtime data | context `bindable` | Only if no other owner exists |
| Data owned by a parent group/form | Live facade getters read in `computed` | Parent remains the writer; do not copy its state into child bindables |
| Derived flags (`isOpen`, `isChecked`, `isDisabled`) | `computed` | Cheap, pure reads |
| Mutually exclusive modes (`idle`/`focused`, `checked`/`unchecked`) | FSM `state` | Used by guards/transitions/tags |
| Presentational / component props (`size`, `variant`, `color`, `title`, `description`, `mode`, `ui`, `items`) | Component `properties` (`this.data`) | Do NOT copy into machine context, and do NOT re-export in `connect` `Api` |
| Handles, disposers, timers, previous snapshot | `refs` | Cleanup in `exit` |

Displayed API fields should be derived (computed or `.matches()`), not stored again.

## `watch` policy

`watch` is an effect: every signal read inside it becomes a dependency, and it re-runs on any of them. Keep its dependency surface tiny.

### Allowed

```ts
// ✅ props are not events: a controlled prop must move the FSM state
watch: ({ prop, state }) => {
  const open = prop("open");
  if (open == null) return;
  const target = open ? "open" : "closed";
  if (!state.matches(target)) state.set(target);
},
```

A computed value may also drive a real FSM mode when transitions depend on that mode. If it only determines a rendered flag (such as group membership), read it in `connect` instead of synchronizing a second owner.

A narrowly necessary external subscription is allowed when an external resource has no reactive facade or existing lifecycle helper. Track only its identity, dispose the previous subscription even on unlink, and clean up on machine exit. This exception is **not** the group/form architecture: do not rebuild their discovery, registration, or propagation in `watch`.

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

// ❌ echoing reactive state as a notification
watch: ({ context, prop }) => {
  prop("onChange")?.({ value: context.get("value") });
},

// ❌ manual form registration / identity bookkeeping
watch: ({ prop, refs }) => {
  // Do not compare currentName/currentFormContext, call host.register(),
  // or dispose/recreate the form binding here. The helper owns this lifecycle.
},

// ❌ evaluating prop() outside the bindable(() => ...) closure (freezes initial value)
const b = <T>(val: T, defaultValue: T) =>
  bindable<T>(() => ({ value: val, defaultValue }));
```

If a value is already in a `bindable`, **do not** `context.set` it from `watch`:
1. **Lazy prop sync**: `bindable` tracks `lastSeenProp` and syncs prop changes lazily on `get` without invoking `onChange` (without requiring a manual mirror).
2. **Untracked writes & state guards in `watch`**:
   - `bindable.set` (`context.set`, `state.set`) executes its internal signal reads inside `setActiveSub(undefined)` (`untracked`), so writing to context or state never subscribes the caller to that signal.
   - `MiniappMachine` passes an untracked `state` view (`get`, `matches`, `hasTag`) to `watch`, so guarding transitions with `if (!state.matches(target)) state.set(target)` or `state.hasTag("open")` inside `watch` **never** subscribes `watch` to FSM state changes. `watch` only re-runs when the `prop(...)` (or `computed(...)`) signals it reads change.
3. **Group/form lifecycle belongs to facades and helpers**, not `watch`. Children read live group getters; `bindFormField` / `setupFormFieldSync` independently track host discovery and field registration. There is no `rebind` method to call and no need for machine refs such as `currentName`, `currentFormContext`, or `currentGroupBus`.

## `watch` vs `effects` (`track`)

Keep the roles of `watch` and `effects` distinct:

| Mechanism | When to use | Examples |
|---|---|---|
| `watch: ({ prop, computed, state }) => void` | Genuine prop/computed → FSM mode sync; narrowly necessary external subscriptions only when no reactive facade/helper exists. | Controlled `checked`, `indeterminate`, `open`, or `error` modes |
| `states.<state>.effects: ["..."]` | **State-scoped side effects**: timers, animations, or async work active only while in a specific state; returns a cleanup function disposed on state exit. | `button` (`autoResetEffect` in `success`/`error`), `drawer` (`waitForCloseAnimation` in `closing`) |
| Root `effects: ["..."]` / `track([deps], fn)` | Machine-lifetime side effects with explicit dependencies and cleanup, when an actual side effect is needed. Not derived-state copying or parent snapshot broadcasts. | External integration with machine-lifetime ownership |
| Reactive facade getters + framework `effect(connect)` | Parent/group/form state propagation. Getter reads subscribe the consumer to the underlying `alien-signals` signals. | Group selection, disabled/readOnly, form errors and field state |
| `bindFormField` / `setupFormFieldSync` | Reactive host discovery and field registration, created once during setup and disposed on exit. | Form controls and groups |

Keep genuine prop/computed → FSM mode sync in `watch`. Do not put form registration there, and do not add root effects to broadcast derived snapshots. A getter dependency is enough for reactive propagation; effects are for actual side effects.

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

For parent-owned data (e.g. group membership), read the live facade and derive the public flag without a child mirror:

```ts
computed: {
  isChecked: ({ context, prop, state }) => {
    const group = prop("groupContext");
    return group
      ? group.value().includes(context.get("value"))
      : state.matches("checked");
  },
}
```

## Reactive group and form facades

### Groups: parent writes, children read and send intents

The parent creates one stable facade in `refs`. Its getters read parent context/computed signals lazily, and its methods send events to the parent machine. Domain relation behaviors pass that facade to children as `groupContext`; they do not copy each parent value into child props/context.

```ts
// Parent machine fragment (CheckboxGroupContext from @code-ui/checkbox-group)
refs: ({ context, computed, send }) => ({
  groupContext: {
    value: () => context.get("value") ?? [],
    disabled: () => computed("isDisabled"),
    readOnly: () => computed("isReadOnly"),
    invalid: () => computed("isInvalid"),
    color: () => context.get("color") || "primary",
    size: () => computed("effectiveSize"),
    variant: () => context.get("variant") || "outline",
    setValue: (value) => send({ type: "SET_VALUE", value }),
    toggleValue: (value, checked) =>
      send({ type: "TOGGLE_VALUE", value, checked }),
  } satisfies CheckboxGroupContext,
}),

// Child action: request a change; the parent owns guards and mutation.
selectGroup: ({ context, prop }) => {
  prop("groupContext")?.toggleValue(context.get("value"));
},
```

Child `computed` reads `groupContext.value()`, `disabled()`, `invalid()`, etc. The framework runs `connect` in an `alien-signals` effect, so those reads subscribe through the facade to parent signals. A stable facade object does not need replacement when its values change. Keep the facade out of serializable API/UI snapshots; return the derived flags WXML needs. Do not introduce child `groupValue`/`groupDisabled` mirrors, `applyGroupState`, broadcast effects, or snapshot listeners. A grouped child's standalone FSM mode need not mirror group selection when the public checked flag is derived from the group getter.

### Forms: setup once, reactive discovery and registration

Use `bindFormField` for a low-level binding, or `setupFormFieldSync` / `cleanupFormFieldSync` from `@code-ui/form/context` for the standard machine integration. `setupFormFieldSync` stores the binding in `refs.formField` and suppresses form input/change echoes during host-driven `setValue`/reset. Supply live getters, especially `getHost: () => prop("formContext")`, rather than capturing the initial host.

```ts
// Machine fragments for a string-valued control; refs declares formField.
entry: ["setupFormField"],
exit: ["cleanupFormField"],

// implementations.actions
setupFormField: ({ prop, context, computed, refs, scope }) => {
  setupFormFieldSync(
    {
      component: prop("component"),
      getHost: () => prop("formContext"),
      id: scope.id ?? "field",
      getFormId: () => prop("form") || "",
      getName: () => prop("name") || "",
      getValue: () => context.get("value"),
      setValue: (value) => context.set("value", String(value ?? "")),
      resetValue: () => context.set("value", prop("defaultValue") ?? ""),
      getRules: () => prop("rules") ?? [],
      getValidateOn: () => prop("validateOn"),
      isDisabled: () => computed("isDisabled"),
    },
    refs,
  );
},
cleanupFormField: ({ refs }) => cleanupFormFieldSync(refs),
```

The binding owns two **independent** reactive effects:

- **Discovery** tracks `getHost()` and `getFormId()`. An explicit host wins; `undefined` permits scoped injection and late-provider discovery, while `null` explicitly disconnects. `@code-ui/context` remains responsible for scoped, deep-slot discovery (`inject`, `onProvide`, context requests). It is not a per-value state transport.
- **Registration** tracks the discovered host and effective field key. A nonempty name is the key; unnamed fields use their id only when rules or an explicit form id make them eligible. Name changes do not restart discovery. Registration remains stable when the host/key are unchanged; unnamed eligibility can depend on rules/form id.

Registration, unregistration, and discovery side effects run **untracked**. Reads performed by `host.register` (including validation, values, errors, disabled state, and rules) must not accidentally subscribe the registration effect and cause registration churn. Field callbacks remain live getters, not captured snapshots.

`BoundFormField.host` is reactive. Read host getters such as `disabled()`, `readOnly()`, `errors(name)`, and `fieldState(name)` in child computed values; `alien-signals` carries those state changes into effect-driven `connect`. No machine `watch` should call `register`, recreate the helper, invoke a nonexistent `rebind`, or maintain `currentName`/`currentFormContext` bookkeeping. Dispose the binding on exit; its cleanup stops both effects, discovery listeners, and registration.

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

// ✅ one action + value (machine only invokes pure prop callbacks)
emitChange: ({ state, context, prop, refs }) => {
  const checked = state.matches("checked");
  const value = context.get("value") || prop("value") || checked;
  prop("onChange")?.({ value, checked });
  refs.get("formField")?.emitInput(checked);
  refs.get("formField")?.emitChange(checked);
},
```

## Notifications and framework glue

- Build user-event payloads once in a shared helper, invoked by the appropriate action or `bindable.onChange`. Do not emit an initial change unless the component contract requires it.
- Do not emit from `watch` or echo programmatic prop changes as user changes.
- Parent → child state is a reactive read, **not** full-snapshot messaging or broadcast deltas. Domain behaviors link/distribute facade identity; getter reads propagate state changes.
- `bindable.onChange` is the right place for user-initiated changes. It already fires once per `set`.
- **Framework event adapter bridge**: Machines MUST invoke pure props like `prop("onTap")(payload)` or `prop("onChange")(payload)`. Never call `prop("component")?.triggerEvent(...)` or `prop("component")?.setData(...)` inside machine code. The MiniApp runtime `createMachinePropGetter` adapter transparently translates these pure callbacks to WeChat's `instance.triggerEvent("tap" | "click" | "change" | "update:modelValue", ...)` and user props.

## Lifecycle and side effects

- `entry`: create machine-lifetime bindings once (for example, `setupFormFieldSync`). No initial parent snapshot broadcast is needed.
- `exit`: dispose machine-lifetime bindings/subscriptions and clear their refs. State-scoped effects return their own cleanup.
- `watch` may manage narrowly necessary external subscriptions, but never form registration/rebinding. Cleanup must be explicit and idempotent.
- Prefer `track([deps], fn)` for machine-lifetime effects that do not need `watch` reruns; it reruns only when the listed deps change.
- Do not perform DOM queries / `getRelationNodes` in every action; measure only when needed.

## MiniProgram reactivity and `defaultProps`

WeChat MiniProgram runtime components register properties via `Component({ properties: createProperties(defaultProps, ...) })`. Furthermore, `createMachineBehavior` sets up reactive observers keyed by `Object.keys(defaultProps)`.

- **Every controlled prop must be declared in `defaultProps`**: If an optional controlled prop (such as `value`, `checked`, `open`) is omitted from `defaultProps` (e.g. only `defaultValue` is defined), WeChat never attaches a property observer for it. When an external page modifies the prop via `setData({ value: 70 })`, the observer does not fire, `updateProps` is never called, and the machine never receives the new controlled value.
- Declare controlled props explicitly in `defaultProps`:
  ```ts
  export const defaultSliderProps: SliderProps = {
    value: null as any,
    defaultValue: 0,
    min: 0,
    max: 100,
    // ...
  };
  ```

## Reference-type `bindables` (`isEqual`)

When `bindable<T>` holds an array or object (such as `value: number[]` for a dual-thumb slider):
- Normalizing or cloning inside the factory returns a new reference each time.
- Without an equality comparer, `bindable` defaults to strict reference comparison (`===`), triggering false dirty syncs.
- Always provide `isEqual` from `@code-ui/utils`:
  ```ts
  value: bindable<number[]>(() => ({
    value: isNotNull(prop("value")) ? normalizeValues(prop("value"), ...) : undefined,
    defaultValue: normalizeValues(prop("defaultValue") ?? 0, ...),
    isEqual,
  })),
  ```

## High-frequency gestures and WXS view driver

MiniProgram isolates the JavaScript execution environment (JSCore) from the rendering environment (Webview). Passing continuous touch events (`touchmove`) over IPC to JSCore, evaluating the machine, and sending back `setData` introduces a 16-50ms latency delay, resulting in noticeable thumb lag during fast drag interactions.

To achieve 60/120fps fluid dragging:
1. **WXS View Driver (Webview thread)**:
   - Captures `touchstart`, `touchmove`, and `touchend` directly in WXS.
   - Instantly mutates DOM element styles via `instance.setStyle({ transform: ..., width: ... })`.
2. **Throttled Machine Reporting (IPC)**:
   - WXS throttles `callMethod` (e.g. every 16-32ms or upon step threshold) to report `handleTouchMove` to the machine.
3. **FSM Machine (JSCore thread)**:
   - Remains the authoritative single source of truth for normalized values, clamping, form synchronization, and emitting `onChange`/`onChangeEnd`.
   - On `touchend` (or external `value` prop updates), data flows from FSM -> `setData` -> WXS `change:rect` / `change:value` to ensure convergence.

## Performance and snapshot hygiene

Machine cost is small. The expensive part is `setData`, which serializes across the JS and render threads. Output flows like this:

```
signals ──▶ connect() snapshot ──▶ toSerializableSnapshot (drops functions)
        ──▶ diffSnapshot (flat delta paths) ──▶ nextTick batch ──▶ setData
```

What is already handled by the framework (`packages/frameworks/miniapp/src/connect.ts`, `packages/utils/src/diff.ts`):

- Functions are stripped before diffing, so closures recreated by `connect()` do not create deltas.
- Only changed paths are sent (`button.state`, `items[2].checked`).
- Multiple updates in one tick coalesce into a single `setData`.

What machine authors must still do:

- **Return only what WXML reads.** Every extra field costs diffing and payload.
- **Prefer stable shapes.** Keep the same keys across states. Removed or `undefined` keys force a whole-object write.
- **Avoid large arrays that change length often.** A length change sends the whole array.
- **No per-frame context writes** for drag, pull, or slider positions. Let WXS drive the view and report on start, end, and thresholds (see the gesture section above).
- **No `watch` on the hot path.** Each read inside `watch` is a dependency that re-runs it.
- **Add a no-op test.** A transition that changes nothing must produce a `null` delta.

Planned improvements are tracked in Phase 4.5 of [bundle-size-optimization.md](./bundle-size-optimization.md).

## Refactoring playbook

1. **Inventory writers.** `grep -n "context.set\|state.set\|refs.set" <machine>.ts`.
2. **Classify each value.** Assign one owner using the table above. Mark duplicates.
3. **Delete mirrored context keys and their setters.**
4. **Convert derivations to `computed`.** Update `connect` to read them.
5. **Reduce `watch`** to genuine prop/computed → FSM state sync + narrowly necessary external subscriptions. Delete `syncingFromProps`/`prev*` guards that only protect mirroring, and manual form registration/rebind bookkeeping. Use live facade getters and the form helper instead.
6. **Dedupe transitions and actions.** Remove unreachable events; share branches; collapse constant-only actions.
7. **Centralize user notification payloads.** One path, no emit in `watch`, no initial emit unless required by the contract. Remove parent snapshot broadcasts; let reactive getters propagate state.
8. **Update tests** (`context.get` assertions usually become `computed(...)`/`api.*`).
9. **Verify:** `pnpm test`, `pnpm --filter @code-ui/<name> typecheck`, `npx oxlint packages/machines/<name>/src packages/machines/<name>/tests`.

## Anti-pattern catalog

| Anti-pattern | Symptom | Fix |
|---|---|---|
| Prop mirror in `watch` | `context.set` for every prop, `syncingFromProps` refs | Delete; rely on `bindable` |
| Prop-echoing in `connect` `Api` | `title`, `description`, `color`, `variant` re-exported in `Api` | See rule 11. Read props directly from component data in WXML and runtime. |
| Unstable `connect` output | New objects or closures for unchanged slices; per-frame values in context | See rule 12. Reuse slices, return data-only snapshots, move drag values to WXS. |
| Omitted controlled prop in `defaultProps` | MiniProgram `createProperties` creates no observer; parent `setData({ value })` fails to reach machine | Include every controlled prop in `defaultProps` (`value: null as any`) |
| Missing `isEqual` in array/reference `bindable` | Factory creates new array reference on each read, breaking dirty checks or causing spurious updates | Pass `isEqual: isEqual` from `@code-ui/utils` to `bindable` |
| Driving high-frequency drag gestures via JSCore `setData` | 16-50ms IPC roundtrip latency causes thumb/slider to lag behind touch gestures | Use WXS view driver to mutate DOM transform/width directly on Webview thread; throttle IPC event calls to machine |
| Clearing transient interactive state in event actions | `activeThumbIndex` cleared on `POINTER_UP` leaves stale state if machine stops or transitions via another path | Clear transient interaction state in `states.<state>.exit` (e.g. `states.dragging.exit: ["clearActiveThumb"]`) |
| Child mirrors of parent group state | `groupValue`, `groupDisabled`, `applyGroupState`, snapshot listeners/broadcasts | Remove mirrors and transport; read live `groupContext` getters in child computed values |
| Reading `field.getValue()` during batched controlled input | Controlled prop `watch` flushes on `endBatch()`, so `field.getValue()` returns pre-toggle state during `emitInput`/`emitChange` | Pass `payload.value` (`valueOverride`) directly to `validateSingleField` / `applyFieldErrors` |
| Moving FSM mode sync into generic effects | `effects: ["trackProps"]` copies props/computed into FSM modes | Keep genuine mode sync in `watch`; use lifecycle effects for actual side effects, facade getters for parent state |
| Eager `prop()` outside `bindable` | `const b = (val, def) => bindable(() => ({ value: val }))` | Pass key and read `prop(key)` inside `bindable(() => ...)` |
| Object literal fallback in `bindable.value` | `value: prop("encoding") ?? {}` creates a new `{}` on every `syncProp()`, overwriting `context.set` | Pass `value: prop("encoding")` and put `{}` in `defaultValue` |
| Manual form registration/rebinding in `watch` | `currentName`, `currentFormContext`, repeated helper setup, or `rebind` calls | Setup once with reactive `getHost`/name/form getters; let the helper manage discovery and registration |
| Duplicate tri-state | state + `checked` + `indeterminate` kept in sync | One owner; derive the rest |
| Emit from multiple places | `onChange` + `watch` + `entry` all emit | Single `emitChange` |
| Presentational props in context | `size`, `variant`, `ui`, `items` bindables | Read via `prop()` in `connect` |
| Dead events | `CHECK`/`UNCHECK` typed but never sent | Delete event + transitions |
| Constant-only actions | `emitTrue` / `emitFalse` clones | One parameterized action |
| Derivation in `watch` | `context.set("isOpen", ...)` | `computed` |
| Tracked registration side effects | Value/error/disabled/rule changes unexpectedly unregister/register a field | Keep discovery and registration effects independent; run register/unregister side effects untracked |

Evidence from this repo:

- Accordion: deleted manual prop mirroring; **309 → 240 lines**, same behavior.
- Checkbox: made state the single source; **573 → 457 lines**, same behavior.

## Minimal skeleton

A no-bus timed interaction. The companion `ExampleSchema` declares states `idle | running`, events `SET_VALUE` (string `value`), `START`, and `STOP`, a string context `value`, and computed `isDisabled`. `defaultExampleProps` declares `value`, `defaultValue: ""`, and `disabled: false`. Add form binding refs/setup only for a component that actually participates in a form.

```ts
import { createMachine } from "@code-ui/core";
import type { ExampleMachine, ExampleSchema } from "./example.types";
import { defaultExampleProps } from "./example.props";

export const exampleMachine: ExampleMachine = createMachine<ExampleSchema>({
  props: ({ props }) => ({ ...defaultExampleProps, ...props }),

  initialState: () => "idle",

  context: ({ prop, bindable }) => ({
    // controlled/uncontrolled value: bindable syncs props lazily
    value: bindable<string>(() => ({
      value: prop("value"),
      defaultValue: prop("defaultValue") ?? "",
    })),
  }),

  computed: {
    // read the prop directly; do not mirror it into context
    isDisabled: ({ prop }) => Boolean(prop("disabled")),
  },

  // No watch/refs/setup are needed: no external mode prop or binding exists.
  on: {
    SET_VALUE: {
      guard: "isInteractive",
      actions: ["setValue"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
      on: { START: { guard: "isInteractive", target: "running" } },
    },
    // Cleanup runs on STOP, automatic completion, or machine stop.
    running: {
      tags: ["busy"],
      effects: ["autoStop"],
      on: { STOP: { target: "idle" } },
    },
  },

  implementations: {
    effects: {
      autoStop: ({ send }) => {
        const id = setTimeout(() => send({ type: "STOP" }), 1000);
        return () => clearTimeout(id);
      },
    },
    guards: {
      isInteractive: ({ computed }) => !computed("isDisabled"),
    },
    actions: {
      setValue: ({ context, event }) => {
        if (event.type !== "SET_VALUE") return;
        context.set("value", event.value);
      },
    },
  },
});
```

## Review checklist

- [ ] Each value has exactly one owner.
- [ ] No `context.set` inside `watch` for values already bound to props.
- [ ] No `context.set` for computed-only data.
- [ ] `watch` reads only the props/computed needed for genuine FSM mode sync or a narrowly necessary external subscription.
- [ ] No notifications emitted from `watch`.
- [ ] Every event in the union has a sender.
- [ ] Transition targets and actions do not duplicate each other.
- [ ] Form setup runs once with reactive `getHost`/name/form getters; no manual registration, rebind, or identity bookkeeping in `watch`.
- [ ] Group children read facade getters; facade methods send parent intents. No mirrored group state or snapshot broadcasts.
- [ ] Machine-lifetime bindings have exit cleanup; external subscriptions also clean up on identity change/unlink; state-scoped effects return cleanup.
- [ ] `connect` only reads and precomputes; no writes.
- [ ] Tests cover: initial/default, controlled `updateProps`, user events + guards, programmatic API, reactive group/form facades, `stop()` cleanup.

## Testing pattern

```ts
import { MiniappMachine } from "@code-ui/miniapp";
import { drawerMachine } from "@code-ui/drawer";
import { expect, it } from "vitest";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

it("syncs controlled props into state", async () => {
  // Use a machine whose schema actually declares closed/open states.
  const machine = new MiniappMachine(drawerMachine, { open: false });
  machine.start();

  machine.updateProps({ open: true });
  await flush();

  expect(machine.state.get()).toBe("open");
  machine.stop();
});
```

Prefer asserting `api.*` / `computed(...)` over raw context keys; context is an implementation detail.

Also cover these cases:

```ts
import type { Service } from "@code-ui/core";
import { diffSnapshot } from "@code-ui/utils";
import { vi } from "vitest";
// exampleMachine and ExampleSchema are the companion definitions above.
const connectExample = (service: Service<ExampleSchema>) => ({
  value: service.context.get("value"),
  state: service.state.get(),
});

// no-op transition produces no setData
it("emits a null delta for a no-op event", () => {
  const machine = new MiniappMachine(exampleMachine, {});
  machine.start();
  const before = connectExample(machine.service);
  machine.send({ type: "SET_VALUE", value: "" }); // same as current
  const after = connectExample(machine.service);
  expect(diffSnapshot(before, after, "example")).toBeNull();
  machine.stop();
});

it("cleans up the state-scoped timer on stop()", () => {
  vi.useFakeTimers();
  const machine = new MiniappMachine(exampleMachine, {});
  try {
    machine.start();
    machine.send({ type: "START" });
    expect(vi.getTimerCount()).toBe(1);
    machine.stop();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    machine.stop();
    vi.useRealTimers();
  }
});
```

- **Groups:** link a child to the parent's facade; update parent selection, disabled/readOnly, and validation state without replacing the facade. Assert child computed/API output updates through the connect effect. Send a child intent and assert the parent handles it; unlink/switch parents and verify old-parent changes no longer affect the child.
- **Form discovery:** cover late providers, scoped form ids and deep slots, explicit host changes, `null` disconnect, and return to `undefined` discovery. Rename a field without restarting discovery; switch hosts/names without cross-talk.
- **Form registration:** assert value/error/disabled and named-field rule changes do not churn registration. Test unnamed eligibility changes from rules/form id. Verify host-driven set/reset suppresses form input/change echoes while user notifications still occur.
- **Cleanup:** stop/dispose and verify discovery listeners, registration, and effects are released. Further old-host/provider changes must not revive a disposed binding.
- **Controlled props:** call `updateProps` for each relevant declared prop and assert its intended state/computed/API result, not an artificial context mirror.
