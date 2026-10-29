import { describe, expect, it, vi } from "vitest";

// dom.wxs is CommonJS compatible
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dom = require("../src/wxs/dom.wxs");

describe("dom.wxs helpers", () => {
  it("now() returns current timestamp in ms", () => {
    const timestamp = dom.now();
    expect(typeof timestamp).toBe("number");
    expect(timestamp).toBeGreaterThan(0);
  });

  it("throttle invokes immediately on first call and throttles subsequent calls within wait window", () => {
    let callCount = 0;
    let lastArgs: any[] = [];
    const fn = (...args: any[]) => {
      callCount++;
      lastArgs = args;
    };

    const throttled = dom.throttle(fn, 50);

    // 1st call: immediate
    throttled("call 1");
    expect(callCount).toBe(1);
    expect(lastArgs).toEqual(["call 1"]);

    // 2nd and 3rd calls within 50ms: throttled out
    throttled("call 2");
    throttled("call 3");
    expect(callCount).toBe(1);
    expect(lastArgs).toEqual(["call 1"]);

    // Advance time or mock
    vi.useFakeTimers();
    vi.advanceTimersByTime(60);

    // Next call after wait window passes
    throttled("call 4");
    expect(callCount).toBe(2);
    expect(lastArgs).toEqual(["call 4"]);

    vi.useRealTimers();
  });

  it("throttled.reset() allows immediate call on next invocation", () => {
    let callCount = 0;
    const fn = () => {
      callCount++;
    };

    const throttled = dom.throttle(fn, 100);

    throttled();
    expect(callCount).toBe(1);

    throttled();
    expect(callCount).toBe(1);

    // Call reset
    throttled.reset();

    // Should fire immediately now
    throttled();
    expect(callCount).toBe(2);
  });

  it("handles event touch helpers safely", () => {
    expect(dom.getTouch({})).toBeNull();
    expect(dom.getTouch({ touches: [{ clientX: 10, clientY: 20 }] })).toEqual({
      clientX: 10,
      clientY: 20,
    });

    expect(dom.getChangedTouch({})).toBeNull();
    expect(
      dom.getChangedTouch({ changedTouches: [{ clientX: 30, clientY: 40 }] }),
    ).toEqual({ clientX: 30, clientY: 40 });

    expect(dom.getDataset({})).toEqual({});
    expect(dom.getDataset({ currentTarget: { dataset: { id: "test" } } })).toEqual(
      { id: "test" },
    );
  });
});

