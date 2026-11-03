import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { toastMachine } from "../src/toast.machine";
import { connectToast } from "../src/toast.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Toast Machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("initializes in open state by default", () => {
    const machine = new MiniappMachine(toastMachine, {
      title: "Notice",
      description: "Operation successful",
    });
    machine.start();

    expect(machine.state.get()).toBe("open");
    expect(machine.computed("isOpen")).toBe(true);
    expect(machine.computed("isVisible")).toBe(true);
    expect(machine.computed("isPaused")).toBe(false);

    const api = connectToast(machine.service);
    expect(api.state).toBe("open");
    expect(api.open).toBe(true);
    expect(api.visible).toBe(true);
    expect(api.paused).toBe(false);

    machine.stop();
  });

  it("initializes in closed state when open is false", () => {
    const machine = new MiniappMachine(toastMachine, {
      open: false,
    });
    machine.start();

    expect(machine.state.get()).toBe("closed");
    expect(machine.computed("isOpen")).toBe(false);
    expect(machine.computed("isVisible")).toBe(false);

    machine.stop();
  });

  it("auto dismisses after duration", async () => {
    const onDismiss = vi.fn();
    const onOpenChange = vi.fn();
    const machine = new MiniappMachine(toastMachine, {
      duration: 3000,
      onDismiss,
      onOpenChange,
    });
    machine.start();

    expect(machine.state.get()).toBe("open");

    // Advance past duration
    vi.advanceTimersByTime(3000);
    await flush();
    expect(machine.state.get()).toBe("dismissing");

    // Advance past dismiss animation
    vi.advanceTimersByTime(250);
    await flush();
    expect(machine.state.get()).toBe("closed");
    expect(onDismiss).toHaveBeenCalledTimes(1);

    machine.stop();
  });

  it("auto dismisses when open: true is explicitly passed", async () => {
    const onDismiss = vi.fn();
    const machine = new MiniappMachine(toastMachine, {
      id: "toast-1",
      open: true,
      duration: 3000,
      onDismiss,
    });
    machine.start();

    expect(machine.state.get()).toBe("open");

    vi.advanceTimersByTime(3000);
    await flush();
    expect(machine.state.get()).toBe("dismissing");

    vi.advanceTimersByTime(250);
    await flush();
    expect(machine.state.get()).toBe("closed");
    expect(onDismiss).toHaveBeenCalledWith({ id: "toast-1" });

    machine.stop();
  });

  it("manual dismiss dismisses and does not reopen when open: true is passed", async () => {
    const onDismiss = vi.fn();
    const machine = new MiniappMachine(toastMachine, {
      id: "toast-2",
      open: true,
      duration: 5000,
      onDismiss,
    });
    machine.start();

    const api = connectToast(machine.service);
    api.dismiss();
    await flush();

    expect(machine.state.get()).toBe("dismissing");
    vi.advanceTimersByTime(250);
    await flush();
    expect(machine.state.get()).toBe("closed");
    expect(onDismiss).toHaveBeenCalledWith({ id: "toast-2" });

    machine.stop();
  });

  it("closes when open prop changes from true to false", async () => {
    const onDismiss = vi.fn();
    const machine = new MiniappMachine(toastMachine, {
      id: "toast-3",
      open: true,
      duration: 5000,
      onDismiss,
    });
    machine.start();

    expect(machine.state.get()).toBe("open");

    machine.updateProps({ open: false });
    await flush();

    expect(machine.state.get()).toBe("dismissing");
    vi.advanceTimersByTime(250);
    await flush();
    expect(machine.state.get()).toBe("closed");

    machine.stop();
  });

  it("pauses and resumes countdown on pause/resume", async () => {
    const onDismiss = vi.fn();
    const machine = new MiniappMachine(toastMachine, {
      duration: 3000,
      onDismiss,
    });
    machine.start();

    // 1000ms passes
    vi.advanceTimersByTime(1000);
    const api = connectToast(machine.service);
    api.pause();
    await flush();

    expect(machine.state.get()).toBe("paused");
    expect(machine.computed("isPaused")).toBe(true);

    // 5000ms while paused should not trigger dismiss
    vi.advanceTimersByTime(5000);
    await flush();
    expect(machine.state.get()).toBe("paused");
    expect(onDismiss).not.toHaveBeenCalled();

    // Resume
    api.resume();
    await flush();
    expect(machine.state.get()).toBe("open");

    // Advance remaining 2000ms
    vi.advanceTimersByTime(2000);
    await flush();
    expect(machine.state.get()).toBe("dismissing");
    vi.advanceTimersByTime(250);
    await flush();
    expect(machine.state.get()).toBe("closed");
    expect(onDismiss).toHaveBeenCalledTimes(1);

    machine.stop();
  });

  it("manual dismiss triggers closing and dismissal", async () => {
    const onDismiss = vi.fn();
    const machine = new MiniappMachine(toastMachine, {
      id: "toast-manual",
      duration: 5000,
      onDismiss,
    });
    machine.start();

    const api = connectToast(machine.service);
    api.dismiss();
    await flush();

    expect(machine.state.get()).toBe("dismissing");
    vi.advanceTimersByTime(250);
    await flush();
    expect(machine.state.get()).toBe("closed");
    expect(onDismiss).toHaveBeenCalledWith({ id: "toast-manual" });

    machine.stop();
  });

  it("handles action tap and auto-dismisses", async () => {
    const onAction = vi.fn();
    const actionClick = vi.fn();
    const machine = new MiniappMachine(toastMachine, {
      actions: [
        {
          label: "Undo",
          onClick: actionClick,
        },
      ],
      onAction,
    });
    machine.start();

    const api = connectToast(machine.service);
    expect(api.actions).toHaveLength(1);
    expect(api.actions[0]?.label).toBe("Undo");

    api.handleAction(0);
    await flush();
    expect(actionClick).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({
      action: expect.objectContaining({ label: "Undo" }),
      index: 0,
      id: undefined,
    });
    expect(machine.state.get()).toBe("dismissing");

    machine.stop();
  });
});
