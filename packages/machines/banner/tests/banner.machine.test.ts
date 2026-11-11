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

  it("syncs controlled open prop without echoing callbacks", async () => {
    const onOpenChange = vi.fn();
    const onDismiss = vi.fn();

    const machine = new MiniappMachine(bannerMachine, {
      open: false,
      onOpenChange,
      onDismiss,
    });
    machine.start();

    expect(machine.state.get()).toBe("closed");

    machine.updateProps({ open: true });
    await flush();

    expect(machine.state.get()).toBe("open");

    machine.updateProps({ open: false });
    await flush();

    expect(machine.state.get()).toBe("dismissing");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();

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
    expect(onOpenChange).toHaveBeenCalledWith({
      open: false,
      id: "sale-banner",
    });
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
      actions: [{ label: "Learn More", onClick }],
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
    const onOpenChange = vi.fn();
    const onClick = vi.fn();

    const machine = new MiniappMachine(bannerMachine, {
      actions: [{ label: "Accept", onClick, closeOnClick: true }],
      onAction,
      onDismiss,
      onOpenChange,
    });
    machine.start();

    const api = connectBanner(machine.service);
    api.handleAction(0);
    await flush();

    expect(onClick).toHaveBeenCalled();
    expect(onAction).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith({
      open: false,
      id: undefined,
    });
    expect(machine.state.get()).toBe("dismissing");

    machine.stop();
  });

  it("precomputes action defaults for WXML rendering", () => {
    const machine = new MiniappMachine(bannerMachine, {
      actions: [
        { label: "Action 1", icon: "check", loading: false },
        { label: "Action 2", loading: true, loadingIcon: "action-spinner" },
      ],
    });
    machine.start();

    const api = connectBanner(machine.service);
    expect(api.actions).toHaveLength(2);
    expect(api.actions[0]).toEqual(
      expect.objectContaining({
        label: "Action 1",
        index: 0,
        icon: "check",
        loading: false,
        loadingIcon: "loading",
        color: "",
        variant: "ghost",
        size: "xs",
      }),
    );

    expect(api.actions[1]).toEqual(
      expect.objectContaining({
        label: "Action 2",
        loading: true,
        loadingIcon: "action-spinner",
      }),
    );

    machine.stop();
  });

  it("invokes tap and more callbacks", async () => {
    const onTap = vi.fn();
    const onMore = vi.fn();

    const machine = new MiniappMachine(bannerMachine, {
      id: "promo-banner",
      onTap,
      onMore,
    });
    machine.start();

    const api = connectBanner(machine.service);
    api.handleTap();
    api.handleMore();
    await flush();

    expect(onTap).toHaveBeenCalledWith({ id: "promo-banner" });
    expect(onMore).toHaveBeenCalledWith({ id: "promo-banner" });

    machine.stop();
  });

  it("produces a null delta for no-op transition", () => {
    const machine = new MiniappMachine(bannerMachine, {});
    machine.start();

    const before = connectBanner(machine.service);
    machine.send({ type: "ANIMATION_END" });
    const after = connectBanner(machine.service);

    expect(diffSnapshot(before, after, "banner")).toBeNull();

    machine.stop();
  });

  it("cleans up the dismiss timer on stop()", async () => {
    vi.useFakeTimers();
    const machine = new MiniappMachine(bannerMachine, {});
    try {
      machine.start();
      connectBanner(machine.service).dismiss();
      await flush();
      expect(vi.getTimerCount()).toBe(1);

      machine.stop();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      machine.stop();
      vi.useRealTimers();
    }
  });
});
