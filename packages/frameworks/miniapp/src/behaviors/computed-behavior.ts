import { isEqual, runIfFn } from "@code-ui/utils";
import {
  computed as alienComputed,
  effect,
  effectScope,
  endBatch,
  pauseTracking,
  resumeTracking,
  signal,
  startBatch,
} from "alien-signals";


export type ComputedGetter<T = any, TThis = any> = (this: TThis) => T;
export type ComputedSetter<T = any, TThis = any> = (
  this: TThis,
  val: T,
) => void;

export interface WritableComputedDef<T = any, TThis = any> {
  get: ComputedGetter<T, TThis>;
  set?: ComputedSetter<T, TThis>;
}

export type ComputedDef<T = any, TThis = any> =
  | ComputedGetter<T, TThis>
  | WritableComputedDef<T, TThis>;

/**
 * @example
 * ```ts
 * const computed: ComputedDefs = {
 *   // Function syntax
 *   fullName() { return this.data.firstName + ' ' + this.data.lastName },
 *   // Object syntax with get and set
 *   fullNameWritable: {
 *     get() { return this.data.firstName + ' ' + this.data.lastName },
 *     set(val: string) {
 *       const [first, last] = val.split(' ');
 *       this.setData({ firstName: first, lastName: last });
 *     }
 *   }
 * }
 * ```
 */
export type ComputedDefs = Record<string, ComputedDef>;

/**
 * Constraint used to infer the `computed` option of
 * {@link createComponentOptions} / {@link createPageOptions}.
 *
 * NOTE: the signatures intentionally declare **no** explicit `this` parameter.
 * An explicit `this: any` on the contextual signature takes precedence over
 * `ThisType<…>`, which made `this` inside every getter collapse to `any`.
 */
export type ComputedDefsOption = Record<
  string,
  (() => any) | { get(): any; set?(val: any): void }
>;

export type ExtractComputedReturns<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? R
    : T[K] extends { get: (...args: any[]) => infer R }
      ? R
      : T[K];
};

export function parseComputedDef(def?: ComputedDef): {
  get: (...args: any[]) => any;
  set?: (val: any) => void;
} {
  if (typeof def === "function") {
    return { get: def };
  }
  if (def && typeof def === "object") {
    if (typeof (def as any).get === "function") {
      return {
        get: (def as any).get,
        set:
          typeof (def as any).set === "function" ? (def as any).set : undefined,
      };
    }
  }
  return {
    get: () => undefined,
  };
}


type IsAny<T> = 0 extends 1 & T ? true : false;

/** `true` when `T` has a `string` index signature (i.e. its keys are unknown). */
type HasStringIndex<T> = string extends keyof T ? true : false;

/** Removes `string` index signatures, keeping only explicitly declared keys. */
type FilterUnknownKeys<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

/**
 * Drops `any` entries from the `behaviors` tuple. Untyped behaviors (e.g. ones
 * created with a `typeof Behavior !== "undefined" ? … : ({} as any)` fallback)
 * would otherwise poison the whole instance intersection.
 */
type TypedBehaviors<T> = T extends readonly [infer H, ...infer R]
  ? IsAny<H> extends true
    ? TypedBehaviors<R>
    : [H, ...TypedBehaviors<R>]
  : T extends readonly (infer U)[]
    ? IsAny<U> extends true
      ? []
      : U[]
    : [];

type HasUntypedBehavior<T> = T extends readonly [infer H, ...infer R]
  ? IsAny<H> extends true
    ? true
    : HasUntypedBehavior<R>
  : T extends readonly (infer U)[]
    ? IsAny<U>
    : false;

type Or<A extends boolean, B extends boolean> = A extends true ? true : B;

/**
 * Escape hatch used only when part of the component is untyped. In an
 * intersection, an index signature never overrides declared properties, so
 * every known key stays strongly typed while unknown keys fall back to `any`.
 */
type LooseWhen<B extends boolean> = B extends true ? Record<string, any> : {};

type PropertiesToData<P> = {
  [K in keyof FilterUnknownKeys<P>]: P[K] extends WechatMiniprogram.Component.AllProperty
    ? WechatMiniprogram.Component.PropertyToData<P[K]>
    : any;
};

