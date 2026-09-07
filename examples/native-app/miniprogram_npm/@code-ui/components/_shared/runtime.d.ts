//#region ../utils/dist/index.d.ts
//#region src/dom.d.ts
type MiniAppRect = WechatMiniprogram.BoundingClientRectCallbackResult;
type MiniAppScrollOffset = WechatMiniprogram.ScrollOffsetCallbackResult;
type MiniAppNodeFields = WechatMiniprogram.IAnyObject;
type MiniAppComponent = WechatMiniprogram.Component.TrivialInstance;
interface DOMQueryHelpers {
  query: () => WechatMiniprogram.SelectorQuery;
  rect: (selector: string) => Promise<MiniAppRect | null>;
  allRects: (selector: string) => Promise<MiniAppRect[]>;
  scrollOffset: (selector: string) => Promise<MiniAppScrollOffset | null>;
  viewportScrollOffset: () => Promise<MiniAppScrollOffset | null>;
  fields: (selector: string, fields: WechatMiniprogram.Fields) => Promise<MiniAppNodeFields | null>;
  computedStyle: (selector: string, properties: string[]) => Promise<Record<string, string> | null>;
  animationDuration: (selector: string) => Promise<number>;
}
export declare function isPromise<T>(value: void | Promise<T> | undefined): boolean;
//#endregion
//#region ../core/dist/index.d.ts
//#region src/types.d.ts
type Dict$1 = Record<string, any>;
interface Scope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  /** The component/page instance used to scope SelectorQuery */
  component?: MiniAppComponent | undefined;
  /** Full DOM query helpers from @code-ui/utils — rect, allRects, fields, etc. */
  dom: DOMQueryHelpers;
}
interface PropFn<T extends Dict$1> {
  <K extends keyof T["props"]>(key: K): T["props"][K];
}
interface ComputedFn<T extends Dict$1> {
  <K extends keyof T["computed"]>(key: K): T["computed"][K];
}
interface BindableParams<T> {
  defaultValue?: T | undefined;
  value?: T | undefined;
  hash?: ((a: T) => string) | undefined;
  isEqual?: ((a: T, b: T | undefined) => boolean) | undefined;
  onChange?: ((value: T, prev: T | undefined) => void) | undefined;
  debug?: string | undefined;
}
type ValueOrFn<T> = T | ((prev: T) => T);
interface Bindable<T> {
  initial: T | undefined;
  ref: any;
  get: () => T;
  set(value: ValueOrFn<T>): void;
  invoke(nextValue: T, prevValue: T): void;
  hash(value: T): string;
}
interface BindableRefs<T extends Dict$1> {
  set<K extends keyof T["refs"]>(key: K, value: T["refs"][K]): void;
  get<K extends keyof T["refs"]>(key: K): T["refs"][K];
}
interface BindableContext<T extends Dict$1> {
  set<K extends keyof T["context"]>(key: K, value: ValueOrFn<T["context"][K]>): void;
  get<K extends keyof T["context"]>(key: K): T["context"][K];
  initial<K extends keyof T["context"]>(key: K): T["context"][K];
  hash<K extends keyof T["context"]>(key: K): string;
}
interface BindableRef<T> {
  get: () => T;
  set: (next: T) => void;
}
interface BindableFn {
  <K>(params: () => BindableParams<K>): Bindable<K>;
  cleanup: (fn: VoidFunction) => void;
  ref: <T>(defaultValue: T) => BindableRef<T>;
}
type EventType<T = any> = T & {
  [key: string]: any;
};
type AnyFunction = () => string | number | boolean | null | undefined;
type TrackFn = (deps: AnyFunction[], fn: VoidFunction) => void;
interface Params<T extends Dict$1> {
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
type GuardFn<T extends Dict$1> = (params: Params<T>) => boolean;
type TopLevelState<S extends string> = S extends `${infer Top}.${string}` ? Top : S;
type ChildStateKey<S extends string, Parent extends string> = S extends `${Parent}.${infer Rest}` ? Rest extends `${infer Child}.${string}` ? Child : Rest : never;
type ParentPath<S extends string> = S extends `${infer Parent}.${string}` ? Parent : never;
type AncestorPaths<S extends string> = S | (ParentPath<S> extends never ? never : AncestorPaths<ParentPath<S>>);
type StateIdTarget = `#${string}`;
type SiblingStateTarget<S extends string, Source extends string> = TopLevelState<S> | ChildStateKey<S, Exclude<AncestorPaths<Source>, Source>>;
type ChildStateTarget<S extends string, Source extends string> = `.${ChildStateKey<S, Source>}`;
interface Transition<T extends Dict$1, Source extends string | undefined = string | undefined> {
  target?: T["state"] | StateIdTarget | (Source extends string ? SiblingStateTarget<T["state"], Source> : never) | (Source extends string ? ChildStateTarget<T["state"], Source> : never) | undefined;
  actions?: T["action"][] | undefined;
  guard?: T["guard"] | GuardFn<T> | undefined;
  reenter?: boolean | undefined;
}
type MaybeArray<T> = T | T[];
type ChooseFn<T extends Dict$1> = (transitions: MaybeArray<Omit<Transition<T, string>, "target">> | null | undefined) => Transition<T> | undefined;
type ActionsOrFn<T extends Dict$1> = T["action"][] | ((params: Params<T>) => T["action"][] | undefined);
type EffectsOrFn<T extends Dict$1> = T["effect"][] | ((params: Params<T>) => T["effect"][] | undefined);
interface MachineState<T extends Dict$1, Parent extends string = string> {
  id?: string | undefined;
  tags?: T["tag"][] | undefined;
  entry?: ActionsOrFn<T> | undefined;
  exit?: ActionsOrFn<T> | undefined;
  effects?: EffectsOrFn<T> | undefined;
  initial?: ChildStateKey<T["state"], Parent> | undefined;
  states?: { [K in ChildStateKey<T["state"], Parent>]?: MachineState<T, `${Parent}.${K}`>; } | undefined;
  on?: { [E in T["event"]["type"]]?: Transition<T, Parent> | Array<Transition<T, Parent>>; } | undefined;
}
interface DeepPartialMachineState<T extends Dict$1, Parent extends string = string> {
  id?: string | undefined;
  tags?: T["tag"][] | undefined;
  entry?: ActionsOrFn<T> | undefined;
  exit?: ActionsOrFn<T> | undefined;
  effects?: EffectsOrFn<T> | undefined;
  initial?: ChildStateKey<T["state"], Parent> | undefined;
  states?: { [K in ChildStateKey<T["state"], Parent>]?: DeepPartialMachineState<T, `${Parent}.${K}`>; } | undefined;
  on?: { [E in T["event"]["type"]]?: Transition<T, Parent> | Array<Transition<T, Parent>>; } | undefined;
}
interface ComputedParams<T extends Dict$1> {
  context: BindableContext<T>;
  event: EventType<T["event"]>;
  prop: PropFn<T>;
  refs: BindableRefs<T>;
  scope: Scope;
  computed: ComputedFn<T>;
}
interface ContextParams<T extends Dict$1> {
  prop: PropFn<T>;
  bindable: BindableFn;
  scope: Scope;
  getContext: () => BindableContext<T>;
  getComputed: () => ComputedFn<T>;
  getRefs: () => BindableRefs<T>;
  getEvent: () => EventType<T["event"]>;
  flush: (fn: VoidFunction) => void;
}
interface PropsParams<T extends Dict$1> {
  props: Partial<T["props"]>;
  scope: Scope;
}
interface RefsParams<T extends Dict$1> {
  prop: PropFn<T>;
  context: BindableContext<T>;
}
interface Machine<T extends Dict$1> {
  debug?: boolean | undefined;
  extend?: Machine<any> | Array<Machine<any>> | undefined;
  props?: ((params: PropsParams<T>) => T["props"]) | undefined;
  context?: ((params: ContextParams<T>) => { [K in keyof T["context"]]: Bindable<T["context"][K]>; }) | undefined;
  computed?: { [K in keyof T["computed"]]: (params: ComputedParams<T>) => T["computed"][K]; } | undefined;
  initialState: (params: {
    prop: PropFn<T>;
  }) => T["state"];
  entry?: ActionsOrFn<T> | undefined;
  exit?: ActionsOrFn<T> | undefined;
  effects?: EffectsOrFn<T> | undefined;
  refs?: ((params: RefsParams<T>) => T["refs"]) | undefined;
  watch?: ((params: Params<T>) => void) | undefined;
  on?: { [E in T["event"]["type"]]?: Transition<T, undefined> | Array<Transition<T, undefined>>; } | undefined;
  states: { [K in TopLevelState<T["state"]>]: MachineState<T, K>; };
  implementations?: {
    guards?: { [K in T["guard"]]: (params: Params<T>) => boolean; } | undefined;
    actions?: { [K in T["action"]]: (params: Params<T>) => void; } | undefined;
    effects?: { [K in T["effect"]]: (params: Params<T>) => void | VoidFunction; } | undefined;
  } | undefined;
}
interface MachineExtension<T extends Dict$1 = any, Base extends Dict$1 = any> {
  extend: Machine<Base> | Array<Machine<Base>>;
  debug?: boolean | undefined;
  props?: ((params: PropsParams<T>) => Partial<T["props"]>) | undefined;
  context?: ((params: ContextParams<T>) => Partial<{ [K in keyof T["context"]]: Bindable<T["context"][K]>; }>) | undefined;
  computed?: Partial<{ [K in keyof T["computed"]]: (params: ComputedParams<T>) => T["computed"][K]; }> | undefined;
  initialState?: ((params: {
    prop: PropFn<T>;
  }) => T["state"]) | undefined;
  entry?: ActionsOrFn<T> | undefined;
  exit?: ActionsOrFn<T> | undefined;
  effects?: EffectsOrFn<T> | undefined;
  refs?: ((params: RefsParams<T>) => Partial<T["refs"]>) | undefined;
  watch?: ((params: Params<T>) => void) | undefined;
  on?: { [E in T["event"]["type"]]?: Transition<T, undefined> | Array<Transition<T, undefined>>; } | undefined;
  states?: { [K in TopLevelState<T["state"]>]?: DeepPartialMachineState<T, K>; } | undefined;
  implementations?: {
    guards?: { [K in T["guard"]]?: (params: Params<T>) => boolean; } | undefined;
    actions?: { [K in T["action"]]?: (params: Params<T>) => void; } | undefined;
    effects?: { [K in T["effect"]]?: (params: Params<T>) => void | VoidFunction; } | undefined;
  } | undefined;
}
type MachineConfig<T extends Dict$1 = any, Base extends Dict$1 = any> = Machine<T> | MachineExtension<T, Base>;
interface MachineBaseProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  [key: string]: any;
}
interface MachineSchema {
  props?: MachineBaseProps | undefined;
  context?: Record<string, any> | undefined;
  refs?: Record<string, any> | undefined;
  computed?: Record<string, any> | undefined;
  state?: string | undefined;
  tag?: string | undefined;
  guard?: string | undefined;
  action?: string | undefined;
  effect?: string | undefined;
  event?: ({
    type: string;
  } & Dict$1) | undefined;
}
type State<T extends MachineSchema> = Bindable<T["state"]> & {
  hasTag: (tag: T["tag"]) => boolean;
  matches: (...values: T["state"][]) => boolean;
};
type Service<T extends MachineSchema> = {
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
declare enum MachineStatus {
  NotStarted = "Not Started",
  Started = "Started",
  Stopped = "Stopped"
}
export declare function createMachine<T extends MachineSchema = any, Base extends MachineSchema = any>(config: MachineConfig<T, Base>): Machine<T>;
//#endregion
//#region src/config.d.ts
type SlotRecord<TSlots extends string = string> = Partial<Record<TSlots, string>>;
interface ComponentVariantsConfig<TSlots extends string = string> {
  variant?: Record<string, SlotRecord<TSlots>>;
  size?: Record<string, SlotRecord<TSlots>>;
  [customVariantKey: string]: Record<string, SlotRecord<TSlots>> | undefined;
}
interface ComponentConfig<TSlots extends string = string> {
  /** Default component properties */
  defaultProps?: Record<string, any>;
  /** Global default slot classes for this component */
  ui?: SlotRecord<TSlots>;
  /** Alias for ui slot classes */
  slots?: SlotRecord<TSlots>;
  /** Variant-specific slot classes */
  variants?: ComponentVariantsConfig<TSlots>;
}
/**
 * Retrieve the configuration for a specific component.
 */
export declare function getComponentConfig<TSlots extends string = string>(componentName: string): ComponentConfig<TSlots>;
interface MergeUIOptions<TSlots extends string> {
  /** Anatomy instance or definition to automatically infer slot keys from */
  anatomy?: {
    keys: () => TSlots[];
  } | undefined;
  /** Base default slot classes defined by the component */
  defaultSlots?: Partial<Record<TSlots, string>> | undefined;
  /** Global component config from setConfig */
  globalConfig?: ComponentConfig<TSlots> | undefined;
  /** Active visual variant (e.g. 'primary', 'secondary', 'outline') */
  variant?: string | undefined;
  /** Active size variant (e.g. 'sm', 'md', 'lg') */
  size?: string | undefined;
  /** Additional custom variant names & values */
  extraVariants?: Record<string, string | undefined> | undefined;
  /** Per-instance `ui` prop overrides */
  instanceUI?: Partial<Record<TSlots, string>> | undefined;
}
export declare function mergeUI<TSlots extends string>(options: MergeUIOptions<TSlots>): Record<TSlots, string>;
//#endregion
//#region ../frameworks/miniapp/dist/index.d.ts
//#region src/bindable.d.ts
declare const bindable: BindableFn;
//#endregion
//#region src/machine.d.ts
declare class MiniappMachine<T extends MachineSchema> {
  private machine;
  scope: Scope;
  context: BindableContext<T>;
  prop: PropFn<T>;
  state: ReturnType<typeof bindable<T["state"]>>;
  refs: BindableRefs<T>;
  computed: ComputedFn<T>;
  private event;
  private previousEvent;
  private effects;
  private transition;
  private cleanups;
  private subscriptions;
  private userPropsSignal;
  private _scope;
  private _computedCache;
  private _contextRefs;
  private getEvent;
  private getState;
  private debug;
  private notify;
  constructor(machine: Machine<T>, userProps?: Partial<T["props"]> | (() => Partial<T["props"]>));
  updateProps(newProps: Partial<T["props"]> | (() => Partial<T["props"]>)): void;
  send: (event: T["event"]) => void;
  private action;
  private guard;
  private effect;
  private choose;
  start(): void;
  stop(): void;
  subscribe: (fn: (service: Service<T>) => void) => () => void;
  private status;
  get service(): Service<T>;
  getParams: () => Params<T>;
}
type ConnectFn<T extends MachineSchema, Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject> = (service: Service<T>) => Data;
//#endregion
//#region src/behavior.d.ts
interface CreateMachineBehaviorOptions<T extends MachineSchema, Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject> {
  /**
   * The state machine definition created with `createMachine(...)`
   */
  machine: Machine<T>;
  /**
   * Optional connect snapshot function that wires to `this.setData` via alien-signals `effect()`
   */
  connect?: ConnectFn<T, Data>;
  /**
   * Optional namespace key under `this.data` (e.g. key: "dialog" -> this.data.dialog)
   */
  key?: string;
  /**
   * Component property names to automatically observe and forward to `machine.updateProps`.
   * If omitted, all properties from the machine's default props are automatically observed.
   */
  syncProps?: Array<keyof T["props"]>;
  /**
   * Automatically include WeChat native form-field behavior (`'wx://form-field'`)
   * Required for custom form controls like Switch, Checkbox, Slider to work with `<form bindsubmit>`
   */
  formField?: boolean;
  /**
   * Export the machine's public API for parent `this.selectComponent(...)` calls via `'wx://component-export'`
   */
  exportApi?: boolean;
}
/**
 * Creates a WeChat MiniProgram component properties schema from default props
 *
 * @example
 * ```ts
 * properties: createProperties(defaultDrawerProps, {
 *   customProp: { type: String, value: "" }
 * })
 * ```
 */
export declare function createProperties<T extends Record<string, any>>(defaultProps: T, extraProps?: WechatMiniprogram.Component.PropertyOption): WechatMiniprogram.Component.PropertyOption;
/**
 * Creates a reactive WeChat MiniProgram Behavior wired to a state machine
 *
 * @example
 * ```ts
 * const dialogBehavior = createMachineBehavior({
 *   machine: dialogMachine,
 *   connect: connectDialog,
 *   key: "dialog",
 *   exportApi: true,
 * });
 *
 * Component({
 *   behaviors: [dialogBehavior],
 *   properties: createProperties(defaultDialogProps),
 *   methods: {
 *     handleOpen() {
 *       this.send({ type: "OPEN" });
 *     },
 *   },
 * });
 * ```
 */
export declare function createMachineBehavior<T extends MachineSchema, Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject>(options: CreateMachineBehaviorOptions<T, Data>): WechatMiniprogram.Behavior.Identifier<WechatMiniprogram.Component.DataOption, WechatMiniprogram.Component.PropertyOption, {
  send(this: any, event: T["event"]): void;
  getMachine(this: any): MiniappMachine<T> | null;
  /** Get the current machine service */
  getService(this: any): any;
}, any[]>;
//#endregion
//#region src/behaviors/button.d.ts
/**
 * Reusable WeChat MiniProgram behavior providing full native `<button>`
 * platform properties (openType, formType, hoverClass, customer service, privacy)
 * and event forwarding.
 */
export declare const wxButtonBehavior: WechatMiniprogram.Behavior.Identifier<WechatMiniprogram.Component.DataOption, {
  openType: {
    type: StringConstructor;
    value: string;
  };
  formType: {
    type: StringConstructor;
    value: string;
  };
  hoverClass: {
    type: StringConstructor;
    value: string;
  };
  hoverStartTime: {
    type: NumberConstructor;
    value: number;
  };
  hoverStayTime: {
    type: NumberConstructor;
    value: number;
  };
  hoverStopPropagation: {
    type: BooleanConstructor;
    value: boolean;
  };
  lang: {
    type: StringConstructor;
    value: string;
  };
  sessionFrom: {
    type: StringConstructor;
    value: string;
  };
  sendMessageTitle: {
    type: StringConstructor;
    value: string;
  };
  sendMessagePath: {
    type: StringConstructor;
    value: string;
  };
  sendMessageImg: {
    type: StringConstructor;
    value: string;
  };
  showMessageCard: {
    type: BooleanConstructor;
    value: boolean;
  };
  appParameter: {
    type: StringConstructor;
    value: string;
  };
}, {
  handleGetPhoneNumber(e: any): void;
  handleChooseAvatar(e: any): void;
  handleContact(e: any): void;
  handleError(e: any): void;
  handleOpenSetting(e: any): void;
  handleLaunchApp(e: any): void;
  handleAgreePrivacyAuthorization(e: any): void;
}, WechatMiniprogram.Component.BehaviorOption>;
//#endregion
//#region src/behaviors/computed-behavior.d.ts
type ComputedGetter<T = any, TThis = any> = (this: TThis) => T;
type ComputedSetter<T = any, TThis = any> = (this: TThis, val: T) => void;
interface WritableComputedDef<T = any, TThis = any> {
  get: ComputedGetter<T, TThis>;
  set?: ComputedSetter<T, TThis>;
}
type ComputedDef<T = any, TThis = any> = ComputedGetter<T, TThis> | WritableComputedDef<T, TThis>;
type ExtractComputedReturns<T> = { [K in keyof T]: T[K] extends ((...args: any[]) => infer R) ? R : T[K] extends {
  get: (...args: any[]) => infer R;
} ? R : any; };
type ComponentInstanceBase<TData extends WechatMiniprogram.Component.DataOption, TProperty extends WechatMiniprogram.Component.PropertyOption> = WechatMiniprogram.Component.InstanceMethods<TData> & {
  data: TData & WechatMiniprogram.Component.PropertyOptionToData<TProperty>;
  properties: TData & WechatMiniprogram.Component.PropertyOptionToData<TProperty>;
  triggerEvent<DetailType = any>(name: string, detail?: DetailType, options?: WechatMiniprogram.Component.TriggerEventOption): void;
  is: string;
  id: string;
  dataset: Record<string, any>;
};
type ComponentInstanceFull<TData extends WechatMiniprogram.Component.DataOption, TProperty extends WechatMiniprogram.Component.PropertyOption, TMethod extends WechatMiniprogram.Component.MethodOption, TComputed, TBehavior extends WechatMiniprogram.Component.BehaviorOption = any[], TCustomInstanceProperty extends WechatMiniprogram.IAnyObject = {}, TIsPage extends boolean = false> = WechatMiniprogram.Component.Instance<TData & ExtractComputedReturns<TComputed>, TProperty, TMethod, TBehavior, TCustomInstanceProperty, TIsPage> & ExtractComputedReturns<TComputed>;
type ComponentComputedDefs<TData extends WechatMiniprogram.Component.DataOption, TProperty extends WechatMiniprogram.Component.PropertyOption> = {
  [key: string]: ComputedDef<any, ComponentInstanceBase<TData, TProperty>>;
};
type ComponentOptionsWithComputed<TData extends WechatMiniprogram.Component.DataOption = WechatMiniprogram.Component.DataOption, TProperty extends WechatMiniprogram.Component.PropertyOption = WechatMiniprogram.Component.PropertyOption, TMethod extends WechatMiniprogram.Component.MethodOption = WechatMiniprogram.Component.MethodOption, TComputed extends ComponentComputedDefs<TData, TProperty> = ComponentComputedDefs<TData, TProperty>, TBehavior extends WechatMiniprogram.Component.BehaviorOption = any[], TCustomInstanceProperty extends WechatMiniprogram.IAnyObject = {}, TIsPage extends boolean = false> = Partial<WechatMiniprogram.Component.Data<TData>> & Partial<WechatMiniprogram.Component.Property<TProperty>> & Partial<WechatMiniprogram.Component.Method<TMethod, TIsPage>> & Partial<WechatMiniprogram.Component.OtherOption> & Partial<WechatMiniprogram.Component.Lifetimes> & {
  behaviors?: TBehavior;
  computed?: TComputed;
} & ThisType<ComponentInstanceFull<TData, TProperty, TMethod, TComputed, TBehavior, TCustomInstanceProperty, TIsPage>>;
/**
 * @example
 * ```ts
 * Component(createComponentOptions({
 *   behaviors: [computedBehavior],
 *   data: { a: 0 },
 *   computed: {
 *     b() { return this.data.a + 100 },
 *     c: {
 *       get() { return this.data.a * 2 },
 *       set(val) { this.setData({ a: val / 2 }) }
 *     }
 *   },
 * }))
 * ```
 */
export declare function createComponentOptions<TData extends WechatMiniprogram.Component.DataOption, TProperty extends WechatMiniprogram.Component.PropertyOption, TMethod extends WechatMiniprogram.Component.MethodOption, TComputed extends ComponentComputedDefs<TData, TProperty>, TBehavior extends WechatMiniprogram.Component.BehaviorOption = any[], TCustomInstanceProperty extends WechatMiniprogram.IAnyObject = {}, TIsPage extends boolean = false>(options: ComponentOptionsWithComputed<TData, TProperty, TMethod, TComputed, TBehavior, TCustomInstanceProperty, TIsPage>): WechatMiniprogram.Component.Options<TData & ExtractComputedReturns<TComputed>, TProperty, TMethod, TBehavior, TCustomInstanceProperty, TIsPage> & {
  computed?: TComputed;
};
type PageInstanceBase<TData extends WechatMiniprogram.Page.DataOption> = WechatMiniprogram.Page.InstanceMethods<TData> & {
  data: TData;
  is: string;
  route: string;
  options: Record<string, string | undefined>;
};
type PageInstanceFull<TData extends WechatMiniprogram.Page.DataOption, TComputed, TCustom extends WechatMiniprogram.Page.CustomOption> = WechatMiniprogram.Page.Instance<TData & ExtractComputedReturns<TComputed>, TCustom> & ExtractComputedReturns<TComputed>;
type ComputedDefsForPage<TData extends WechatMiniprogram.Page.DataOption> = {
  [key: string]: ComputedDef<any, PageInstanceBase<TData>>;
};
type PageOptionsWithComputed<TData extends WechatMiniprogram.Page.DataOption = WechatMiniprogram.Page.DataOption, TComputed extends ComputedDefsForPage<TData> = ComputedDefsForPage<TData>, TCustom extends WechatMiniprogram.Page.CustomOption = WechatMiniprogram.Page.CustomOption> = (TCustom & Partial<WechatMiniprogram.Page.Data<TData>> & Partial<WechatMiniprogram.Page.ILifetime> & {
  options?: WechatMiniprogram.Component.ComponentOptions;
  behaviors?: any[];
  computed?: TComputed;
}) & ThisType<PageInstanceFull<TData, TComputed, TCustom>>;
/**
 * Typed wrapper for `Page()` that adds support for the `computed` field
 * and `behaviors` (works in both standard WebView and Skyline rendering engines).
 *
 * @example
 * ```ts
 * Page(createPageOptions({
 *   behaviors: [computedBehavior],
 *   data: { count: 1 },
 *   computed: {
 *     doubled() { return this.data.count * 2 },
 *     quadrupled: {
 *       get() { return this.data.count * 4 },
 *       set(val) { this.setData({ count: val / 4 }) }
 *     }
 *   },
 * }))
 * ```
 */
export declare function createPageOptions<TData extends WechatMiniprogram.Page.DataOption, TComputed extends ComputedDefsForPage<TData>, TCustom extends WechatMiniprogram.Page.CustomOption>(options: PageOptionsWithComputed<TData, TComputed, TCustom>): WechatMiniprogram.Page.Options<TData & ExtractComputedReturns<TComputed>, TCustom> & {
  computed?: TComputed;
};
/**
 * @example
 * ```ts
 * Component({
 *   behaviors: [computedBehavior],
 *   data: { a: 0 },
 *   computed: {
 *     b() { return this.data.a + 100 },
 *     c: {
 *       get() { return this.data.a * 2 },
 *       set(val) { this.setData({ a: val / 2 }) }
 *     }
 *   },
 *   methods: {
 *     onTap() { this.setData({ a: this.data.a + 1 }) }
 *   }
 * })
 * ```
 */
export declare const computedBehavior: WechatMiniprogram.Behavior.Identifier<WechatMiniprogram.Component.DataOption, WechatMiniprogram.Component.PropertyOption, WechatMiniprogram.Component.MethodOption, WechatMiniprogram.Component.BehaviorOption>;
//#endregion
//#region ../anatomy/dist/index.d.ts
//#region src/create-anatomy.d.ts
interface AnatomyPart {
  selector: string;
  attrs: Record<"data-scope" | "data-part", string>;
}
type AnatomyInstance<T extends string> = Omit<Anatomy<T>, "parts">;
interface Anatomy<T extends string> {
  parts: <U extends string>(...parts: U[]) => AnatomyInstance<U>;
  extendWith: <V extends string>(...parts: V[]) => AnatomyInstance<T | V>;
  build: () => Record<T, AnatomyPart>;
  rename: (newName: string) => Anatomy<T>;
  keys: () => T[];
  omit: <U extends T>(...values: U[]) => AnatomyInstance<Exclude<T, U>>;
  emptySlots: () => Record<T, string>;
}
export declare const createAnatomy: <T extends string>(name: string, parts?: T[]) => Anatomy<T>;
//#endregion