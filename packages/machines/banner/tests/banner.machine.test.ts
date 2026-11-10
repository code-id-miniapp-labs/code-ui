import { describe, expect, it, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { diffSnapshot } from "@code-ui/utils";
import { bannerMachine, connectBanner } from "../src";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("bannerMachine", () => {
  it("initializes to open state by default", () => {
    const machine = new MiniappMachine(bannerMachine, {});
    machine.start();

    const api = connectBanner(machine.service);
    expect(api.state).toBe("open");
    expect(api.open).toBe(true);
    expect(api.visible).toBe(true);
    expect(api.dismissing).toBe(false);

    machine.stop();
  });

  it("initializes to closed state when defaultOpen is false", () => {
    const machine = new MiniappMachine(bannerMachine, { defaultOpen: false });
    machine.start();

    const api = connectBanner(machine.service);
    expect(api.state).toBe("closed");
    expect(api.open).toBe(false);
    expect(api.visible).toBe(false);

    machine.stop();
  });

  it("syncs controlled open prop", async () => {
    const machine = new MiniappMachine(bannerMachine, { open: false });
    machine.start();

    expect(machine.state.get()).toBe("closed");

    machine.updateProps({ open: true });
    await flush();

    expect(machine.state.get()).toBe("open");

    machine.updateProps({ open: false });
    await flush();

    expect(machine.state.get()).toBe("dismissing");

    machine.stop();
  });

  it("handles dismiss lifecycle and triggers callbacks", async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const onOpenChange = vi.fn();

    const machine = new MiniappMachine(bannerMachine, {
      id: "sale-banner",
      onDismiss,
      onOpenChange,
    });
    machine.start();

    const api = connectBanner(machine.service);
    api.dismiss();
    await flush();

    expect(onDismiss).toHaveBeenCalledWith({ id: "sale-banner" });
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, id: "sale-banner" });
    expect(machine.state.get()).toBe("dismissing");
    expect(connectBanner(machine.service).dismissing).toBe(true);
    expect(connectBanner(machine.service).visible).toBe(true);

    vi.advanceTimersByTime(250);
    await flush();

    expect(machine.state.get()).toBe("closed");
    expect(connectBanner(machine.service).visible).toBe(false);

    machine.stop();
    vi.useRealTimers();
  });

  it("handles action buttons without closeOnClick", async () => {
    const onAction = vi.fn();
    const onClick = vi.fn();

    const machine = new MiniappMachine(bannerMachine, {
      actions: [
        { label: "Learn More", onClick },
      ],
      onAction,
    });
    machine.start();

    const api = connectBanner(machine.service);
    expect(api.actions).toHaveLength(1);
    expect(api.actions[0]?.label).toBe("Learn More");

    api.handleAction(0);
    await flush();

    expect(onClick).toHaveBeenCalled();
    expect(onAction).toHaveBeenCalledWith({
      action: { label: "Learn More", onClick },
      index: 0,
      id: undefined,
    });
    expect(machine.state.get()).toBe("open");

    machine.stop();
  });

  it("handles action buttons with closeOnClick: true", async () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    const onClick = vi.fn();

    const machine = new MiniappMachine(bannerMachine, {
      actions: [
        { label: "Accept", onClick, closeOnClick: true },
      ],
      onAction,
      onDismiss,
    });
    machine.start();

    const api = connectBanner(machine.service);
    api.handleAction(0);
    await flush();

    expect(onClick).toHaveBeenCalled();
    expect(onAction).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
    expect(machine.state.get()).toBe("dismissing");

    machine.stop();
  });

  it("supports configurable icon props (loadingIcon, closeIcon, action icons)", () => {
    const machine = new MiniappMachine(bannerMachine, {
      loading: true,
      loadingIcon: "custom-spinner",
      closeIcon: "custom-close",
      actions: [
        { label: "Action 1", icon: "check", loading: false },
        { label: "Action 2", loading: true, loadingIcon: "action-spinner" },
      ],
    });
    machine.start();

    const api = connectBanner(machine.service);
    expect(api.loading).toBe(true);
    expect(api.loadingIcon).toBe("custom-spinner");
    expect(api.closeIcon).toBe("custom-close");
    expect(api.rootProps["data-loading"]).toBe("true");
    expect(api.rootProps["aria-busy"]).toBe(true);

    expect(api.actions).toHaveLength(2);
    expect(api.actions[0]?.icon).toBe("check");
    expect(api.actions[0]?.loading).toBe(false);
    expect(api.actions[0]?.loadingIcon).toBe("custom-spinner");

    expect(api.actions[1]?.loading).toBe(true);
    expect(api.actions[1]?.loadingIcon).toBe("action-spinner");

    machine.stop();
  });

  it("produces a null delta for no-op transition", () => {
    const machine = new MiniappMachine(bannerMachine, {});
    machine.start();

    const before = connectBanner(machine.service);
    machine.send({ type: "MEASURE" });
    const after = connectBanner(machine.service);

    expect(diffSnapshot(before, after, "banner")).toBeNull();

    machine.stop();
  });
});
