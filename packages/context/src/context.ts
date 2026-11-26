/// <reference types="miniprogram-api-typings" />

import type { MiniAppComponent } from "@code-id-labs/utils";

/**
 * @example
 * const ThemeKey: InjectionKey<'light' | 'dark'> = createInjectionKey('theme');
 */
export type InjectionKey<T> = symbol & { readonly __injectionType: T };

/**
 * Extract the value type carried by an `InjectionKey`.
 *
 * @example
 * const ThemeKey = createInjectionKey<'light' | 'dark'>('theme');
 * type Theme = InferInjection<typeof ThemeKey>; // 'light' | 'dark'
 */
export type InferInjection<Key> = Key extends InjectionKey<infer T> ? T : never;

/**
 * @param label - Optional debug label — shown in `Symbol(label)` in devtools.
 *
 * @example
 * export const ThemeKey = createInjectionKey<'light' | 'dark'>('theme');
 * export const UserKey  = createInjectionKey<User>('user');
 */
export function createInjectionKey<T>(label?: string): InjectionKey<T> {
  return Symbol(label) as InjectionKey<T>;
}

export const CONTEXT_REQUEST_EVENT = "cui-context-request";

export interface ContextRequestDetail<T = unknown> {
  key: InjectionKey<T>;
  consumer: object;
  value?: T | undefined;
  provider?: object | undefined;
  handled?: boolean | undefined;
}

/**
 * Global registry: InjectionKey symbol → WeakMap<Component, value>.
 * One WeakMap per key ensures different contexts never collide,
 * and WeakMap entries are GC'd automatically when components detach.
 */
const registry = new Map<symbol, WeakMap<object, unknown>>();
const directProviders = new Map<symbol, WeakSet<object>>();
const slotParents = new WeakMap<object, object>();
const pageFallbacks = new Map<string, object>();
const pageFallbackRefs = new Map<object, { id: string; keys: Set<symbol> }>();
const MAX_PAGE_FALLBACKS = 64;
const provideListeners = new Map<
  symbol,
  Set<{ component: MiniAppComponent; callback: (value: any) => void }>
>();

function getStore<T>(key: InjectionKey<T>): WeakMap<object, T> {
  let store = registry.get(key);
  if (!store) {
    store = new WeakMap();
    registry.set(key, store);
  }
  return store as WeakMap<object, T>;
}

function getDirectSet(key: symbol): WeakSet<object> {
  let set = directProviders.get(key);
  if (!set) {
    set = new WeakSet();
    directProviders.set(key, set);
  }
  return set;
}

function deleteFromPageFallback(pageScope: object, key: symbol): void {
  const meta = pageFallbackRefs.get(pageScope);
  if (!meta) return;
  meta.keys.delete(key);
  if (meta.keys.size === 0) {
    pageFallbackRefs.delete(pageScope);
    if (pageFallbacks.get(meta.id) === pageScope) {
      pageFallbacks.delete(meta.id);
    }
  }
}

function trackPageFallback(pageScope: object, key: symbol): void {
  const meta = pageFallbackRefs.get(pageScope);
  if (meta) {
    meta.keys.add(key);
  }
}

function unwrapInstance(instance: any): object | null {
  if (!instance || typeof instance !== "object") return null;
  if (
    instance.__codeUiInstance &&
    typeof instance.__codeUiInstance === "object"
  ) {
    return instance.__codeUiInstance as object;
  }
  return instance as object;
}

/**
 * Handles a bubbling `cui-context-request` event caught on a provider component's
 * root template (e.g. `<form catch:cui-context-request="handleContextRequest">`).
 * Links the consumer to this `<slot />` provider instance and resolves the
 * requested context value synchronously when available.
 */
export function resolveContextRequest(
  providerComponent: MiniAppComponent,
  event: { detail?: any } | undefined,
): void {
  const detail = event?.detail as ContextRequestDetail<any> | undefined;
  if (!detail || detail.handled) return;

  const provider = unwrapInstance(providerComponent) ?? providerComponent;

  if (detail.consumer && detail.consumer !== provider) {
    slotParents.set(detail.consumer, provider);
  }

  if (detail.key) {
    const store = getStore(detail.key);
    if (store.has(provider)) {
      detail.value = store.get(provider);
      detail.provider = provider;
      detail.handled = true;
    }
  }
}

