import { afterEach, describe, expect, it, vi } from "vitest";
import { usePresence } from "../src/use-presence";

describe("usePresence composable", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("manages lazyMount + unmountOnExit lifecycle and syncs keyed state to target.setData", () => {
    const target = {
      data: {} as Record<string, any>,
      setData: vi.fn((patch: Record<string, unknown>) => {
        Object.assign(target.data, patch);
      }),
    };
    const onExitComplete = vi.fn();

    const drawer = usePresence({
      target,
      key: "filterDrawer",
      onExitComplete,
    });

    // Initially unmounted
    expect(drawer.mounted).toBe(false);
    expect(drawer.open).toBe(false);
    expect(drawer.present).toBe(false);
    expect(drawer.state).toBe("unmounted");
    expect(target.data.filterDrawer).toEqual({
      present: false,
      open: false,
      mounted: false,
      state: "unmounted",
    });

    // Show mounts and opens
    drawer.show();
    expect(drawer.mounted).toBe(true);
    expect(drawer.open).toBe(true);
    expect(drawer.state).toBe("open");
    expect(target.data.filterDrawer.mounted).toBe(true);
    expect(target.data.filterDrawer.open).toBe(true);

    // Hide starts exiting while keeping mounted = true
    drawer.hide();
    expect(drawer.mounted).toBe(true);
    expect(drawer.open).toBe(false);
    expect(drawer.state).toBe("exiting");
    expect(onExitComplete).not.toHaveBeenCalled();

    // bind:exitcomplete from <c-drawer> triggers true unmount
    drawer.onExitComplete();
    expect(drawer.mounted).toBe(false);
    expect(drawer.open).toBe(false);
    expect(drawer.state).toBe("unmounted");
    expect(target.data.filterDrawer.mounted).toBe(false);
    expect(onExitComplete).toHaveBeenCalledTimes(1);

    drawer.stop();
  });

  it("ignores stale onExitComplete and cancels timer on rapid reopen", () => {
    vi.useFakeTimers();
    const onExitComplete = vi.fn();

    const modal = usePresence({
      duration: 300,
      onExitComplete,
    });

    modal.show();
    modal.hide();
    expect(modal.state).toBe("exiting");
    expect(vi.getTimerCount()).toBe(1);

    // Rapid reopen before exit completes
    modal.show();
    expect(modal.state).toBe("open");
    expect(modal.mounted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    // Stale exitcomplete event must be ignored while open
    modal.onExitComplete();
    vi.advanceTimersByTime(500);
    expect(modal.state).toBe("open");
    expect(modal.mounted).toBe(true);
    expect(onExitComplete).not.toHaveBeenCalled();

    // Closing again settles after duration
    modal.hide();
    vi.advanceTimersByTime(300);
    expect(modal.state).toBe("unmounted");
    expect(modal.mounted).toBe(false);
    expect(onExitComplete).toHaveBeenCalledTimes(1);

    modal.stop();
  });

  it("syncs flat properties when target is provided without key and supports unmountOnExit: false", () => {
    const target = {
      data: {} as Record<string, any>,
      setData: vi.fn((patch: Record<string, unknown>) => {
        Object.assign(target.data, patch);
      }),
    };

    const sheet = usePresence({
      target,
      lazyMount: true,
      unmountOnExit: false,
    });

    expect(target.data).toEqual({
      present: false,
      open: false,
      mounted: false,
      presenceState: "unmounted",
    });

    sheet.toggle();
    expect(target.data.mounted).toBe(true);
    expect(target.data.open).toBe(true);

    sheet.toggle();
    expect(target.data.open).toBe(false);
    expect(target.data.mounted).toBe(true);

    sheet.onExitComplete();
    expect(target.data.presenceState).toBe("unmounted");
    expect(target.data.mounted).toBe(true);

    sheet.stop();
  });

  it("manages multiple overlays via key array with granular setData, event dataset dispatch, and hideAll()", () => {
    const patches: Record<string, unknown>[] = [];
    const target = {
      setData: vi.fn((patch: Record<string, unknown>) => {
        patches.push(patch);
      }),
    };
    const onExitComplete = vi.fn();

    const overlays = usePresence({
      target,
      key: ["filter", "sort", "payment"] as const,
      onExitComplete,
    });

    expect(patches[0]).toEqual({
      filter: { present: false, open: false, mounted: false, state: "unmounted" },
      sort: { present: false, open: false, mounted: false, state: "unmounted" },
      payment: { present: false, open: false, mounted: false, state: "unmounted" },
    });

    // Open by string name
    overlays.show("filter");
    expect(overlays.getState("filter")).toEqual({
      present: true,
      open: true,
      mounted: true,
      state: "open",
    });
    expect(patches[patches.length - 1]).toEqual({
      filter: {
        present: true,
        open: true,
        mounted: true,
        state: "open",
      },
    });

    // Open by WXML event dataset
    overlays.show({ currentTarget: { dataset: { name: "sort" } } });
    expect(overlays.getState("sort").open).toBe(true);

    // Hide all open overlays
    overlays.hideAll();
    expect(overlays.getState("filter").state).toBe("exiting");
    expect(overlays.getState("sort").state).toBe("exiting");
    expect(overlays.getState("payment").state).toBe("unmounted");

    // Complete exit via WXML event dataset
    overlays.onExitComplete({ currentTarget: { dataset: { name: "filter" } } });
    expect(overlays.getState("filter").mounted).toBe(false);
    expect(onExitComplete).toHaveBeenCalledWith("filter");

    overlays.stop();
  });
});
