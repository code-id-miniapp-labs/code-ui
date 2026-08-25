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

/**
 * Global registry: InjectionKey symbol → WeakMap<Component, value>.
 * One WeakMap per key ensures different contexts never collide,
 * and WeakMap entries are GC'd automatically when components detach.
 */
const registry = new Map<symbol, WeakMap<MiniAppComponent, unknown>>();

function getStore<T>(key: InjectionKey<T>): WeakMap<MiniAppComponent, T> {
  if (!registry.has(key)) {
    registry.set(key, new WeakMap());
  }

  return registry.get(key) as WeakMap<MiniAppComponent, T>;
}

function findProvider<T>(
  component: MiniAppComponent,
  store: WeakMap<MiniAppComponent, T>,
): MiniAppComponent | undefined {
  let current: MiniAppComponent | null = component;

  while (current !== null) {
    if (store.has(current)) return current;

    try {
      const owner = current.selectOwnerComponent() as MiniAppComponent | null;
      // selectOwnerComponent() returns itself at the page root — detect cycle
      if (owner === null || owner === current) break;
      current = owner;
    } catch {
      // Some environments throw when called at the page root
      break;
    }
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
  getStore(key).set(component, value);
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
  const provider = findProvider(component, store);

  if (provider === undefined) return defaultValue;

  return store.get(provider);
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
  return findProvider(component, getStore(key)) !== undefined;
}
