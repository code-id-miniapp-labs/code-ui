/// <reference types="miniprogram-api-typings" />

import { signal } from "alien-signals";
import { isFunction } from "@code-ui/utils";
import type { Bindable, BindableFn, BindableParams } from "./types";

// alien-signals signal shape: signal<T>(init) → { (): T; (value: T): void }
type SignalFn<T> = { (): T; (value: T): void };

export const bindable: BindableFn = Object.assign(
  function bindable<T>(props: () => BindableParams<T>): Bindable<T> {
    const initial = props().value ?? props().defaultValue;
    const eq = props().isEqual ?? Object.is;

    if (props().debug) {
      console.log(`[bindable > ${props().debug}] initial`, initial);
    }

    // ⚡ alien-signals signal — callable function, not .get()/.set()
    //   read:  _signal()
    //   write: _signal(nextValue)
    const _signal = signal<T>(initial as T) as SignalFn<T>;

    const controlled = () => props().value !== undefined;

    return {
      initial,

      // ⚡ Wrap signal in a { get() } object so _contextRefs can call ref.get()
      // uniformly in the MiniappMachine effect that tracks context signals
      ref: { get: () => _signal() },

      get(): T {
        if (controlled()) return props().value as T;
        return _signal();
      },

      set(nextValue: T | ((prev: T) => T)): void {
        const prev = controlled() ? (props().value as T) : _signal();
        const next = isFunction(nextValue)
          ? (nextValue as (prev: T) => T)(prev)
          : (nextValue as T);

        if (props().debug) {
          console.log(`[bindable > ${props().debug}] setValue`, { next, prev });
        }

        if (!controlled()) _signal(next);

        if (!eq(next, prev)) {
          props().onChange?.(next, prev);
        }
      },

      invoke(nextValue: T, prevValue: T): void {
        props().onChange?.(nextValue, prevValue);
      },

      hash(value: T): string {
        return props().hash?.(value) ?? String(value);
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
) as BindableFn;
