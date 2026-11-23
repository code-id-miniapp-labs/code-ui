import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetAppRegistry,
  createAppHostBehavior,
} from "../src/behaviors/app";
import {
  __resetPageLifecycleHub,
  emitPageLifecycle,
  getPageLifecycleSubscriberCount,
  subscribePageLifecycle,
} from "../src/behaviors/page-lifecycle";
import { createPresenceBehavior } from "../src/behaviors/presence";
import {
  __resetThemeRegistry,
  createAppThemeBehavior,
} from "../src/behaviors/theme";

interface MockBehaviorDef {
  data?: Record<string, unknown>;
  definitionFilter?: (def: Record<string, unknown>) => void;
  lifetimes?: {
    created?: (this: Record<string, any>) => void;
    attached?: (this: Record<string, any>) => void;
    detached?: (this: Record<string, any>) => void;
  };
  pageLifetimes?: {
    show?: (this: Record<string, any>) => void;
    hide?: (this: Record<string, any>) => void;
  };
  methods?: Record<string, (this: Record<string, any>, ...args: any[]) => any>;
}

describe("per-page lifecycle hub & pageLifetimes consolidation", () => {
  let originalBehavior: unknown;

  beforeEach(() => {
    __resetPageLifecycleHub();
    __resetThemeRegistry();
    __resetAppRegistry();
    originalBehavior = (globalThis as Record<string, unknown>).Behavior;
    (globalThis as Record<string, unknown>).Behavior = (
      def: Record<string, unknown>,
    ) => def;
    delete (globalThis as Record<string, unknown>).getCurrentPages;
    delete (globalThis as Record<string, unknown>).wx;
  });

  afterEach(() => {
    if (originalBehavior === undefined) {
      delete (globalThis as Record<string, unknown>).Behavior;
    } else {
      (globalThis as Record<string, unknown>).Behavior = originalBehavior;
    }
    delete (globalThis as Record<string, unknown>).getCurrentPages;
    delete (globalThis as Record<string, unknown>).wx;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("registers only 1 pageLifetimes listener (on <c-app>) for a page with 35+ components and flushes all on page show", async () => {
    vi.resetModules();
    const { computedBehavior } = await import(
      "../src/behaviors/computed-behavior"
    );
    const computedDef = computedBehavior as unknown as MockBehaviorDef;
    const themeDef = createAppThemeBehavior() as unknown as MockBehaviorDef;
    const presenceDef = createPresenceBehavior({
      key: "drawer",
    }) as unknown as MockBehaviorDef;
    const appHostDef = createAppHostBehavior({
      detectBars: () => {},
      extractTopBarHeight: () => 0,
      extractBottomBarHeight: () => 0,
    }) as unknown as MockBehaviorDef;

    // Leaf & overlay behaviors must NOT declare pageLifetimes directly
    expect(computedDef.pageLifetimes).toBeUndefined();
    expect(themeDef.pageLifetimes).toBeUndefined();
    expect(presenceDef.pageLifetimes).toBeUndefined();
    // Single <c-app> host declares pageLifetimes
    expect(appHostDef.pageLifetimes?.show).toBeTypeOf("function");
    expect(appHostDef.pageLifetimes?.hide).toBeTypeOf("function");

    const pageId = "page-heavy-1";
    const page = { getPageId: () => pageId };
    (globalThis as Record<string, unknown>).getCurrentPages = () => [page];

    let registeredPageLifetimeCount = 0;
    const countIfHasPageLifetimes = (behaviors: MockBehaviorDef[]) => {
      if (behaviors.some((b) => Boolean(b.pageLifetimes))) {
        registeredPageLifetimeCount++;
      }
    };

    // 1. Mount single <c-app> host
    countIfHasPageLifetimes([appHostDef, themeDef, computedDef]);
    const appInstance: Record<string, any> = {
      getPageId: () => pageId,
      data: { autoDetectBars: false },
      setData: vi.fn(),
      applyHostState: vi.fn(),
    };
    appHostDef.lifetimes?.attached?.call(appInstance);

    // 2. Mount 30 leaf components using computedBehavior
    const leafInstances: Array<{
      instance: Record<string, any>;
      flushSpy: ReturnType<typeof vi.fn>;
    }> = [];
    for (let i = 0; i < 30; i++) {
      countIfHasPageLifetimes([computedDef]);
      const flushSpy = vi.fn();
      const defFields: Record<string, any> = {
        data: { count: i },
        computed: {
          doubled(this: { data: { count: number } }) {
            return this.data.count * 2;
          },
        },
        methods: {},
      };
      computedDef.definitionFilter?.(defFields);

      const leaf: Record<string, any> = {
        getPageId: () => pageId,
        data: { ...defFields.data },
        setData: vi.fn((patch: Record<string, unknown>) => {
          Object.assign(leaf.data, patch);
        }),
        ...defFields.methods,
      };
      computedDef.lifetimes?.created?.call(leaf);
      const originalFlush = leaf.__cui_computedFlush__;
      leaf.__cui_computedFlush__ = () => {
        flushSpy();
        originalFlush?.();
      };
      computedDef.lifetimes?.attached?.call(leaf);
      flushSpy.mockClear();
      leafInstances.push({ instance: leaf, flushSpy });
    }

    // 3. Mount 5 overlay components using createAppThemeBehavior + computedBehavior
    const themeInstances: Array<{
      instance: Record<string, any>;
      setData: ReturnType<typeof vi.fn>;
    }> = [];
    for (let i = 0; i < 5; i++) {
      countIfHasPageLifetimes([themeDef, computedDef]);
      const setData = vi.fn((patch: Record<string, unknown>) => {
        Object.assign(inst.data, patch);
      });
      const inst: Record<string, any> = {
        getPageId: () => pageId,
        data: { themeMode: "light", themeCssVars: "" },
        setData,
      };
      themeDef.lifetimes?.attached?.call(inst);
      setData.mockClear();
      themeInstances.push({ instance: inst, setData });
    }

    // Total 36 components mounted, ONLY 1 pageLifetimes registration from code-ui (<c-app>)
    expect(registeredPageLifetimeCount).toBe(1);
    expect(getPageLifecycleSubscriberCount(pageId)).toBe(35);

    // Mutate theme registry directly to simulate stale theme before page show
    const reg = (globalThis as Record<string, any>).__CODE_UI_THEME_REGISTRY__;
    reg.colorMode = "dark";
    reg.cssVars = "--ui-primary:#ef4444;";

    // Trigger page show ONLY on the single <c-app> host
    appHostDef.pageLifetimes?.show?.call(appInstance);

    for (const { flushSpy } of leafInstances) {
      expect(flushSpy).toHaveBeenCalledTimes(1);
    }
    for (const { setData } of themeInstances) {
      expect(setData).toHaveBeenCalledWith({
        themeMode: "dark",
        themeCssVars: "--ui-primary:#ef4444;",
      });
    }

    // Detach all leaf and overlay components -> zero leaked subscriptions
    for (const { instance, flushSpy } of leafInstances) {
      computedDef.lifetimes?.detached?.call(instance);
      flushSpy.mockClear();
    }
    for (const { instance, setData } of themeInstances) {
      themeDef.lifetimes?.detached?.call(instance);
      setData.mockClear();
    }
    expect(getPageLifecycleSubscriberCount(pageId)).toBe(0);

    // Subsequent page show does not call detached instances
    appHostDef.pageLifetimes?.show?.call(appInstance);
    for (const { flushSpy } of leafInstances) {
      expect(flushSpy).not.toHaveBeenCalled();
    }
    for (const { setData } of themeInstances) {
      expect(setData).not.toHaveBeenCalled();
    }

    appHostDef.lifetimes?.detached?.call(appInstance);
  });

  it("isolates page show/hide notifications across separate pages", () => {
    const showA = vi.fn();
    const hideA = vi.fn();
    const showB = vi.fn();
    const hideB = vi.fn();

    const unsubA = subscribePageLifecycle(
      { getPageId: () => "page-A" },
      { onShow: showA, onHide: hideA },
    );
    const unsubB = subscribePageLifecycle(
      { getPageId: () => "page-B" },
      { onShow: showB, onHide: hideB },
    );

    emitPageLifecycle("page-A", "show");
    expect(showA).toHaveBeenCalledTimes(1);
    expect(showB).not.toHaveBeenCalled();

    emitPageLifecycle("page-B", "hide");
    expect(hideB).toHaveBeenCalledTimes(1);
    expect(hideA).not.toHaveBeenCalled();

    unsubA();
    unsubB();
  });

  it("falls back to patching page.onShow/onHide once when <c-app> is absent and avoids double-firing if <c-app> mounts later", () => {
    const origShow = vi.fn();
    const origHide = vi.fn();
    const page: {
      getPageId: () => string;
      onShow: () => void;
      onHide: () => void;
    } = {
      getPageId: () => "page-no-app",
      onShow: origShow,
      onHide: origHide,
    };
    (globalThis as Record<string, unknown>).getCurrentPages = () => [page];

    const sub1Show = vi.fn();
    const sub1Hide = vi.fn();
    const sub2Show = vi.fn();

    const unsub1 = subscribePageLifecycle(
      { getPageId: () => "page-no-app" },
      { onShow: sub1Show, onHide: sub1Hide },
    );
    const unsub2 = subscribePageLifecycle(
      { getPageId: () => "page-no-app" },
      { onShow: sub2Show },
    );

    page.onShow();
    expect(origShow).toHaveBeenCalledTimes(1);
    expect(sub1Show).toHaveBeenCalledTimes(1);
    expect(sub2Show).toHaveBeenCalledTimes(1);

    page.onHide();
    expect(origHide).toHaveBeenCalledTimes(1);
    expect(sub1Hide).toHaveBeenCalledTimes(1);

    // Now mount <c-app> on the same page -> fallback wrapper suppresses its own emit
    const appHostDef = createAppHostBehavior({
      detectBars: () => {},
      extractTopBarHeight: () => 0,
      extractBottomBarHeight: () => 0,
    }) as unknown as MockBehaviorDef;
    const appInstance: Record<string, any> = {
      getPageId: () => "page-no-app",
      data: { autoDetectBars: false },
      setData: vi.fn(),
    };
    appHostDef.lifetimes?.attached?.call(appInstance);

    sub1Show.mockClear();
    sub2Show.mockClear();

    // Both page.onShow and <c-app>.pageLifetimes.show run during a real WeChat page show
    page.onShow();
    appHostDef.pageLifetimes?.show?.call(appInstance);

    expect(sub1Show).toHaveBeenCalledTimes(1);
    expect(sub2Show).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
    appHostDef.lifetimes?.detached?.call(appInstance);
  });

  it("createPresenceBehavior coordinates parent mounted/open state and cleans up timers on detach", () => {
    vi.useFakeTimers();

    const behavior = createPresenceBehavior({
      key: "filterDrawer",
      duration: 250,
    }) as unknown as MockBehaviorDef;

    expect(behavior.pageLifetimes).toBeUndefined();
    expect(behavior.data?.filterDrawer).toEqual({
      present: false,
      open: false,
      mounted: false,
      state: "unmounted",
    });

    const instance: Record<string, any> = {
      data: { ...behavior.data },
      setData: vi.fn((patch: Record<string, unknown>) => {
        Object.assign(instance.data, patch);
      }),
    };

    behavior.lifetimes?.attached?.call(instance);
    behavior.methods?.openFilterDrawer?.call(instance);
    expect(instance.data.filterDrawer).toEqual({
      present: true,
      open: true,
      mounted: true,
      state: "open",
    });

    // Begin closing: open becomes false, mounted stays true while exit plays
    behavior.methods?.closeFilterDrawer?.call(instance);
    expect(instance.data.filterDrawer).toEqual({
      present: false,
      open: false,
      mounted: true,
      state: "exiting",
    });

    // Complete via bind:exitcomplete handler before timer expires
    behavior.methods?.handleFilterDrawerExitComplete?.call(instance);
    expect(instance.data.filterDrawer).toEqual({
      present: false,
      open: false,
      mounted: false,
      state: "unmounted",
    });
    expect(vi.getTimerCount()).toBe(0);

    // Reopen, close, then detach mid-exit -> timer cleared
    behavior.methods?.showFilterDrawer?.call(instance);
    behavior.methods?.hideFilterDrawer?.call(instance);
    expect(vi.getTimerCount()).toBe(1);
    behavior.lifetimes?.detached?.call(instance);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("createPresenceBehavior supports managing multiple overlays via key array and WXML dataset events", () => {
    vi.useFakeTimers();

    const behavior = createPresenceBehavior({
      key: ["filter", "sort", "payment"],
      duration: 200,
    }) as unknown as MockBehaviorDef;

    expect(behavior.pageLifetimes).toBeUndefined();
    expect(behavior.data).toEqual({
      filter: { present: false, open: false, mounted: false, state: "unmounted" },
      sort: { present: false, open: false, mounted: false, state: "unmounted" },
      payment: { present: false, open: false, mounted: false, state: "unmounted" },
    });

    const patches: Record<string, unknown>[] = [];
    const instance: Record<string, any> = {
      data: { ...behavior.data },
      setData: vi.fn((patch: Record<string, unknown>) => {
        patches.push(patch);
      }),
    };

    behavior.lifetimes?.attached?.call(instance);
    patches.length = 0;

    // Open by WXML event dataset (data-name="filter")
    behavior.methods?.openPresence?.call(instance, {
      currentTarget: { dataset: { name: "filter" } },
    });
    expect(patches[patches.length - 1]).toEqual({
      filter: {
        present: true,
        open: true,
        mounted: true,
        state: "open",
      },
    });

    // Open second overlay by string name
    behavior.methods?.openPresence?.call(instance, "payment");
    expect(patches[patches.length - 1]).toEqual({
      payment: {
        present: true,
        open: true,
        mounted: true,
        state: "open",
      },
    });

    // Close all overlays at once
    behavior.methods?.closeAllPresence?.call(instance);
    expect(vi.getTimerCount()).toBe(2);

    // Complete filter via WXML event
    behavior.methods?.handlePresenceExitComplete?.call(instance, {
      currentTarget: { dataset: { name: "filter" } },
    });
    expect(patches[patches.length - 1]).toEqual({
      filter: {
        present: false,
        open: false,
        mounted: false,
        state: "unmounted",
      },
    });

    // Detach cleans up remaining timers
    behavior.lifetimes?.detached?.call(instance);
    expect(vi.getTimerCount()).toBe(0);
  });
});
