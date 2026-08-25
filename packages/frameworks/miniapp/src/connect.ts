/// <reference types="miniprogram-api-typings" />

import { effect, effectScope, signal } from "alien-signals";
import { subscribeConfig } from "@code-ui/core";
import type { MachineSchema, Service } from "@code-ui/core";
import type { MiniappMachine } from "./machine";

export type MiniAppInstance = WechatMiniprogram.Component.TrivialInstance;

export type ConnectFn<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> = (service: Service<T>) => Data;

/**
 * Computes a dirty path-based delta between previous and next snapshots.
 * e.g. { "drawer.open": true } rather than sending the full 15-property object.
 * Returns null if nothing changed.
 */
function diffSnapshot(
  prev: Record<string, any> | undefined,
  next: Record<string, any>,
  prefix?: string,
): Record<string, any> | null {
  if (!prev) {
    return prefix ? { [prefix]: next } : next;
  }

  const delta: Record<string, any> = {};
  let hasDiff = false;

  for (const k of Object.keys(next)) {
    const path = prefix ? `${prefix}.${k}` : k;
    const pVal = prev[k];
    const nVal = next[k];

    if (pVal !== nVal) {
      if (
        pVal &&
        nVal &&
        typeof pVal === "object" &&
        typeof nVal === "object" &&
        !Array.isArray(pVal) &&
        !Array.isArray(nVal)
      ) {
        const sub = diffSnapshot(pVal, nVal, path);
        if (sub) {
          Object.assign(delta, sub);
          hasDiff = true;
        }
      } else {
        delta[path] = nVal;
        hasDiff = true;
      }
    }
  }

  return hasDiff ? delta : null;
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
  let disposeEffect: (() => void) | null = null;
  let isMounted = false;
  let prevSnapshot: Record<string, any> | undefined;
  let pendingDelta: Record<string, any> = {};
  let isBatchScheduled = false;

  const configVersion = signal(0);
  const unsubConfig = subscribeConfig(() => configVersion(configVersion() + 1));

  function flushSetData() {
    isBatchScheduled = false;
    if (Object.keys(pendingDelta).length > 0 && instance && instance.setData) {
      const payload = pendingDelta;
      pendingDelta = {};
      instance.setData(payload);
    }
  }

  const stopScope = effectScope(() => {
    disposeEffect = effect(() => {
      configVersion();
      const snapshot = connect(machine.service);

      const delta = diffSnapshot(prevSnapshot, snapshot, key);
      prevSnapshot = snapshot;

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
          queueMicrotask(flushSetData);
        }
      }
    });
  });

  return () => {
    unsubConfig();
    disposeEffect?.();
    stopScope();
    pendingDelta = {};
    isBatchScheduled = false;
  };
}

export const connectToComponent = connectToPage;
