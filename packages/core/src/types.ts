// ─────────────────────────────────────────────────────────────────────────────
// types.ts — core type contracts for code-ui FSM
// ─────────────────────────────────────────────────────────────────────────────

import type { DOMQueryHelpers, MiniAppComponent } from "@code-ui/utils";

type Dict = Record<string, any>;

// ─── Scope ───────────────────────────────────────────────────────────────────
// Miniapp scope: exposes id/ids for element identification, the component
// instance for scoped queries, and the full DOMQueryHelpers from dom.ts.

export interface Scope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  /** The component/page instance used to scope SelectorQuery */
  component?: MiniAppComponent | undefined;
  /** Full DOM query helpers from @code-ui/utils — rect, allRects, fields, etc. */
  dom: DOMQueryHelpers;
}

// ─── Prop ────────────────────────────────────────────────────────────────────

export interface PropFn<T extends Dict> {
  <K extends keyof T["props"]>(key: K): T["props"][K];
}

// ─── Computed ─────────────────────────────────────────────────────────────────

export interface ComputedFn<T extends Dict> {
  <K extends keyof T["computed"]>(key: K): T["computed"][K];
}

// ─── Bindable ─────────────────────────────────────────────────────────────────

export interface BindableParams<T> {
  defaultValue?: T | undefined;
  value?: T | undefined;
  hash?: ((a: T) => string) | undefined;
  isEqual?: ((a: T, b: T | undefined) => boolean) | undefined;
  onChange?: ((value: T, prev: T | undefined) => void) | undefined;
  debug?: string | undefined;
}

export type ValueOrFn<T> = T | ((prev: T) => T);

export interface Bindable<T> {
  initial: T | undefined;
  ref: any; // signal in alien-signals implementation
  get: () => T;
  set(value: ValueOrFn<T>): void;
  invoke(nextValue: T, prevValue: T): void;
  hash(value: T): string;
}

export interface BindableRefs<T extends Dict> {
  set<K extends keyof T["refs"]>(key: K, value: T["refs"][K]): void;
  get<K extends keyof T["refs"]>(key: K): T["refs"][K];
}

export interface BindableContext<T extends Dict> {
  set<K extends keyof T["context"]>(
    key: K,
    value: ValueOrFn<T["context"][K]>,
  ): void;
  get<K extends keyof T["context"]>(key: K): T["context"][K];
  initial<K extends keyof T["context"]>(key: K): T["context"][K];
  hash<K extends keyof T["context"]>(key: K): string;
}

interface BindableRef<T> {
  get: () => T;
  set: (next: T) => void;
}

export interface BindableFn {
  <K>(params: () => BindableParams<K>): Bindable<K>;
  cleanup: (fn: VoidFunction) => void;
  ref: <T>(defaultValue: T) => BindableRef<T>;
}

// ─── Event ────────────────────────────────────────────────────────────────────

type EventType<T = any> = T & {
  [key: string]: any;
};

export type EventObject = EventType<{ type: string }>;

// ─── Params (passed to all implementations: actions, guards, effects, watch) ──

type AnyFunction = () => string | number | boolean | null | undefined;
type TrackFn = (deps: AnyFunction[], fn: VoidFunction) => void;

export interface Params<T extends Dict> {
  prop: PropFn<T>;
  action: (action: T["action"][]) => void;
  context: BindableContext<T>;
  refs: BindableRefs<T>;
  track: TrackFn;
  flush: (fn: VoidFunction) => void;
  event: EventType<T["event"]> & {
    current: () => EventType<T["event"]>;
    previous: () => EventType<T["event"]>;
  };
  send: (event: EventType<T["event"]>) => void;
  computed: ComputedFn<T>;
  scope: Scope;
  state: Bindable<T["state"]> & {
    matches: (...values: T["state"][]) => boolean;
    hasTag: (tag: T["tag"]) => boolean;
  };
  choose: ChooseFn<T>;
  guard: (key: T["guard"] | GuardFn<T>) => boolean | undefined;
}

