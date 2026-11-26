import { afterEach, describe, expect, it, vi } from "vitest";
import { MiniappMachine } from "@code-id-labs/miniapp";
import { connectTour, tourMachine, type TourStepDetails } from "@code-id-labs/tour";
import { useTour } from "../src/use-tour";

const flush = () =>
  new Promise<void>((resolve) =>
    queueMicrotask(() => queueMicrotask(() => queueMicrotask(resolve))),
  );

const STEPS: TourStepDetails[] = [
  { id: "welcome", type: "dialog", title: "Welcome", description: "Intro" },
  { id: "search", type: "tooltip", target: "#search", title: "Search" },
  { id: "done", type: "floating", title: "All Set" },
];

function createMockTourComponent(steps: TourStepDetails[]) {
  const machine = new MiniappMachine(tourMachine, {
    steps,
    transition: false,
  });
  machine.start();

  const comp: Record<string, any> = {
    __codeUiMachine: machine,
    get __codeUiApi() {
      return connectTour(machine.service);
    },
    send(ev: any) {
      machine.send(ev);
    },
    start(stepId?: string) {
      connectTour(machine.service).start(stepId);
    },
    next() {
      connectTour(machine.service).next();
    },
    prev() {
      connectTour(machine.service).prev();
    },
    goTo(stepIdOrIndex: string | number) {
      connectTour(machine.service).goTo(stepIdOrIndex);
    },
    skip() {
      connectTour(machine.service).skip();
    },
    dismiss() {
      connectTour(machine.service).dismiss();
    },
    close() {
      connectTour(machine.service).close();
    },
    reposition() {
      connectTour(machine.service).reposition();
    },
    setOpen(open: boolean) {
      connectTour(machine.service).setOpen(open);
    },
  };
  comp.__codeUiInstance = comp;

  return { comp, machine };
}

function createMockPage(components: Record<string, any> = {}) {
  const page: Record<string, any> = {
    data: {} as Record<string, any>,
    setData: vi.fn((patch: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(patch)) {
        if (k.includes(".")) {
          const [root, prop] = k.split(".");
          if (root && prop) {
            page.data[root] = { ...(page.data[root] ?? {}), [prop]: v };
          }
        } else {
          page.data[k] = v;
        }
      }
    }),
    selectComponent: vi.fn((selector: string) => components[selector] ?? null),
  };
  return page;
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as { wx?: unknown }).wx;
});

