import { describe, it, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { buttonMachine } from "../src/button.machine";
import { connectButton } from "../src/button.connect";
import { diffSnapshot } from "@code-ui/utils";
import { effectScope, effect } from "alien-signals";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nextTick = (fn: VoidFunction) => queueMicrotask(fn);

describe("Button setData propagation", () => {
  it("calls setData with correct loading state", async () => {
    let capturedPromise: Promise<any>;
    const page: Record<string, any> = {
      increment() {
        capturedPromise = sleep(20);
        return capturedPromise;
      },
    };
    
    const setDataMock = vi.fn((data) => console.log("MOCK CALL", data));
    const instance = {
      selectOwnerComponent: () => null,
      triggerEvent: (name: string) => {
        if (name === "tap") return page.increment();
      },
      setData: setDataMock
    };

    const machine = new MiniappMachine(buttonMachine, {
      component: instance,
      loadingAuto: true,
      autoResetDuration: 30,
    } as any);

    machine.start();

    let prevSnapshot: any;
    let isMounted = false;
    let pendingDelta: any = {};
    let isBatchScheduled = false;

    function flushSetData() {
      isBatchScheduled = false;
      if (Object.keys(pendingDelta).length > 0 && instance && instance.setData) {
        const payload = pendingDelta;
        pendingDelta = {};
        instance.setData(payload);
      }
    }

    const scope = effectScope(() => {
      effect(() => {
        try {
          const snapshot = connectButton(machine.service);
          console.log("CONNECT EVAL, loading=", snapshot.loading);
          
          const delta = diffSnapshot(prevSnapshot, snapshot, "button");
          prevSnapshot = snapshot;

          if (!delta) return;

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
        } catch (err) {
          console.error("EFFECT ERROR", err);
        }
      });
    });

    console.log("handleTap");
    connectButton(machine.service).handleTap({});
    await sleep(5);
    
    console.log("calls after tap:", setDataMock.mock.calls.length);

    await sleep(60);
    console.log("calls after resolve:", setDataMock.mock.calls.length);
    
    scope();
    machine.stop();
  });
});
