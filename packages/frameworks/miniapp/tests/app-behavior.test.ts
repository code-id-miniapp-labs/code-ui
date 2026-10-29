import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  __resetAppRegistry,
  cuiAppChildBehavior,
  cuiAppParentBehavior,
  getPageAppSignals,
  isScrollLocked,
  isAppScaled,
  linkAppChildToParent,
  registerAppHost,
  setupAppRelations,
  unlinkAppChildFromParent,
  unregisterAppHost,
  withAppInset,
  withScrollLock,
  withAppScale,
} from "../src/behaviors/app";

// Mock global Behavior for Node test environment
(globalThis as any).Behavior = vi.fn((config: any) => ({
  ...config,
  __isMockBehavior: true,
}));

let pageStack: any[] = [];

function createHost(pageId: string) {
  const instance = { getPageId: () => pageId };
  const onChange = vi.fn();
  registerAppHost(instance, { onChange });
  return { instance, onChange };
}

beforeEach(() => {
  __resetAppRegistry();
  pageStack = [];
  (globalThis as any).getCurrentPages = () => pageStack;
});

afterEach(() => {
  delete (globalThis as any).getCurrentPages;
  delete (globalThis as any).wx;
});

describe("setupAppRelations", () => {
  it("configures cuiAppChild descendant relation on parent", () => {
    const rels: Record<string, any> = {};
    setupAppRelations(rels, "parent");
    expect(rels.cuiAppChild).toBeDefined();
    expect(rels.cuiAppChild.type).toBe("descendant");
    expect(rels.cuiAppChild.target).toBe(cuiAppChildBehavior);
    expect(typeof rels.cuiAppChild.linked).toBe("function");
    expect(typeof rels.cuiAppChild.unlinked).toBe("function");
  });

  it("configures cuiAppParent ancestor relation on child", () => {
    const rels: Record<string, any> = {};
    setupAppRelations(rels, "child");
    expect(rels.cuiAppParent).toBeDefined();
    expect(rels.cuiAppParent.type).toBe("ancestor");
    expect(rels.cuiAppParent.target).toBe(cuiAppParentBehavior);
    expect(typeof rels.cuiAppParent.linked).toBe("function");
    expect(typeof rels.cuiAppParent.unlinked).toBe("function");
  });

  it("links child to parent and syncs lock status", () => {
    const host = createHost("p1");
    const parent = host.instance;
    const child: any = {
      __cuiScrollLocked: true,
      __cuiScrollLockId: "drawer:1",
    };

    linkAppChildToParent(parent, child);
    expect(child.__cuiAppParent).toBe(parent);
    expect(isScrollLocked(child)).toBe(true);

    unlinkAppChildFromParent(parent, child);
    expect(child.__cuiAppParent).toBeUndefined();
    expect(isScrollLocked(parent)).toBe(false);
  });
});

