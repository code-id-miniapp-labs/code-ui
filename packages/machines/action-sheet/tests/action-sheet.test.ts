import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { actionSheetMachine } from "../src/action-sheet.machine";
import { connectActionSheet } from "../src/action-sheet.connect";
import type { ActionSheetItem } from "../src/action-sheet.types";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("ActionSheet Machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Initialization & Default Props", () => {
    it("initializes in closed state by default", () => {
      const machine = new MiniappMachine(actionSheetMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(false);

      const api = connectActionSheet(machine.service);
      expect(api.open).toBe(false);
      expect(api.visible).toBe(false);
      expect(api.state).toBe("closed");
      expect(api.duration).toBe(300);
      expect(api.actions).toEqual([]);
      expect(api.showCancel).toBe(false);

      machine.stop();
    });

    it("initializes in open state when defaultOpen is true", () => {
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

      const api = connectActionSheet(machine.service);
      expect(api.open).toBe(true);
      expect(api.visible).toBe(true);
      expect(api.state).toBe("open");

      machine.stop();
    });

    it("initializes in open state when controlled open is true", () => {
      const machine = new MiniappMachine(actionSheetMachine, { open: true });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

      machine.stop();
    });
  });

  describe("Open & Close Lifecycle", () => {
    it("opens via openActionSheet and closes via closeActionSheet", async () => {
      const onOpenChange = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        onOpenChange,
        onClose,
        duration: 200,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.openActionSheet();
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(onOpenChange).toHaveBeenCalledWith({ open: true });

      api.closeActionSheet();
      await flush();
      expect(machine.state.get()).toBe("closing");
      expect(onOpenChange).toHaveBeenCalledWith({ open: false });
      expect(onClose).toHaveBeenCalled();

      // In closing, visible remains true
      const closingApi = connectActionSheet(machine.service);
      expect(closingApi.open).toBe(false);
      expect(closingApi.visible).toBe(true);

      // Advance timers for close animation
      vi.advanceTimersByTime(200);
      await flush();
      expect(machine.state.get()).toBe("closed");

      const closedApi = connectActionSheet(machine.service);
      expect(closedApi.visible).toBe(false);

      machine.stop();
    });

    it("supports setOpen(true) and setOpen(false)", async () => {
      const machine = new MiniappMachine(actionSheetMachine, {
        duration: 150,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.setOpen(true);
      await flush();
      expect(machine.state.get()).toBe("open");

      api.setOpen(false);
      await flush();
      expect(machine.state.get()).toBe("closing");

      vi.advanceTimersByTime(150);
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });

    it("ignores redundant setOpen calls", async () => {
      const onOpenChange = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        onOpenChange,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.setOpen(true);
      await flush();
      expect(onOpenChange).not.toHaveBeenCalled();

      machine.stop();
    });
  });

  describe("Controlled Open State", () => {
    it("syncs state when controlled open prop changes", async () => {
      const machine = new MiniappMachine(actionSheetMachine, {
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
  });

  describe("Backdrop & Cancel Tap", () => {
    it("closes when backdrop is tapped and closeOnBackdropClick is true", async () => {
      const onOpenChange = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        closeOnBackdropClick: true,
        onOpenChange,
        onClose,
      });
      machine.start();

      machine.send({ type: "BACKDROP.TAP" });
      await flush();
      expect(machine.state.get()).toBe("closing");
      expect(onOpenChange).toHaveBeenCalledWith({ open: false });
      expect(onClose).toHaveBeenCalled();

      machine.stop();
    });

    it("does not close when backdrop is tapped and closeOnBackdropClick is false", async () => {
      const onOpenChange = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        closeOnBackdropClick: false,
        onOpenChange,
      });
      machine.start();

      machine.send({ type: "BACKDROP.TAP" });
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(onOpenChange).not.toHaveBeenCalled();

      machine.stop();
    });

    it("triggers onCancel and closes when cancel is tapped", async () => {
      const onCancel = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        cancelText: "Cancel",
        onCancel,
        onClose,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.cancel();
      await flush();

      expect(onCancel).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });
  });

  describe("Action Selection", () => {
    const sampleActions: ActionSheetItem[] = [
      { label: "Option 1" },
      { label: "Delete", destructive: true },
      { label: "Disabled Option", disabled: true },
      { label: "Loading Option", loading: true },
    ];

    it("selects action and closes when closeOnAction is true", async () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        actions: sampleActions,
        closeOnAction: true,
        onSelect,
        onClose,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.select(1);
      await flush();

      expect(onSelect).toHaveBeenCalledWith({
        item: sampleActions[1],
        index: 1,
      });
      expect(onClose).toHaveBeenCalled();
      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });

    it("selects action but stays open when closeOnAction is false", async () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        actions: sampleActions,
        closeOnAction: false,
        onSelect,
        onClose,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.select(0);
      await flush();

      expect(onSelect).toHaveBeenCalledWith({
        item: sampleActions[0],
        index: 0,
      });
      expect(onClose).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("open");

      machine.stop();
    });

    it("does not select disabled or loading actions", async () => {
      const onSelect = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        actions: sampleActions,
        onSelect,
      });
      machine.start();

      const api = connectActionSheet(machine.service);

      // Select disabled action (index 2)
      api.select(2);
      await flush();
      expect(onSelect).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("open");

      // Select loading action (index 3)
      api.select(3);
      await flush();
      expect(onSelect).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("open");

      machine.stop();
    });
  });

  describe("ShowCancel & Actions Pre-computation", () => {
    it("computes showCancel based on cancelText presence", () => {
      const m1 = new MiniappMachine(actionSheetMachine, {
        cancelText: "Cancel",
      });
      m1.start();
      expect(connectActionSheet(m1.service).showCancel).toBe(true);
      m1.stop();

      const m2 = new MiniappMachine(actionSheetMachine, { cancelText: "" });
      m2.start();
      expect(connectActionSheet(m2.service).showCancel).toBe(false);
      m2.stop();

      const m3 = new MiniappMachine(actionSheetMachine, {
        cancelText: "Cancel",
        showCancel: false,
      });
      m3.start();
      expect(connectActionSheet(m3.service).showCancel).toBe(false);
      m3.stop();

      const m4 = new MiniappMachine(actionSheetMachine, {
        showCancel: true,
      });
      m4.start();
      expect(connectActionSheet(m4.service).showCancel).toBe(true);
      m4.stop();
    });

    it("pre-computes action items safely for WXML", () => {
      const items: ActionSheetItem[] = [
        { label: "Share", openType: "share", icon: "share" },
        { label: "Remove", destructive: true },
        { label: "Loading Item", loading: true, loadingIcon: "item-spinner" },
      ];
      const machine = new MiniappMachine(actionSheetMachine, {
        actions: items,
        loadingIcon: "global-spinner",
        cancelIcon: "close",
        closeIcon: "cross",
        close: true,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      expect(api.loadingIcon).toBe("global-spinner");
      expect(api.cancelIcon).toBe("close");
      expect(api.closeIcon).toBe("cross");
      expect(api.showClose).toBe(true);
      expect(api.actions).toHaveLength(3);
      expect(api.actions[0]?.loadingIcon).toBe("global-spinner");
      expect(api.actions[2]?.loadingIcon).toBe("item-spinner");

      machine.stop();
    });

    it("closes when header close trigger is tapped", async () => {
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        close: true,
        onClose,
      });
      machine.start();

      machine.send({ type: "CLOSE_TRIGGER.TAP" });
      await flush();
      expect(machine.state.get()).toBe("closing");
      expect(onClose).toHaveBeenCalled();

      machine.stop();
    });
  });

  describe("ARIA & DOM Props", () => {
    it("provides correct accessibility and state attributes", () => {
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        cancelText: "Dismiss",
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      expect(api.rootProps["data-state"]).toBe("open");
      expect(api.rootProps.hidden).toBe(false);

      expect(api.backdropProps["data-state"]).toBe("open");
      expect(api.backdropProps["aria-hidden"]).toBe(true);

      expect(api.contentProps["data-state"]).toBe("open");
      expect(api.contentProps["aria-role"]).toBe("dialog");
      expect(api.contentProps["aria-modal"]).toBe(true);
      expect(api.contentProps["aria-hidden"]).toBe(false);

      expect(api.cancelProps["aria-role"]).toBe("button");
      expect(api.cancelProps["aria-label"]).toBe("Dismiss");

      machine.stop();
    });
  });
});
