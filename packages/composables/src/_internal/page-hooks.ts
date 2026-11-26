const hookDispatchers = new WeakMap<object, Map<string, Set<() => void>>>();

/**
 * Registers a callback to run before an existing lifecycle hook (e.g.
 * `onUnload`, `detached`, `onReady`, `ready`) on a Page or Component instance,
 * wrapping each hook method at most once to avoid nested closure chains.
 *
 * Returns an unsubscribe function that removes the callback immediately.
 */
export function registerInstanceHook(
  instance: object | null | undefined,
  hook: string,
  callback: () => void,
): () => void {
  if (!instance || typeof instance !== "object") return () => {};
  const target = instance as Record<string, any>;
  if (typeof target[hook] !== "function") return () => {};

  let hooksMap = hookDispatchers.get(instance);
  if (!hooksMap) {
    hooksMap = new Map();
    hookDispatchers.set(instance, hooksMap);
  }

  let callbacks = hooksMap.get(hook);
  if (!callbacks) {
    callbacks = new Set();
    hooksMap.set(hook, callbacks);
    const origHook = target[hook];
    target[hook] = function (this: any, ...args: any[]) {
      const current = hooksMap?.get(hook);
      if (current && current.size > 0) {
        for (const fn of Array.from(current)) {
          fn();
        }
      }
      return origHook.apply(this, args);
    };
  }

  callbacks.add(callback);
  return () => {
    callbacks?.delete(callback);
  };
}