/** `this.data` / `this.properties` of a component using `computed`. */
export type ComponentComputedData<
  TData,
  TProperty,
  TComputed,
  TBehavior extends readonly any[] = [],
> = FilterUnknownKeys<TData> &
  WechatMiniprogram.Component.MixinData<TypedBehaviors<TBehavior>> &
  WechatMiniprogram.Component.MixinProperties<TypedBehaviors<TBehavior>> &
  PropertiesToData<TProperty> &
  ExtractComputedReturns<TComputed> &
  LooseWhen<
    Or<
      HasUntypedBehavior<TBehavior>,
      Or<HasStringIndex<TProperty>, HasStringIndex<TData>>
    >
  >;

export type SafeData<T> = [T] extends [never]
  ? WechatMiniprogram.Component.DataOption
  : T;
export type SafeMethod<T> = [T] extends [never]
  ? WechatMiniprogram.Component.MethodOption
  : T;

export type ComponentInstanceBase<
  TData extends WechatMiniprogram.Component.DataOption,
  TProperty extends WechatMiniprogram.Component.PropertyOption,
> = WechatMiniprogram.Component.InstanceMethods<SafeData<TData>> & {
  data: SafeData<TData> &
    WechatMiniprogram.Component.PropertyOptionToData<TProperty>;
  properties: SafeData<TData> &
    WechatMiniprogram.Component.PropertyOptionToData<TProperty>;
  triggerEvent<DetailType = any>(
    name: string,
    detail?: DetailType,
    options?: WechatMiniprogram.Component.TriggerEventOption,
  ): void;
  is: string;
  id: string;
  dataset: Record<string, any>;
};

/**
 * `this` inside `computed`, `methods`, `lifetimes`, `observers`, … of a
 * component created with {@link createComponentOptions}.
 *
 * Built from scratch instead of wrapping `WechatMiniprogram.Component.Instance`,
 * because that type applies `Omit<TCustomInstanceProperty, …>` (which erases
 * declared keys when an index signature is present) and mixes in behaviors
 * without guarding against `any`.
 */
export type ComponentInstanceFull<
  TData,
  TProperty,
  TMethod,
  TComputed,
  TBehavior extends readonly any[] = [],
  TCustomInstanceProperty = {},
  TIsPage extends boolean = false,
> = WechatMiniprogram.Component.InstanceProperties &
  WechatMiniprogram.Component.InstanceMethods<
    ComponentComputedData<TData, TProperty, TComputed, TBehavior>
  > &
  TMethod &
  WechatMiniprogram.Component.MixinMethods<TypedBehaviors<TBehavior>> &
  (TIsPage extends true ? WechatMiniprogram.Page.ILifetime : {}) &
  TCustomInstanceProperty &
  ExtractComputedReturns<TComputed> & {
    data: ComponentComputedData<TData, TProperty, TComputed, TBehavior>;
    properties: ComponentComputedData<TData, TProperty, TComputed, TBehavior>;
  } & LooseWhen<HasUntypedBehavior<TBehavior>>;

/** @deprecated Use {@link ComputedDefsOption}. */
export type ComponentComputedDefs = ComputedDefsOption;

export type ComponentOptionsWithComputed<
  TData extends WechatMiniprogram.Component.DataOption =
    WechatMiniprogram.Component.DataOption,
  TProperty extends WechatMiniprogram.Component.PropertyOption =
    WechatMiniprogram.Component.PropertyOption,
  TMethod extends WechatMiniprogram.Component.MethodOption =
    WechatMiniprogram.Component.MethodOption,
  TComputed extends ComputedDefsOption = ComputedDefsOption,
  TBehavior extends readonly any[] = any[],
  TCustomInstanceProperty extends WechatMiniprogram.IAnyObject = {},
  TIsPage extends boolean = false,
