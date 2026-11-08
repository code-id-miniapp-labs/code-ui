import { effect } from "alien-signals";
import { diffSnapshot, isPlainObject } from "@code-ui/utils";
import type { MachineSchema, Service } from "@code-ui/core";
import { type MiniappMachine, nextTick } from "./machine";
import { normalizeProps } from "./normalize-props";

export type MiniAppInstance = WechatMiniprogram.Component.TrivialInstance;

export type ConnectFn<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> = (service: Service<T>, ...args: any[]) => Data;

/**
 * Remove function values before diffing/setData. Connect snapshots expose
 * methods for `__codeUiApi`, but WeChat cannot serialize functions into data.
 * Avoids `delete` to preserve object hidden classes on the hot path.
 */
function toSerializableSnapshot<T>(value: T, seen?: WeakSet<object>): T {
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
      k === "tabIndex"
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
): () => void {
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
    }
  }

  const update = () => {
    const snapshot = connect(machine.service, normalizeProps);
    (instance as any).__codeUiApi = snapshot;
    (instance as any).__codeUiOnSnapshot?.(snapshot);

    const dataSnapshot = toSerializableSnapshot(snapshot);
    const delta = diffSnapshot(prevSnapshot, dataSnapshot, key);
    prevSnapshot = dataSnapshot;

    if (!delta) {
      return;
    }

    if (!isMounted) {
      isMounted = true;
      instance.setData(delta);
    } else {
      Object.assign(pendingDelta, delta);
      if (!isBatchScheduled) {
        isBatchScheduled = true;
        (instance as any).__cuiPendingFlush = true;
        nextTick(flushSetData);
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