export type GuardFn<T extends Dict> = (params: Params<T>) => boolean;

// ─── Transitions ──────────────────────────────────────────────────────────────

export type TopLevelState<S extends string> = S extends `${infer Top}.${string}`
  ? Top
  : S;
export type ChildStateKey<
  S extends string,
  Parent extends string,
> = S extends `${Parent}.${infer Rest}`
  ? Rest extends `${infer Child}.${string}`
    ? Child
    : Rest
  : never;

type ParentPath<S extends string> = S extends `${infer Parent}.${string}`
  ? Parent
  : never;
type AncestorPaths<S extends string> =
  | S
  | (ParentPath<S> extends never ? never : AncestorPaths<ParentPath<S>>);
type StateIdTarget = `#${string}`;

type SiblingStateTarget<S extends string, Source extends string> =
  | TopLevelState<S>
  | ChildStateKey<S, Exclude<AncestorPaths<Source>, Source>>;

type ChildStateTarget<
  S extends string,
  Source extends string,
> = `.${ChildStateKey<S, Source>}`;

export interface Transition<
  T extends Dict,
  Source extends string | undefined = string | undefined,
> {
  target?:
    | T["state"]
    | StateIdTarget
    | (Source extends string ? SiblingStateTarget<T["state"], Source> : never)
    | (Source extends string ? ChildStateTarget<T["state"], Source> : never)
    | undefined;
  actions?: T["action"][] | undefined;
  guard?: T["guard"] | GuardFn<T> | undefined;
  reenter?: boolean | undefined;
}

export type TransitionSet<T extends Dict> =
  | Transition<T>
  | Transition<T>[]
  | undefined;
export type TransitionMap<T extends Dict> = Record<string, TransitionSet<T>>;
export type TransitionMatch<T extends Dict> = {
  transitions: TransitionSet<T>;
  source: string | undefined;
};

type MaybeArray<T> = T | T[];

export type ChooseFn<T extends Dict> = (
  transitions:
    | MaybeArray<Omit<Transition<T, string>, "target">>
    | null
    | undefined,
) => Transition<T> | undefined;

// ─── Machine State Definition ─────────────────────────────────────────────────

export type ActionsOrFn<T extends Dict> =
  | T["action"][]
  | ((params: Params<T>) => T["action"][] | undefined);
export type EffectsOrFn<T extends Dict> =
  | T["effect"][]
  | ((params: Params<T>) => T["effect"][] | undefined);

export interface MachineState<T extends Dict, Parent extends string = string> {
  id?: string | undefined;
  tags?: T["tag"][] | undefined;
  entry?: ActionsOrFn<T> | undefined;
  exit?: ActionsOrFn<T> | undefined;
  effects?: EffectsOrFn<T> | undefined;
  initial?: ChildStateKey<T["state"], Parent> | undefined;
  states?:
    | {
        [K in ChildStateKey<T["state"], Parent>]?: MachineState<
          T,
          `${Parent}.${K}`
        >;
      }
    | undefined;
  on?:
    | {
        [E in T["event"]["type"]]?:
          | Transition<T, Parent>
          | Array<Transition<T, Parent>>;
      }
    | undefined;
}

export interface DeepPartialMachineState<
  T extends Dict,
  Parent extends string = string,
> {
  id?: string | undefined;
  tags?: T["tag"][] | undefined;
  entry?: ActionsOrFn<T> | undefined;
  exit?: ActionsOrFn<T> | undefined;
  effects?: EffectsOrFn<T> | undefined;
  initial?: ChildStateKey<T["state"], Parent> | undefined;
  states?:
    | {
        [K in ChildStateKey<T["state"], Parent>]?: DeepPartialMachineState<
          T,
          `${Parent}.${K}`
        >;
      }
    | undefined;
  on?:
    | {
        [E in T["event"]["type"]]?:
          | Transition<T, Parent>
          | Array<Transition<T, Parent>>;
      }
    | undefined;
}

// ─── Machine Definition ───────────────────────────────────────────────────────

