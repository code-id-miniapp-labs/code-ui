import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { buttonMachine } from "../src/button.machine";
import { connectButton } from "../src/button.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Button Machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Initialization & Default Props", () => {
    it("initializes in idle state by default", () => {
      const machine = new MiniappMachine(buttonMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("isLoading")).toBe(false);
      expect(machine.computed("isDisabled")).toBe(false);
      expect(machine.computed("isInteractive")).toBe(true);

      const api = connectButton(machine.service);
      expect(api.state).toBe("idle");
      expect(api.loading).toBe(false);
      expect(api.disabled).toBe(false);
      expect(api.variant).toBe("solid");
      expect(api.color).toBe("primary");
      expect(api.size).toBe("md");
      expect(api.block).toBe(false);

      machine.stop();
    });

    it("initializes directly in loading state when loading prop is true", () => {
      const machine = new MiniappMachine(buttonMachine, { loading: true });
      machine.start();

      expect(machine.state.get()).toBe("loading");
      expect(machine.computed("isLoading")).toBe(true);
      expect(machine.computed("isDisabled")).toBe(true);
      expect(machine.computed("isInteractive")).toBe(false);

      const api = connectButton(machine.service);
      expect(api.state).toBe("loading");
      expect(api.loading).toBe(true);
      expect(api.rootProps["data-state"]).toBe("loading");
      expect(api.rootProps["data-loading"]).toBe("true");
      expect(api.rootProps["aria-busy"]).toBe("true");

      machine.stop();
    });

    it("initializes with custom variants, size, and block props", () => {
      const machine = new MiniappMachine(buttonMachine, {
        variant: "outline",
        color: "danger",
        size: "lg",
        block: true,
      });
      machine.start();

      const api = connectButton(machine.service);
      expect(api.variant).toBe("outline");
      expect(api.color).toBe("danger");
      expect(api.size).toBe("lg");
      expect(api.block).toBe(true);
      expect(api.rootProps["data-variant"]).toBe("outline");
      expect(api.rootProps["data-color"]).toBe("danger");
      expect(api.rootProps["data-size"]).toBe("lg");
      expect(api.rootProps["data-block"]).toBe("true");

      machine.stop();
    });
  });

  describe("Synchronous Tap Handling", () => {
    it("invokes onTap and onClick handlers on TAP in idle state", async () => {
      const onTap = vi.fn();
      const onClick = vi.fn();
      const machine = new MiniappMachine(buttonMachine, { onTap, onClick });
      machine.start();

      const api = connectButton(machine.service);
      const fakeEvent = { detail: { x: 10, y: 20 } };
      api.handleTap(fakeEvent);

      await flush();

      expect(onTap).toHaveBeenCalledTimes(1);
      expect(onTap).toHaveBeenCalledWith(fakeEvent);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(fakeEvent);
      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });

    it("does not fire handlers when disabled", async () => {
      const onTap = vi.fn();
      const machine = new MiniappMachine(buttonMachine, {
        disabled: true,
        onTap,
      });
      machine.start();

      const api = connectButton(machine.service);
      api.handleTap();

      await flush();

      expect(onTap).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("idle");
      expect(api.disabled).toBe(true);
      expect(api.rootProps.disabled).toBe(true);

      machine.stop();
    });

    it("does not fire handlers when already loading", async () => {
      const onTap = vi.fn();
      const machine = new MiniappMachine(buttonMachine, {
        loading: true,
        onTap,
      });
      machine.start();

      const api = connectButton(machine.service);
      api.handleTap();

      await flush();

      expect(onTap).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("loading");

      machine.stop();
    });
  });

  describe("Async Tap Handling & Auto Loading (loadingAuto)", () => {
    it("transitions idle -> loading -> success -> idle on resolved async promise", async () => {
      let resolvePromise!: (val?: unknown) => void;
      const asyncAction = vi.fn(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
      );

      const machine = new MiniappMachine(buttonMachine, {
        loadingAuto: true,
        autoResetDuration: 1000,
        onTap: asyncAction,
      });
      machine.start();

      expect(machine.state.get()).toBe("idle");

      // Trigger tap
      machine.send({ type: "TAP" });
      await flush();

      expect(asyncAction).toHaveBeenCalledTimes(1);
      expect(machine.state.get()).toBe("loading");
      expect(machine.context.get("internalLoading")).toBe(true);
      expect(machine.computed("isLoading")).toBe(true);

      // Resolve the promise
      resolvePromise();
      await flush();
      await flush();

      expect(machine.state.get()).toBe("success");
      expect(machine.context.get("internalLoading")).toBe(false);

      // Auto reset timer
      vi.advanceTimersByTime(1000);
      await flush();

      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });

    it("transitions idle -> loading -> error -> idle on rejected async promise", async () => {
      let rejectPromise!: (err: unknown) => void;
      const asyncAction = vi.fn(
        () =>
          new Promise((_, reject) => {
            rejectPromise = reject;
          }),
      );

      const machine = new MiniappMachine(buttonMachine, {
        loadingAuto: true,
        autoResetDuration: 800,
        onTap: asyncAction,
      });
      machine.start();

      machine.send({ type: "TAP" });
      await flush();

      expect(machine.state.get()).toBe("loading");
      expect(machine.computed("isLoading")).toBe(true);

      // Reject the promise
      rejectPromise(new Error("Network failed"));
      await flush();
      await flush();

      expect(machine.state.get()).toBe("error");
      expect(machine.context.get("internalLoading")).toBe(false);

      // Auto reset timer
      vi.advanceTimersByTime(800);
      await flush();

      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });

    it("resets immediately to idle if autoResetDuration is <= 0", async () => {
      const asyncAction = vi.fn(() => Promise.resolve("ok"));
      const machine = new MiniappMachine(buttonMachine, {
        loadingAuto: true,
        autoResetDuration: 0,
        onTap: asyncAction,
      });
      machine.start();

      machine.send({ type: "TAP" });
      await flush();
      await flush();
      await flush();

      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });

    it("can re-trigger tap handler immediately during success or error, and RESET resets to idle", async () => {
      let resolvePromise!: () => void;
      const asyncAction = vi.fn(
        () =>
          new Promise<void>((res) => {
            resolvePromise = res;
          }),
      );

      const machine = new MiniappMachine(buttonMachine, {
        loadingAuto: true,
        autoResetDuration: 5000,
        onTap: asyncAction,
      });
      machine.start();

      machine.send({ type: "TAP" });
      await flush();
      resolvePromise();
      await flush();
      await flush();

      expect(machine.state.get()).toBe("success");

      // Immediate tap during success re-triggers handler instead of swallowing the click
      machine.send({ type: "TAP" });
      await flush();
      expect(asyncAction).toHaveBeenCalledTimes(2);
      expect(machine.state.get()).toBe("loading");

      // RESET resets to idle
      machine.send({ type: "RESET" });
      await flush();
      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });

    it("does not enter loading if loadingAuto is false even when returning a promise", async () => {
      const asyncAction = vi.fn(() => Promise.resolve());
      const machine = new MiniappMachine(buttonMachine, {
        loadingAuto: false,
        onTap: asyncAction,
      });
      machine.start();

      machine.send({ type: "TAP" });
      await flush();

      expect(asyncAction).toHaveBeenCalledTimes(1);
      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("isLoading")).toBe(false);

      machine.stop();
    });

    it("supports async handler via setPromise on event detail (MiniApp pattern)", async () => {
      let resolvePromise!: () => void;
      const asyncPromise = new Promise<void>((res) => {
        resolvePromise = res;
      });

      const machine = new MiniappMachine(buttonMachine, {
        loadingAuto: true,
        autoResetDuration: 1200,
        onTap: (rawEvent: any) => {
          // Parent Miniapp handler attaches promise to event detail
          rawEvent?.detail?.setPromise?.(asyncPromise);
        },
      });
      machine.start();

      const fakeEvent = {
        detail: {
          x: 10,
          y: 20,
        },
      };

      machine.send({ type: "TAP", event: fakeEvent });
      await flush();

      expect(machine.state.get()).toBe("loading");
      expect(machine.context.get("internalLoading")).toBe(true);
      expect(machine.computed("isLoading")).toBe(true);

      const api = connectButton(machine.service);
      expect(api.loading).toBe(true);
      expect(api.internalLoading).toBe(true);
      expect(api.rootProps["data-loading"]).toBe("true");

      // Resolve the async promise
      resolvePromise();
      await flush();
      await flush();

      expect(machine.state.get()).toBe("success");
      expect(machine.context.get("internalLoading")).toBe(false);

      // Auto reset to idle
      vi.advanceTimersByTime(1200);
      await flush();

      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("isLoading")).toBe(false);

      machine.stop();
    });

    it("tracks FSM state loading in computed isLoading, isDisabled, and isInteractive", async () => {
      const machine = new MiniappMachine(buttonMachine, {});
      machine.start();

      expect(machine.computed("isLoading")).toBe(false);
      expect(machine.computed("isDisabled")).toBe(false);
      expect(machine.computed("isInteractive")).toBe(true);

      machine.send({ type: "SET_LOADING", loading: true });
      await flush();

      expect(machine.state.get()).toBe("loading");
      expect(machine.computed("isLoading")).toBe(true);
      expect(machine.computed("isDisabled")).toBe(true);
      expect(machine.computed("isInteractive")).toBe(false);

      const api = connectButton(machine.service);
      expect(api.loading).toBe(true);
      expect(api.disabled).toBe(true);

      machine.stop();
    });
  });

  describe("Controlled State & Transitions", () => {
    it("handles manual SET_LOADING true and false events", async () => {
      const machine = new MiniappMachine(buttonMachine, {});
      machine.start();

      machine.send({ type: "SET_LOADING", loading: true });
      await flush();

      expect(machine.state.get()).toBe("loading");
      expect(machine.context.get("loading")).toBe(true);
      expect(machine.computed("isLoading")).toBe(true);

      machine.send({ type: "SET_LOADING", loading: false });
      await flush();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("loading")).toBe(false);
      expect(machine.computed("isLoading")).toBe(false);

      machine.stop();
    });

    it("handles SET_DISABLED event to mutate context disabled state", async () => {
      const machine = new MiniappMachine(buttonMachine, {});
      machine.start();

      const api = connectButton(machine.service);
      api.setDisabled(true);
      await flush();

      expect(machine.context.get("disabled")).toBe(true);
      expect(machine.computed("isDisabled")).toBe(true);
      expect(machine.computed("isInteractive")).toBe(false);

      api.setDisabled(false);
      await flush();

      expect(machine.context.get("disabled")).toBe(false);
      expect(machine.computed("isDisabled")).toBe(false);
      expect(machine.computed("isInteractive")).toBe(true);

      machine.stop();
    });

    it("syncs state when controlled loading prop is dynamically updated via updateProps", async () => {
      const machine = new MiniappMachine(buttonMachine, { loading: false });
      machine.start();

      expect(machine.state.get()).toBe("idle");

      // Parent updates prop to true
      machine.updateProps({ loading: true });
      await flush();

      expect(machine.state.get()).toBe("loading");

      // Parent updates prop back to false
      machine.updateProps({ loading: false });
      await flush();

      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });

    it("supports RESET event while in loading state", async () => {
      const machine = new MiniappMachine(buttonMachine, {});
      machine.start();

      machine.send({ type: "SET_LOADING", loading: true });
      await flush();

      expect(machine.state.get()).toBe("loading");

      machine.send({ type: "RESET" });
      await flush();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("loading")).toBe(false);

      machine.stop();
    });

    it("syncs state when controlled disabled prop is dynamically updated via updateProps", async () => {
      const machine = new MiniappMachine(buttonMachine, { disabled: false });
      machine.start();

      expect(machine.context.get("disabled")).toBe(false);
      expect(machine.computed("isDisabled")).toBe(false);

      // Parent updates prop to true
      machine.updateProps({ disabled: true });
      await flush();

      expect(machine.context.get("disabled")).toBe(true);
      expect(machine.computed("isDisabled")).toBe(true);
      expect(machine.computed("isInteractive")).toBe(false);

      // Parent updates prop back to false
      machine.updateProps({ disabled: false });
      await flush();

      expect(machine.context.get("disabled")).toBe(false);
      expect(machine.computed("isDisabled")).toBe(false);
      expect(machine.computed("isInteractive")).toBe(true);

      machine.stop();
    });

    it("loadingAuto works properly even when initialized with explicit loading: false and disabled: false (MiniApp default props)", async () => {
      let resolvePromise!: () => void;
      const asyncAction = vi.fn(
        () =>
          new Promise<void>((res) => {
            resolvePromise = res;
          }),
      );

      const machine = new MiniappMachine(buttonMachine, {
        loading: false,
        disabled: false,
        loadingAuto: true,
        onTap: asyncAction,
      });
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("isLoading")).toBe(false);

      machine.send({ type: "TAP" });
      await flush();

      expect(asyncAction).toHaveBeenCalledTimes(1);
      expect(machine.state.get()).toBe("loading");
      expect(machine.context.get("internalLoading")).toBe(true);
      expect(machine.computed("isLoading")).toBe(true);

      resolvePromise();
      await flush();
      await flush();

      expect(machine.state.get()).toBe("success");
      expect(machine.context.get("internalLoading")).toBe(false);
      expect(machine.computed("isLoading")).toBe(false);

      machine.stop();
    });
  });

  describe("Connected API Props & Accessibility", () => {
    it("generates correct DOM accessibility and data attributes", () => {
      const machine = new MiniappMachine(buttonMachine, {
        id: "submit-btn",
        variant: "secondary",
        color: "neutral",
        size: "sm",
        block: true,
      });
      machine.start();

      const api = connectButton(machine.service);

      expect(api.rootProps.id).toBe("button:submit-btn:root");
      expect(api.rootProps.role).toBe("button");
      expect(api.rootProps["data-state"]).toBe("idle");
      expect(api.rootProps["data-variant"]).toBe("secondary");
      expect(api.rootProps["data-color"]).toBe("neutral");
      expect(api.rootProps["data-size"]).toBe("sm");
      expect(api.rootProps["data-block"]).toBe("true");
      expect(api.rootProps["data-loading"]).toBeUndefined();
      expect(api.rootProps["data-disabled"]).toBeUndefined();
      expect(api.rootProps.disabled).toBe(false);

      expect(api.spinnerProps.id).toBe("button:submit-btn:spinner");
      expect(api.spinnerProps["aria-hidden"]).toBe("true");

      expect(api.labelProps.id).toBe("button:submit-btn:label");
      expect(api.iconProps.id).toBe("button:submit-btn:icon");
      expect(api.iconProps["aria-hidden"]).toBe("true");

      machine.stop();
    });
  });
});
