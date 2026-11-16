import { MiniappMachine } from "@code-ui/miniapp";
import { diffSnapshot } from "@code-ui/utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  computeFloatingPosition,
  connectFloatingMenu,
  floatingMenuMachine,
} from "../src";

const flush = () =>
  new Promise<void>((resolve) => queueMicrotask(() => queueMicrotask(resolve)));

describe("floatingMenuMachine (@code-ui/floating-menu)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes closed by default and opens/closes with animation lifecycle", async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const machine = new MiniappMachine(floatingMenuMachine, {
      id: "fm-1",
      duration: 150,
      onOpenChange,
    });
    machine.start();

    let api = connectFloatingMenu(machine.service);
    expect(api.state).toBe("closed");
    expect(api.open).toBe(false);
    expect(api.visible).toBe(false);

    api.openMenu();
    await flush();
    api = connectFloatingMenu(machine.service);
    expect(api.state).toBe("open");
    expect(api.open).toBe(true);
    expect(api.visible).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith({ open: true });

    api.handleBackdropTap();
    await flush();
    api = connectFloatingMenu(machine.service);
    expect(api.state).toBe("closing");
    expect(api.open).toBe(false);
    expect(api.visible).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith({ open: false });

    vi.advanceTimersByTime(150);
    await flush();
    api = connectFloatingMenu(machine.service);
    expect(api.state).toBe("closed");
    expect(api.visible).toBe(false);

    machine.stop();
  });

  it("syncs controlled open prop into state", async () => {
    vi.useFakeTimers();
    const machine = new MiniappMachine(floatingMenuMachine, {
      open: false,
      duration: 100,
    });
    machine.start();
    expect(machine.state.get()).toBe("closed");

    machine.updateProps({ open: true });
    await flush();
    expect(machine.state.get()).toBe("open");

    machine.updateProps({ open: false });
    await flush();
    expect(machine.state.get()).toBe("closing");

    vi.advanceTimersByTime(100);
    await flush();
    expect(machine.state.get()).toBe("closed");

    machine.stop();
  });

  it("respects triggerMode='tap' and disabled", async () => {
    const machine = new MiniappMachine(floatingMenuMachine, {
      triggerMode: "tap",
      disabled: true,
    });
    machine.start();

    connectFloatingMenu(machine.service).handleTriggerTap();
    await flush();
    expect(machine.state.get()).toBe("closed");

    machine.updateProps({ disabled: false });
    await flush();
    connectFloatingMenu(machine.service).handleTriggerTap();
    await flush();
    expect(machine.state.get()).toBe("open");

    connectFloatingMenu(machine.service).handleTriggerTap();
    await flush();
    expect(machine.state.get()).toBe("closing");
    machine.stop();
  });

  it("queries anchor rect via component selector and clears on close", async () => {
    vi.useFakeTimers();
    const mockComp = {
      createSelectorQuery: () => ({
        select: () => ({
          boundingClientRect: (cb: (res: any) => void) => {
            cb({
              left: 20,
              top: 100,
              right: 220,
              bottom: 136,
              width: 200,
              height: 36,
            });
            return { exec: () => {} };
          },
        }),
      }),
    };

    const machine = new MiniappMachine(floatingMenuMachine, {
      id: "fm-q",
      component: mockComp as any,
      duration: 50,
    });
    machine.start();

    machine.send({ type: "OPEN" });
    await flush();

    const api = connectFloatingMenu(machine.service);
    expect(api.positioned).toBe(true);
    expect(api.resolvedSide).toBe("bottom");
    expect(api.positionerStyle).toContain("top: 140px;");
    expect(api.positionerStyle).toContain("left: 20px;");
    expect(api.positionerStyle).toContain("width: 200px;");

    machine.send({ type: "CLOSE" });
    await flush();
    vi.advanceTimersByTime(50);
    await flush();
    expect(connectFloatingMenu(machine.service).positioned).toBe(false);
    machine.stop();
  });

  it("flips to top when anchor is near bottom edge of viewport", () => {
    const pos = computeFloatingPosition({
      anchorRect: {
        left: 16,
        top: 580,
        right: 359,
        bottom: 616,
        width: 343,
        height: 36,
      },
      viewport: { width: 375, height: 667, safeTop: 0, safeBottom: 0 },
      portal: true,
      side: "bottom",
      align: "start",
      sideOffset: 4,
      alignOffset: 0,
      collisionPadding: 8,
      avoidCollisions: true,
      matchTriggerWidth: true,
      maxHeight: 240,
    });

    expect(pos.positioned).toBe(true);
    expect(pos.resolvedSide).toBe("top");
    expect(pos.positionerStyle).toContain("bottom: 91px;");
    expect(pos.contentStyle).toContain("transform-origin: bottom center;");
  });

  it("computes non-portal CSS styles without anchor measurement", () => {
    const pos = computeFloatingPosition({
      anchorRect: null,
      viewport: { width: 375, height: 667 },
      portal: false,
      side: "bottom",
      align: "end",
      sideOffset: 6,
      alignOffset: 0,
      collisionPadding: 8,
      avoidCollisions: true,
      matchTriggerWidth: "min",
      maxHeight: 200,
    });

    expect(pos.positioned).toBe(true);
    expect(pos.positionerStyle).toContain("top: calc(100% + 6px);");
    expect(pos.positionerStyle).toContain("right: 0px;");
    expect(pos.positionerStyle).toContain("min-width: 100%;");
  });

  it("emits null delta on no-op transition and cleans up timer on stop()", async () => {
    vi.useFakeTimers();
    const machine = new MiniappMachine(floatingMenuMachine, { duration: 150 });
    machine.start();

    const before = connectFloatingMenu(machine.service);
    machine.send({ type: "CLOSE" });
    await flush();
    const after = connectFloatingMenu(machine.service);
    expect(diffSnapshot(before, after, "floatingMenu")).toBeNull();

    machine.send({ type: "OPEN" });
    await flush();
    machine.send({ type: "CLOSE" });
    await flush();
    expect(vi.getTimerCount()).toBe(1);
    machine.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