> = {
  data?: TData;
  properties?: TProperty;
  methods?: TMethod;
  behaviors?: TBehavior;
  computed?: TComputed;
} & Partial<WechatMiniprogram.Component.OtherOption> &
  Partial<WechatMiniprogram.Component.Lifetimes> &
  ThisType<
    ComponentInstanceFull<
      TData,
      TProperty,
      TMethod,
      TComputed,
      TBehavior,
      TCustomInstanceProperty,
      TIsPage
    >
  >;


const _COMPUTED_INITIALIZED = "__cui_computedInit__" as const;
const _COMPUTED_DEFS = "__cui_computedDefs__" as const;
/** Synchronously re-syncs signals from `this.data` and emits computed changes. */
const _COMPUTED_FLUSH = "__cui_computedFlush__" as const;
/** Re-syncs tracked data signals from `this.data` (used by the `**` observer). */
const _COMPUTED_SYNC = "__cui_computedSync__" as const;
/** Tears down signals, effects and restores the original `setData`. */
const _COMPUTED_DISPOSE = "__cui_computedDispose__" as const;

const hasOwn = (obj: object, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

function ensureComputedBehavior(behaviors: readonly any[] | undefined): any[] {
  const list = behaviors ? [...behaviors] : [];
  if (!list.includes(computedBehavior)) {
    list.push(computedBehavior);
  }
  return list;
}

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
export function createComponentOptions<
  TData extends WechatMiniprogram.Component.DataOption = {},
  TProperty extends WechatMiniprogram.Component.PropertyOption = {},
  TMethod extends WechatMiniprogram.Component.MethodOption = {},
  TComputed extends ComputedDefsOption = {},
  const TBehavior extends readonly any[] = [],
  TCustomInstanceProperty extends WechatMiniprogram.IAnyObject = {},
  TIsPage extends boolean = false,
>(
  options: ComponentOptionsWithComputed<
    TData,
    TProperty,
    TMethod,
    TComputed,
    TBehavior,
    TCustomInstanceProperty,
    TIsPage
  >,
): any {
  if (!options.computed) return options;

  return {
    ...options,
    behaviors: ensureComputedBehavior(options.behaviors),
  };
}

export type PageInstanceBase<TData extends WechatMiniprogram.Page.DataOption> =
  WechatMiniprogram.Page.InstanceMethods<TData> & {
    data: TData;
    is: string;
    route: string;
    options: Record<string, string | undefined>;
  };

export type PageInstanceFull<
  TData extends WechatMiniprogram.Page.DataOption,
  TComputed,
  TCustom extends WechatMiniprogram.Page.CustomOption,
> = WechatMiniprogram.Page.Instance<
  FilterUnknownKeys<TData> &
    ExtractComputedReturns<TComputed> &
    LooseWhen<HasStringIndex<TData>>,
  Omit<TCustom, "data" | "computed"> & ExtractComputedReturns<TComputed>
>;

/** @deprecated Use {@link ComputedDefsOption}. */
export type ComputedDefsForPage = ComputedDefsOption;

export type PageOptionsWithComputed<
  TData extends WechatMiniprogram.Page.DataOption =
    WechatMiniprogram.Page.DataOption,
  TComputed extends ComputedDefsOption = ComputedDefsOption,
  TCustom extends WechatMiniprogram.Page.CustomOption =
    WechatMiniprogram.Page.CustomOption,
> = (TCustom & {
  data?: TData;
  options?: WechatMiniprogram.Component.ComponentOptions;
  behaviors?: any[];
  computed?: TComputed;
} & Partial<WechatMiniprogram.Page.ILifetime>) &
  ThisType<PageInstanceFull<TData, TComputed, TCustom>>;

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
export function createPageOptions<
  TData extends WechatMiniprogram.Page.DataOption = {},
  TComputed extends ComputedDefsOption = {},
  TCustom extends WechatMiniprogram.Page.CustomOption = {},
>(options: PageOptionsWithComputed<TData, TComputed, TCustom>): any {
  const computedDefs = options.computed as ComputedDefs | undefined;
  if (!computedDefs) return options;

  const data = {
    ...(options.data as Record<string, any> | undefined),
  };
  Object.assign(data, evaluateInitialComputed(computedDefs, data));

  const originalOnLoad = (options as any).onLoad;
  const originalOnUnload = (options as any).onUnload;

  return {
    ...options,
    data,
    behaviors: ensureComputedBehavior(options.behaviors),
    onLoad(this: any, query: Record<string, string | undefined>) {
      setupComputed(this, computedDefs, { immediate: false });
      this[_COMPUTED_FLUSH]?.();
      return originalOnLoad?.call(this, query);
    },
    onUnload(this: any) {
      try {
        return originalOnUnload?.call(this);
      } finally {
        this[_COMPUTED_DISPOSE]?.();
      }
    },
  };
}


function defaultValueForType(type: unknown): unknown {
  switch (type) {
    case String:
      return "";
    case Number:
      return 0;
    case Boolean:
      return false;
    case Array:
      return [];
    default:
      return null;
  }
}

function propertyDefault(def: unknown): unknown {
  if (def === null) return null;
  if (typeof def === "function") return defaultValueForType(def);
  if (def && typeof def === "object") {
    if ("value" in def) return (def as { value: unknown }).value;
    return defaultValueForType((def as { type?: unknown }).type);
  }
  return undefined;
}

/**
 * Evaluates computed getters at definition time so the first render already
 * contains (default-prop based) computed values and the first runtime flush is
 * usually a no-op.
 *
 * - `this.data` / `this.properties` contain property **default values** (not
 *   the property schema) merged with `data`.
 * - Other computed values are resolved lazily (`this.other`, `this.data.other`).
 * - Getters that depend on runtime-only APIs (e.g. `this.setData`) are skipped.
 */
export function evaluateInitialComputed(
  defs: ComputedDefs,
  data?: Record<string, any>,
  properties?: Record<string, unknown>,
): Record<string, unknown> {
  const keys = Object.keys(defs);
  const base: Record<string, any> = {};
  if (properties) {
    for (const key of Object.keys(properties)) {
      base[key] = propertyDefault(properties[key]);
    }
  }
  if (data) Object.assign(base, data);

  const results: Record<string, unknown> = {};
  const done = new Set<string>();
  const evaluating = new Set<string>();
  const ctx: Record<string, any> = { data: base, properties: base };

  const resolve = (key: string): unknown => {
    if (done.has(key)) return results[key];
    if (evaluating.has(key)) return undefined; // circular dependency
    evaluating.add(key);
    try {
      results[key] = parseComputedDef(defs[key]).get.call(ctx);
    } catch {
      results[key] = undefined;
    } finally {
      evaluating.delete(key);
      done.add(key);
    }
    return results[key];
  };

  for (const key of keys) {
    const descriptor: PropertyDescriptor = {
      configurable: true,
      enumerable: true,
      get: () => resolve(key),
    };
    Object.defineProperty(ctx, key, descriptor);
    Object.defineProperty(base, key, descriptor);
  }

  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const val = resolve(key);
    if (val !== undefined) out[key] = val;
  }
  return out;
}


