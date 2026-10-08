import { diffSnapshot } from "@code-ui/utils";
import type { MachineSchema, Service } from "@code-ui/core";
import { type MiniappMachine, nextTick } from "./machine";

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
  let isMounted = false;
  let prevSnapshot: Record<string, any> | undefined;
  let pendingDelta: Record<string, any> = {};
  let isBatchScheduled = false;

  function flushSetData() {
    isBatchScheduled = false;
    console.log(
      `[code-ui connect debug] flushSetData START, pendingDelta:`,
      pendingDelta,
    );
    if (Object.keys(pendingDelta).length > 0 && instance && instance.setData) {
      const payload = pendingDelta;
      pendingDelta = {};
      instance.setData(payload);
      console.log(
        `[code-ui connect debug] flushSetData DONE, payload sent to setData:`,
        payload,
      );
    }
  }

  const update = () => {
    const snapshot = connect(machine.service);
    (instance as any).__codeUiApi = snapshot;

    const delta = diffSnapshot(prevSnapshot, snapshot, key);
    prevSnapshot = snapshot;

    if (!delta) {
      return;
    }

    console.log(`[code-ui connect debug] Snapshot delta:`, delta);

    if (!isMounted) {
      isMounted = true;
      console.log(`[code-ui connect debug] First mount, sync setData`);
      instance.setData(delta);
    } else {
      Object.assign(pendingDelta, delta);
      if (!isBatchScheduled) {
        isBatchScheduled = true;
        console.log(
          `[code-ui connect debug] Scheduling flushSetData via nextTick`,
        );
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