function requestSlotContext<T>(
  component: MiniAppComponent,
  key: InjectionKey<T>,
): object | undefined {
  const target = unwrapInstance(component);
  if (!target) return undefined;

  try {
    if (typeof component.triggerEvent === "function") {
      const detail: ContextRequestDetail<T> = {
        key,
        consumer: target,
        handled: false,
      };
      component.triggerEvent(CONTEXT_REQUEST_EVENT, detail, {
        bubbles: true,
        composed: true,
      });
      if (detail.handled && detail.provider) {
        return detail.provider;
      }
    }
  } catch {
    // ignore in non-MiniApp environments
  }

  return undefined;
}

function resolvePageScope(
  component: any,
  createFallback = false,
): object | null {
  try {
    const pid = component?.getPageId?.() ?? component?.__wxWebviewId__;
    const pages =
      typeof getCurrentPages === "function" ? getCurrentPages() : null;

    // Prefer the real MiniProgram Page object as WeakMap key so it is
    // automatically GC'd when the page unloads (no strong Map retention).
    const hasPid = pid !== null && pid !== undefined && pid !== "";
    if (pages && pages.length > 0) {
      if (hasPid) {
        const pidStr = String(pid);
        for (let i = pages.length - 1; i >= 0; i--) {
          const p = pages[i] as any;
          const pId = p?.getPageId?.() ?? p?.__wxWebviewId__;
          if (pId !== null && pId !== undefined && String(pId) === pidStr) {
            return p as object;
          }
        }
      } else {
        return pages[pages.length - 1] as object;
      }
    }

    if (hasPid) {
      const k = String(pid);
      let h = pageFallbacks.get(k);
      if (!h && createFallback) {
        if (pageFallbacks.size >= MAX_PAGE_FALLBACKS) {
          const oldestKey = pageFallbacks.keys().next().value;
          if (oldestKey !== undefined) {
            const oldestObj = pageFallbacks.get(oldestKey);
            pageFallbacks.delete(oldestKey);
            if (oldestObj) pageFallbackRefs.delete(oldestObj);
          }
        }
        h = Object.create(null) as object;
        pageFallbacks.set(k, h);
        pageFallbackRefs.set(h, { id: k, keys: new Set() });
      }
      return h ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

function resolveNextOwner(current: any): object | null {
  try {
    const rawOwner =
      typeof current?.selectOwnerComponent === "function"
        ? current.selectOwnerComponent()
        : null;
    const owner = unwrapInstance(rawOwner);
    if (owner !== null && owner !== current) {
      return owner;
    }
  } catch {
    // ignore
  }
  return null;
}

function findProvider<T>(
  component: MiniAppComponent,
  store: WeakMap<object, T> | undefined,
  key?: InjectionKey<T>,
): object | undefined {
  const target = unwrapInstance(component);
  if (!target) return undefined;

  if (key !== undefined && !slotParents.has(target)) {
    const discovered = requestSlotContext(component, key);
    if (discovered !== undefined && store?.has(discovered)) {
      return discovered;
    }
  }

  if (!store) return undefined;

  if (slotParents.has(target)) {
    let slotCur: object | undefined = slotParents.get(target);
    const slotVisited = new Set<object>();
    while (slotCur !== undefined && !slotVisited.has(slotCur)) {
      slotVisited.add(slotCur);
      if (store.has(slotCur)) return slotCur;
      slotCur = slotParents.get(slotCur);
    }
    return undefined;
  }

  let current: object | null = target;
  const visited = new Set<object>();

  while (current !== null && !visited.has(current)) {
    visited.add(current);
    if (store.has(current)) return current;

    const next = resolveNextOwner(current);
    if (next === null) break;
    current = next;
  }

  const pageScope = resolvePageScope(component, false);
  if (pageScope !== null && store.has(pageScope)) {
    return pageScope;
  }

  return undefined;
}

/**
 * @example
 * Component({
 *   lifetimes: {
 *     attached() { provide(this, ThemeKey, 'dark'); },
 *   },
 * });
 */
export function provide<T>(
  component: MiniAppComponent,
  key: InjectionKey<T>,
  value: T,
): void {
  const store = getStore(key);
  const direct = getDirectSet(key);
  const target = unwrapInstance(component) ?? component;
  store.set(target, value);
  direct.add(target);

  const owner = resolveNextOwner(target);
  if (owner !== null && !direct.has(owner)) {
    store.set(owner, value);
  }

  const pageScope = resolvePageScope(target, true);
  if (pageScope !== null && !direct.has(pageScope)) {
    store.set(pageScope, value);
    trackPageFallback(pageScope, key);
  }

  const listeners = provideListeners.get(key);
  if (listeners && listeners.size > 0) {
    for (const entry of Array.from(listeners)) {
      const resolved = findProvider(entry.component, store, key);
      if (
        resolved !== undefined &&
        (resolved === target || resolved === owner || resolved === pageScope)
      ) {
        entry.callback(store.get(resolved));
      }
    }
  }
}

export interface UnprovideOptions {
  /** Expected value guard so removing one provider does not clobber a newer provider on owner/pageScope */
  value?: unknown;
  /** Remove the key's registry buckets entirely when no listeners remain (for dynamic scoped keys) */
  pruneKey?: boolean | undefined;
}

/**
 * Releases a context value previously registered with `provide()` and cleans up
 * any synthetic page-fallback scope entries to avoid cross-page retention.
 */
export function unprovide<T>(
  component: MiniAppComponent,
  key: InjectionKey<T>,
  options?: UnprovideOptions,
): void {
  const store = registry.get(key);
  const direct = directProviders.get(key);
  const target = unwrapInstance(component) ?? component;

  if (store) {
    const prevValue =
      options && "value" in options ? options.value : store.get(target);
    const hasExpected = prevValue !== undefined;

    if (!hasExpected || store.get(target) === prevValue) {
      store.delete(target);
      direct?.delete(target);
    }

    const owner = resolveNextOwner(target);
    if (
      owner !== null &&
      !direct?.has(owner) &&
      (!hasExpected || store.get(owner) === prevValue)
    ) {
      store.delete(owner);
    }

    const pageScope = resolvePageScope(target, false);
    if (
      pageScope !== null &&
      !direct?.has(pageScope) &&
      (!hasExpected || store.get(pageScope) === prevValue)
    ) {
      store.delete(pageScope);
      deleteFromPageFallback(pageScope, key);
    }
  }

  if (options?.pruneKey) {
    const listeners = provideListeners.get(key);
    if (!listeners || listeners.size === 0) {
      provideListeners.delete(key);
      registry.delete(key);
      directProviders.delete(key);
    }
  }
}

/**
 * Explicitly removes a synthetic page-fallback entry for a given page ID.
 */
export function clearPageScope(pageId: string): void {
  const obj = pageFallbacks.get(pageId);
  if (!obj) return;
  pageFallbacks.delete(pageId);
  pageFallbackRefs.delete(obj);
}

/**
 *
 * @example
 * Component({
 *   lifetimes: {
 *     attached() {
 *      const theme = inject(this, ThemeKey);
 *      this.theme = theme
 *  },
 *   },
 * });
 */
export function inject<T>(
  component: MiniAppComponent,
  key: InjectionKey<T>,
  defaultValue?: T,
): T | undefined {
  const store = registry.get(key) as WeakMap<object, T> | undefined;
  const provider = findProvider(component, store, key);

  if (provider === undefined || !store) return defaultValue;

  return store.get(provider);
}

/**
 * Subscribes to a context key on `component`. Invokes `callback` immediately
 * if a provider is already available, and also whenever a matching ancestor or
 * Page owner calls `provide()` later (handling child-first `attached` order).
 */
export function onProvide<T>(
  component: MiniAppComponent,
  key: InjectionKey<T>,
  callback: (value: T) => void,
): () => void {
  const existing = inject(component, key);
  if (existing !== undefined) {
    callback(existing);
  }

  let set = provideListeners.get(key);
  if (!set) {
    set = new Set();
    provideListeners.set(key, set);
  }
  const entry = { component, callback };
  set.add(entry);

  return () => {
    set?.delete(entry);
    if (set && set.size === 0) {
      provideListeners.delete(key);
    }
  };
}

/**
 * Returns `true` if any ancestor of `component` (including itself) has called
 * `provide` with this `key`. Useful for optional dependency checks.
 *
 * @example
 * if (hasInjection(this, ThemeKey)) {
 *   const theme = inject(this, ThemeKey)!;
 * }
 */
export function hasInjection<T>(
  component: MiniAppComponent,
  key: InjectionKey<T>,
): boolean {
  const store = registry.get(key) as WeakMap<object, T> | undefined;
  return findProvider(component, store, key) !== undefined;
}
