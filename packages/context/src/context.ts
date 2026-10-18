/// <reference types="miniprogram-api-typings" />

import type { MiniAppComponent } from "@code-ui/utils";

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
const provideListeners = new Map<
  symbol,
  Set<{ component: MiniAppComponent; callback: (value: any) => void }>
>();

function getStore<T>(key: InjectionKey<T>): WeakMap<object, T> {
  if (!registry.has(key)) {
    registry.set(key, new WeakMap());
  }

  return registry.get(key) as WeakMap<object, T>;
}

function getDirectSet(key: symbol): WeakSet<object> {
  let set = directProviders.get(key);
  if (!set) {
    set = new WeakSet();
    directProviders.set(key, set);
  }
  return set;
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

function resolvePageScope(component: any): object | null {
  try {
    if (typeof component?.getPageId === "function") {
      const pageId = component.getPageId();
      if (typeof pageId === "string" && pageId.length > 0) {
        let holder = pageFallbacks.get(pageId);
        if (!holder) {
          holder = Object.create(null) as object;
          pageFallbacks.set(pageId, holder);
        }
        return holder;
      }
    }
  } catch {
    // ignore
  }

  if (
    component &&
    (typeof component.__wxWebviewId__ === "number" ||
      typeof component.__wxWebviewId__ === "string")
  ) {
    const key = `wv:${String(component.__wxWebviewId__)}`;
    let holder = pageFallbacks.get(key);
    if (!holder) {
      holder = Object.create(null) as object;
      pageFallbacks.set(key, holder);
    }
    return holder;
  }

  try {
    if (typeof getCurrentPages === "function") {
      const pages = getCurrentPages();
      const topPage =
        pages && pages.length > 0 ? pages[pages.length - 1] : null;
      if (topPage && typeof topPage === "object") {
        return topPage as object;
      }
    }
  } catch {
    // ignore
  }

  return null;
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
  store: WeakMap<object, T>,
  key?: InjectionKey<T>,
): object | undefined {
  const target = unwrapInstance(component);
  if (!target) return undefined;

  if (key !== undefined && !slotParents.has(target)) {
    const discovered = requestSlotContext(component, key);
    if (discovered !== undefined && store.has(discovered)) {
      return discovered;
    }
  }

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

  const pageScope = resolvePageScope(component);
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

  const pageScope = resolvePageScope(target);
  if (pageScope !== null && !direct.has(pageScope)) {
    store.set(pageScope, value);
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
  const store = getStore(key);
  const provider = findProvider(component, store, key);

  if (provider === undefined) return defaultValue;

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
  return findProvider(component, getStore(key), key) !== undefined;
}
