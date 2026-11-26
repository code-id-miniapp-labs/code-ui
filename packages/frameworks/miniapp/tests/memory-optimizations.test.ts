import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMachine } from "@code-id-labs/core";
import { MiniappMachine } from "../src/machine";
import { connectToComponent } from "../src/connect";
import { createMachineBehavior } from "../src/behavior";
import {
  __resetAppRegistry,
  createAppHostBehavior,
  registerAppHost,
  requestAppScale,
  unregisterAppHost,
} from "../src/behaviors/app";
import {
  __resetPageLifecycleHub,
  getPageLifecycleSubscriberCount,
} from "../src/behaviors/page-lifecycle";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("memory leak prevention & per-instance heap optimizations", () => {
  let origBehavior: unknown;

  beforeEach(() => {
    __resetAppRegistry();
    __resetPageLifecycleHub();
    origBehavior = (globalThis as Record<string, unknown>).Behavior;
    (globalThis as Record<string, unknown>).Behavior = (def: any) => def;
    delete (globalThis as Record<string, unknown>).getCurrentPages;
  });

  afterEach(() => {
    if (origBehavior === undefined) {
      delete (globalThis as Record<string, unknown>).Behavior;
    } else {
      (globalThis as Record<string, unknown>).Behavior = origBehavior;
    }
    delete (globalThis as Record<string, unknown>).getCurrentPages;
    vi.restoreAllMocks();
  });

  it("caps app pending queues, clears pending on unregisterAppHost, and clears page.__cuiApp on detach", () => {
    const page: Record<string, any> = { getPageId: () => "page-app-mem" };
    (globalThis as Record<string, unknown>).getCurrentPages = () => [page];

    // Enqueue 35 pending scale requests before any host mounts (cap is 20)
    const orphan: any = { getPageId: () => "page-app-mem" };
    for (let i = 0; i < 35; i++) {
      requestAppScale(orphan, { id: `req-${i}`, factor: 0.9 });
    }

    const reg = (globalThis as any).__CODE_UI_APP_REGISTRY__;
    expect(reg.pending.get("page-app-mem")?.length).toBeLessThanOrEqual(20);

    // Mount and detach <c-app> host -> page.__cuiApp cleared and pending cleaned
    const appDef = createAppHostBehavior({
      detectBars: () => {},
      extractTopBarHeight: () => 0,
      extractBottomBarHeight: () => 0,
    }) as any;
    const appHost: any = {
      getPageId: () => "page-app-mem",
      data: { autoDetectBars: false },
      setData: vi.fn(),
      applyHostState: vi.fn(),
    };
    appDef.lifetimes.attached.call(appHost);
    expect(page.__cuiApp).toBe(appHost);
    expect(reg.pending.has("page-app-mem")).toBe(false);

    appDef.lifetimes.detached.call(appHost);
    expect(page.__cuiApp).toBeUndefined();

    // Unregistering a host deletes any pending queue left for its pageId
    const secondHost: any = { getPageId: () => "page-pending-clear" };
    registerAppHost(secondHost);
    reg.pending.set("page-pending-clear", [() => {}]);
    unregisterAppHost(secondHost);
    expect(reg.pending.has("page-pending-clear")).toBe(false);
  });

  it("supports deferred: true with shouldStart and clears component references on detach", async () => {
    const modalMachine = createMachine({
      props: () => ({ open: false, defaultOpen: false }),
      initialState: ({ prop }) =>
        prop("open") || prop("defaultOpen") ? "open" : "closed",
      watch: ({ prop, state, track }) => {
        track([() => prop("open")], () => {
          state.set(prop("open") ? "open" : "closed");
        });
      },
      states: {
        closed: { on: { OPEN: { target: "open" } } },
        open: { on: { CLOSE: { target: "closed" } } },
      },
    });
    const connectModal = (service: any) => ({
      open: service.state.matches("open"),
      visible: service.state.matches("open"),
      openModal: () => service.send({ type: "OPEN" }),
      closeModal: () => service.send({ type: "CLOSE" }),
    });

    const behavior = createMachineBehavior({
      machine: modalMachine,
      connect: connectModal,
      key: "modal",
      deferred: true,
      shouldStart: (p) => Boolean(p.open || p.defaultOpen),
      exportApi: true,
      exportApiKeys: ["open", "visible", "openModal", "closeModal"],
    });

    const comp: any = {
      id: "m1",
      data: { open: false, defaultOpen: false },
      setData: vi.fn((patch: Record<string, unknown>) => {
        Object.assign(comp.data, patch);
      }),
    };

    behavior.lifetimes.attached.call(comp);
    // Remains cold while closed — zero setData calls and machine not started
    expect(comp.__codeUiDeferred).toBe(true);
    expect(comp.setData).not.toHaveBeenCalled();

    // Wakes lazily on exported imperative method call
    const exported = behavior.export.call(comp);
    expect(exported.open).toBe(false);
    exported.openModal();
    await flush();

    expect(comp.__codeUiDeferred).toBe(false);
    expect(exported.open).toBe(true);
    expect(comp.setData).toHaveBeenCalled();

    // Detached clears internal snapshot / API / listener references
    comp.__codeUiOnSnapshot = vi.fn();
    behavior.lifetimes.detached.call(comp);
    expect(comp.__codeUiMachine).toBeNull();
    expect(comp.__codeUiApi).toBeNull();
    expect(comp.__codeUiOnSnapshot).toBeUndefined();
    expect(comp.__codeUiDispose).toBeNull();
  });

  it("guards queued connectToComponent microtask flush after dispose()", async () => {
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "a",
        states: { a: { on: { GO: { target: "b" } } }, b: {} },
      }),
    );
    m.start();
    const emitPending = vi.fn();
    const inst: any = {
      data: {},
      setData: vi.fn(),
      __cui_computedEmitPending: emitPending,
    };

    const dispose = connectToComponent(
      m,
      inst,
      (svc) => ({ state: svc.state.get() }),
      "demo",
    );
    inst.setData.mockClear();

    m.send({ type: "GO" });
    dispose();
    await flush();
    await flush();

    expect(inst.setData).not.toHaveBeenCalled();
    expect(emitPending).not.toHaveBeenCalled();
    m.stop();
  });

  it("skips propCache computed allocation for non-reactive reads and releases component on stop()", () => {
    const comp = { id: "c1", triggerEvent: vi.fn() };
    const m = new MiniappMachine(
      createMachine({
        props: ({ props }) => ({ a: 1, b: 2, c: 3, ...props }),
        initialState: ({ prop }) => {
          void prop("a");
          void prop("b");
          return "idle";
        },
        states: { idle: {} },
      }),
      { component: comp, c: 99 },
    );
    // Reading props outside a reactive tracking scope should not populate propCache
    expect(m.prop("c")).toBe(99);
    expect((m as any).propCache.size).toBe(0);

    m.start();
    m.stop();
    expect(m.scope.component).toBeUndefined();
  });

  it("staticComputedBehavior computes chained getters with zero page-lifecycle subscribers", async () => {
    vi.resetModules();
    const { staticComputedBehavior, createComponentOptions } = await import(
      "../src/behaviors/computed-behavior"
    );
    const behaviorDef = staticComputedBehavior as any;

    const opts = createComponentOptions({
      behaviors: [staticComputedBehavior],
      slots: { leading: false },
      properties: {
        name: { type: String, value: "check" },
        size: { type: String, value: "md" },
        ui: { type: Object, value: {} },
      },
      computed: {
        resolvedName() {
          return `icon:${this.data.name}`;
        },
        classes() {
          return {
            root: `sz-${this.data.size} ${this.data.resolvedName}`,
            icon: this.data.slots.leading ? "has-lead" : "no-lead",
          };
        },
      },
    });

    // createComponentOptions must not append heavy computedBehavior alongside staticComputedBehavior
    expect(opts.behaviors).toEqual([staticComputedBehavior]);

    behaviorDef.definitionFilter(opts);

    const setDataCalls: Record<string, any>[] = [];
    const inst: any = {
      getPageId: () => "page-static-1",
      data: {
        name: "star",
        size: "lg",
        ui: {},
        slots: { leading: false },
      },
      ...opts.methods,
      setData(patch: Record<string, any>) {
        setDataCalls.push(patch);
        for (const [k, v] of Object.entries(patch)) {
          if (k.includes(".")) {
            const [head, tail] = k.split(".");
            if (head && tail && inst.data[head]) {
              inst.data[head][tail] = v;
            }
          } else {
            inst.data[k] = v;
          }
        }
      },
    };

    opts.lifetimes.created.call(inst);
    behaviorDef.lifetimes.attached.call(inst);

    // Zero page-lifecycle registrations for static Tier-1 components
    expect(getPageLifecycleSubscriberCount("page-static-1")).toBe(0);
    expect(inst.data.resolvedName).toBe("icon:star");
    expect(inst.data.classes).toEqual({
      root: "sz-lg icon:star",
      icon: "no-lead",
    });
    expect(setDataCalls).toHaveLength(1);

    // Updating a prop triggers batched observer and sub-path diffs `classes.root`
    setDataCalls.length = 0;
    inst.data.size = "sm";
    const obsKey = Object.keys(opts.observers).find((k) => k.includes("size"));
    expect(obsKey).toBeDefined();
    if (obsKey) {
      opts.observers[obsKey].call(inst);
    }
    expect(setDataCalls).toEqual([{ "classes.root": "sz-sm icon:star" }]);

    // Updating slots via slots.** observer updates `classes.icon`
    setDataCalls.length = 0;
    opts.observers["slots.**"].call(inst, { leading: true });
    expect(setDataCalls).toEqual([{ "classes.icon": "has-lead" }]);

    behaviorDef.lifetimes.detached.call(inst);
  });
});
