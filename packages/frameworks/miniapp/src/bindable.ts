import { computed, setActiveSub, signal } from "alien-signals";
import { isFunction } from "@code-ui/utils";
import type { Bindable, BindableFn, BindableParams } from "@code-ui/core";

export const bindable: BindableFn = Object.assign(
  function bindable<T>(props: () => BindableParams<T>): Bindable<T> {
    const _params = computed(() => props());
    const init = _params();
    const initial = init.value ?? init.defaultValue;
    const eq = init.isEqual ?? Object.is;

    if (init.debug) {
      console.log(`[bindable > ${init.debug}] initial`, initial);
    }

    const _signal = signal<T>(initial as T);
    let lastSeenProp: T | undefined = init.value;

    const syncProp = () => {
      const p = _params();
      const currentProp = p.value;
      if (
        currentProp !== undefined &&
        currentProp !== null &&
        !eq(currentProp as T, lastSeenProp as T)
      ) {
        lastSeenProp = currentProp as T;
        _signal(currentProp as T);
      }
    };

    return {
      initial: initial as T,

      ref: {
        get: () => {
          syncProp();
          return _signal();
        },
      },

      get(): T {
        syncProp();
        return _signal();
      },

      set(nextValue: T | ((prev: T) => T)): void {
        const prevSub = setActiveSub(undefined);
        let prev: T;
        let next: T;
        let shouldInvoke = false;
        let onChange: ((value: T, prev: T | undefined) => void) | undefined;
        try {
          syncProp();
          prev = _signal();
          next = isFunction(nextValue)
            ? (nextValue as (prev: T) => T)(prev)
            : (nextValue as T);

          if (init.debug) {
            console.log(`[bindable > ${init.debug}] setValue`, { next, prev });
          }

          _signal(next);

          if (!eq(next, prev)) {
            shouldInvoke = true;
            onChange = _params().onChange;
          }
        } finally {
          setActiveSub(prevSub);
        }

        if (shouldInvoke && onChange) {
          onChange(next, prev);
        }
      },

      invoke(nextValue: T, prevValue: T): void {
        _params().onChange?.(nextValue, prevValue);
      },

      hash(value: T): string {
        return _params().hash?.(value) ?? String(value);
      },
    };
  },
  {
    cleanup: (_fn: VoidFunction) => {},

    ref: <T>(defaultValue: T) => {
      let value = defaultValue;
      return {
        get: () => value,
        set: (next: T) => {
          value = next;
        },
      };
    },
  },
);
