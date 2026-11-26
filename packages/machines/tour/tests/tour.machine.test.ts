import { describe, expect, it, vi, afterEach } from "vitest";
import { MiniappMachine } from "@code-id-labs/miniapp";
import {
  computeTourPosition,
  computeTourSpotlight,
  connectTour,
  tourMachine,
  type TourProps,
  type TourStepDetails,
} from "../src";

const flush = () =>
  new Promise<void>((resolve) =>
    queueMicrotask(() => queueMicrotask(() => queueMicrotask(resolve))),
  );

const SAMPLE_STEPS: TourStepDetails[] = [
  {
    id: "welcome",
    type: "dialog",
    title: "Welcome to Code UI",
    description: "Let's take a quick tour of the interface.",
  },
  {
    id: "search",
    type: "tooltip",
    target: "#search-bar",
    title: "Quick Search",
    description: "Find any component instantly.",
    placement: "bottom",
  },
  {
    id: "actions",
    type: "floating",
    title: "Quick Actions",
    description: "Switch themes or toggle dark mode anytime.",
    placement: "bottom",
  },
];

function setupTour(props: Partial<TourProps> = {}) {
  let currentProps: TourProps = {
    steps: SAMPLE_STEPS,
    ...props,
  };

  const machine = new MiniappMachine(tourMachine, currentProps);
  machine.start();

  const api = () => connectTour(machine.service);

  const updateProps = (next: Partial<TourProps>) => {
    currentProps = { ...currentProps, ...next };
    machine.updateProps(currentProps);
  };

  return { service: machine, api, updateProps };
}

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as { wx?: unknown }).wx;
});

