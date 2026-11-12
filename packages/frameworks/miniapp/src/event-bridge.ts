import { isPromise } from "@code-ui/utils";

type AnyFn = (...args: any[]) => any;

export function resolveOwners(component: any): any[] {
  if (!component) return [];
  const owners: any[] = [];
  const seen = new Set<any>();

  try {
    let current = component.selectOwnerComponent?.();
    while (current && !seen.has(current)) {
      seen.add(current);
      owners.push(current);
      current = current.selectOwnerComponent?.();
    }
  } catch {
    // ignore
  }

  try {
    const pages =
      (typeof getCurrentPages === "function"
        ? getCurrentPages()
        : (globalThis as any)?.getCurrentPages?.()) ?? [];
    const activePage = pages.length > 0 ? pages[pages.length - 1] : undefined;
    if (activePage && !seen.has(activePage)) {
      owners.push(activePage);
    }
  } catch {
    // ignore
  }

  return owners;
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
  const isAction = ["tap", "click", "action"].includes(eventName);

  return (
    detail?: any,
    options?: WechatMiniprogram.Component.TriggerEventOption,
  ): Promise<any> | undefined => {
    const supportsAsyncDetail =
      detail &&
      typeof detail === "object" &&
      typeof detail.setPromise === "function";
    const canCaptureAsync = isAction || Boolean(supportsAsyncDetail);

    let asyncPromise: Promise<any> | undefined;
    const capture = (promise: Promise<any>) => {
      asyncPromise = promise;
    };

    if (canCaptureAsync && detail && typeof detail === "object") {
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

    const owners = canCaptureAsync ? resolveOwners(component) : [];
    const cleanups: VoidFunction[] = [];
    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      if (owner && typeof owner === "object") {
        cleanups.push(interceptOwnerPromises(owner, capture));
      }
    }

    try {
      const ret =
        options !== undefined
          ? component?.triggerEvent?.(eventName, detail, options)
          : component?.triggerEvent?.(eventName, detail);
      if (isPromise(ret)) return ret;
    } finally {
      for (let i = cleanups.length - 1; i >= 0; i--) {
        cleanups[i]?.();
      }
    }

    return asyncPromise;
  };
}
