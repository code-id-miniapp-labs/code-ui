import { isPromise } from "@code-ui/utils";

type AnyFn = (...args: any[]) => any;

function resolveOwner(component: any): any {
  if (!component) return undefined;
  if (typeof component.selectOwnerComponent === "function") {
    try {
      const owner = component.selectOwnerComponent();
      if (owner) return owner;
    } catch {
      // Fall through to global lookup
    }
  }

  let pages: any[] | undefined;
  if (typeof getCurrentPages === "function") {
    try {
      pages = getCurrentPages();
    } catch {
      // Ignore
    }
  } else if (typeof (globalThis as any)?.getCurrentPages === "function") {
    try {
      pages = (globalThis as any).getCurrentPages();
    } catch {
      // Ignore
    }
  }

  if (Array.isArray(pages) && pages.length > 0) {
    return pages[pages.length - 1];
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
export function interceptOwnerPromises(
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
export function createEventBridge(component: any, eventName: string) {
  const isAction = eventName === "tap" || eventName === "click";

  return (
    detail?: any,
    options?: WechatMiniprogram.Component.TriggerEventOption,
  ): Promise<any> | undefined => {
    let asyncPromise: Promise<any> | undefined;
    const capture = (promise: Promise<any>) => {
      asyncPromise = promise;
    };

    if (isAction && detail && typeof detail === "object") {
      const origSetPromise = detail.setPromise;
      try {
        Object.defineProperty(detail, "setPromise", {
          value: (promise: Promise<any>) => {
            capture(promise);
            origSetPromise?.(promise);
          },
          configurable: true,
          writable: true,
          enumerable: false,
        });
      } catch {
        // ignore
      }
    }

    const owner = isAction ? resolveOwner(component) : undefined;
    const restore =
      owner && typeof owner === "object"
        ? interceptOwnerPromises(owner, capture)
        : undefined;

    try {
      const ret =
        options !== undefined
          ? component?.triggerEvent?.(eventName, detail, options)
          : component?.triggerEvent?.(eventName, detail);
      if (isPromise(ret)) return ret;
    } finally {
      restore?.();
    }

    return asyncPromise;
  };
}
