import { describe, it, expect } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { buttonMachine } from "../src/button.machine";
import { connectButton } from "../src/button.connect";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("Button via component triggerEvent (page async handler)", () => {
  it("leaves loading after the page's async handler resolves", async () => {
    const page: Record<string, any> = {
      async increment() {
        await sleep(20);
      },
    };
    (globalThis as any).getCurrentPages = () => [page];

    const component = {
      selectOwnerComponent: () => null,
      triggerEvent: (name: string) => {
        if (name === "tap") page.increment();
      },
    };

    const machine = new MiniappMachine(buttonMachine, {
      component,
      loadingAuto: true,
      autoResetDuration: 30,
    } as any);

    const snapshots: boolean[] = [];
    machine.subscribe((service) => {
      snapshots.push(connectButton(service as any).loading);
    });
    machine.start();

    connectButton(machine.service).handleTap({});
    await sleep(5);
    expect(machine.state.get()).toBe("loading");

    await sleep(60);
    expect(machine.state.get()).not.toBe("loading");
    expect(machine.computed("isLoading")).toBe(false);
    expect(snapshots[snapshots.length - 1]).toBe(false);

    machine.stop();
  });
});
