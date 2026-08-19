import {
  computed as alienComputed,
  effect,
  effectScope,
  signal,
} from "alien-signals";
import { isFunction, isString, callAll, runIfFn, warn } from "@code-ui/utils";
import {
  bindable,
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
import type {
  ActionsOrFn,
  BindableContext,
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

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function compact<T extends object>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj as object)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== undefined) result[key] = val;
  }
  return result as T;
}

function nextTick(fn: VoidFunction) {
  if (typeof wx !== "undefined" && typeof wx.nextTick === "function") {
    wx.nextTick(fn);
  } else {
    queueMicrotask(fn);
  }
}

export class MiniappMachine<T extends MachineSchema> {
  scope: Scope;
  context: BindableContext<T>;
  prop: PropFn<T>;
  state: ReturnType<typeof bindable<T["state"]>>;
  refs: BindableRefs<T>;
  computed: ComputedFn<T>;

  private event: T["event"] = { type: "" } as T["event"];
  private previousEvent: T["event"] = { type: "" } as T["event"];

  private effects = new Map<string, VoidFunction>();
  private transition: Transition<T> | null = null;

  private cleanups: VoidFunction[] = [];
  private subscriptions: Array<(service: Service<T>) => void> = [];

  private userPropsSignal = signal<
    Partial<T["props"]> | (() => Partial<T["props"]>)
  >({});

  private _scope: (() => void) | null = null;

  private _computedCache = new Map<string, ReturnType<typeof alienComputed>>();

  private _contextRefs: Array<{ get: () => any }> = [];

  private getEvent = () => ({
    ...this.event,
    current: () => this.event,
    previous: () => this.previousEvent,
  });

  private getState = () => ({
    ...this.state,
    matches: (...values: T["state"][]) =>
      values.some((value) =>
        matchesState(this.state.get() as string, value as string),
      ),
    hasTag: (tag: T["tag"]) => hasTag(this.machine, this.state.get(), tag),
  });

  private debug = (...args: any[]) => {
    if (this.machine.debug) console.log("[code-ui]", ...args);
  };

  private notify = () => {
    this.subscriptions.forEach((fn) => fn(this.service));
  };

  constructor(
    private machine: Machine<T>,
    userProps: Partial<T["props"]> | (() => Partial<T["props"]>) = {},
  ) {
    this.userPropsSignal(userProps);

    const { id, ids, component } = runIfFn(userProps) as any;
    this.scope = createScope({ id, ids, component });

    const prop: PropFn<T> = (key) => {
      const __props = runIfFn(this.userPropsSignal());
      const props: any =
        machine.props?.({ props: compact(__props), scope: this.scope }) ??
        __props;

      let value = props[key];

      // Auto-forward onXxx events to WeChat triggerEvent
      if (
        value === undefined &&
        typeof key === "string" &&
        key.startsWith("on")
      ) {
        const _component = this.scope?.component;
        if (_component && typeof _component.triggerEvent === "function") {
          // e.g. "onOpenChange" -> "openChange", "onClose" -> "close"
          const eventName = key.charAt(2).toLowerCase() + key.slice(3);
          value = (detail: any) => _component.triggerEvent(eventName, detail);
        }
      }

      return value as any;
    };
    this.prop = prop;

    const context: any = machine.context?.({
      prop,
      bindable,
      scope: this.scope,
      flush: (fn: VoidFunction) => nextTick(fn),
      getContext: () => ctx as any,
      getComputed: () => computed as any,
      getRefs: () => refs as any,
      getEvent: this.getEvent.bind(this),
    });

    if (context) {
      this._contextRefs = Object.values(context).map((item: any) => item.ref);
    }

    const ctx: BindableContext<T> = {
      get: (key) => context?.[key].get(),
      set: (key, value) => context?.[key].set(value),
      initial: (key) => context?.[key].initial,
      hash: (key) => {
        const current = context?.[key].get();
        return context?.[key].hash(current);
      },
    };
    this.context = ctx;

    const computed = (<K extends keyof T["computed"]>(
      key: K,
    ): T["computed"][K] => {
      if (!machine.computed) {
        throw new Error(`[code-ui] No computed object found on machine`);
      }

      if (!this._computedCache.has(key as string)) {
        this._computedCache.set(
          key as string,
          alienComputed(() =>
            machine.computed?.[key]({
              context: ctx as any,
              event: this.getEvent(),
              prop,
              refs: this.refs,
              scope: this.scope,
              computed: computed as any,
            }),
          ),
        );
      }

      return (this._computedCache.get(key as string)?.() ??
        undefined) as T["computed"][K];
    }) as ComputedFn<T>;
    this.computed = computed;

    const refs: BindableRefs<T> = createRefs<T>(
      machine.refs?.({ prop, context: ctx }),
    );
    this.refs = refs;

    const state = bindable<T["state"]>(() => ({
      defaultValue: resolveStateValue(machine, machine.initialState({ prop })),
      onChange: (nextState: T["state"], prevState: T["state"] | undefined) => {
        const { exiting, entering } = getExitEnterStates(
          this.machine,
          prevState,
          nextState,
          this.transition?.reenter,
        );

        exiting.forEach((item) => {
          const exitEffects = this.effects.get(item.path);
          exitEffects?.();
          this.effects.delete(item.path);
        });

        exiting.forEach((item) => this.action(item.state?.exit));

        this.action(this.transition?.actions);

        entering.forEach((item) => {
          const cleanup = this.effect(item.state?.effects);
          if (cleanup) {
            const existing = this.effects.get(item.path);
            this.effects.set(
              item.path,
              existing ? callAll(existing, cleanup) : cleanup,
            );
          }
        });

        if (prevState === INIT_STATE) {
          this.action(machine.entry);
          const cleanup = this.effect(machine.effects);
          if (cleanup) {
            const existing = this.effects.get(INIT_STATE);
            this.effects.set(
              INIT_STATE,
              existing ? callAll(existing, cleanup) : cleanup,
            );
          }
        }

        entering.forEach((item) => this.action(item.state?.entry));
      },
    }));
    this.state = state;
  }