function cloneValue<T>(val: T): T {
  if (Array.isArray(val)) {
    return [...val] as unknown as T;
  }
  if (val !== null && typeof val === "object") {
    return { ...(val as Record<string, any>) } as unknown as T;
  }
  return val;
}

/**
 * Parses a `setData` path following WeChat semantics:
 * `a.b` → object key, `a[0]` → array index.
 */
function parsePath(path: string): Array<string | number> {
  if (path.indexOf(".") === -1 && path.indexOf("[") === -1) return [path];

  const tokens: Array<string | number> = [];
  const regex = /[^.[\]]+|\[(?:(-?\d+)|["'](.*?)["'])\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      tokens.push(parseInt(match[1], 10));
    } else if (match[2] !== undefined) {
      tokens.push(match[2]);
    } else {
      tokens.push(match[0]);
    }
  }
  return tokens;
}

/** Immutable path update: copies only the containers along `subTokens`. */
function applyPathUpdate(
  root: any,
  subTokens: Array<string | number>,
  value: any,
): any {
  if (subTokens.length === 0) return value;
  const firstKey = subTokens[0];
  const nextIsArray = typeof firstKey === "number";
  const newRoot = Array.isArray(root)
    ? [...root]
    : root !== null && typeof root === "object"
      ? { ...root }
      : nextIsArray
        ? []
        : {};

  let current: any = newRoot;

  for (let i = 0; i < subTokens.length - 1; i++) {
    const key = subTokens[i];
    if (key === undefined) continue;
    const isNextNumber = typeof subTokens[i + 1] === "number";
    const existing = current[key];

    const clonedChild =
      existing === null || typeof existing !== "object"
        ? isNextNumber
          ? []
          : {}
        : cloneValue(existing);

    current[key] = clonedChild;
    current = clonedChild;
  }

  const lastKey = subTokens[subTokens.length - 1];
  if (lastKey !== undefined) {
    current[lastKey] = value;
  }

  return newRoot;
}

const warnReadonly = (key: string) => {
  console.warn(
    `[code-ui/computed] Cannot set read-only computed property "${key}". Provide a "set(val)" handler in computed definition to allow writes.`,
  );
};


export interface SetupComputedOptions {
  /**
   * Emit the initial computed diff synchronously during setup.
   * The behavior disables this in `created` (where `setData` is not allowed and
   * properties may not be applied yet) and flushes in `attached` instead.
   * @default true
   */
  immediate?: boolean;
}

type DataSignal = ReturnType<typeof signal<unknown>>;
type SetDataFn = (data: Record<string, any>, callback?: () => void) => void;

export function setupComputed(
  self: any,
  explicitDefs?: ComputedDefs,
  options: SetupComputedOptions = {},
): void {
  if (!self || self[_COMPUTED_INITIALIZED]) return;

  const computedDefs: ComputedDefs =
    explicitDefs ??
    runIfFn(self[_COMPUTED_DEFS]) ??
    self[_COMPUTED_DEFS] ??
    self.computed ??
    {};

  const computedKeys = Object.keys(computedDefs);
  if (!computedKeys.length) return;

  self[_COMPUTED_INITIALIZED] = true;

  const computedKeySet = new Set(computedKeys);
  const readData = (key: string): unknown => self.data?.[key];

  const dataSignals = new Map<string, DataSignal>();
  const getDataSignal = (key: string): DataSignal => {
    let sig = dataSignals.get(key);
    if (!sig) {
      sig = signal<unknown>(readData(key));
      dataSignals.set(key, sig);
    }
    return sig;
  };

  const computedSignals: Record<string, () => unknown> = Object.create(null);
  const computedSetters: Record<string, (val: unknown) => void> =
    Object.create(null);

  const readReactive = (key: string): unknown => {
    const c = computedSignals[key];
    return c ? c() : getDataSignal(key)();
  };

  const writeComputed = (key: string, val: unknown) => {
    const setter = computedSetters[key];
    if (setter) setter(val);
    else warnReadonly(key);
  };

  /** Reactive view of `this.data` / `this.properties` used inside getters. */
  const reactiveData = new Proxy(Object.create(null) as Record<string, any>, {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      return readReactive(prop);
    },
    set(_target, prop, val) {
      if (typeof prop !== "string") return false;
      self.setData({ [prop]: val });
      return true;
    },
    has(_target, prop) {
      if (typeof prop !== "string") return false;
      return computedKeySet.has(prop) || (!!self.data && prop in self.data);
    },
    ownKeys() {
      const keys = new Set<string>(self.data ? Object.keys(self.data) : []);
      for (const key of computedKeys) keys.add(key);
      return [...keys];
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop !== "string") return undefined;
      if (!computedKeySet.has(prop) && !(self.data && hasOwn(self.data, prop))) {
        return undefined;
      }
      return {
        configurable: true,
        enumerable: true,
        writable: true,
        value: readReactive(prop),
      };
    },
  });

  const boundMethodCache = new Map<string, { fn: Function; bound: Function }>();
  /** `this` inside computed getters / setters. */
  const computedCtx = new Proxy(self, {
    get(target, prop) {
      if (typeof prop !== "string") return (target as any)[prop];
      if (prop === "data" || prop === "properties") return reactiveData;
      if (computedKeySet.has(prop)) return readReactive(prop);
      const val = (target as any)[prop];
      if (typeof val !== "function") return val;
      const cached = boundMethodCache.get(prop);
      if (cached && cached.fn === val) return cached.bound;
      const bound = val.bind(target) as Function;
      boundMethodCache.set(prop, { fn: val, bound });
      return bound;
    },
    set(target, prop, val) {
      if (typeof prop === "string" && computedKeySet.has(prop)) {
        writeComputed(prop, val);
        return true;
      }
      (target as any)[prop] = val;
      return true;
    },
  });

  for (const key of computedKeys) {
    const { get, set } = parseComputedDef(computedDefs[key]);
    computedSignals[key] = alienComputed<unknown>((prev) => {
      try {
        return get.call(computedCtx);
      } catch (err) {
        console.error(
          `[code-ui/computed] Error while evaluating computed "${key}":`,
          err,
        );
        return prev !== undefined ? prev : readData(key);
      }
    });
    if (set) {
      computedSetters[key] = (val: unknown) => set.call(computedCtx, val);
    }
  }

  const definedKeys: string[] = [];
  for (const key of computedKeys) {
    if (key in self) continue;
    Object.defineProperty(self, key, {
      configurable: true,
      enumerable: true,
      get: () => computedSignals[key]!(),
      set: (val) => writeComputed(key, val),
    });
    definedKeys.push(key);
  }

  /** Last values sent to the view, seeded from (definition-time) initial data. */
  const cache: Record<string, unknown> = Object.create(null);
  for (const key of computedKeys) {
    cache[key] = readData(key);
  }

  /** Returns changed computed values (and commits them to `cache`), or `null`. */
  const collectComputedUpdates = (): Record<string, unknown> | null => {
    let updates: Record<string, unknown> | null = null;
    pauseTracking();
    try {
      for (const key of computedKeys) {
        const val = computedSignals[key]!();
        if (!isEqual(cache[key], val)) {
          cache[key] = val;
          if (!updates) updates = {};
          updates[key] = val;
        }
      }
    } finally {
      resumeTracking();
    }
    return updates;
  };

  const hadOwnSetData = hasOwn(self, "setData");
  const originalSetData: SetDataFn = self.setData;

  let disposed = false;
  /** Effect runs only emit after the first explicit flush. */
  let mounted = false;
  /** > 0 while we're inside the original `setData` (observers fire there). */
  let writeDepth = 0;
  /** `true` while applying writes we're about to diff synchronously anyway. */
  let applyingWrites = false;
  let emitScheduled = false;

  const callOriginal = (data: Record<string, any>, callback?: () => void) => {
    writeDepth++;
    try {
      originalSetData.call(self, data, callback);
    } finally {
      writeDepth--;
    }
  };

  const emitPending = () => {
    emitScheduled = false;
    if (disposed) return;
    const updates = collectComputedUpdates();
    if (updates) callOriginal(updates);
  };

  const scheduleEmit = () => {
    if (emitScheduled) return;
    emitScheduled = true;
    queueMicrotask(emitPending);
  };

  /**
   * Pulls changes that bypassed our patched `setData` (parent property
   * updates, writes through a stale `setData` reference) into the signals.
   */
  const syncFromData = () => {
    if (!dataSignals.size) return;
    pauseTracking();
    startBatch();
    try {
      for (const [key, sig] of dataSignals) {
        const current = readData(key);
        if (!Object.is(sig(), current)) sig(current);
      }
    } finally {
      endBatch();
      resumeTracking();
    }
  };

  const patchedSetData: SetDataFn = (data, callback) => {
    if (disposed) {
      originalSetData.call(self, data, callback);
      return;
    }

    pauseTracking();
    try {
      const normal: Record<string, any> = {};
      let hasNormal = false;
      const setterEntries: Array<[string, unknown]> = [];

      for (const path of Object.keys(data)) {
        const val = data[path];
        if (computedKeySet.has(path)) {
          if (computedSetters[path]) setterEntries.push([path, val]);
          else warnReadonly(path);
          continue;
        }
        normal[path] = val;
        hasNormal = true;
      }

      if (hasNormal) {
        applyingWrites = true;
        startBatch();
        try {
          for (const path of Object.keys(normal)) {
            const tokens = parsePath(path);
            if (tokens.length === 0) continue;
            const rootKey = String(tokens[0]);

            if (computedKeySet.has(rootKey)) {
              warnReadonly(path);
              delete normal[path];
              continue;
            }

            let nextRoot: unknown;
            if (tokens.length === 1) {
              const val = normal[path];
              nextRoot =
                val !== null &&
                typeof val === "object" &&
                Object.is(val, readData(rootKey))
                  ? cloneValue(val)
                  : val;
              normal[path] = nextRoot;
            } else {
              nextRoot = applyPathUpdate(
                readData(rootKey),
                tokens.slice(1),
                normal[path],
              );
            }

            if (self.data) self.data[rootKey] = nextRoot;
            dataSignals.get(rootKey)?.(nextRoot);
          }
        } finally {
          endBatch();
          applyingWrites = false;
        }

        const updates = collectComputedUpdates();
        callOriginal(updates ? Object.assign(normal, updates) : normal, callback);
      }

      for (const [key, val] of setterEntries) {
        computedSetters[key]!(val);
      }

      if (!hasNormal && callback) {
        callOriginal({}, callback);
      }
    } finally {
      resumeTracking();
    }
  };

  self.setData = patchedSetData;



  const stopScope = effectScope(() => {
    effect(() => {
      for (const key of computedKeys) computedSignals[key]!();
      if (!mounted || disposed || applyingWrites) return;
      scheduleEmit();
    });
  });



  self[_COMPUTED_SYNC] = () => {
    if (disposed || writeDepth > 0) return;
    syncFromData();
  };

  self[_COMPUTED_FLUSH] = () => {
    if (disposed) return;
    syncFromData();
    mounted = true;
    const updates = collectComputedUpdates();
    if (updates) callOriginal(updates);
  };

  self[_COMPUTED_DISPOSE] = () => {
    if (disposed) return;
    disposed = true;
    stopScope();
    if (hadOwnSetData) self.setData = originalSetData;
    else delete self.setData;
    for (const key of definedKeys) delete self[key];
    dataSignals.clear();
    boundMethodCache.clear();
    self[_COMPUTED_SYNC] = undefined;
    self[_COMPUTED_FLUSH] = undefined;
    self[_COMPUTED_DISPOSE] = undefined;
    self[_COMPUTED_INITIALIZED] = false;
  };

  if (options.immediate !== false) {
    self[_COMPUTED_FLUSH]();
  }
}

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
export const computedBehavior =
  typeof Behavior !== "undefined"
    ? /*#__PURE__*/ Behavior({
        definitionFilter(defFields: any) {
          const computedDefs: ComputedDefs | undefined = defFields.computed;
          if (!computedDefs || typeof computedDefs !== "object") return;
          if (!Object.keys(computedDefs).length) return;

          defFields.methods = defFields.methods || {};
          defFields.methods[_COMPUTED_DEFS] = function () {
            return computedDefs;
          };

          defFields.data = defFields.data || {};
          Object.assign(
            defFields.data,
            evaluateInitialComputed(
              computedDefs,
              defFields.data,
              defFields.properties,
            ),
          );

          defFields.observers = defFields.observers || {};
          const userWildcard = defFields.observers["**"];
          defFields.observers["**"] = function (this: any, ...args: any[]) {
            this[_COMPUTED_SYNC]?.();
            return userWildcard?.apply(this, args);
          };
        },

        lifetimes: {
          created(this: any) {
            setupComputed(this, undefined, { immediate: false });
          },

          attached(this: any) {
            setupComputed(this, undefined, { immediate: false });
            this[_COMPUTED_FLUSH]?.();
          },

          detached(this: any) {
            this[_COMPUTED_DISPOSE]?.();
          },
        },

        pageLifetimes: {
          show(this: any) {
            this[_COMPUTED_FLUSH]?.();
          },
        },
      })
    : ({} as any);
