import { effect } from "alien-signals";
import { diffSnapshot, isPlainObject } from "@code-id-labs/utils";
import type { MachineSchema, Service } from "@code-id-labs/core";
import type { MiniappMachine } from "./machine";
import { normalizeProps } from "./normalize-props";

export type MiniAppInstance = WechatMiniprogram.Component.TrivialInstance;

export type ConnectFn<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> = (service: Service<T>, ...args: any[]) => Data;

export interface ConnectOptions {
  /**
   * Top-level keys from the `connect()` snapshot to omit from `setData`
   * (they remain available on `__codeUiApi`).
   */
  omitKeys?: ReadonlyArray<string> | undefined;
}

/**
 * Remove function values and non-WXML helper subtrees (`hiddenInputProps`)
 * before diffing/setData. Connect snapshots expose methods and web/a11y helpers
 * for `__codeUiApi`, but WeChat WXML never renders them.
 * Avoids `delete` to preserve object hidden classes on the hot path.
 */
function toSerializableSnapshot<T>(
  value: T,
  seen?: WeakSet<object>,
  omitKeySet?: ReadonlySet<string>,
): T {
  if (Array.isArray(value)) {
    const visited = seen ?? new WeakSet<object>();
    if (visited.has(value)) return value;
    visited.add(value);

    let changed = false;
    const next = value.map((item) => {
      const cleaned = toSerializableSnapshot(item, visited);
      if (cleaned !== item) changed = true;
      return cleaned;
    });
    return (changed ? next : value) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const visited = seen ?? new WeakSet<object>();
  if (visited.has(value)) {
    return value;
  }
  visited.add(value);

  let copy: Record<string, any> | null = null;
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k === undefined) continue;
    const item = (value as Record<string, any>)[k];
    if (
      typeof item === "function" ||
      item === undefined ||
      k === "role" ||
      k === "tabindex" ||
      k === "tabIndex" ||
      k === "hiddenInputProps" ||
      (omitKeySet && omitKeySet.has(k))
    ) {
      if (!copy) {
        copy = {};
        for (let j = 0; j < i; j++) {
          const prevKey = keys[j];
          if (prevKey !== undefined) copy[prevKey] = (value as Record<string, any>)[prevKey];
        }
      }
      continue;
    }

    const cleaned = toSerializableSnapshot(item, visited);
    if (cleaned !== item && !copy) {
      copy = {};
      for (let j = 0; j < i; j++) {
        const prevKey = keys[j];
        if (prevKey !== undefined) copy[prevKey] = (value as Record<string, any>)[prevKey];
      }
    }
    if (copy) copy[k] = cleaned;
  }

  return (copy ?? value) as T;
}

export function connectToPage<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  machine: MiniappMachine<T>,
  instance: MiniAppInstance,
  connect: ConnectFn<T, Data>,
  key?: string,
  options?: ConnectOptions,
): () => void {
  const omitKeySet =
    options?.omitKeys && options.omitKeys.length > 0
      ? new Set(options.omitKeys)
      : undefined;
  let isMounted = false;
  let prevSnapshot: Record<string, any> | undefined;
  let pendingDelta: Record<string, any> = {};
  let isBatchScheduled = false;

  function flushSetData() {
    isBatchScheduled = false;
    (instance as any).__cuiPendingFlush = false;
    if (Object.keys(pendingDelta).length > 0 && instance && instance.setData) {
      const payload = pendingDelta;
      pendingDelta = {};
      instance.setData(payload);
    } else {
      (instance as any).__cui_computedEmitPending?.();
    }
  }

  const update = () => {
    const snapshot = connect(machine.service, normalizeProps);
    (instance as any).__codeUiApi = snapshot;
    (instance as any).__codeUiOnSnapshot?.(snapshot);

    const dataSnapshot = toSerializableSnapshot(snapshot, undefined, omitKeySet);
    const delta = diffSnapshot(prevSnapshot, dataSnapshot, key);
    prevSnapshot = dataSnapshot;

    if (!delta) {
      return;
    }

    if (!isMounted) {
      isMounted = true;
      if (
        typeof (instance as any).__cuiBufferMountData === "function" &&
        (instance as any).__cuiBufferMountData(delta)
      ) {
        return;
      }
      instance.setData(delta);
    } else {
      Object.assign(pendingDelta, delta);
      if (!isBatchScheduled) {
        isBatchScheduled = true;
        (instance as any).__cuiPendingFlush = true;
        queueMicrotask(flushSetData);
      }
    }
  };

  const dispose = effect(update);

  return () => {
    dispose();
    pendingDelta = {};
    isBatchScheduled = false;
    (instance as any).__cuiPendingFlush = false;
  };
}

export const connectToComponent = connectToPage;
