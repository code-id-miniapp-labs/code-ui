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
 */
function toSerializableSnapshot<T>(value: T, seen = new WeakSet<object>()): T {
  if (Array.isArray(value)) {
    if (seen.has(value)) return value;
    seen.add(value);

    let changed = false;
    const next = value.map((item) => {
      const cleaned = toSerializableSnapshot(item, seen);
      if (cleaned !== item) changed = true;
      return cleaned;
    });
    return (changed ? next : value) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }
  seen.add(value);

  let next: Record<string, any> | null = null;
  for (const key of Object.keys(value)) {
    const item = (value as Record<string, any>)[key];
    if (typeof item === "function") {
      if (!next) next = { ...value };
      delete next[key];
      continue;
    }

    const cleaned = toSerializableSnapshot(item, seen);
    if (cleaned !== item) {
      if (!next) next = { ...value };
      next[key] = cleaned;
    }
  }

  return (next ?? value) as T;
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
        nextTick(flushSetData);
      }
    }
  };

  const unsubscribe = machine.subscribe(update);
  update(); // Initial sync

  return () => {
    unsubscribe();
    pendingDelta = {};
    isBatchScheduled = false;
  };
}

export const connectToComponent = connectToPage;
