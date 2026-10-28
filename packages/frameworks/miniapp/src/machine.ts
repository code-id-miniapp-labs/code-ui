import {
  computed as alienComputed,
  effect,
  effectScope,
  endBatch,
  setActiveSub,
  signal,
  startBatch,
} from "alien-signals";
import {
  callAll,
  isFunction,
  isPromise,
  isString,
  normalizeProps,
  runIfFn,
  warn,
} from "@code-ui/utils";
import {
  createRefs,
  createScope,
  findTransition,
  getExitEnterStates,
  hasTag,
  INIT_STATE,
  MachineStatus,
  matchesState,
  resolveStateValue,
} from "@code-ui/core";
import { bindable } from "./bindable";
import type {
  ActionsOrFn,
  Bindable,
  BindableContext,
  BindableParams,
  BindableRefs,
  ChooseFn,
  ComputedFn,
  EffectsOrFn,
  GuardFn,
  Machine,
  MachineSchema,
  Params,
  PropFn,
  Scope,
  Service,
  Transition,
} from "@code-ui/core";

type Dict = Record<string, any>;
type AnyFn = (...args: any[]) => any;
type UserProps<T extends MachineSchema> =
  | Partial<T["props"]>
  | (() => Partial<T["props"]>);
type StateView<T extends MachineSchema> = Params<T>["state"];
type EventView<T extends MachineSchema> = Params<T>["event"];
type Subscriber<T extends MachineSchema> = (service: Service<T>) => void;

const EMPTY_EVENT = Object.freeze({ type: "" });
const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Removes `undefined` values so `machine.props` defaults can apply.
 * Uses `for..in` to avoid intermediate `Object.keys` array allocation.
 */
function compact<T extends object>(obj: T): T {
  const result: Dict = {};
  for (const key in obj) {
    if (hasOwn.call(obj, key)) {
      const val = (obj as Dict)[key];
      if (val !== undefined) result[key] = val;
    }
  }
  return result as T;
}

export function nextTick(fn: VoidFunction) {
  if (typeof wx !== "undefined" && typeof wx.nextTick === "function") {
    wx.nextTick(fn);
  } else {
    queueMicrotask(fn);
  }
}

/** Runs `fn` without registering signal reads on the active subscriber. */
function untracked<R>(fn: () => R): R {
  const prevSub = setActiveSub(undefined);
  try {
    return fn();
  } finally {
    setActiveSub(prevSub);
  }
}

function normalizeUserProps<T extends MachineSchema>(
  input: UserProps<T>,
): Partial<T["props"]> {
  const evaluated = runIfFn(input) as Partial<T["props"]> | undefined;
  if (!evaluated || typeof evaluated !== "object") return {};
  return normalizeProps(evaluated) as Partial<T["props"]>;
}

/**
 * Checks if `target` already matches all keys in `patch` without allocating
 * an `Object.keys` array.
 */