interface ComputedParams<T extends Dict> {
  context: BindableContext<T>;
  event: EventType<T["event"]>;
  prop: PropFn<T>;
  refs: BindableRefs<T>;
  scope: Scope;
  computed: ComputedFn<T>;
}

interface ContextParams<T extends Dict> {
  prop: PropFn<T>;
  bindable: BindableFn;
  scope: Scope;
  getContext: () => BindableContext<T>;
  getComputed: () => ComputedFn<T>;
  getRefs: () => BindableRefs<T>;
  getEvent: () => EventType<T["event"]>;
  flush: (fn: VoidFunction) => void;
}

interface PropsParams<T extends Dict> {
  props: Partial<T["props"]>;
  scope: Scope;
}

interface RefsParams<T extends Dict> {
  prop: PropFn<T>;
  context: BindableContext<T>;
}

export interface Machine<T extends Dict> {
  debug?: boolean | undefined;
  extend?: Machine<any> | Array<Machine<any>> | undefined;
  props?: ((params: PropsParams<T>) => T["props"]) | undefined;
  context?:
    | ((params: ContextParams<T>) => {
        [K in keyof T["context"]]: Bindable<T["context"][K]>;
      })
    | undefined;
  computed?:
    | {
        [K in keyof T["computed"]]: (
          params: ComputedParams<T>,
        ) => T["computed"][K];
      }
    | undefined;
  initialState: (params: { prop: PropFn<T> }) => T["state"];
  entry?: ActionsOrFn<T> | undefined;
  exit?: ActionsOrFn<T> | undefined;
  effects?: EffectsOrFn<T> | undefined;
  refs?: ((params: RefsParams<T>) => T["refs"]) | undefined;
  watch?: ((params: Params<T>) => void) | undefined;
  on?:
    | {
        [E in T["event"]["type"]]?:
          | Transition<T, undefined>
          | Array<Transition<T, undefined>>;
      }
    | undefined;
  states: {
    [K in TopLevelState<T["state"]>]: MachineState<T, K>;
  };
  implementations?:
    | {
        guards?:
          | {
              [K in T["guard"]]: (params: Params<T>) => boolean;
            }
          | undefined;
        actions?:
          | {
              [K in T["action"]]: (params: Params<T>) => void;
            }
          | undefined;
        effects?:
          | {
              [K in T["effect"]]: (params: Params<T>) => void | VoidFunction;
            }
          | undefined;
      }
    | undefined;
}

// ─── Machine Extension Definition ─────────────────────────────────────────────

export interface MachineExtension<
  T extends Dict = any,
  Base extends Dict = any,
> {
  extend: Machine<Base> | Array<Machine<Base>>;
  debug?: boolean | undefined;
  props?: ((params: PropsParams<T>) => Partial<T["props"]>) | undefined;
  context?:
    | ((params: ContextParams<T>) => Partial<{
        [K in keyof T["context"]]: Bindable<T["context"][K]>;
      }>)
    | undefined;
  computed?:
    | Partial<{
        [K in keyof T["computed"]]: (
          params: ComputedParams<T>,
        ) => T["computed"][K];
      }>
    | undefined;
  initialState?: ((params: { prop: PropFn<T> }) => T["state"]) | undefined;
  entry?: ActionsOrFn<T> | undefined;
  exit?: ActionsOrFn<T> | undefined;
  effects?: EffectsOrFn<T> | undefined;
  refs?: ((params: RefsParams<T>) => Partial<T["refs"]>) | undefined;
  watch?: ((params: Params<T>) => void) | undefined;
  on?:
    | {
        [E in T["event"]["type"]]?:
          | Transition<T, undefined>
          | Array<Transition<T, undefined>>;
      }
    | undefined;
  states?:
    | {
        [K in TopLevelState<T["state"]>]?: DeepPartialMachineState<T, K>;
      }
    | undefined;
  implementations?:
    | {
        guards?:
          | {
              [K in T["guard"]]?: (params: Params<T>) => boolean;
            }
          | undefined;
        actions?:
          | {
              [K in T["action"]]?: (params: Params<T>) => void;
            }
          | undefined;
        effects?:
          | {
              [K in T["effect"]]?: (params: Params<T>) => void | VoidFunction;
            }
          | undefined;
      }
    | undefined;
}

