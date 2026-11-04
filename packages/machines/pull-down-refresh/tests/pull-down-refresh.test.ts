import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { pullDownRefreshMachine } from "../src/pull-down-refresh.machine";
import { connectPullDownRefresh } from "../src/pull-down-refresh.connect";
import type { PullDownRefreshRefreshDetails } from "../src/pull-down-refresh.types";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

async function send(machine: any, event: any): Promise<void> {
  machine.send(event);
  await flush();
}

describe("PullDownRefresh Machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Initialization", () => {
    it("starts idle by default", () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("isRefreshing")).toBe(false);
      expect(machine.computed("canPull")).toBe(true);
      expect(machine.computed("barHeight")).toBe(0);
      expect(machine.computed("tipsHeight")).toBe(0);
      expect(machine.computed("status")).toBe(-1);
      expect(machine.computed("text")).toBe("");

      const api = connectPullDownRefresh(machine.service);
      expect(api.state).toBe("idle");
      expect(api.statusKey).toBe("idle");
      expect(api.disabled).toBe(false);
      expect(api.threshold).toBe(50);
      expect(api.maxPullDistance).toBe(80);

      machine.stop();
    });

    it("starts refreshing when value is controlled true", () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        value: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("refreshing");
      expect(machine.computed("isRefreshing")).toBe(true);
      expect(machine.computed("barHeight")).toBe(50);
      expect(machine.computed("status")).toBe(2);
      expect(machine.computed("text")).toBe("Refreshing...");

      machine.stop();
    });

    it("starts refreshing when defaultValue is true", () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        defaultValue: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("refreshing");
      expect(machine.computed("barHeight")).toBe(50);

      machine.stop();
    });

    it("respects custom loading texts", async () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        loadingTexts: ["下拉刷新", "松手刷新", "正在刷新", "刷新完成"],
      });
      machine.start();

      await send(machine, { type: "DRAG_START" });
      await send(machine, { type: "DRAG_MOVE", offset: 10 });
      expect(machine.computed("text")).toBe("下拉刷新");

      await send(machine, { type: "DRAG_MOVE", offset: 60 });
      expect(machine.computed("text")).toBe("松手刷新");

      machine.stop();
    });
  });

  describe("Pull gesture", () => {
    it("moves between pulling and armed states based on threshold", async () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {});
      machine.start();

      await send(machine, { type: "DRAG_START" });
      expect(machine.state.get()).toBe("pulling");
      expect(machine.computed("canPull")).toBe(false);

      await send(machine, { type: "DRAG_MOVE", offset: 20 });
      expect(machine.state.get()).toBe("pulling");
      expect(machine.computed("barHeight")).toBe(20);
      expect(machine.computed("tipsHeight")).toBe(20);
      expect(machine.computed("status")).toBe(0);

      await send(machine, { type: "DRAG_MOVE", offset: 60 });
      expect(machine.state.get()).toBe("armed");
      expect(machine.computed("isArmed")).toBe(true);
      expect(machine.computed("barHeight")).toBe(60);
      expect(machine.computed("status")).toBe(1);

      await send(machine, { type: "DRAG_MOVE", offset: 30 });
      expect(machine.state.get()).toBe("pulling");
      expect(machine.computed("barHeight")).toBe(30);

      machine.stop();
    });

    it("clamps the pull distance to maxPullDistance", async () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        maxPullDistance: 70,
      });
      machine.start();

      await send(machine, { type: "DRAG_START" });
      await send(machine, { type: "DRAG_MOVE", offset: 200 });

      expect(machine.state.get()).toBe("armed");
      expect(machine.computed("barHeight")).toBe(70);
      expect(machine.computed("tipsHeight")).toBe(50);

      machine.stop();
    });

    it("cancels when released below the threshold", async () => {
      const onDragEnd = vi.fn();
      const onChange = vi.fn();
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        onDragEnd,
        onChange,
      });
      machine.start();

      await send(machine, { type: "DRAG_START" });
      await send(machine, { type: "DRAG_MOVE", offset: 30 });
      await send(machine, { type: "DRAG_END", offset: 30 });

      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("barHeight")).toBe(0);
      expect(onDragEnd).toHaveBeenCalledWith({ offset: 30 });
      expect(onChange).not.toHaveBeenCalled();

      machine.stop();
    });

    it("starts refreshing when released past the threshold", async () => {
      const onChange = vi.fn();
      const onRefresh = vi.fn();
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        onChange,
        onRefresh,
      });
      machine.start();

      await send(machine, { type: "DRAG_START" });
      await send(machine, { type: "DRAG_MOVE", offset: 60 });
      await send(machine, { type: "DRAG_END", offset: 60 });

      expect(machine.state.get()).toBe("refreshing");
      expect(machine.computed("barHeight")).toBe(50);
      expect(onChange).toHaveBeenCalledWith({ value: true });
      expect(onRefresh).toHaveBeenCalledTimes(1);

      machine.stop();
    });

    it("ignores drag events when disabled", async () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        disabled: true,
      });
      machine.start();

      expect(machine.computed("canPull")).toBe(false);
      await send(machine, { type: "DRAG_START" });
      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });
  });

  describe("Refreshing lifecycle", () => {
    it("shows success for successDuration before collapsing", async () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {});
      machine.start();

      await send(machine, { type: "DRAG_START" });
      await send(machine, { type: "DRAG_MOVE", offset: 60 });
      await send(machine, { type: "DRAG_END", offset: 60 });

      await send(machine, { type: "CLOSE" });

      expect(machine.state.get()).toBe("success");
      expect(machine.computed("status")).toBe(3);
      expect(machine.computed("barHeight")).toBe(50);
      expect(machine.computed("text")).toBe("Refresh complete");

      vi.advanceTimersByTime(500);
      await flush();

      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("barHeight")).toBe(0);

      machine.stop();
    });

    it("times out after refreshTimeout", async () => {
      const onChange = vi.fn();
      const onTimeout = vi.fn();
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        refreshTimeout: 1000,
        onChange,
        onTimeout,
      });
      machine.start();

      await send(machine, { type: "REFRESH" });
      expect(machine.state.get()).toBe("refreshing");

      vi.advanceTimersByTime(1000);
      await flush();

      expect(machine.state.get()).toBe("idle");
      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ value: false });

      machine.stop();
    });

    it("waits for the onRefresh promise instead of refreshTimeout", async () => {
      let resolveRefresh: (() => void) | undefined;
      const onRefresh = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRefresh = resolve;
          }),
      );
      const onTimeout = vi.fn();
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        refreshTimeout: 1000,
        onRefresh,
        onTimeout,
      });
      machine.start();

      await send(machine, { type: "REFRESH" });
      expect(machine.state.get()).toBe("refreshing");
      expect(onRefresh).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      await flush();

      expect(machine.state.get()).toBe("refreshing");
      expect(onTimeout).not.toHaveBeenCalled();

      resolveRefresh?.();
      await flush();
      await flush();

      expect(machine.state.get()).toBe("success");

      vi.advanceTimersByTime(500);
      await flush();

      expect(machine.state.get()).toBe("idle");
      expect(onTimeout).not.toHaveBeenCalled();

      machine.stop();
    });

    it("waits for a task registered with setPromise", async () => {
      let resolveRefresh: (() => void) | undefined;
      const onRefresh = vi.fn((details: PullDownRefreshRefreshDetails) => {
        details.setPromise(
          new Promise<void>((resolve) => {
            resolveRefresh = resolve;
          }),
        );
      });
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        refreshTimeout: 1000,
        onRefresh,
      });
      machine.start();

      await send(machine, { type: "REFRESH" });
      expect(machine.state.get()).toBe("refreshing");

      vi.advanceTimersByTime(1000);
      await flush();

      expect(machine.state.get()).toBe("refreshing");

      resolveRefresh?.();
      await flush();
      await flush();

      expect(machine.state.get()).toBe("success");

      vi.advanceTimersByTime(500);
      await flush();

      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });

    it("syncs a controlled value from true to false", async () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        value: false,
      });
      machine.start();

      machine.updateProps({ value: true });
      await flush();
      expect(machine.state.get()).toBe("refreshing");

      machine.updateProps({ value: false });
      await flush();
      expect(machine.state.get()).toBe("success");

      vi.advanceTimersByTime(500);
      await flush();
      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });

    it("can be refreshed and closed programmatically", async () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {});
      machine.start();
      const api = connectPullDownRefresh(machine.service);

      api.refresh();
      await flush();
      expect(machine.state.get()).toBe("refreshing");

      api.close();
      await flush();
      expect(machine.state.get()).toBe("success");

      vi.advanceTimersByTime(500);
      await flush();
      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });
  });

  describe("Scroll tracking", () => {
    it("updates atTop and emits scroll events", async () => {
      const onScroll = vi.fn();
      const onScrollToLower = vi.fn();
      const machine = new MiniappMachine(pullDownRefreshMachine, {
        onScroll,
        onScrollToLower,
      });
      machine.start();
      const api = connectPullDownRefresh(machine.service);

      api.handleScroll({ detail: { scrollTop: 120, scrollLeft: 0 } });
      await flush();

      expect(machine.computed("isAtTop")).toBe(false);
      expect(machine.computed("canPull")).toBe(false);
      expect(onScroll).toHaveBeenCalledWith({
        scrollTop: 120,
        scrollLeft: 0,
      });

      api.handleScrollToUpper();
      await flush();
      expect(machine.computed("isAtTop")).toBe(true);
      expect(machine.computed("canPull")).toBe(true);

      api.handleScrollToLower();
      await flush();
      expect(onScrollToLower).toHaveBeenCalledTimes(1);

      machine.stop();
    });

    it("cannot pull while scrolled down", async () => {
      const machine = new MiniappMachine(pullDownRefreshMachine, {});
      machine.start();

      await send(machine, { type: "SCROLL", scrollTop: 40, scrollLeft: 0 });
      await send(machine, { type: "DRAG_START" });

      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });
  });
});
