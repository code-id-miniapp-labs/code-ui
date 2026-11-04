import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gesture = require("../src/wxs/pull-down-refresh-gesture.wxs");

interface MethodCall {
  method: string;
  data: any;
}

interface StyleCall {
  selector: string;
  style: string;
}

function createOwnerInstance() {
  const calls: MethodCall[] = [];
  const styles: StyleCall[] = [];
  const elements = new Map<string, any>();

  return {
    calls,
    styles,
    callMethod(method: string, data?: any) {
      calls.push({ method, data });
    },
    selectComponent(selector: string) {
      let element = elements.get(selector);
      if (!element) {
        element = {
          setStyle(style: string) {
            styles.push({ selector, style });
          },
          getDataset() {
            return {};
          },
        };
        elements.set(selector, element);
      }
      return element;
    },
  };
}

function dataset(overrides: Record<string, any> = {}) {
  return {
    trackId: "track",
    tipsId: "tips",
    threshold: "30",
    maxDistance: "50",
    duration: "300",
    enabled: "true",
    disabled: "false",
    ...overrides,
  };
}

function touchEvent(clientY: number, data: Record<string, any>) {
  const touch = { clientX: 0, clientY };
  return {
    touches: [touch],
    changedTouches: [touch],
    currentTarget: { dataset: data },
  };
}

function touchEndEvent(clientY: number, data: Record<string, any>) {
  const touch = { clientX: 0, clientY };
  return {
    touches: [],
    changedTouches: [touch],
    currentTarget: { dataset: data },
  };
}

function callsOf(
  owner: ReturnType<typeof createOwnerInstance>,
  method: string,
) {
  return owner.calls.filter((call) => call.method === method);
}

describe("PullDownRefresh WXS gesture", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts pulling and reports the drag distance", () => {
    const owner = createOwnerInstance();
    const data = dataset();

    gesture.onTouchStart(touchEvent(100, data), owner);
    vi.advanceTimersByTime(20);
    gesture.onTouchMove(touchEvent(150, data), owner);

    expect(callsOf(owner, "handleTouchStart")).toHaveLength(1);
    expect(
      owner.styles.some(
        (call) =>
          call.selector === "#track" &&
          call.style.includes("translate3d(0, 50px, 0)"),
      ),
    ).toBe(true);

    gesture.onTouchEnd(touchEndEvent(150, data), owner);

    const end = callsOf(owner, "handleTouchEnd").at(-1);
    expect(end?.data).toEqual({ offset: 50, passed: true });
  });

  it("does not trigger when released below the threshold", () => {
    const owner = createOwnerInstance();
    const data = dataset();

    gesture.onTouchStart(touchEvent(100, data), owner);
    vi.advanceTimersByTime(20);
    gesture.onTouchMove(touchEvent(120, data), owner);
    gesture.onTouchEnd(touchEndEvent(120, data), owner);

    const end = callsOf(owner, "handleTouchEnd").at(-1);
    expect(end?.data).toEqual({ offset: 20, passed: false });
  });

  it("re-arms the baseline after a disabled gesture so the next pull is measured from its own start", () => {
    const owner = createOwnerInstance();

    // First completed pull leaves the gesture module with a stale start point.
    const data = dataset();
    gesture.onTouchStart(touchEvent(500, data), owner);
    vi.advanceTimersByTime(20);
    gesture.onTouchMove(touchEvent(540, data), owner);
    gesture.onTouchEnd(touchEndEvent(540, data), owner);
    owner.calls.length = 0;

    // While the refresh is still running, the user starts dragging at the top.
    const busy = dataset({ enabled: "false" });
    gesture.onTouchStart(touchEvent(100, busy), owner);
    vi.advanceTimersByTime(20);
    gesture.onTouchMove(touchEvent(140, busy), owner);

    expect(callsOf(owner, "handleTouchStart")).toHaveLength(0);

    // The refresh finishes mid-gesture; the remaining drag starts the pull.
    vi.advanceTimersByTime(20);
    gesture.onTouchMove(touchEvent(150, data), owner);

    expect(callsOf(owner, "handleTouchStart")).toHaveLength(1);

    vi.advanceTimersByTime(20);
    gesture.onTouchMove(touchEvent(170, data), owner);
    gesture.onTouchEnd(touchEndEvent(170, data), owner);

    const end = callsOf(owner, "handleTouchEnd").at(-1);
    expect(end?.data).toEqual({ offset: 30, passed: true });
  });

  it("ignores gestures while the component is disabled", () => {
    const owner = createOwnerInstance();
    const data = dataset({ disabled: "true" });

    gesture.onTouchStart(touchEvent(100, data), owner);
    vi.advanceTimersByTime(20);
    gesture.onTouchMove(touchEvent(200, data), owner);
    gesture.onTouchEnd(touchEndEvent(200, data), owner);

    expect(callsOf(owner, "handleTouchStart")).toHaveLength(0);
    expect(callsOf(owner, "handleTouchEnd")).toHaveLength(0);
  });
});