describe("withScrollLock plugin", () => {
  it("locks and unlocks scroll on machine state transitions", () => {
    pageStack = [{ getPageId: () => "p1" }];
    const host = createHost("p1");
    const plugin = withScrollLock({ idPrefix: "test-lock" });

    const instance: any = {
      data: { lockScroll: true },
      getPageId: () => "p1",
    };

    plugin.onAttached?.(instance, {});
    expect(instance.__cuiScrollLockId).toBe("test-lock:1");
    expect(isScrollLocked(instance)).toBe(false);

    let subscriber: ((service: any) => void) | undefined;
    let currentState: any = { hasTag: (t: string) => t === "closed", value: "closed" };

    const mockMachine: any = {
      service: {
        get state() {
          return currentState;
        },
      },
      subscribe(fn: any) {
        subscriber = fn;
        return vi.fn();
      },
    };

    plugin.onMachineStarted?.(instance, mockMachine);
    expect(isScrollLocked(instance)).toBe(false);

    // Transition to open
    currentState = { hasTag: (t: string) => t === "open", value: "open" };
    subscriber?.(mockMachine.service);
    expect(isScrollLocked(instance)).toBe(true);

    // Transition back to closed
    currentState = { hasTag: () => false, value: "closed" };
    subscriber?.(mockMachine.service);
    expect(isScrollLocked(instance)).toBe(false);

    unregisterAppHost(host.instance);
  });

  it("respects lockScroll: false prop", () => {
    pageStack = [{ getPageId: () => "p1" }];
    createHost("p1");
    const plugin = withScrollLock();

    const instance: any = {
      data: { lockScroll: false },
      getPageId: () => "p1",
    };

    plugin.onAttached?.(instance, {});

    const currentState: any = { hasTag: (t: string) => t === "open", value: "open" };
    const mockMachine: any = {
      service: {
        get state() {
          return currentState;
        },
      },
      subscribe() {
        return vi.fn();
      },
    };

    instance.__codeUiMachine = mockMachine;
    plugin.onMachineStarted?.(instance, mockMachine);

    // Should NOT lock because lockScroll is false
    expect(isScrollLocked(instance)).toBe(false);

    // Now prop changes to true
    instance.data.lockScroll = true;
    plugin.onPropChanged?.(instance, "lockScroll", true);
    expect(isScrollLocked(instance)).toBe(true);

    // Detach cleans up
    plugin.onDetached?.(instance);
    expect(isScrollLocked(instance)).toBe(false);
  });
});

describe("withAppScale plugin", () => {
  it("scales and un-scales background on machine state and prop changes", () => {
    pageStack = [{ getPageId: () => "p1" }];
    const host = createHost("p1");
    const plugin = withAppScale({ idPrefix: "test-scale" });

    const instance: any = {
      data: {
        shouldScaleBackground: true,
        scaleFactor: 0.92,
        scaleBackground: "bg-neutral-950",
      },
      getPageId: () => "p1",
    };

    plugin.onAttached?.(instance, {});
    expect(instance.__cuiScaleId).toBe("test-scale:1");
    expect(isAppScaled(instance)).toBe(false);

    let subscriber: ((service: any) => void) | undefined;
    let currentState: any = { hasTag: (t: string) => t === "closed", value: "closed" };

    const mockMachine: any = {
      service: {
        get state() {
          return currentState;
        },
      },
      subscribe(fn: any) {
        subscriber = fn;
        return vi.fn();
      },
    };

    instance.__codeUiMachine = mockMachine;
    plugin.onMachineStarted?.(instance, mockMachine);
    expect(isAppScaled(instance)).toBe(false);

    // Open drawer
    currentState = { hasTag: (t: string) => t === "open", value: "open" };
    subscriber?.(mockMachine.service);

    expect(isAppScaled(instance)).toBe(true);
    expect(host.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        scale: {
          scaled: true,
          factor: 0.92,
          background: "bg-neutral-950",
        },
      }),
    );

    // Close drawer
    currentState = { hasTag: (t: string) => t === "closed", value: "closed" };
    subscriber?.(mockMachine.service);

    expect(isAppScaled(instance)).toBe(false);
    expect(host.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        scale: {
          scaled: false,
          factor: 1,
        },
      }),
    );

    // Detach cleans up
    plugin.onDetached?.(instance);
    expect(isAppScaled(instance)).toBe(false);
  });
});

describe("withAppInset behavior", () => {
  it("registers and unregisters layout insets", () => {
    pageStack = [{ getPageId: () => "p1" }];
    const host = createHost("p1");
    const signals = getPageAppSignals(host.instance);
    const behaviorDef = withAppInset({ edge: "top", idPrefix: "banner" });

    const instance: any = {
      data: { mode: "stack" },
      getPageId: () => "p1",
    };

    behaviorDef.lifetimes.attached.call(instance);
    expect(instance.__cuiInsetId).toBe("banner:1");

    // Register 48px
    behaviorDef.methods.setAppInset.call(instance, 48);
    expect(signals.insets().top).toBe(48);

    // Switch to overlay mode -> unregisters
    instance.data.mode = "overlay";
    behaviorDef.methods.setAppInset.call(instance, 48);
    expect(signals.insets().top).toBe(0);

    // Back to stack and detach
    instance.data.mode = "stack";
    behaviorDef.methods.setAppInset.call(instance, 48);
    expect(signals.insets().top).toBe(48);

    behaviorDef.lifetimes.detached.call(instance);
    expect(signals.insets().top).toBe(0);
  });
});