function shallowContains(target: Dict, patch: Dict): boolean {
  for (const key in patch) {
    if (hasOwn.call(patch, key) && !Object.is(target[key], patch[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Resolves the owner (parent component or current page) of a component.
 * `selectOwnerComponent()` returns `null` when the component lives directly in
 * a page, in which case the current page is the owner.
 */
function resolveOwner(component: any): any {
  const owner =
    typeof component.selectOwnerComponent === "function"
      ? component.selectOwnerComponent()
      : undefined;
  if (owner) return owner;

  if (typeof getCurrentPages === "function") {
    const pages = getCurrentPages();
    return pages && pages.length > 0 ? pages[pages.length - 1] : undefined;
  }
  return undefined;
}

interface OwnerPatchState {
  depth: number;
  restored: Array<[string, AnyFn | undefined, AnyFn, boolean]>;
  collectors: Array<(p: Promise<any>) => void>;
}

const ownerStates = new WeakMap<object, OwnerPatchState>();
const interceptors = new WeakSet<AnyFn>();

function restoreOwner(owner: any, state: OwnerPatchState): void {
  for (let i = 0; i < state.restored.length; i++) {
    const entry = state.restored[i];
    if (!entry) continue;
    const [name, original, wrapper, wasOwn] = entry;
    if (owner[name] === wrapper) {
      if (wasOwn) {
        owner[name] = original;
      } else {
        delete owner[name];
      }
    }
  }
  ownerStates.delete(owner);
}

/**
 * Temporarily wraps the own, writable, data-property methods of `owner` so
 * that a promise returned by the handler that `triggerEvent` invokes
 * synchronously can be captured. Accessors, non-writable members and methods
 * that are already wrapped (re-entrant calls) are never touched. Restoration
 * only reverts members that still hold our wrapper once the outermost call completes.
 */
function interceptOwnerPromises(
  owner: any,
  onPromise: (promise: Promise<any>) => void,
): VoidFunction {
  let state = ownerStates.get(owner);
  if (state) {
    state.depth++;
    state.collectors.push(onPromise);
    return () => {
      if (!state) return;
      state.depth--;
      state.collectors.pop();
      if (state.depth === 0) {
        restoreOwner(owner, state);
      }
    };
  }

  const restored: Array<[string, AnyFn | undefined, AnyFn, boolean]> = [];
  const seen = new Set<string>();
  state = {
    depth: 1,
    restored,
    collectors: [onPromise],
  };
  ownerStates.set(owner, state);

  let current = owner;
  while (current && current !== Object.prototype) {
    const names = Object.getOwnPropertyNames(current);
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      if (
        !name ||
        seen.has(name) ||
        name.startsWith("__") ||
        name === "setData" ||
        name === "constructor"
      ) {
        if (name) seen.add(name);
        continue;
      }
      seen.add(name);

      const descriptor = Object.getOwnPropertyDescriptor(current, name);
      if (!descriptor || typeof descriptor.value !== "function") continue;
      if (current === owner && !descriptor.writable) continue;

      const original = descriptor.value;
      if (interceptors.has(original)) continue;

      const currentState = state;
      const wrapper = function (this: unknown, ...args: unknown[]) {
        const ret = original.apply(this, args);
        if (isPromise(ret)) {
          const collector =
            currentState.collectors[currentState.collectors.length - 1];
          collector?.(ret);
        }
        return ret;
      };
      interceptors.add(wrapper);

      const wasOwn = Object.prototype.hasOwnProperty.call(owner, name);
      const ownOriginal = wasOwn ? owner[name] : undefined;

      try {
        owner[name] = wrapper;
        restored.push([name, ownOriginal, wrapper, wasOwn]);
      } catch {
        // Ignore read-only properties
      }
    }
    current = Object.getPrototypeOf(current);
  }

  return () => {
    if (!state) return;
    state.depth--;
    state.collectors.pop();
    if (state.depth === 0) {
      restoreOwner(owner, state);
    }
  };
}

/**
 * Builds a callback that forwards to `component.triggerEvent(eventName)` and
 * returns the handler's promise (if any) so async-aware machines can await it.
 */
function createEventBridge(component: any, eventName: string) {
  return (detail?: any): Promise<any> | undefined => {
    let asyncPromise: Promise<any> | undefined;
    const capture = (promise: Promise<any>) => {
      asyncPromise = promise;
    };

    if (detail && typeof detail === "object") {
      const origSetPromise = detail.setPromise;
      detail.setPromise = (promise: Promise<any>) => {
        capture(promise);
        origSetPromise?.(promise);
      };
    }

    const owner = resolveOwner(component);
    const restore =
      owner && typeof owner === "object"
        ? interceptOwnerPromises(owner, capture)
        : undefined;

    try {
      const ret = component?.triggerEvent?.(eventName, detail);
      if (isPromise(ret)) return ret;
    } finally {
      restore?.();
    }

    return asyncPromise;
  };
}

/**
 * Finite state machine runtime for MiniApp environments, backed by
 * `alien-signals` for reactive state, context and computed values.
 */
export class MiniappMachine<T extends MachineSchema> {
  scope: Scope;
  context: BindableContext<T>;
  prop: PropFn<T>;
  state: Bindable<T["state"]>;
  refs: BindableRefs<T>;
  computed: ComputedFn<T>;

  private readonly machine: Machine<T>;
  private status: MachineStatus = MachineStatus.NotStarted;

  private event: T["event"] = EMPTY_EVENT as T["event"];
  private previousEvent: T["event"] = EMPTY_EVENT as T["event"];
  private readonly queue: T["event"][] = [];
  private queueCursor = 0;
  private flushScheduled = false;
  private transition: Transition<T> | null = null;

  private rawProps: Partial<T["props"]>;
  private readonly userPropsSignal: {
    (): Partial<T["props"]>;
    (value: Partial<T["props"]>): void;
  };
  /** Memoized `machine.props(...)` result; recomputes only when user props change. */
  private readonly resolvedProps: () => Dict;
  /** Per-key computed signals to prevent cross-prop reactive invalidations. */
  private readonly propCache = new Map<PropertyKey, () => unknown>();
  private readonly eventBridges = new Map<string, AnyFn>();

  private contextRefs: Array<{ get: () => unknown }> = [];
  private readonly computedCache = new Map<PropertyKey, () => unknown>();
  /** Active effect cleanups keyed by state path (or INIT_STATE for root). */
  private readonly effects = new Map<string, VoidFunction>();
  /** Machine-lifetime disposers (e.g. `track` calls made outside state effects). */
  private readonly cleanups = new Set<VoidFunction>();
  /** Collector for `track` disposers created while a state effect is running. */
  private trackSink: VoidFunction[] | null = null;
  private disposeScope: VoidFunction | null = null;
  private readonly subscriptions = new Set<Subscriber<T>>();

  private readonly stateView: StateView<T>;
  /** Stable proxy view over `this.event` — eliminates per-event object allocations. */
  private readonly eventView: EventView<T>;
  private paramsCache: Params<T> | null = null;
  private serviceCache: Service<T> | null = null;
  private readonly computedParams: {
    state: StateView<T>;
    context: BindableContext<T>;
    event: EventView<T>;
    prop: PropFn<T>;
    refs: BindableRefs<T>;
    scope: Scope;
    computed: ComputedFn<T>;
  };

  constructor(machine: Machine<T>, userProps: UserProps<T> = {}) {
    this.machine = machine;

    this.rawProps = normalizeUserProps<T>(userProps);
    this.userPropsSignal = signal(this.rawProps) as typeof this.userPropsSignal;

    const { id, ids, component } = this.rawProps as Dict;
    this.scope = createScope({ id, ids, component });

    this.resolvedProps = alienComputed(() => {
      const raw = this.userPropsSignal() as Dict;
      return (machine.props?.({ props: compact(raw), scope: this.scope }) ??
        raw) as Dict;
    });
    this.prop = this.createPropFn();

    this.eventView = this.createEventView();
    this.context = this.createContext();
    this.computed = this.createComputedFn();

    this.refs = createRefs<T>(
      machine.refs?.({ prop: this.prop, context: this.context }),
    );

    const stateParams: BindableParams<T["state"]> = {
      defaultValue: resolveStateValue(
        machine,
        machine.initialState({ prop: this.prop }),
      ),
      onChange: (next, prev) => this.onStateChange(next, prev),
    };
    this.state = bindable<T["state"]>(() => stateParams);
    this.stateView = this.createStateView();

    this.computedParams = {
      state: this.stateView,
      context: this.context,
      event: this.eventView,
      prop: this.prop,
      refs: this.refs,
      scope: this.scope,
      computed: this.computed,
    };
  }

  get service(): Service<T> {
    return (this.serviceCache ??= {
      state: this.stateView,
      send: this.send,
      context: this.context,
      prop: this.prop,
      scope: this.scope,
      refs: this.refs,
      computed: this.computed,
      event: this.eventView,
      getStatus: this.getStatus,
      toJSON: () => undefined,
    } as Service<T>);
  }

  getParams = (): Params<T> =>
    (this.paramsCache ??= {
      state: this.stateView,
      context: this.context,
      event: this.eventView,
      prop: this.prop,
      send: this.send,
      action: this.action,
      guard: this.guard,
      track: this.track,
      refs: this.refs,
      computed: this.computed,
      flush: nextTick,
      scope: this.scope,
      choose: this.choose,
    } as Params<T>);

  /**
   * Enqueues an event. Events are processed asynchronously, in FIFO order, in
   * a single microtask; events sent while processing are appended to the same
   * drain (run-to-completion semantics).
   */
  send = (event: T["event"]) => {
    if (this.status !== MachineStatus.Started || !event) return;
    this.queue.push(event);
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    queueMicrotask(this.drain);
  };

  subscribe = (fn: Subscriber<T>) => {
    this.subscriptions.add(fn);
    return () => {
      this.subscriptions.delete(fn);
    };
  };

  updateProps(newProps: UserProps<T>) {
    const patch = normalizeUserProps<T>(newProps);
    if (shallowContains(this.rawProps as Dict, patch as Dict)) return;

    this.rawProps = { ...this.rawProps, ...patch };
    this.batch(() => {
      this.userPropsSignal(this.rawProps);
      if (this.status !== MachineStatus.Started) {
        this.notify();
      }
    });
  }

  /**
   * Starts the machine and enters the initial state. Idempotent.
   *
   * State and every context signal share a single notify effect, so a
   * transition touching several signals produces one notification per batch.
   */
  start() {
    if (this.status === MachineStatus.Started) return;
    this.status = MachineStatus.Started;
    this.debug("starting...");

    let initialRun = true;
    const refs = this.contextRefs;
    const refsLen = refs.length;

    this.disposeScope = effectScope(() => {
      const watch = this.machine.watch;
      if (watch) {
        effect(() => watch(this.getParams()));
      }

      effect(() => {
        this.userPropsSignal();
        this.state.ref.get();
        for (let i = 0; i < refsLen; i++) refs[i]?.get();
        if (!initialRun) this.notify();
      });
    });
    initialRun = false;
    this.notify();

    this.batch(() =>
      this.state.invoke(
        this.state.initial ?? this.state.get(),
        INIT_STATE as T["state"],
      ),
    );
  }

  /**
   * Stops the machine: drops pending events, disposes effects, runs root
   * `exit` actions and clears subscriptions. Exit actions only run if the
   * machine was started; repeated calls are no-ops.
   */
  stop() {
    if (this.status === MachineStatus.Started) {
      this.queue.length = 0;
      this.queueCursor = 0;

      for (const cleanup of this.effects.values()) cleanup();
      this.effects.clear();
      this.transition = null;
      this.action(this.machine.exit);

      this.disposeScope?.();
      this.disposeScope = null;

      for (const dispose of this.cleanups) dispose();
      this.cleanups.clear();
      this.computedCache.clear();
      this.propCache.clear();
      this.paramsCache = null;
      this.serviceCache = null;
    }

    this.subscriptions.clear();
    this.status = MachineStatus.Stopped;
    this.debug("stopped");
  }

  /**
   * Processes queued events inside a single outer batch using an index cursor
   * (avoiding O(N) array `shift()` overhead and intermediate notifications).
   * If a handler throws, remaining events are sliced and rescheduled.
   */
  private drain = () => {
    startBatch();
    try {
      while (
        this.status === MachineStatus.Started &&
        this.queueCursor < this.queue.length
      ) {
        const event = this.queue[this.queueCursor++];
        this.processEvent(event);
      }
      this.queue.length = 0;
      this.queueCursor = 0;
    } finally {
      endBatch();
      this.flushScheduled = false;
      if (this.status !== MachineStatus.Started) {
        this.queue.length = 0;
        this.queueCursor = 0;
      } else if (this.queueCursor < this.queue.length) {
        this.queue.splice(0, this.queueCursor);
        this.queueCursor = 0;
        this.flushScheduled = true;
        queueMicrotask(this.drain);
      }
    }
  };

  private processEvent(event: T["event"]) {
    this.setEvent(event);
    this.debug("send", event);

    const current = this.state.get();
    const { transitions, source } = findTransition(
      this.machine,
      current,
      (event as { type: string }).type,
    );
    const transition = this.choose(transitions);
    if (!transition) return;

    const target = resolveStateValue(
      this.machine,
      transition.target ?? current,
      source,
    );
    this.debug("transition", transition);

    this.transition = transition;
    try {
      if (target !== current) {
        this.state.set(target);
      } else if (transition.reenter) {
        this.state.invoke(current, current);
      } else {
        this.action(transition.actions);
      }
    } finally {
      this.transition = null;
    }
  }

  /**
   * Applies exit/transition/entry semantics (SCXML order):
   * exit effects → exit actions → transition actions → entry effects →
   * (root entry/effects on init) → entry actions.
   *
   * Executed inside `untracked` so signal reads inside actions or effects
   * never leak into any enclosing reactive subscriber.
   */
  private onStateChange(next: T["state"], prev: T["state"] | undefined): void {
    untracked(() => {
      const transition = this.transition;
      this.transition = null;

      const { exiting, entering } = getExitEnterStates(
        this.machine,
        prev,
        next,
        transition?.reenter,
      );

      for (let i = 0; i < exiting.length; i++) {
        const item = exiting[i];
        if (item) this.disposeEffects(item.path);
      }
      for (let i = 0; i < exiting.length; i++) {
        const item = exiting[i];
        if (item) this.action(item.state?.exit);
      }

      this.action(transition?.actions);

      for (let i = 0; i < entering.length; i++) {
        const item = entering[i];
        if (item) this.addEffects(item.path, this.effect(item.state?.effects));
      }

      if (prev === INIT_STATE) {
        this.action(this.machine.entry);
        this.addEffects(INIT_STATE, this.effect(this.machine.effects));
      }

      for (let i = 0; i < entering.length; i++) {
        const item = entering[i];
        if (item) this.action(item.state?.entry);
      }
    });
  }

  private setEvent(event: T["event"]) {
    this.previousEvent = this.event;
    this.event = event;
    this.paramsCache = null;
    this.serviceCache = null;
  }

  private action = (keys: ActionsOrFn<T> | undefined) => {
    if (!keys) return;
    const params = this.getParams();
    const list = (isFunction(keys) ? untracked(() => keys(params)) : keys) as
      | T["action"][]
      | undefined;
    if (!list || list.length === 0) return;

    const impls = this.machine.implementations?.actions as
      | Record<string, AnyFn>
      | undefined;

    untracked(() => {
      for (let i = 0; i < list.length; i++) {
        const key = list[i];
        if (key === undefined) continue;
        const fn = impls?.[key as string];
        if (fn) fn(params);
        else
          warn(
            `[code-ui] No implementation found for action "${JSON.stringify(key)}"`,
          );
      }
    });
  };

  private guard = (key: T["guard"] | GuardFn<T>) => {
    const params = this.getParams();
    if (isFunction(key)) return untracked(() => key(params));

    const fn = (
      this.machine.implementations?.guards as Record<string, AnyFn> | undefined
    )?.[key as string];
    if (!fn) {
      warn(
        `[code-ui] No implementation found for guard "${JSON.stringify(key)}"`,
      );
      return undefined;
    }
    return untracked(() => fn(params)) as boolean;
  };

  /**
   * Runs the given effects and returns a combined cleanup, or `undefined` when
   * nothing needs cleaning up. `track` calls made synchronously inside an
   * effect are scoped to it and disposed with the owning state.
   */
  private effect = (
    keys: EffectsOrFn<T> | undefined,
  ): VoidFunction | undefined => {
    if (!keys) return undefined;
    const params = this.getParams();
    const list = (isFunction(keys) ? untracked(() => keys(params)) : keys) as
      | T["effect"][]
      | undefined;
    if (!list || list.length === 0) return undefined;

    const impls = this.machine.implementations?.effects as
      | Record<string, AnyFn>
      | undefined;

    const cleanups: VoidFunction[] = [];
    const prevSink = this.trackSink;
    this.trackSink = cleanups;
    try {
      for (let i = 0; i < list.length; i++) {
        const key = list[i];
        if (key === undefined) continue;
        const fn = impls?.[key as string];
        if (!fn) {
          warn(
            `[code-ui] No implementation found for effect "${JSON.stringify(key)}"`,
          );
          continue;
        }
        const cleanup = untracked(() => fn(params));
        if (typeof cleanup === "function") cleanups.push(cleanup);
      }
    } finally {
      this.trackSink = prevSink;
    }

    if (cleanups.length === 0) return undefined;
    return () => {
      for (let i = 0; i < cleanups.length; i++) cleanups[i]?.();
    };
  };

  private choose: ChooseFn<T> = (transitions) => {
    if (!transitions) return undefined;
    if (Array.isArray(transitions)) {
      for (let i = 0; i < transitions.length; i++) {
        const t = transitions[i];
        if (t && this.isEnabled(t)) return t as Transition<T>;
      }
      return undefined;
    }
    return this.isEnabled(transitions)
      ? (transitions as Transition<T>)
      : undefined;
  };

  private isEnabled(transition: { guard?: unknown }): boolean {
    const guard = transition.guard;
    if (!guard) return true;
    if (isString(guard)) return !!this.guard(guard as T["guard"]);
    if (isFunction(guard)) {
      return !!untracked(() => (guard as GuardFn<T>)(this.getParams()));
    }
    return false;
  }

  /**
   * Re-runs `fn` whenever any of `deps` change (and once immediately).
   * Only `deps` are tracked; signals read inside `fn` are not.
   */
  private track = (deps: Array<() => unknown>, fn: VoidFunction) => {
    const depsLen = deps.length;
    const dispose = untracked(() =>
      effect(() => {
        for (let i = 0; i < depsLen; i++) deps[i]?.();
        untracked(fn);
      }),
    );

    if (this.trackSink) this.trackSink.push(dispose);
    else this.cleanups.add(dispose);
  };

  private addEffects(path: string, cleanup: VoidFunction | undefined) {
    if (!cleanup) return;
    const existing = this.effects.get(path);
    this.effects.set(path, existing ? callAll(existing, cleanup) : cleanup);
  }

  private disposeEffects(path: string) {
    const cleanup = this.effects.get(path);
    if (!cleanup) return;
    this.effects.delete(path);
    cleanup();
  }

  /**
   * Per-key `alienComputed` wrapper ensures that updating an unrelated prop
   * does not trigger downstream `computed` or `watch` effects that only
   * read a specific prop key.
   */
  private createPropFn(): PropFn<T> {
    return ((key: PropertyKey) => {
      let getter = this.propCache.get(key);
      if (!getter) {
        getter = alienComputed(() => this.resolvedProps()[key as string]);
        this.propCache.set(key, getter);
      }
      const value = getter();
      if (value !== undefined) return value;
      return this.getEventBridge(key);
    }) as PropFn<T>;
  }

  /** Lazily creates (and caches) an `onXxx` handler that fires `triggerEvent`. */
  private getEventBridge(key: PropertyKey): AnyFn | undefined {
    if (typeof key !== "string" || !key.startsWith("on")) return undefined;

    const component = this.scope.component;
    if (!component || typeof component.triggerEvent !== "function") {
      return undefined;
    }

    let bridge = this.eventBridges.get(key);
    if (!bridge) {
      const eventName = key.charAt(2).toLowerCase() + key.slice(3);
      bridge = createEventBridge(component, eventName);
      this.eventBridges.set(key, bridge);
    }
    return bridge;
  }

  private createContext(): BindableContext<T> {
    const bindables = this.machine.context?.({
      prop: this.prop,
      bindable,
      scope: this.scope,
      flush: nextTick,
      getContext: () => this.context,
      getComputed: () => this.computed,
      getRefs: () => this.refs,
      getEvent: this.getEvent,
    }) as Record<PropertyKey, Bindable<any>> | undefined;

    if (!bindables) {
      return {
        get: () => undefined,
        set: () => {},
        initial: () => undefined,
        hash: () => undefined,
      } as unknown as BindableContext<T>;
    }

    this.contextRefs = Object.values(bindables).map((item) => item.ref);
    const at = (key: PropertyKey) => bindables[key] as Bindable<any>;

    return {
      get: (key) => at(key).get(),
      set: (key, value) => at(key).set(value),
      initial: (key) => at(key).initial,
      hash: (key) => {
        const item = at(key);
        return item.hash(item.get());
      },
    } as BindableContext<T>;
  }

  private createComputedFn(): ComputedFn<T> {
    return ((key: PropertyKey) => {
      const defs = this.machine.computed as
        | Record<PropertyKey, AnyFn>
        | undefined;
      if (!defs) {
        throw new Error(`[code-ui] No computed object found on machine`);
      }

      let getter = this.computedCache.get(key);
      if (!getter) {
        const fn = defs[key];
        getter = alienComputed(() => fn?.(this.computedParams));
        this.computedCache.set(key, getter);
      }
      return getter();
    }) as ComputedFn<T>;
  }

  private createStateView(): StateView<T> {
    const state = this.state;
    const machine = this.machine;
    return {
      ...state,
      matches: (...values: T["state"][]) => {
        const current = state.get() as string;
        for (let i = 0; i < values.length; i++) {
          if (matchesState(current, values[i] as string)) return true;
        }
        return false;
      },
      hasTag: (tag: T["tag"]) => hasTag(machine, state.get(), tag),
    };
  }

  /**
   * Creates a single Proxy instance that forwards property accesses to
   * `this.event` dynamically, avoiding object allocations on every event.
   */
  private createEventView(): EventView<T> {
    const base = {
      current: this.getCurrentEvent,
      previous: this.getPreviousEvent,
    };

    return new Proxy(base, {
      get: (target, prop, receiver) => {
        if (prop in target) return Reflect.get(target, prop, receiver);
        return (this.event as Dict)[prop as string];
      },
      has: (target, prop) => {
        return prop in target || prop in (this.event as Dict);
      },
      ownKeys: () => {
        return Reflect.ownKeys(this.event as object).concat([
          "current",
          "previous",
        ]);
      },
      getOwnPropertyDescriptor: (target, prop) => {
        if (prop in target) {
          return Object.getOwnPropertyDescriptor(target, prop);
        }
        const desc = Object.getOwnPropertyDescriptor(
          this.event as object,
          prop,
        );
        return desc ? { ...desc, configurable: true } : undefined;
      },
    }) as unknown as EventView<T>;
  }

  private getEvent = (): EventView<T> => this.eventView;
  private getCurrentEvent = () => this.event;
  private getPreviousEvent = () => this.previousEvent;
  private getStatus = () => this.status;

  /**
   * Fast-paths the common 1-subscriber case to avoid `Array.from` allocation,
   * while remaining safe for multi-subscriber mutation during notification.
   */
  private notify = () => {
    const size = this.subscriptions.size;
    if (size === 0) return;
    const service = this.service;

    untracked(() => {
      if (size === 1) {
        const fn = this.subscriptions.values().next().value;
        if (fn) fn(service);
        return;
      }
      const subscribers = Array.from(this.subscriptions);
      for (let i = 0; i < subscribers.length; i++) {
        const fn = subscribers[i];
        if (fn && this.subscriptions.has(fn)) fn(service);
      }
    });
  };

  private batch(fn: VoidFunction) {
    startBatch();
    try {
      fn();
    } finally {
      endBatch();
    }
  }

  private debug(...args: unknown[]) {
    if (this.machine.debug) console.log("[code-ui]", ...args);
  }
}
