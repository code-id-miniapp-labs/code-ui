import { isEqual, runIfFn } from "@code-ui/utils";
import {
  computed as alienComputed,
  effect,
  effectScope,
  signal,
} from "alien-signals";

/**
 * @example
 * ```ts
 * const computed: ComputedDefs = {
 *   fullName() { return this.data.firstName + ' ' + this.data.lastName },
 *   doubled() { return this.data.count * 2 }
 * }
 * ```
 */
export type ComputedDefs = Record<string, (...args: any[]) => any>;

export type ComponentOptionsWithComputed<
  TData extends WechatMiniprogram.Component.DataOption =
    WechatMiniprogram.Component.DataOption,
  TProperty extends WechatMiniprogram.Component.PropertyOption =
    WechatMiniprogram.Component.PropertyOption,
  TMethod extends WechatMiniprogram.Component.MethodOption =
    WechatMiniprogram.Component.MethodOption,
  TBehavior extends WechatMiniprogram.Component.BehaviorOption = any[],
  TComputed extends ComputedDefs = ComputedDefs,
  TCustomInstanceProperty extends WechatMiniprogram.IAnyObject = {},
  TIsPage extends boolean = false,
  TInstance = WechatMiniprogram.Component.Instance<
    TData,
    TProperty,
    TMethod,
    TBehavior,
    TCustomInstanceProperty,
    TIsPage
  >,
> = WechatMiniprogram.Component.Options<
  TData,
  TProperty,
  TMethod,
  TBehavior,
  TCustomInstanceProperty,
  TIsPage
> & {
  /**
   * Signal-powered computed properties.
   * Inside computed getters, `this.data` and `this.properties` have full autocomplete.
   *
   * @example
   * ```ts
   * computed: {
   *   b() { return this.data.a + 100 }
   * }
   * ```
   */
  computed?: TComputed & ThisType<TInstance>;
};

/**
 * Typed wrapper for `Component()` that adds support for the `computed` field.
 * Passes the options through unchanged — typing only.
 *
 * @example
 * ```ts
 * Component(createComponentOptions({
 *   behaviors: [computedBehavior],
 *   data: { a: 0 },
 *   computed: {
 *     b() { return this.data.a + 100 }
 *   },
 * }))
 * ```
 */
export function createComponentOptions<
  TData extends WechatMiniprogram.Component.DataOption,
  TProperty extends WechatMiniprogram.Component.PropertyOption,
  TMethod extends WechatMiniprogram.Component.MethodOption,
  TBehavior extends WechatMiniprogram.Component.BehaviorOption = any[],
  TComputed extends ComputedDefs = ComputedDefs,
  TCustomInstanceProperty extends WechatMiniprogram.IAnyObject = {},
  TIsPage extends boolean = false,
>(
  options: ComponentOptionsWithComputed<
    TData,
    TProperty,
    TMethod,
    TBehavior,
    TComputed,
    TCustomInstanceProperty,
    TIsPage
  >,
): ComponentOptionsWithComputed<
  TData,
  TProperty,
  TMethod,
  TBehavior,
  TComputed,
  TCustomInstanceProperty,
  TIsPage
> {
  const computedDefs = options.computed;
  if (computedDefs) {
    (options as any)[_COMPUTED_DEFS] = computedDefs;

    const behaviors = (
      options.behaviors ? [...(options.behaviors as any[])] : []
    ) as any[];
    if (!behaviors.includes(computedBehavior)) {
      behaviors.push(computedBehavior);
    }
    options.behaviors = behaviors as unknown as TBehavior;

    options.data = options.data || ({} as TData);
    for (const [key, getter] of Object.entries(computedDefs)) {
      try {
        const val = getter.call({
          data: options.data,
          properties: options.properties || options.data,
        });
        if (val !== undefined) {
          (options.data as any)[key] = val;
        }
      } catch {}
    }
  }

  return options;
}

export type PageOptionsWithComputed<
  TData extends WechatMiniprogram.Page.DataOption =
    WechatMiniprogram.Page.DataOption,
  TCustom extends WechatMiniprogram.Page.CustomOption =
    WechatMiniprogram.Page.CustomOption,
  TComputed extends ComputedDefs = ComputedDefs,
  TInstance = WechatMiniprogram.Page.Instance<TData, TCustom>,
