import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { drawerMachine } from "../src/drawer.machine";
import { connectDrawer } from "../src/drawer.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Drawer Machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Initialization & Default Props", () => {
    it("initializes in closed state by default", () => {
      const machine = new MiniappMachine(drawerMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("placement")).toBe("bottom");

      const api = connectDrawer(machine.service);
      expect(api.open).toBe(false);
      expect(api.state).toBe("closed");
      expect(api.placement).toBe("bottom");
      expect(api.threshold).toBe(80);
      expect(api.duration).toBe(300);

      machine.stop();
    });

    it("initializes in open state when defaultOpen is true", () => {
      const machine = new MiniappMachine(drawerMachine, { defaultOpen: true });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);

      const api = connectDrawer(machine.service);
      expect(api.open).toBe(true);
      expect(api.state).toBe("open");

      machine.stop();
    });

    it("initializes in open state when controlled open is true", () => {
      const machine = new MiniappMachine(drawerMachine, { open: true });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);

      machine.stop();
    });

    it("respects custom placement prop", () => {
      const machine = new MiniappMachine(drawerMachine, { placement: "top" });
      machine.start();

      expect(machine.computed("placement")).toBe("top");
      const api = connectDrawer(machine.service);
      expect(api.placement).toBe("top");

      machine.stop();
    });
  });

  describe("Open & Close Transitions", () => {
    it("opens via OPEN event and closes via CLOSE event with animation effect", async () => {
      const machine = new MiniappMachine(drawerMachine, { duration: 250 });
      machine.start();

      expect(machine.state.get()).toBe("closed");

      // Open
      machine.send({ type: "OPEN" });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(machine.context.get("open")).toBe(true);

      // Close -> enters closing state
      machine.send({ type: "CLOSE" });
      await flush();

      expect(machine.state.get()).toBe("closing");
      expect(machine.context.get("open")).toBe(false);

      // Animation timer finishes
      vi.advanceTimersByTime(250);
      await flush();

      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });

    it("toggles open and closed states with TOGGLE event", async () => {
      const machine = new MiniappMachine(drawerMachine, { duration: 200 });
      machine.start();

      // Closed -> Open
      machine.send({ type: "TOGGLE" });
      await flush();
      expect(machine.state.get()).toBe("open");

      // Open -> Closing
      machine.send({ type: "TOGGLE" });
      await flush();
      expect(machine.state.get()).toBe("closing");

      // Closing -> Closed
      vi.advanceTimersByTime(200);
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });

    it("closes on CLOSE_TRIGGER.TAP", async () => {
      const machine = new MiniappMachine(drawerMachine, { defaultOpen: true });
      machine.start();

      expect(machine.state.get()).toBe("open");

      machine.send({ type: "CLOSE_TRIGGER.TAP" });
      await flush();

      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });

    it("closes on BACKDROP.TAP when closeOnBackdropClick is true", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        closeOnBackdropClick: true,
      });
      machine.start();

      machine.send({ type: "BACKDROP.TAP" });
      await flush();

      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });

    it("ignores BACKDROP.TAP when closeOnBackdropClick is false", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        closeOnBackdropClick: false,
      });
      machine.start();

      machine.send({ type: "BACKDROP.TAP" });
      await flush();

      expect(machine.state.get()).toBe("open");

      machine.stop();
    });

    it("allows re-opening while in closing state", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        duration: 500,
      });
      machine.start();

      machine.send({ type: "CLOSE" });
      await flush();
      expect(machine.state.get()).toBe("closing");

      // Re-open before animation finishes
      machine.send({ type: "OPEN" });
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(machine.context.get("open")).toBe(true);

      machine.stop();
    });
  });

  describe("Dragging & Gesture Handling", () => {
    it("transitions to dragging state on DRAG_START when dismissible", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        dismissible: true,
      });
      machine.start();

      machine.send({ type: "DRAG_START" });
      await flush();

      expect(machine.state.get()).toBe("dragging");
      expect(machine.service.state.hasTag("open")).toBe(true);
      expect(machine.service.state.hasTag("dragging")).toBe(true);

      machine.stop();
    });

    it("blocks DRAG_START when dismissible is false", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        dismissible: false,
      });
      machine.start();

      machine.send({ type: "DRAG_START" });
      await flush();

      expect(machine.state.get()).toBe("open");

      machine.stop();
    });

    it("transitions from dragging to closing when drag passed threshold", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
      });
      machine.start();

      machine.send({ type: "DRAG_START" });
      await flush();
      expect(machine.state.get()).toBe("dragging");

      machine.send({ type: "DRAG_END", passed: true } as any);
      await flush();

      expect(machine.state.get()).toBe("closing");
      expect(machine.context.get("open")).toBe(false);

      machine.stop();
    });

    it("snaps back to open when drag does not pass threshold", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
      });
      machine.start();

      machine.send({ type: "DRAG_START" });
      await flush();
      expect(machine.state.get()).toBe("dragging");

      machine.send({ type: "DRAG_END", passed: false } as any);
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(machine.context.get("open")).toBe(true);

      machine.stop();
    });

    it("can be closed directly during dragging", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
      });
      machine.start();

      machine.send({ type: "DRAG_START" });
      await flush();
      expect(machine.state.get()).toBe("dragging");

      machine.send({ type: "CLOSE" });
      await flush();

      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });
  });

  describe("Keyboard Height Tracking", () => {
    it("updates keyboardHeight in open and dragging states", async () => {
      const machine = new MiniappMachine(drawerMachine, { defaultOpen: true });
      machine.start();

      expect(machine.context.get("keyboardHeight")).toBe(0);

      // In open state
      machine.send({ type: "KEYBOARD_CHANGE", height: 280 } as any);
      await flush();
      expect(machine.context.get("keyboardHeight")).toBe(280);

      // In dragging state
      machine.send({ type: "DRAG_START" });
      await flush();

      machine.send({ type: "KEYBOARD_CHANGE", height: 0 } as any);
      await flush();
      expect(machine.context.get("keyboardHeight")).toBe(0);

      machine.stop();
    });
  });

  describe("onClose Callback", () => {
    it("fires onClose when open context transitions from true to false", async () => {
      const onClose = vi.fn();
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        onClose,
      });
      machine.start();

      expect(onClose).not.toHaveBeenCalled();

      machine.send({ type: "CLOSE" });
      await flush();

      expect(onClose).toHaveBeenCalledTimes(1);

      machine.stop();
    });
  });

  describe("Controlled Open Prop (watch)", () => {
    it("syncs state when controlled open prop is dynamically updated via updateProps", async () => {
      const machine = new MiniappMachine(drawerMachine, { open: false });
      machine.start();

      expect(machine.state.get()).toBe("closed");

      // Parent sets open = true
      machine.updateProps({ open: true });
      await flush();

      expect(machine.state.get()).toBe("open");

      // Parent sets open = false
      machine.updateProps({ open: false });
      await flush();

      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });
  });

  describe("Connected API Props & Anatomy", () => {
    it("provides connected methods and DOM attribute bindings", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        id: "payment-sheet",
        placement: "bottom",
        threshold: 100,
        duration: 400,
      });
      machine.start();

      const api = connectDrawer(machine.service);

      expect(api.rootProps.id).toBe("drawer:payment-sheet:root");
      expect(api.rootProps["data-state"]).toBe("closed");
      expect(api.rootProps["data-placement"]).toBe("bottom");

      expect(api.backdropProps.id).toBe("drawer:payment-sheet:backdrop");
      expect(api.backdropProps["data-state"]).toBe("closed");
      expect(api.backdropProps["aria-hidden"]).toBe(true);

      expect(api.contentProps.id).toBe("drawer:payment-sheet:content");
      expect(api.contentProps.role).toBe("dialog");
      expect(api.contentProps["aria-modal"]).toBe("true");
      expect(api.contentProps["aria-hidden"]).toBe(true);

      expect(api.grabberProps.id).toBe("drawer:payment-sheet:grabber");
      expect(api.closeTriggerProps.id).toBe("drawer:payment-sheet:close-trigger");
      expect(api.closeTriggerProps["aria-label"]).toBe("Close");

      // openDrawer via API
      api.openDrawer();
      await flush();

      const openApi = connectDrawer(machine.service);
      expect(openApi.open).toBe(true);
      expect(openApi.state).toBe("open");
      expect(openApi.rootProps["data-state"]).toBe("open");
      expect(openApi.backdropProps["data-state"]).toBe("open");
      expect(openApi.backdropProps["aria-hidden"]).toBe(false);
      expect(openApi.contentProps["aria-hidden"]).toBe(false);

      // closeDrawer via API
      openApi.closeDrawer();
      await flush();

      const closingApi = connectDrawer(machine.service);
      expect(closingApi.state).toBe("closing");

      // setOpen via API
      api.setOpen(true);
      await flush();
      expect(machine.state.get()).toBe("open");

      api.setOpen(false);
      await flush();
      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });
  });
});
