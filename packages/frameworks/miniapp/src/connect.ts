import { effect, effectScope, signal } from "alien-signals";
import { subscribeConfig } from "@code-ui/core";
import { diffSnapshot } from "@code-ui/utils";
import type { MachineSchema, Service } from "@code-ui/core";
import type { MiniappMachine } from "./machine";

export type MiniAppInstance = WechatMiniprogram.Component.TrivialInstance;

export type ConnectFn<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> = (service: Service<T>) => Data;

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