> = WechatMiniprogram.Page.Options<TData, TCustom> & {
  behaviors?: any[];
  computed?: TComputed & ThisType<TInstance>;
};

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
 *     doubled() { return this.data.count * 2 }
 *   },
 * }))
 * ```
 */
export function createPageOptions<
  TData extends WechatMiniprogram.Page.DataOption,
  TCustom extends WechatMiniprogram.Page.CustomOption,
  TComputed extends ComputedDefs = ComputedDefs,
>(
  options: PageOptionsWithComputed<TData, TCustom, TComputed>,
): PageOptionsWithComputed<TData, TCustom, TComputed> {
  const computedDefs = options.computed;
  if (computedDefs) {
    (options as any)[_COMPUTED_DEFS] = computedDefs;

    const behaviors = options.behaviors ? [...options.behaviors] : [];
    if (!behaviors.includes(computedBehavior)) {
      behaviors.push(computedBehavior);
    }
    options.behaviors = behaviors;

    options.data = options.data || ({} as TData);
    for (const [key, getter] of Object.entries(computedDefs)) {
      try {
        const val = getter.call({
          data: options.data,
          properties: options.data,
        });
        if (val !== undefined) {
          (options.data as any)[key] = val;
        }
      } catch {}
    }

    const originalOnLoad = options.onLoad;
    options.onLoad = function (
      this: any,
      query: Record<string, string | undefined>,
    ) {
      setupComputed(this, computedDefs);
      return originalOnLoad?.call(this, query);
    };
  }

  return options;
}

const _COMPUTED_INITIALIZED = "__cui_computedInit__" as const;
const _COMPUTED_DEFS = "__cui_computedDefs__" as const;
const _COMPUTED_SCOPE = "__cui_computedScope__" as const;
const _COMPUTED_FLUSHING = "__cui_computedFlushing__" as const;
const _COMPUTED_FLUSH = "__cui_computedFlush__" as const;

function cloneValue<T>(val: T): T {
  if (Array.isArray(val)) {
    return [...val] as unknown as T;
  }
  if (val !== null && typeof val === "object") {
    return { ...(val as Record<string, any>) } as unknown as T;
  }
  return val;
}

function parsePath(path: string): Array<string | number> {
  const tokens: Array<string | number> = [];
  const regex = /[^.[\]]+|\[(?:(-?\d+)|["'](.*?)["'])\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      tokens.push(parseInt(match[1], 10));
    } else if (match[2] !== undefined) {
      tokens.push(match[2]);
    } else {
      const seg = match[0];
      const num = Number(seg);
      tokens.push(
        !isNaN(num) && !isNaN(parseFloat(seg)) && String(num) === seg
          ? num
          : seg,
      );
    }
  }
  return tokens;
}

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
    const nextKey = subTokens[i + 1];
    const isNextNumber = typeof nextKey === "number";
    const existing = current[key];

    const clonedChild = Array.isArray(existing)
      ? [...existing]
      : existing !== null && typeof existing === "object"
        ? { ...existing }
        : isNextNumber
          ? []
          : {};

    current[key] = clonedChild;
    current = clonedChild;
  }

  const lastKey = subTokens[subTokens.length - 1];
  if (lastKey !== undefined) {
    current[lastKey] = value;
  }

  return newRoot;
}

function setupComputed(self: any, explicitDefs?: ComputedDefs) {
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

  const dataSignalMap = new Map<string, ReturnType<typeof signal<unknown>>>();

  const getDataSignal = (prop: string) => {
    let sig = dataSignalMap.get(prop);
    if (!sig) {
      sig = signal((self.data as any)?.[prop]);
      dataSignalMap.set(prop, sig);
    }
    return sig;
  };

  const computedSignals: Record<string, () => any> = {};

  const reactiveData = new Proxy({} as Record<string, any>, {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      if (computedSignals[prop]) {
        return computedSignals[prop]();
      }
      return getDataSignal(prop)();
    },
    has(_target, prop) {
      if (typeof prop !== "string") return false;
      return (
        prop in computedDefs ||
        (self.data && prop in self.data) ||
        (self.properties && prop in self.properties)
      );
    },
  });

  const boundMethodCache = new Map<string, Function>();
  const computedCtx = new Proxy(self, {
    get(target, prop) {
      if (typeof prop !== "string") return (target as any)[prop];
      if (prop === "data" || prop === "properties") return reactiveData;
      const val = (target as any)[prop];
      if (typeof val !== "function") return val;
      let bound = boundMethodCache.get(prop);
      if (!bound) {
        bound = val.bind(target) as Function;
        boundMethodCache.set(prop, bound);
      }
      return bound;
    },
  });

  for (const key of computedKeys) {
    const getter = computedDefs[key];
    computedSignals[key] = alienComputed(() => getter?.call(computedCtx));
  }

  const cache: Record<string, any> = {};
  for (const key of computedKeys) {
    cache[key] = (self.data as any)?.[key];
  }

  const originalSetData: (
    data: Record<string, any>,
    callback?: () => void,
  ) => void = self.setData.bind(self);

  const flush = () => {
    if (self[_COMPUTED_FLUSHING]) return;

    const update: Record<string, any> = {};
    let dirty = false;

    for (const key of computedKeys) {
      const val = computedSignals[key]?.();
      if (!isEqual(cache[key], val)) {
        cache[key] = val;
        update[key] = val;
        dirty = true;
      }
    }

    if (!dirty) return;

    self[_COMPUTED_FLUSHING] = true;
    try {
      originalSetData(update);
    } finally {
      self[_COMPUTED_FLUSHING] = false;
    }
  };

  self[_COMPUTED_FLUSH] = flush;

  self.setData = (
    data: Record<string, any>,
    callback?: () => void,
  ): void => {
    if (self[_COMPUTED_FLUSHING]) {
      originalSetData(data, callback);
      return;
    }

    for (const path of Object.keys(data)) {
      const val = data[path];
      const tokens = parsePath(path);

      if (tokens.length === 0) continue;

      const rootKey = tokens[0] as string;
      const sig = getDataSignal(rootKey);

      if (tokens.length === 1) {
        const nextVal = cloneValue(val);
        if (self.data) {
          self.data[rootKey] = nextVal;
        }
        sig(nextVal);
      } else {
        const currentRoot = self.data?.[rootKey];
        const newRoot = applyPathUpdate(currentRoot, tokens.slice(1), val);
        if (self.data) {
          self.data[rootKey] = newRoot;
        }
        sig(newRoot);
      }
    }

    const computedUpdates: Record<string, any> = {};
    for (const key of computedKeys) {
      const val = computedSignals[key]?.();
      if (!isEqual(cache[key], val)) {
        cache[key] = val;
        computedUpdates[key] = val;
      }
    }

    const mergedData =
      Object.keys(computedUpdates).length > 0
        ? { ...data, ...computedUpdates }
        : data;

    self[_COMPUTED_FLUSHING] = true;
    try {
      originalSetData(mergedData, callback);
    } finally {
      self[_COMPUTED_FLUSHING] = false;
    }
  };

  const stopScope = effectScope(() => {
    effect(flush);
  });

  self[_COMPUTED_SCOPE] = stopScope;
}

/**
 * @example
 * ```ts
 * Component({
 *   behaviors: [computedBehavior],
 *   data: { a: 0 },
 *   computed: {
 *     b() { return this.data.a + 100 }
 *   },
 *   methods: {
 *     onTap() { this.setData({ a: this.data.a + 1 }) }
 *   }
 * })
 * ```
 */
export const computedBehavior = Behavior({
  definitionFilter(defFields: any) {
    const computedDefs: ComputedDefs = defFields.computed ?? {};
    const keys = Object.keys(computedDefs);
    if (!keys.length) return;
    defFields[_COMPUTED_DEFS] = computedDefs;

    defFields.methods = defFields.methods || {};
    defFields.methods[_COMPUTED_DEFS] = function () {
      return computedDefs;
    };

    defFields.data = defFields.data || {};
    for (const key of keys) {
      try {
        const val = computedDefs[key]?.call({
          data: defFields.data,
          properties: defFields.properties || defFields.data,
        });
        if (val !== undefined) {
          defFields.data[key] = val;
        }
      } catch {}
    }
  },

  lifetimes: {
    created(this: any) {
      setupComputed(this);
    },

    attached(this: any) {
      setupComputed(this);
      this[_COMPUTED_FLUSH]?.();
    },

    detached(this: any) {
      this[_COMPUTED_SCOPE]?.();
      this[_COMPUTED_SCOPE] = null;
      this[_COMPUTED_FLUSH] = null;
    },
  },

  pageLifetimes: {
    show(this: any) {
      setupComputed(this);
      this[_COMPUTED_FLUSH]?.();
    },
  },
});

