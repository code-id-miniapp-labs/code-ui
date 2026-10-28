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
      expect(machine.computed("isVisible")).toBe(false);
      expect(machine.computed("placement")).toBe("bottom");

      const api = connectDrawer(machine.service);
      expect(api.open).toBe(false);
      expect(api.visible).toBe(false);
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
      expect(machine.computed("isVisible")).toBe(true);

      const api = connectDrawer(machine.service);
      expect(api.open).toBe(true);
      expect(api.visible).toBe(true);
      expect(api.state).toBe("open");

      machine.stop();
    });

    it("initializes in open state when controlled open is true", () => {
      const machine = new MiniappMachine(drawerMachine, { open: true });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

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
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(false);

      // Open
      machine.send({ type: "OPEN" });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

      // Close -> enters closing state
      machine.send({ type: "CLOSE" });
      await flush();

      expect(machine.state.get()).toBe("closing");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(true);

      // Animation timer finishes
      vi.advanceTimersByTime(250);
      await flush();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(false);

      machine.stop();
    });

    it("toggles open and closed states with TOGGLE event", async () => {
      const machine = new MiniappMachine(drawerMachine, { duration: 200 });
      machine.start();

      // Closed -> Open
      machine.send({ type: "TOGGLE" });
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

      // Open -> Closing
      machine.send({ type: "TOGGLE" });
      await flush();
      expect(machine.state.get()).toBe("closing");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(true);

      // Closing -> Closed
      vi.advanceTimersByTime(200);
      await flush();
      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(false);

      machine.stop();
    });

    it("closes on CLOSE_TRIGGER.TAP", async () => {
      const machine = new MiniappMachine(drawerMachine, { defaultOpen: true });
      machine.start();

      expect(machine.state.get()).toBe("open");

      machine.send({ type: "CLOSE_TRIGGER.TAP" });
      await flush();

      expect(machine.state.get()).toBe("closing");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(true);

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
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(true);

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
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

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
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(true);

      // Re-open before animation finishes
      machine.send({ type: "OPEN" });
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

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
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

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
      expect(machine.computed("isOpen")).toBe(true);

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
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(true);

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
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

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
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(true);

      machine.stop();
    });
  });

  describe("Callbacks (onOpenChange & onClose)", () => {
    it("invokes onOpenChange when opening", async () => {
      const onOpenChange = vi.fn();
      const machine = new MiniappMachine(drawerMachine, { onOpenChange });
      machine.start();

      machine.send({ type: "OPEN" });
      await flush();

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith({ open: true });

      machine.stop();
    });

    it("invokes onOpenChange and onClose when closing via CLOSE event", async () => {
      const onOpenChange = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        onOpenChange,
        onClose,
      });
      machine.start();

      machine.send({ type: "CLOSE" });
      await flush();

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith({ open: false });
      expect(onClose).toHaveBeenCalledTimes(1);

      machine.stop();
    });

    it("invokes onOpenChange and onClose on successful drag close", async () => {
      const onOpenChange = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        onOpenChange,
        onClose,
      });
      machine.start();

      machine.send({ type: "DRAG_START" });
      await flush();
      machine.send({ type: "DRAG_END", passed: true } as any);
      await flush();

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith({ open: false });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });

    it("does not invoke onClose when drag snaps back to open", async () => {
      const onClose = vi.fn();
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        onClose,
      });
      machine.start();

      machine.send({ type: "DRAG_START" });
      await flush();
      machine.send({ type: "DRAG_END", passed: false } as any);
      await flush();

      expect(onClose).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("open");

      machine.stop();
    });
  });

  describe("Keyboard Height Tracking", () => {
    it("updates keyboardHeight in open and dragging states and resets on closed", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        defaultOpen: true,
        duration: 100,
      });
      machine.start();

      expect(machine.context.get("keyboardHeight")).toBe(0);

      // In open state
      machine.send({ type: "KEYBOARD_CHANGE", height: 280 } as any);
      await flush();
      expect(machine.context.get("keyboardHeight")).toBe(280);

      // In dragging state
      machine.send({ type: "DRAG_START" });
      await flush();

      machine.send({ type: "KEYBOARD_CHANGE", height: 150 } as any);
      await flush();
      expect(machine.context.get("keyboardHeight")).toBe(150);

      // Close and wait for animation to complete -> enters closed state
      machine.send({ type: "CLOSE" });
      await flush();
      vi.advanceTimersByTime(100);
      await flush();

      expect(machine.state.get()).toBe("closed");
      expect(machine.context.get("keyboardHeight")).toBe(0);

      machine.stop();
    });
  });

  describe("Controlled Open Prop (watch)", () => {
    it("syncs state across multiple open -> close -> open cycles via updateProps", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        open: false,
        duration: 200,
      });
      machine.start();

      expect(machine.state.get()).toBe("closed");

      // 1st open
      machine.updateProps({ open: true });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);

      // 1st close
      machine.updateProps({ open: false });
      await flush();

      expect(machine.state.get()).toBe("closing");
      expect(machine.computed("isOpen")).toBe(false);

      vi.advanceTimersByTime(200);
      await flush();
      expect(machine.state.get()).toBe("closed");

      // 2nd open (re-open)
      machine.updateProps({ open: true });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);

      machine.stop();
    });

    it("can re-open via controlled prop after closing via backdrop tap or drag", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        open: false,
        duration: 200,
        onClose: () => {
          machine.updateProps({ open: false });
        },
      });
      machine.start();

      // Open
      machine.updateProps({ open: true });
      await flush();
      expect(machine.state.get()).toBe("open");

      // Close via drag
      machine.send({ type: "DRAG_START" });
      await flush();
      expect(machine.state.get()).toBe("dragging");

      machine.send({ type: "DRAG_END", passed: true } as any);
      await flush();
      expect(machine.state.get()).toBe("closing");

      vi.advanceTimersByTime(200);
      await flush();
      expect(machine.state.get()).toBe("closed");

      // Re-open
      machine.updateProps({ open: true });
      await flush();
      expect(machine.state.get()).toBe("open");

      machine.stop();
    });
  });

  describe("Connected API Props & Anatomy", () => {
    it("provides connected methods and DOM attribute bindings in closed state", () => {
      const machine = new MiniappMachine(drawerMachine, {
        id: "payment-sheet",
        placement: "bottom",
        threshold: 100,
        duration: 400,
      });
      machine.start();

      const api = connectDrawer(machine.service);

      expect(api.open).toBe(false);
      expect(api.visible).toBe(false);
      expect(api.state).toBe("closed");
      expect(api.placement).toBe("bottom");
      expect(api.threshold).toBe(100);
      expect(api.duration).toBe(400);

      expect(api.rootProps.id).toBe("drawer:payment-sheet:root");
      expect(api.rootProps["data-state"]).toBe("closed");
      expect(api.rootProps["data-placement"]).toBe("bottom");
      expect(api.rootProps.hidden).toBe(true);

      expect(api.backdropProps.id).toBe("drawer:payment-sheet:backdrop");
      expect(api.backdropProps["data-state"]).toBe("closed");
      expect(api.backdropProps["data-transition-state"]).toBe("closed");
      expect(api.backdropProps["aria-hidden"]).toBe(true);
      expect(api.backdropProps.hidden).toBe(true);

      expect(api.contentProps.id).toBe("drawer:payment-sheet:content");
      expect(api.contentProps.role).toBe("dialog");
      expect(api.contentProps["aria-modal"]).toBe("true");
      expect(api.contentProps["aria-hidden"]).toBe(true);
      expect(api.contentProps.hidden).toBe(true);
      expect(api.contentProps["data-keyboard-height"]).toBe(0);

      expect(api.grabberProps.id).toBe("drawer:payment-sheet:grabber");
      expect(api.closeTriggerProps.id).toBe(
        "drawer:payment-sheet:close-trigger",
      );
      expect(api.closeTriggerProps["aria-label"]).toBe("Close");

      machine.stop();
    });

    it("updates attributes when opened, closed, and during keyboard change", async () => {
      const machine = new MiniappMachine(drawerMachine, {
        id: "sheet",
        duration: 300,
      });
      machine.start();

      const api = connectDrawer(machine.service);

      // openDrawer via API
      api.openDrawer();
      await flush();

      const openApi = connectDrawer(machine.service);
      expect(openApi.open).toBe(true);
      expect(openApi.visible).toBe(true);
      expect(openApi.state).toBe("open");
      expect(openApi.rootProps["data-state"]).toBe("open");
      expect(openApi.rootProps.hidden).toBe(false);
      expect(openApi.backdropProps["data-state"]).toBe("open");
      expect(openApi.backdropProps["data-transition-state"]).toBe("open");
      expect(openApi.backdropProps["aria-hidden"]).toBe(true);
      expect(openApi.backdropProps.hidden).toBe(false);
      expect(openApi.contentProps["aria-hidden"]).toBe(false);
      expect(openApi.contentProps.hidden).toBe(false);

      // Keyboard change while open
      machine.send({ type: "KEYBOARD_CHANGE", height: 260 } as any);
      await flush();
      const kbApi = connectDrawer(machine.service);
      expect(kbApi.contentProps["data-keyboard-height"]).toBe(260);
      expect(kbApi.contentProps.style).toBe("--keyboard-height: 260px;");

      // closeDrawer via API
      openApi.closeDrawer();
      await flush();

      const closingApi = connectDrawer(machine.service);
      expect(closingApi.state).toBe("closing");
      expect(closingApi.open).toBe(false);
      expect(closingApi.visible).toBe(true);
      expect(closingApi.backdropProps["data-state"]).toBe("closed");
      expect(closingApi.backdropProps["data-transition-state"]).toBe("closing");
      expect(closingApi.contentProps.style).toBe("--keyboard-height: 260px;");

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
