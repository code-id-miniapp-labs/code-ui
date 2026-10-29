import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  __resetAppRegistry,
  appMetricsSignal,
  getAppHost,
  getAppMetrics,
  getAppState,
  getPageAppSignals,
  isScrollLocked,
  lockScroll,
  refreshAppMetrics,
  registerAppHost,
  registerInset,
  setAppHostVisible,
  unlockScroll,
  unregisterAppHost,
  unregisterInset,
} from "../src/utils/app";
import type { AppHostState } from "../src/utils/app";

let pageStack: any[] = [];

function createPage(id: string) {
  return { getPageId: () => id };
}

function createInstance(pageId: string) {
  return { getPageId: () => pageId };
}

function createHost(pageId: string) {
  const instance = createInstance(pageId);
  const onChange = vi.fn<(state: AppHostState) => void>();
  return {
    instance,
    onChange,
    register: () => registerAppHost(instance, { onChange }),
  };
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

describe("app registry — host resolution", () => {
  it("resolves descendants to the host on the same page", () => {
    pageStack = [createPage("p1"), createPage("p2")];
    const h1 = createHost("p1");
    const h2 = createHost("p2");
    h1.register();
    h2.register();

    expect(getAppHost(createInstance("p1"))).toBe(h1.instance);
    expect(getAppHost(createInstance("p2"))).toBe(h2.instance);
  });

  it("resolves owner-less calls to the top page host", () => {
    pageStack = [createPage("p1"), createPage("p2")];
    const h1 = createHost("p1");
    const h2 = createHost("p2");
    h1.register();
    h2.register();
    expect(getAppHost()).toBe(h2.instance);

    pageStack = [createPage("p1")];
    expect(getAppHost()).toBe(h1.instance);
  });

  it("falls back to the most recently shown host without getCurrentPages", () => {
    delete (globalThis as any).getCurrentPages;
    const h1 = createHost("p1");
    const h2 = createHost("p2");
    h1.register();
    h2.register();
    setAppHostVisible(h2.instance, false);
    expect(getAppHost()).toBe(h1.instance);
  });

  it("stops resolving after unregister", () => {
    pageStack = [createPage("p1")];
    const h1 = createHost("p1");
    h1.register();
    unregisterAppHost(h1.instance);
    expect(getAppHost(createInstance("p1"))).toBeUndefined();
  });
});

describe("app registry — insets and signals", () => {
  it("sums insets per edge, updates signals, and notifies the host", () => {
    pageStack = [createPage("p1")];
    const host = createHost("p1");
    host.register();
    const owner = createInstance("p1");
    const signals = getPageAppSignals(host.instance);

    registerInset(owner, { id: "a", edge: "top", size: 40 });
    registerInset(owner, { id: "b", edge: "top", size: 24 });
    registerInset(owner, { id: "c", edge: "bottom", size: 50 });

    expect(signals.insets()).toEqual({ top: 64, bottom: 50 });
    expect(getAppState(owner).insets).toEqual({ top: 64, bottom: 50 });
    expect(host.onChange).toHaveBeenLastCalledWith({
      insets: { top: 64, bottom: 50 },
      locked: false,
      scale: { scaled: false, factor: 1 },
    });

    unregisterInset(owner, "a");
    expect(signals.insets()).toEqual({ top: 24, bottom: 50 });
    expect(getAppState(owner).insets).toEqual({ top: 24, bottom: 50 });
  });

  it("isolates signals per instance via WeakMap", () => {
    const inst1 = createInstance("p1");
    const inst2 = createInstance("p2");
    const sig1 = getPageAppSignals(inst1);
    const sig2 = getPageAppSignals(inst2);

    expect(sig1).not.toBe(sig2);
    expect(getPageAppSignals(inst1)).toBe(sig1);
  });

  it("does not notify when an inset is re-registered unchanged", () => {
    pageStack = [createPage("p1")];
    const host = createHost("p1");
    host.register();
    const owner = createInstance("p1");

    registerInset(owner, { id: "a", edge: "top", size: 40 });
    const calls = host.onChange.mock.calls.length;
    registerInset(owner, { id: "a", edge: "top", size: 40 });
    expect(host.onChange.mock.calls.length).toBe(calls);
  });

  it("ignores negative / non-finite sizes", () => {
    pageStack = [createPage("p1")];
    createHost("p1").register();
    const owner = createInstance("p1");
    registerInset(owner, { id: "a", edge: "top", size: -10 });
    registerInset(owner, { id: "b", edge: "top", size: Number.NaN });
    expect(getAppState(owner).insets.top).toBe(0);
  });

  it("queues registrations made before the host attaches", () => {
    pageStack = [createPage("p1")];
    const owner = createInstance("p1");
    registerInset(owner, { id: "a", edge: "top", size: 30 });

    const host = createHost("p1");
    host.register();
    expect(getAppState(owner).insets.top).toBe(30);
    expect(host.onChange).toHaveBeenLastCalledWith({
      insets: { top: 30, bottom: 0 },
      locked: false,
      scale: { scaled: false, factor: 1 },
    });
  });
});

describe("app registry — scroll lock and signals", () => {
  it("is ref-counted across lock ids and updates locked signal", () => {
    pageStack = [createPage("p1")];
    const host = createHost("p1");
    host.register();
    const owner = createInstance("p1");
    const signals = getPageAppSignals(host.instance);

    lockScroll(owner, "drawer:1");
    lockScroll(owner, "drawer:2");
    expect(signals.locked()).toBe(true);
    expect(isScrollLocked(owner)).toBe(true);

    unlockScroll(owner, "drawer:1");
    expect(signals.locked()).toBe(true);
    expect(isScrollLocked(owner)).toBe(true);

    unlockScroll(owner, "drawer:2");
    expect(signals.locked()).toBe(false);
    expect(isScrollLocked(owner)).toBe(false);
  });

  it("only notifies on lock state transitions", () => {
    pageStack = [createPage("p1")];
    const host = createHost("p1");
    host.register();
    const owner = createInstance("p1");
    host.onChange.mockClear();

    lockScroll(owner, "a");
    lockScroll(owner, "b");
    unlockScroll(owner, "a");
    unlockScroll(owner, "b");

    expect(host.onChange.mock.calls.map((c) => c[0].locked)).toEqual([
      true,
      false,
    ]);
  });

  it("keeps locks isolated per page", () => {
    pageStack = [createPage("p1"), createPage("p2")];
    createHost("p1").register();
    createHost("p2").register();

    lockScroll(createInstance("p1"), "a");
    expect(isScrollLocked(createInstance("p1"))).toBe(true);
    expect(isScrollLocked(createInstance("p2"))).toBe(false);
  });

  it("cancels a queued lock when unlocked before the host attaches", () => {
    pageStack = [createPage("p1")];
    const owner = createInstance("p1");
    lockScroll(owner, "a");
    unlockScroll(owner, "a");

    createHost("p1").register();
    expect(isScrollLocked(owner)).toBe(false);
  });
});

describe("getAppMetrics & appMetricsSignal", () => {
  it("returns zeros outside WeChat", () => {
    expect(getAppMetrics().navHeight).toBe(0);
  });

  it("computes custom navigation bar metrics from the capsule and caches", () => {
    (globalThis as any).wx = {
      getWindowInfo: () => ({
        windowWidth: 375,
        windowHeight: 812,
        screenHeight: 812,
        statusBarHeight: 44,
        safeArea: { top: 44, bottom: 778 },
      }),
      getMenuButtonBoundingClientRect: () => ({
        top: 48,
        height: 32,
        left: 281,
      }),
    };

    const m = refreshAppMetrics();
    expect(m.statusBarHeight).toBe(44);
    expect(m.safeTop).toBe(44);
    expect(m.safeBottom).toBe(34);
    expect(m.navBarHeight).toBe(40);
    expect(m.navHeight).toBe(84);
    expect(m.menuInset).toBe(94);
    expect(appMetricsSignal()).toEqual(m);

    // Verify module caching returns identical instance without calling wx
    delete (globalThis as any).wx;
    const cached = getAppMetrics();
    expect(cached).toBe(m);
  });

  it("falls back when the capsule API is unavailable", () => {
    (globalThis as any).wx = {
      getWindowInfo: () => ({
        windowWidth: 375,
        windowHeight: 667,
        statusBarHeight: 20,
      }),
    };
    const m = refreshAppMetrics();
    expect(m.menuHeight).toBe(32);
    expect(m.navBarHeight).toBe(40);
    expect(m.safeBottom).toBe(0);
  });
});

describe("app scale coordination", () => {
  it("coordinates background scale requests with host", async () => {
    const { requestAppScale, releaseAppScale, isAppScaled } = await import(
      "../src/utils/app"
    );

    pageStack = [createPage("p1")];
    const host = createHost("p1");
    host.register();

    const drawer = createInstance("p1");
    expect(isAppScaled(drawer)).toBe(false);

    // Request scale
    requestAppScale(drawer, {
      id: "drawer:1",
      factor: 0.94,
      background: "bg-black",
    });

    expect(isAppScaled(drawer)).toBe(true);
    expect(host.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        scale: {
          scaled: true,
          factor: 0.94,
          background: "bg-black",
        },
      }),
    );

    // Release scale
    releaseAppScale(drawer, "drawer:1");
    expect(isAppScaled(drawer)).toBe(false);
    expect(host.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        scale: {
          scaled: false,
          factor: 1,
        },
      }),
    );
  });
});