describe("tourMachine", () => {
  it("starts closed by default and opens via start()", async () => {
    const onOpenChange = vi.fn();
    const onStatusChange = vi.fn();
    const { api, service } = setupTour({ onOpenChange, onStatusChange });

    expect(api().state).toBe("closed");
    expect(api().open).toBe(false);
    expect(api().visible).toBe(false);

    api().start();
    await flush();

    expect(api().state).toBe("open");
    expect(api().open).toBe(true);
    expect(api().visible).toBe(true);
    expect(api().stepId).toBe("welcome");
    expect(api().stepIndex).toBe(0);
    expect(api().totalSteps).toBe(3);
    expect(api().firstStep).toBe(true);
    expect(api().lastStep).toBe(false);
    expect(api().hasPrevStep).toBe(false);
    expect(api().hasNextStep).toBe(true);
    expect(api().progressPercent).toBe(33);
    expect(api().progressText).toBe("1 / 3");
    expect(onOpenChange).toHaveBeenCalledWith({ open: true });
    expect(onStatusChange).toHaveBeenCalledWith({
      status: "started",
      stepId: "welcome",
      stepIndex: 0,
    });

    service.stop();
  });

  it("navigates forward, backward, by id/index, and completes on last next()", async () => {
    vi.useFakeTimers();
    const onStepChange = vi.fn();
    const onStatusChange = vi.fn();
    const onExitComplete = vi.fn();
    const { api, service } = setupTour({
      duration: 150,
      onStepChange,
      onStatusChange,
      onExitComplete,
    });

    api().start();
    await flush();
    expect(api().stepId).toBe("welcome");

    api().next();
    await flush();
    expect(api().stepId).toBe("search");
    expect(api().stepIndex).toBe(1);
    expect(api().hasPrevStep).toBe(true);
    expect(api().hasNextStep).toBe(true);
    expect(api().progressText).toBe("2 / 3");
    expect(onStepChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        stepId: "search",
        stepIndex: 1,
        totalSteps: 3,
      }),
    );

    api().prev();
    await flush();
    expect(api().stepId).toBe("welcome");
    expect(api().stepIndex).toBe(0);

    api().goTo("actions");
    await flush();
    expect(api().stepId).toBe("actions");
    expect(api().stepIndex).toBe(2);
    expect(api().lastStep).toBe(true);
    expect(api().hasNextStep).toBe(false);
    expect(api().progressPercent).toBe(100);

    // Next on last step completes the tour
    api().next();
    await flush();
    expect(api().state).toBe("closing");
    expect(api().visible).toBe(true);
    expect(api().open).toBe(false);
    expect(onStatusChange).toHaveBeenLastCalledWith({
      status: "completed",
      stepId: "actions",
      stepIndex: 2,
    });

    vi.advanceTimersByTime(160);
    await flush();
    expect(api().state).toBe("closed");
    expect(api().visible).toBe(false);
    expect(onExitComplete).toHaveBeenCalledTimes(1);

    service.stop();
  });

  it("supports start(stepId) and goTo(index)", async () => {
    const { api, service } = setupTour();

    api().start("search");
    await flush();
    expect(api().open).toBe(true);
    expect(api().stepId).toBe("search");
    expect(api().stepIndex).toBe(1);

    api().goTo(2);
    await flush();
    expect(api().stepId).toBe("actions");

    service.stop();
  });

  it("handles skip, dismiss, closeOnInteractOutside, and instant close", async () => {
    const onStatusChange = vi.fn();
    const onBackdropTap = vi.fn();
    const { api, service, updateProps } = setupTour({
      transition: false,
      closeOnInteractOutside: false,
      onStatusChange,
      onBackdropTap,
    });

    api().start();
    await flush();
    api().handleBackdropTap();
    await flush();
    expect(onBackdropTap).toHaveBeenCalledTimes(1);
    expect(api().open).toBe(true);

    updateProps({ closeOnInteractOutside: true });
    await flush();
    api().handleBackdropTap();
    await flush();
    expect(api().state).toBe("closed");
    expect(onStatusChange).toHaveBeenLastCalledWith({
      status: "dismissed",
      stepId: "welcome",
      stepIndex: 0,
    });

    api().start();
    await flush();
    api().skip();
    await flush();
    expect(api().state).toBe("closed");
    expect(onStatusChange).toHaveBeenLastCalledWith({
      status: "skipped",
      stepId: "welcome",
      stepIndex: 0,
    });

    service.stop();
  });

  it("executes built-in and custom step actions via handleAction", async () => {
    const customSpy = vi.fn();
    const steps: TourStepDetails[] = [
      {
        id: "one",
        type: "dialog",
        title: "Step 1",
        actions: [
          { label: "Custom", action: (ctx) => customSpy(ctx.stepIndex) },
          { label: "Next", action: "next" },
        ],
      },
      {
        id: "two",
        type: "dialog",
        title: "Step 2",
        actions: [{ label: "Back", action: "prev" }],
      },
    ];

    const { api, service } = setupTour({ steps, defaultOpen: true });

    api().handleAction(0);
    await flush();
    expect(customSpy).toHaveBeenCalledWith(0);
    expect(api().stepId).toBe("one");

    api().handleAction(1);
    await flush();
    expect(api().stepId).toBe("two");

    api().handleAction(0);
    await flush();
    expect(api().stepId).toBe("one");

    service.stop();
  });

  it("runs and cleans up step.effect on step change and close", async () => {
    const cleanupOne = vi.fn();
    const effectOne = vi.fn(() => cleanupOne);
    const effectTwo = vi.fn();

    const steps: TourStepDetails[] = [
      { id: "one", type: "dialog", title: "One", effect: effectOne },
      { id: "two", type: "wait", effect: effectTwo },
    ];

    const { api, service } = setupTour({ steps, transition: false });
    expect(effectOne).not.toHaveBeenCalled();

    api().start();
    await flush();
    expect(effectOne).toHaveBeenCalledTimes(1);
    expect(cleanupOne).not.toHaveBeenCalled();

    api().next();
    await flush();
    expect(cleanupOne).toHaveBeenCalledTimes(1);
    expect(effectTwo).toHaveBeenCalledTimes(1);
    expect(api().showCard).toBe(false);

    // Step effect's ctx.next() completes the wait step
    const effectArgs = effectTwo.mock.calls[0]?.[0];
    effectArgs?.next();
    await flush();
    expect(api().state).toBe("closed");

    service.stop();
  });

  it("supports controlled open and controlled stepId props", async () => {
    const { api, service, updateProps } = setupTour({
      open: false,
      stepId: "welcome",
      transition: false,
    });

    expect(api().open).toBe(false);

    updateProps({ open: true });
    await flush();
    expect(api().open).toBe(true);
    expect(api().stepId).toBe("welcome");

    updateProps({ stepId: "actions" });
    await flush();
    expect(api().stepId).toBe("actions");
    expect(api().stepIndex).toBe(2);

    updateProps({ open: false });
    await flush();
    expect(api().open).toBe(false);
    expect(api().state).toBe("closed");

    service.stop();
  });

  it("does not open when steps list is empty", async () => {
    const { api, service } = setupTour({ steps: [] });
    api().start();
    await flush();
    expect(api().state).toBe("closed");
    expect(api().open).toBe(false);
    service.stop();
  });

  it("measures page target via wx.createSelectorQuery and computes spotlight & tooltip", async () => {
    const mockRect = {
      left: 40,
      top: 120,
      right: 240,
      bottom: 168,
      width: 200,
      height: 48,
    };

    (globalThis as Record<string, unknown>).wx = {
      getWindowInfo: () => ({
        windowWidth: 375,
        windowHeight: 812,
        safeArea: { top: 44, bottom: 778 },
      }),
      createSelectorQuery: () => {
        const q = {
          select: () => q,
          boundingClientRect: () => q,
          selectViewport: () => q,
          scrollOffset: () => q,
          exec: (cb: (res: unknown[]) => void) => {
            cb([mockRect, { scrollTop: 0 }]);
          },
        };
        return q;
      },
    };

    const { api, service } = setupTour({ defaultStepId: "search" });
    api().start("search");
    await flush();
    await flush();

    expect(api().showSpotlight).toBe(true);
    expect(api().spotlightStyle).toContain("left: 32px;");
    expect(api().spotlightStyle).toContain("top: 112px;");
    expect(api().spotlightStyle).toContain("width: 216px;");
    expect(api().spotlightStyle).toContain("height: 64px;");
    expect(api().resolvedSide).toBe("bottom");
    expect(api().showArrow).toBe(true);
    expect(api().positioned).toBe(true);

    service.stop();
  });
});

