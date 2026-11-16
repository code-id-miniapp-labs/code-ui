import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { diffSnapshot } from "@code-ui/utils";
import { modalMachine } from "../src/modal.machine";
import { connectModal } from "../src/modal.connect";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("Modal Machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Initialization & Default Props", () => {
    it("initializes in closed state by default", () => {
      const machine = new MiniappMachine(modalMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(false);

      const api = connectModal(machine.service);
      expect(api.open).toBe(false);
      expect(api.visible).toBe(false);
      expect(api.state).toBe("closed");
      expect(api.rootProps["data-state"]).toBe("closed");
      expect(api.rootProps.hidden).toBe(true);
      expect(api.contentProps["aria-role"]).toBe("dialog");
      expect(api.contentProps["aria-modal"]).toBe(true);
      expect(api.contentProps["aria-hidden"]).toBe(true);

      machine.stop();
    });

    it("initializes in open state when defaultOpen is true", () => {
      const machine = new MiniappMachine(modalMachine, { defaultOpen: true });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

      const api = connectModal(machine.service);
      expect(api.open).toBe(true);
      expect(api.visible).toBe(true);
      expect(api.contentProps["aria-hidden"]).toBe(false);

      machine.stop();
    });

    it("initializes in open state when controlled open is true", () => {
      const machine = new MiniappMachine(modalMachine, { open: true });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

      machine.stop();
    });
  });

  describe("Controlled Prop Sync", () => {
    it("syncs controlled open prop into FSM state", async () => {
      const machine = new MiniappMachine(modalMachine, {
        open: false,
        duration: 200,
      });
      machine.start();

      expect(machine.state.get()).toBe("closed");

      machine.updateProps({ open: true });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

      machine.updateProps({ open: false });
      await flush();

      expect(machine.state.get()).toBe("closing");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(true);

      vi.advanceTimersByTime(200);
      await flush();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isVisible")).toBe(false);

      machine.stop();
    });

    it("closes immediately when controlled open changes to false with transition: false", async () => {
      const machine = new MiniappMachine(modalMachine, {
        open: true,
        transition: false,
      });
      machine.start();

      expect(machine.state.get()).toBe("open");

      machine.updateProps({ open: false });
      await flush();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isVisible")).toBe(false);
      expect(vi.getTimerCount()).toBe(0);

      machine.stop();
    });
  });

  describe("Open, Close, Trigger & Lifecycle Callbacks", () => {
    it("opens via OPEN / TRIGGER.TAP and closes via CLOSE with transition lifecycle callbacks", async () => {
      const onOpenChange = vi.fn();
      const onClose = vi.fn();
      const onEnter = vi.fn();
      const onAfterEnter = vi.fn();
      const onLeave = vi.fn();
      const onAfterLeave = vi.fn();

      const machine = new MiniappMachine(modalMachine, {
        duration: 250,
        onOpenChange,
        onClose,
        onEnter,
        onAfterEnter,
        onLeave,
        onAfterLeave,
      });
      machine.start();

      machine.send({ type: "TRIGGER.TAP" });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(onOpenChange).toHaveBeenLastCalledWith({ open: true });
      expect(onEnter).toHaveBeenCalledTimes(1);
      expect(onAfterEnter).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250);
      await flush();
      expect(onAfterEnter).toHaveBeenCalledTimes(1);

      machine.send({ type: "CLOSE" });
      await flush();

      expect(machine.state.get()).toBe("closing");
      expect(onOpenChange).toHaveBeenLastCalledWith({ open: false });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onLeave).toHaveBeenCalledTimes(1);
      expect(onAfterLeave).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250);
      await flush();

      expect(machine.state.get()).toBe("closed");
      expect(onAfterLeave).toHaveBeenCalledTimes(1);

      machine.stop();
    });

    it("toggles via TOGGLE and imperative API helpers", async () => {
      const machine = new MiniappMachine(modalMachine, { duration: 150 });
      machine.start();

      const api = connectModal(machine.service);
      api.openModal();
      await flush();
      expect(machine.state.get()).toBe("open");

      api.toggle();
      await flush();
      expect(machine.state.get()).toBe("closing");

      // Re-open while closing cancels exit transition
      api.setOpen(true);
      await flush();
      expect(machine.state.get()).toBe("open");

      api.closeModal();
      await flush();
      expect(machine.state.get()).toBe("closing");

      vi.advanceTimersByTime(150);
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });

    it("skips closing state and timers when transition is false", async () => {
      const onEnter = vi.fn();
      const onAfterEnter = vi.fn();
      const onLeave = vi.fn();
      const onAfterLeave = vi.fn();

      const machine = new MiniappMachine(modalMachine, {
        transition: false,
        onEnter,
        onAfterEnter,
        onLeave,
        onAfterLeave,
      });
      machine.start();

      machine.send({ type: "OPEN" });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(onEnter).toHaveBeenCalledTimes(1);
      expect(onAfterEnter).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);

      machine.send({ type: "CLOSE" });
      await flush();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isVisible")).toBe(false);
      expect(onLeave).toHaveBeenCalledTimes(1);
      expect(onAfterLeave).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);

      machine.stop();
    });
  });

  describe("Dismissible, Overlay & Close Trigger Guards", () => {
    it("dismisses on OVERLAY.TAP when dismissible and closeOnBackdropClick are true", async () => {
      const onClose = vi.fn();
      const onClosePrevent = vi.fn();
      const machine = new MiniappMachine(modalMachine, {
        defaultOpen: true,
        duration: 100,
        onClose,
        onClosePrevent,
      });
      machine.start();

      machine.send({ type: "OVERLAY.TAP" });
      await flush();

      expect(machine.state.get()).toBe("closing");
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClosePrevent).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });

    it("prevents overlay dismissal and emits onClosePrevent when dismissible is false, while close trigger still closes", async () => {
      const onClose = vi.fn();
      const onClosePrevent = vi.fn();
      const machine = new MiniappMachine(modalMachine, {
        defaultOpen: true,
        dismissible: false,
        duration: 100,
        onClose,
        onClosePrevent,
      });
      machine.start();

      machine.send({ type: "OVERLAY.TAP" });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(onClose).not.toHaveBeenCalled();
      expect(onClosePrevent).toHaveBeenCalledTimes(1);

      machine.send({ type: "CLOSE_TRIGGER.TAP" });
      await flush();

      expect(machine.state.get()).toBe("closing");
      expect(onClose).toHaveBeenCalledTimes(1);

      machine.stop();
    });

    it("prevents overlay dismissal when closeOnBackdropClick is false", async () => {
      const onClosePrevent = vi.fn();
      const machine = new MiniappMachine(modalMachine, {
        defaultOpen: true,
        closeOnBackdropClick: false,
        onClosePrevent,
      });
      machine.start();

      machine.send({ type: "OVERLAY.TAP" });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(onClosePrevent).toHaveBeenCalledTimes(1);

      machine.stop();
    });
  });

  describe("Keyboard Avoidance, Snapshot Hygiene & Cleanup", () => {
    it("tracks keyboardHeight while open and resets on close", async () => {
      const machine = new MiniappMachine(modalMachine, {
        defaultOpen: true,
        transition: false,
      });
      machine.start();

      machine.send({ type: "KEYBOARD_CHANGE", height: 280 });
      await flush();

      const openApi = connectModal(machine.service);
      expect(openApi.containerProps.style).toBe("padding-bottom: 280px;");
      expect(openApi.contentProps["data-keyboard-height"]).toBe(280);
      expect(openApi.contentProps.style).toBe("--keyboard-height: 280px;");

      machine.send({ type: "CLOSE" });
      await flush();

      const closedApi = connectModal(machine.service);
      expect(closedApi.containerProps.style).toBe("");
      expect(closedApi.contentProps["data-keyboard-height"]).toBe(0);
      expect(closedApi.contentProps.style).toBe("");

      machine.stop();
    });

    it("emits a null delta for no-op events", async () => {
      const machine = new MiniappMachine(modalMachine, {});
      machine.start();

      const before = connectModal(machine.service);
      machine.send({ type: "CLOSE" }); // already closed
      await flush();
      const after = connectModal(machine.service);

      expect(diffSnapshot(before, after, "modal")).toBeNull();

      machine.stop();
    });

    it("cleans up state-scoped timers on stop()", async () => {
      const onAfterEnter = vi.fn();
      const onAfterLeave = vi.fn();
      const machine = new MiniappMachine(modalMachine, {
        duration: 300,
        onAfterEnter,
        onAfterLeave,
      });
      machine.start();

      machine.send({ type: "OPEN" });
      await flush();
      expect(vi.getTimerCount()).toBe(1);

      machine.send({ type: "CLOSE" });
      await flush();
      expect(vi.getTimerCount()).toBe(1);

      machine.stop();
      expect(vi.getTimerCount()).toBe(0);
      expect(onAfterEnter).not.toHaveBeenCalled();
      expect(onAfterLeave).not.toHaveBeenCalled();
    });
  });
});