  updateProps(newProps: Partial<T["props"]> | (() => Partial<T["props"]>)) {
    const prevSource = this.userPropsSignal();
    this.userPropsSignal(() => ({
      ...runIfFn(prevSource),
      ...runIfFn(newProps),
    }));
    this.notify();
  }

  send = (event: T["event"]) => {
    if (this.status !== MachineStatus.Started) return;

    queueMicrotask(() => {
      if (!event) return;

      this.previousEvent = this.event;
      this.event = event;

      this.debug("send", event);

      const currentState = this.state.get();
      const eventType = event.type as string;
      const { transitions, source } = findTransition(
        this.machine,
        currentState,
        eventType,
      );
      const transition = this.choose(transitions);
      if (!transition) return;

      this.transition = transition;
      const target = resolveStateValue(
        this.machine,
        transition.target ?? currentState,
        source,
      );

      this.debug("transition", transition);

      const changed = target !== currentState;
      if (changed) {
        this.state.set(target);
      } else if (transition.reenter) {
        this.state.invoke(currentState, currentState);
      } else {
        this.action(transition.actions);
      }
    });
  };

  private action = (keys: ActionsOrFn<T> | undefined) => {
    const strs = isFunction(keys) ? keys(this.getParams()) : keys;
    if (!strs) return;
    const list = strs as T["action"][];
    const fns = list.map((s) => {
      const fn = (this.machine.implementations?.actions as any)?.[s as string];
      if (!fn)
        warn(
          `[code-ui] No implementation found for action "${JSON.stringify(s)}"`,
        );
      return fn as ((params: any) => void) | undefined;
    });
    for (const fn of fns) fn?.(this.getParams());
  };

  private guard = (str: T["guard"] | GuardFn<T>) => {
    if (isFunction(str)) return str(this.getParams());
    const fn = (this.machine.implementations?.guards as any)?.[
      str as string
    ] as ((params: any) => boolean) | undefined;
    if (!fn)
      warn(
        `[code-ui] No implementation found for guard "${JSON.stringify(str)}"`,
      );
    return fn?.(this.getParams());
  };

  private effect = (keys: EffectsOrFn<T> | undefined) => {
    const strs = isFunction(keys) ? keys(this.getParams()) : keys;
    if (!strs) return;
    const list = strs as T["effect"][];
    const fns = list.map((s) => {
      const fn = (this.machine.implementations?.effects as any)?.[
        s as string
      ] as ((params: any) => void | VoidFunction) | undefined;
      if (!fn)
        warn(
          `[code-ui] No implementation found for effect "${JSON.stringify(s)}"`,
        );
      return fn;
    });
    const cleanups: VoidFunction[] = [];
    for (const fn of fns) {
      const cleanup = fn?.(this.getParams());
      if (cleanup) cleanups.push(cleanup);
    }
    return () => cleanups.forEach((fn) => fn?.());
  };

  private choose: ChooseFn<T> = (transitions) => {
    return (
      toArray(transitions).find((t: any) => {
        let result = !t.guard;
        if (isString(t.guard)) result = !!this.guard(t.guard);
        else if (isFunction(t.guard)) result = t.guard(this.getParams());
        return result;
      }) ?? undefined
    );
  };

  start() {
    this.status = MachineStatus.Started;
    this.debug("starting...");

    this._scope = effectScope(() => {
      effect(() => {
        this.state.ref.get();
        this.notify();
      });

      effect(() => {
        this._contextRefs.forEach((ref) => ref.get());
        this.notify();
      });

      if (this.machine.watch) {
        effect(() => {
          this.machine.watch?.(this.getParams());
        });
      }
    });

    // Enter initial state
    this.state.invoke(this.state.initial ?? this.state.get(), INIT_STATE);
  }

  stop() {
    // Run exit effects
    this.effects.forEach((fn) => fn?.());
    this.effects.clear();
    this.transition = null;
    this.action(this.machine.exit);

    // ⚡ Dispose ALL effects at once
    this._scope?.();
    this._scope = null;
    this._computedCache.clear();

    this.cleanups.forEach((unsub) => unsub());
    this.cleanups = [];
    this.subscriptions = [];

    this.status = MachineStatus.Stopped;
    this.debug("stopped");
  }

  subscribe = (fn: (service: Service<T>) => void) => {
    this.subscriptions.push(fn);
    return () => {
      const index = this.subscriptions.indexOf(fn);
      if (index > -1) this.subscriptions.splice(index, 1);
    };
  };

  private status = MachineStatus.NotStarted;

  get service(): Service<T> {
    return {
      state: this.getState(),
      send: this.send,
      context: this.context,
      prop: this.prop,
      scope: this.scope,
      refs: this.refs,
      computed: this.computed,
      event: this.getEvent(),
      getStatus: () => this.status,
    } as Service<T>;
  }

  getParams = (): Params<T> =>
    ({
      state: this.getState(),
      context: this.context,
      event: this.getEvent(),
      prop: this.prop,
      send: this.send,
      action: this.action,
      guard: this.guard,
      track: (deps: any[], fn: any) => {
        effect(() => {
          deps.forEach((dep) => dep());
          fn();
        });
      },
      refs: this.refs,
      computed: this.computed,
      flush: (fn: VoidFunction) => nextTick(fn),
      scope: this.scope,
      choose: this.choose,
    }) as Params<T>;
}