describe("tour position & spotlight math", () => {
  it("computes 4-panel backdrop scrim and spotlight ring around target", () => {
    const res = computeTourSpotlight({
      targetRect: { left: 50, top: 200, right: 250, bottom: 250, width: 200, height: 50 },
      viewport: { width: 375, height: 800, safeTop: 0, safeBottom: 0 },
      stepType: "tooltip",
      spotlightOffset: 10,
      spotlightRadius: 12,
      preventInteraction: false,
    });

    expect(res.visible).toBe(true);
    expect(res.rect).toEqual({
      left: 40,
      top: 190,
      right: 260,
      bottom: 260,
      width: 220,
      height: 70,
    });
    expect(res.backdropTopStyle).toBe("top: 0px; left: 0px; right: 0px; height: 190px;");
    expect(res.backdropBottomStyle).toBe("top: 260px; left: 0px; right: 0px; bottom: 0px;");
    expect(res.backdropLeftStyle).toBe("top: 190px; left: 0px; width: 40px; height: 70px;");
    expect(res.backdropRightStyle).toBe("top: 190px; left: 260px; right: 0px; height: 70px;");
    expect(res.spotlightStyle).toContain("pointer-events: none;");
    expect(res.spotlightStyle).toContain("border-radius: 12px;");
    expect(res.spotlightStyle).toContain("box-shadow: 0 0 0 1200px");

    const noBackdrop = computeTourSpotlight({
      targetRect: { left: 50, top: 200, right: 250, bottom: 250, width: 200, height: 50 },
      viewport: { width: 375, height: 800, safeTop: 0, safeBottom: 0 },
      stepType: "tooltip",
      spotlightOffset: 10,
      spotlightRadius: 12,
      preventInteraction: false,
      showBackdrop: false,
    });
    expect(noBackdrop.spotlightStyle).not.toContain("box-shadow:");

    // Auto-detect radius: rounded target gets concentric radius, square target gets 0px
    const autoRounded = computeTourSpotlight({
      targetRect: { left: 50, top: 200, right: 250, bottom: 250, width: 200, height: 50 },
      viewport: { width: 375, height: 800, safeTop: 0, safeBottom: 0 },
      stepType: "tooltip",
      spotlightOffset: 8,
      spotlightRadius: null,
      targetRadius: 16,
      preventInteraction: false,
    });
    expect(autoRounded.spotlightStyle).toContain("border-radius: 20px;");

    const autoSquare = computeTourSpotlight({
      targetRect: { left: 50, top: 200, right: 250, bottom: 250, width: 200, height: 50 },
      viewport: { width: 375, height: 800, safeTop: 0, safeBottom: 0 },
      stepType: "tooltip",
      spotlightOffset: 8,
      spotlightRadius: null,
      targetRadius: 0,
      preventInteraction: false,
    });
    expect(autoSquare.spotlightStyle).toContain("border-radius: 0px;");
  });

  it("flips bottom tooltip to top when target is near viewport bottom", () => {
    const pos = computeTourPosition({
      stepType: "tooltip",
      hasTarget: true,
      hasCardContent: true,
      measureResolved: true,
      targetRect: { left: 40, top: 700, right: 335, bottom: 748, width: 295, height: 48 },
      spotlightRect: { left: 32, top: 692, right: 343, bottom: 756, width: 311, height: 64 },
      viewport: { width: 375, height: 800, safeTop: 44, safeBottom: 20 },
      contentSize: { width: 300, height: 180 },
      placement: "bottom",
      arrow: true,
      sideOffset: 10,
      collisionPadding: 16,
      avoidCollisions: true,
      maxWidth: 320,
    });

    expect(pos.positioned).toBe(true);
    expect(pos.resolvedSide).toBe("top");
    expect(pos.showArrow).toBe(true);
    expect(pos.arrowStyle).toContain("bottom: -5px;");
  });
});
