import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MiniappMachine } from "@code-id-labs/miniapp";
import { connectPresence, presenceMachine } from "../src";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Presence Machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("defers mounting when lazyMount is true until present becomes true", async () => {
    const machine = new MiniappMachine(presenceMachine, {
      present: false,
      lazyMount: true,
      unmountOnExit: false,
      duration: 200,
    });
    machine.start();

    let api = connectPresence(machine.service);
    expect(api.state).toBe("unmounted");
    expect(api.present).toBe(false);
    expect(api.mounted).toBe(false);
    expect(api.visible).toBe(false);
    expect(api.dataState).toBe("closed");

    // Open for the first time
    machine.updateProps({ present: true });
    await flush();

    api = connectPresence(machine.service);
    expect(api.state).toBe("open");
    expect(api.present).toBe(true);
    expect(api.mounted).toBe(true);
    expect(api.visible).toBe(true);
    expect(api.dataState).toBe("open");

    // Exit: stays mounted during exiting, and stays mounted afterward because unmountOnExit is false
    const onExitComplete = vi.fn();
    machine.updateProps({ present: false, onExitComplete });
    await flush();

    api = connectPresence(machine.service);
    expect(api.state).toBe("exiting");
    expect(api.mounted).toBe(true);
    expect(api.visible).toBe(true);
    expect(api.dataState).toBe("closed");
    expect(onExitComplete).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    await flush();

    api = connectPresence(machine.service);
    expect(api.state).toBe("unmounted");
    expect(api.mounted).toBe(true);
    expect(api.visible).toBe(false);
    expect(api.rootProps.hidden).toBe(true);
    expect(onExitComplete).toHaveBeenCalledTimes(1);

    machine.stop();
  });

  it("mounts initially when lazyMount and unmountOnExit are both false", () => {
    const machine = new MiniappMachine(presenceMachine, {
      present: false,
      lazyMount: false,
      unmountOnExit: false,
    });
    machine.start();

    const api = connectPresence(machine.service);
    expect(api.state).toBe("unmounted");
    expect(api.mounted).toBe(true);
    expect(api.visible).toBe(false);
    expect(api.rootProps.hidden).toBe(true);

    machine.stop();
  });

  it("unmounts after exit completes and invokes onExitComplete when unmountOnExit is true", async () => {
    const onExitComplete = vi.fn();
    const machine = new MiniappMachine(presenceMachine, {
      present: true,
      lazyMount: true,
      unmountOnExit: true,
      duration: 250,
      onExitComplete,
    });
    machine.start();

    expect(connectPresence(machine.service).mounted).toBe(true);
    expect(connectPresence(machine.service).state).toBe("open");

    machine.updateProps({ present: false });
    await flush();

    const exitingApi = connectPresence(machine.service);
    expect(exitingApi.state).toBe("exiting");
    expect(exitingApi.exiting).toBe(true);
    expect(exitingApi.mounted).toBe(true);
    expect(exitingApi.dataState).toBe("closed");
    expect(onExitComplete).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    await flush();

    const unmountedApi = connectPresence(machine.service);
    expect(unmountedApi.state).toBe("unmounted");
    expect(unmountedApi.mounted).toBe(false);
    expect(unmountedApi.visible).toBe(false);
    expect(onExitComplete).toHaveBeenCalledTimes(1);

    machine.stop();
  });

  it("handles rapid open -> close -> reopen interruption without firing onExitComplete", async () => {
    const onExitComplete = vi.fn();
    const machine = new MiniappMachine(presenceMachine, {
      present: false,
      lazyMount: true,
      unmountOnExit: true,
      duration: 300,
      onExitComplete,
    });
    machine.start();

    // Open
    machine.updateProps({ present: true });
    await flush();
    expect(machine.state.get()).toBe("open");

    // Close -> enters exiting and starts 300ms timer
    machine.updateProps({ present: false });
    await flush();
    expect(machine.state.get()).toBe("exiting");
    expect(vi.getTimerCount()).toBe(1);

    // Halfway through exit animation, reopen
    vi.advanceTimersByTime(120);
    machine.updateProps({ present: true });
    await flush();

    expect(machine.state.get()).toBe("open");
    expect(connectPresence(machine.service).mounted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    // Advance well past original exit duration -> stale timer must not fire
    vi.advanceTimersByTime(500);
    await flush();

    expect(machine.state.get()).toBe("open");
    expect(connectPresence(machine.service).mounted).toBe(true);
    expect(onExitComplete).not.toHaveBeenCalled();

    machine.stop();
  });

  it("supports immediate exit when duration is 0", async () => {
    const onExitComplete = vi.fn();
    const machine = new MiniappMachine(presenceMachine, {
      present: true,
      unmountOnExit: true,
      duration: 0,
      onExitComplete,
    });
    machine.start();

    machine.updateProps({ present: false });
    await flush();

    expect(machine.state.get()).toBe("unmounted");
    expect(connectPresence(machine.service).mounted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(onExitComplete).toHaveBeenCalledTimes(1);

    machine.stop();
  });

  it("completes exit early on handleAnimationEnd and ignores enter animationend", async () => {
    const onExitComplete = vi.fn();
    const triggerEvent = vi.fn();
    const machine = new MiniappMachine(presenceMachine, {
      present: true,
      unmountOnExit: true,
      duration: 400,
      onExitComplete,
      component: { triggerEvent } as any,
    });
    machine.start();

    // Enter animationend while in open state should be ignored
    connectPresence(machine.service).handleAnimationEnd();
    await flush();
    expect(machine.state.get()).toBe("open");
    expect(onExitComplete).not.toHaveBeenCalled();

    // Start exit
    machine.updateProps({ present: false });
    await flush();
    expect(machine.state.get()).toBe("exiting");
    expect(vi.getTimerCount()).toBe(1);

    // Native bindanimationend / bindtransitionend fires early
    connectPresence(machine.service).handleAnimationEnd();
    await flush();

    expect(machine.state.get()).toBe("unmounted");
    expect(connectPresence(machine.service).mounted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(onExitComplete).toHaveBeenCalledTimes(1);
    expect(triggerEvent).toHaveBeenCalledWith("exitcomplete", undefined);

    machine.stop();
  });
});
