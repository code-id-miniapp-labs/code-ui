import { afterEach, describe, expect, it, vi } from "vitest";
import { createMachine } from "@code-id-labs/core";

(globalThis as any).Behavior = vi.fn((def: any) => def);

const flushMicrotasks = () =>
  new Promise<void>((resolve) => queueMicrotask(() => queueMicrotask(resolve)));

describe("setData latency & IPC call minimization", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).wx;
    vi.clearAllMocks();
  });

  it("coalesces appThemeBehavior + machineBehavior + computedBehavior mount into a single setData call", async () => {
    const { computedBehavior } = await import(
      "../src/behaviors/computed-behavior"
    );
    const { createAppThemeBehavior, __resetThemeRegistry } = await import(
      "../src/behaviors/theme"
    );
    const { createMachineBehavior } = await import("../src/behavior");
    __resetThemeRegistry();

    const dummyDrawerMachine = createMachine({
      props: ({ props }) => ({ open: false, ...props }),
      initialState: ({ prop }) => (prop("open") ? "open" : "closed"),
      states: {
        closed: { on: { OPEN: { target: "open" } } },
        open: { on: { CLOSE: { target: "closed" } } },
      },
    });

    const themeDef = createAppThemeBehavior() as any;
    const machineDef = createMachineBehavior({
      machine: dummyDrawerMachine,
      connect: (service) => ({
        state: service.state.get(),
        open: service.state.matches("open"),
      }),
      key: "drawer",
    }) as any;
    const computedDef = computedBehavior as any;

    const defFields: any = {
      data: { ...themeDef.data },
      properties: {
        open: { type: Boolean, value: false },
        placement: { type: String, value: "bottom" },
      },
      computed: {
        classes(this: any) {
          return {
            root: "fixed inset-0",
            backdrop: this.data.drawer?.open ? "opacity-100" : "opacity-0",
            content: `sheet-${this.data.placement}`,
          };
        },
      },
    };
    computedDef.definitionFilter(defFields);

    const ipcCalls: Record<string, any>[] = [];
    const instance: any = {
      id: "drawer-perf-1",
      data: {
        ...defFields.data,
        open: true,
        placement: "bottom",
      },
      ...defFields.methods,
      setData(payload: Record<string, any>, cb?: () => void) {
        ipcCalls.push(payload);
        Object.assign(this.data, payload);
        cb?.();
      },
    };

    // Simulate WeChat lifecycle order: created -> attached across all 3 behaviors
    computedDef.lifetimes.created.call(instance);
    themeDef.lifetimes.attached.call(instance);
    machineDef.lifetimes.attached.call(instance);
    computedDef.lifetimes.attached.call(instance);

    // Previously emitted 3 separate IPC setData calls; now strictly 1 merged call!
    expect(ipcCalls).toHaveLength(1);
    expect(ipcCalls[0]).toMatchObject({
      drawer: { state: "open", open: true },
      classes: {
        root: "fixed inset-0",
        backdrop: "opacity-100",
        content: "sheet-bottom",
      },
    });

    themeDef.lifetimes.detached.call(instance);
    machineDef.lifetimes.detached.call(instance);
    computedDef.lifetimes.detached.call(instance);
  });

  it("diffs multi-slot object computeds into granular sub-paths (`classes.<slot>`) and skips unchanged primitives", async () => {
    const { setupComputed } = await import(
      "../src/behaviors/computed-behavior"
    );

    const ipcCalls: Record<string, any>[] = [];
    const unrelatedSpy = vi.fn(function (this: any) {
      return `title:${this.data.title}`;
    });

    const instance: any = {
      data: {
        open: false,
        isOtpError: false,
        title: "Verify",
      },
      setData(payload: Record<string, any>, cb?: () => void) {
        ipcCalls.push(payload);
        Object.assign(this.data, payload);
        cb?.();
      },
    };

    setupComputed(instance, {
      headerLabel: unrelatedSpy,
      classes() {
        return {
          root: "fixed inset-0 z-drawer flex overflow-hidden",
          backdrop: this.data.open
            ? "fixed inset-0 bg-black/40 opacity-100"
            : "fixed inset-0 bg-black/40 opacity-0",
          content: "relative z-10 flex bg-default shadow-2xl rounded-t-xl",
          header: "flex items-center justify-between px-4 py-3",
          body: "min-h-0 w-full overflow-y-auto px-4 pt-3 pb-6",
          footer: "flex items-center justify-end gap-2 px-4 py-3",
        };
      },
    });

    const mountBytes = Buffer.byteLength(JSON.stringify(ipcCalls[0]), "utf8");
    ipcCalls.length = 0;
    unrelatedSpy.mockClear();

    // 1. No-op primitive setData (`isOtpError: false` when already `false`) -> 0 IPC calls!
    instance.setData({ isOtpError: false });
    expect(ipcCalls).toHaveLength(0);
    expect(unrelatedSpy).not.toHaveBeenCalled();

    // 2. Toggle `open: true` -> only `open` and `classes.backdrop` are sent, NOT all 6 slots,
    //    and `headerLabel` getter does not re-run at all!
    instance.setData({ open: true });
    expect(ipcCalls).toHaveLength(1);
    expect(unrelatedSpy).not.toHaveBeenCalled();
    expect(Object.keys(ipcCalls[0] ?? {})).toEqual(["open", "classes.backdrop"]);
    expect(instance.data.classes.backdrop).toContain("opacity-100");

    const updateBytes = Buffer.byteLength(JSON.stringify(ipcCalls[0]), "utf8");
    expect(updateBytes).toBeLessThan(mountBytes * 0.35);
  });

  it("flushes machine + computed updates in < 10ms via microtask even when wx.nextTick is stalled (150ms)", async () => {
    // Simulate a congested Android WeChat bridge where `wx.nextTick` stalls for 150ms
    (globalThis as Record<string, unknown>).wx = {
      nextTick: (cb: () => void) => setTimeout(cb, 150),
    };

    const { MiniappMachine } = await import("../src/machine");
    const { connectToComponent } = await import("../src/connect");
    const { setupComputed } = await import(
      "../src/behaviors/computed-behavior"
    );

    const toggleMachine = createMachine({
      initialState: () => "closed",
      states: {
        closed: { on: { OPEN: { target: "open" } } },
        open: { on: { CLOSE: { target: "closed" } } },
      },
    });

    const ipcCalls: Record<string, any>[] = [];
    const instance: any = {
      data: {},
      setData(payload: Record<string, any>) {
        ipcCalls.push(payload);
        Object.assign(this.data, payload);
      },
    };

    setupComputed(instance, {
      classes() {
        return {
          root: "fixed inset-0",
          backdrop: this.data.drawer?.open ? "open" : "closed",
        };
      },
    });

    const machine = new MiniappMachine(toggleMachine);
    machine.start();
    const dispose = connectToComponent(
      machine,
      instance,
      (s) => ({
        state: s.state.get(),
        open: s.state.matches("open"),
      }),
      "drawer",
    );
    ipcCalls.length = 0;

    const start = performance.now();
    machine.send({ type: "OPEN" });
    await flushMicrotasks();
    const elapsedMs = performance.now() - start;

    // Must complete in a single microtask (< 15ms, well below 60ms budget) without waiting 150ms for wx.nextTick
    expect(elapsedMs).toBeLessThan(15);
    expect(ipcCalls).toHaveLength(1);
    expect(ipcCalls[0]).toMatchObject({
      "drawer.state": "open",
      "drawer.open": true,
      "classes.backdrop": "open",
    });

    dispose();
    machine.stop();
  });
});