describe("useTour composable", () => {
  it("binds to a <c-tour> component via selector and drives live transitions & callbacks", async () => {
    const { comp, machine } = createMockTourComponent(STEPS);
    const page = createMockPage({ "#main-tour": comp });

    const onStart = vi.fn();
    const onStepChange = vi.fn();
    const onComplete = vi.fn();

    const tour = useTour({
      target: page,
      selector: "#main-tour",
      key: "tour",
      steps: STEPS,
      onStart,
      onStepChange,
      onComplete,
    });

    expect(tour.open).toBe(false);
    expect(tour.totalSteps).toBe(3);
    expect(page.data.tour.steps).toHaveLength(3);

    tour.start();
    await flush();
    expect(tour.open).toBe(true);
    expect(tour.stepId).toBe("welcome");
    expect(tour.stepIndex).toBe(0);
    expect(tour.progressText).toBe("1 / 3");
    expect(onStart).toHaveBeenCalledTimes(1);

    tour.next();
    await flush();
    expect(tour.stepId).toBe("search");
    expect(tour.stepIndex).toBe(1);
    expect(page.data.tour.stepId).toBe("search");
    expect(onStepChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ stepId: "search", stepIndex: 1 }),
    );

    tour.goTo(2);
    await flush();
    expect(tour.stepId).toBe("done");
    expect(tour.lastStep).toBe(true);

    // Completing last step triggers onComplete
    tour.next();
    await flush();
    expect(tour.open).toBe(false);
    expect(tour.status).toBe("completed");
    expect(tour.completed).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);

    tour.stop();
    machine.stop();
  });

  it("supports controlled mode (without selector) and WXML event bridges", () => {
    const page = createMockPage();
    const onStepChange = vi.fn();
    const onSkip = vi.fn();

    const tour = useTour({
      target: page,
      key: "guide",
      steps: STEPS,
      onStepChange,
      onSkip,
    });

    tour.start();
    expect(tour.open).toBe(true);
    expect(tour.stepId).toBe("welcome");
    expect(page.data.guide.open).toBe(true);
    expect(page.data.guide.stepId).toBe("welcome");

    tour.next();
    expect(tour.stepId).toBe("search");
    expect(onStepChange).toHaveBeenCalledWith(
      expect.objectContaining({ stepId: "search", stepIndex: 1 }),
    );

    tour.prev();
    expect(tour.stepId).toBe("welcome");

    tour.skip();
    expect(tour.open).toBe(false);
    expect(tour.status).toBe("skipped");
    expect(onSkip).toHaveBeenCalledTimes(1);

    // WXML bridge events update state cleanly
    tour.handleOpenChange({ detail: { open: true } });
    tour.handleStepChange({
      detail: {
        stepId: "done",
        stepIndex: 2,
        totalSteps: 3,
        step: STEPS[2] ?? null,
      },
    });
    expect(tour.open).toBe(true);
    expect(tour.stepId).toBe("done");

    tour.stop();
  });

  it("persists completion via storageKey and guards startOnce()", () => {
    const store = new Map<string, unknown>();
    (globalThis as Record<string, unknown>).wx = {
      getStorageSync: (k: string) => store.get(k),
      setStorageSync: (k: string, v: unknown) => store.set(k, v),
      removeStorageSync: (k: string) => store.delete(k),
    };

    const firstStep = STEPS[0];
    if (!firstStep) throw new Error("Missing first step");

    const tour = useTour({
      steps: [firstStep],
      storageKey: "test:onboarding_tour",
    });

    expect(tour.hasCompleted()).toBe(false);
    expect(tour.startOnce()).toBe(true);
    expect(tour.open).toBe(true);

    // Complete single-step tour
    tour.next();
    expect(tour.status).toBe("completed");
    expect(tour.hasCompleted()).toBe(true);
    expect(store.get("test:onboarding_tour")).toBe(true);

    // Subsequent startOnce is a no-op
    expect(tour.startOnce()).toBe(false);
    expect(tour.open).toBe(false);

    // Resetting storage allows startOnce again
    tour.resetCompleted();
    expect(tour.hasCompleted()).toBe(false);
    expect(tour.startOnce()).toBe(true);

    tour.stop();
  });

  it("queues start() called before <c-tour> mounts and flushes onReady", async () => {
    const { comp, machine } = createMockTourComponent(STEPS);
    let mounted = false;
    const page: Record<string, any> = {
      data: {},
      setData: vi.fn(),
      selectComponent: vi.fn((sel: string) =>
        mounted && sel === "#lazy-tour" ? comp : null,
      ),
      onReady() {},
    };

    const tour = useTour({
      target: page,
      selector: "#lazy-tour",
      steps: STEPS,
    });

    // Called in onLoad before child component exists
    tour.start("search");
    expect(tour.open).toBe(false);

    // Child mounts and page onReady fires
    mounted = true;
    page.onReady();
    await flush();

    expect(tour.open).toBe(true);
    expect(tour.stepId).toBe("search");

    tour.stop();
    machine.stop();
  });

  it("updates steps dynamically via setSteps()", () => {
    const page = createMockPage();
    const firstStep = STEPS[0];
    if (!firstStep) throw new Error("Missing first step");
    const tour = useTour({
      target: page,
      key: "tour",
      steps: [firstStep],
    });

    expect(tour.totalSteps).toBe(1);
    tour.setSteps(STEPS);
    expect(tour.totalSteps).toBe(3);
    expect(page.data.tour.steps).toHaveLength(3);

    tour.stop();
  });
});