describe("Hybrid host resolution (relations + fallback)", () => {
  it("resolves host directly via getRelationNodes when inside template", () => {
    const hostInstance = { id: "host-1", getPageId: () => "p1" };
    registerAppHost(hostInstance);

    const childInstance = {
      id: "child-1",
      getRelationNodes(type: string) {
        if (type === "cuiAppParent") return [hostInstance];
        return [];
      },
      getPageId: () => "different-or-undefined-page",
    };

    const plugin = withScrollLock();
    plugin.onAttached?.(childInstance, {});

    const mockMachine: any = {
      service: { state: { hasTag: () => true } },
      subscribe: (fn: any) => {
        fn();
        return vi.fn();
      },
    };

    plugin.onMachineStarted?.(childInstance, mockMachine);
    expect(isScrollLocked(childInstance)).toBe(true);
    expect(getPageAppSignals(hostInstance).locked()).toBe(true);

    plugin.onDetached?.(childInstance);
    expect(isScrollLocked(childInstance)).toBe(false);
    expect(getPageAppSignals(hostInstance).locked()).toBe(false);
  });

  it("coordinates scroll lock when drawer machine prop changes", async () => {
    const pageInstance: any = {
      route: "pages/drawer/index",
      data: {},
      setData: vi.fn((patch: any) => {
        Object.assign(pageInstance.data, patch);
      }),
    };
    pageStack = [pageInstance];

    const appInstance: any = {
      data: { locked: false },
      selectOwnerComponent: () => null,
      setData: vi.fn((patch: any) => {
        Object.assign(appInstance.data, patch);
      }),
      applyHostState(state: any) {
        const wantLock = Boolean(state.locked);
        if (wantLock !== Boolean(this.data.locked)) {
          this.data.locked = wantLock;
          pageInstance.setData({
            cuiPageStyle: wantLock ? "overflow: hidden;" : "",
          });
        }
      },
    };

    registerAppHost(appInstance, {
      onChange: (state) => appInstance.applyHostState(state),
    });

    const { drawerMachine, defaultDrawerProps } = await import("@code-ui/drawer");
    const { createMachineBehavior } = await import("../src/behavior");

    const drawerBehavior = createMachineBehavior({
      machine: drawerMachine,
      key: "drawer",
      plugins: [
        withScrollLock({
          idPrefix: "drawer",
        }),
      ],
    });

    const drawerInstance: any = {
      data: {
        ...defaultDrawerProps,
        open: false,
        lockScroll: true,
      },
      setData: vi.fn((patch: any) => {
        Object.assign(drawerInstance.data, patch);
      }),
    };

    drawerBehavior.lifetimes.attached.call(drawerInstance);

    // Initial state: not locked
    expect(pageInstance.data.cuiPageStyle).toBeUndefined();

    // Now page updates drawerOpen prop to true: observer for 'open' fires
    drawerBehavior.observers.open.call(drawerInstance, true);

    // Wait for microtask / drain
    await new Promise((r) => setTimeout(r, 20));

    console.log("TEST RESULT:", {
      drawerState: drawerInstance.__codeUiMachine.state.get(),
      drawerLocked: drawerInstance.__cuiScrollLocked,
      pageData: pageInstance.data,
      appLocked: appInstance.data.locked,
    });

    expect(drawerInstance.__cuiScrollLocked).toBe(true);
    expect(pageInstance.data.cuiPageStyle).toBe("overflow: hidden;");
  });
});