export type MachineOverride<T extends Dict = any> = Omit<
  MachineExtension<T, any>,
  "extend"
>;

export type MachineConfig<T extends Dict = any, Base extends Dict = any> =
  | Machine<T>
  | MachineExtension<T, Base>;

// ─── MachineSchema ────────────────────────────────────────────────────────────

interface MachineBaseProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  [key: string]: any;
}

export interface MachineSchema {
  props?: MachineBaseProps | undefined;
  context?: Record<string, any> | undefined;
  refs?: Record<string, any> | undefined;
  computed?: Record<string, any> | undefined;
  state?: string | undefined;
  tag?: string | undefined;
  guard?: string | undefined;
  action?: string | undefined;
  effect?: string | undefined;
  event?: ({ type: string } & Dict) | undefined;
}

export type ExtendSchema<
  Base extends MachineSchema,
  Overrides extends {
    props?: Record<string, any>;
    context?: Record<string, any>;
    refs?: Record<string, any>;
    computed?: Record<string, any>;
    state?: string;
    tag?: string;
    guard?: string;
    action?: string;
    effect?: string;
    event?: { type: string } & Dict;
  } = {},
> = {
  props: (Base["props"] extends Record<string, any> ? Base["props"] : {}) &
    (Overrides["props"] extends Record<string, any> ? Overrides["props"] : {});
  context: (Base["context"] extends Record<string, any>
    ? Base["context"]
    : {}) &
    (Overrides["context"] extends Record<string, any>
      ? Overrides["context"]
      : {});
  refs: (Base["refs"] extends Record<string, any> ? Base["refs"] : {}) &
    (Overrides["refs"] extends Record<string, any> ? Overrides["refs"] : {});
  computed: (Base["computed"] extends Record<string, any>
    ? Base["computed"]
    : {}) &
    (Overrides["computed"] extends Record<string, any>
      ? Overrides["computed"]
      : {});
  state:
    | (Base["state"] extends string ? Base["state"] : never)
    | (Overrides["state"] extends string ? Overrides["state"] : never);
  tag:
    | (Base["tag"] extends string ? Base["tag"] : never)
    | (Overrides["tag"] extends string ? Overrides["tag"] : never);
  guard:
    | (Base["guard"] extends string ? Base["guard"] : never)
    | (Overrides["guard"] extends string ? Overrides["guard"] : never);
  action:
    | (Base["action"] extends string ? Base["action"] : never)
    | (Overrides["action"] extends string ? Overrides["action"] : never);
  effect:
    | (Base["effect"] extends string ? Base["effect"] : never)
    | (Overrides["effect"] extends string ? Overrides["effect"] : never);
  event:
    | (Base["event"] extends { type: string } ? Base["event"] : never)
    | (Overrides["event"] extends { type: string } ? Overrides["event"] : never);
};

// ─── Service (runtime public API) ─────────────────────────────────────────────

type State<T extends MachineSchema> = Bindable<T["state"]> & {
  hasTag: (tag: T["tag"]) => boolean;
  matches: (...values: T["state"][]) => boolean;
};

export type Service<T extends MachineSchema> = {
  getStatus: () => MachineStatus;
  state: State<T>;
  context: BindableContext<T>;
  send: (event: EventType<T["event"]>) => void;
  prop: PropFn<T>;
  scope: Scope;
  computed: ComputedFn<T>;
  refs: BindableRefs<T>;
  event: EventType<T["event"]> & {
    current: () => EventType<T["event"]>;
    previous: () => EventType<T["event"]>;
  };
};

// ─── Machine Status ────────────────────────────────────────────────────────────

export enum MachineStatus {
  NotStarted = "Not Started",
  Started = "Started",
  Stopped = "Stopped",
}

export const INIT_STATE = "__init__";
