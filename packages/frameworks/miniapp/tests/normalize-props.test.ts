import { describe, expect, it, vi } from "vitest";
import {
  createMachinePropGetter,
  createNormalizer,
  normalizeEvent,
  normalizeProps,
  toMiniEventName,
} from "../src";
import { buttonMachine, connectButton } from "@code-ui/button";
import { MiniappMachine } from "../src/machine";

describe("toMiniEventName", () => {
  it("converts camelCase on-prefixed event names to lowercase by default", () => {
    expect(toMiniEventName("onTap")).toBe("tap");
    expect(toMiniEventName("onClick")).toBe("click");
    expect(toMiniEventName("onChange")).toBe("change");
    expect(toMiniEventName("onValueChange")).toBe("valuechange");
    expect(toMiniEventName("onFocus")).toBe("focus");
  });

  it("converts to kebab-case when specified", () => {
    expect(toMiniEventName("onValueChange", true)).toBe("value-change");
    expect(toMiniEventName("onKeyboardHeightChange", true)).toBe(
      "keyboard-height-change",
    );
  });
});

describe("normalizeEvent", () => {
  it("wraps a raw payload into a standard NormalizedMiniEvent shape", () => {
    const payload = { value: "code-ui" };
    const event = normalizeEvent(payload, "change");

    expect(event.type).toBe("change");
    expect(event.detail).toEqual({ value: "code-ui" });
    expect(event.target).toBeDefined();
    expect(event.currentTarget).toBeDefined();
    expect(typeof event.timeStamp).toBe("number");
  });

  it("normalizes an existing WeChat-like event without double-wrapping detail", () => {
    const rawWxEvent = {
      type: "tap",
      timeStamp: 12345,
      target: { id: "btn-1", dataset: { role: "action" } },
      currentTarget: { id: "btn-1", dataset: { role: "action" } },
      detail: { custom: true },
    };

    const event = normalizeEvent(rawWxEvent, "tap");
    expect(event.type).toBe("tap");
    expect(event.timeStamp).toBe(12345);
    expect(event.detail).toEqual({ custom: true });
    expect(event.target.id).toBe("btn-1");
  });

  it("preserves setPromise on detail when provided on raw event", () => {
    const setPromiseFn = vi.fn();
    const rawEvent = {
      type: "tap",
      detail: {},
      setPromise: setPromiseFn,
    };

    const event = normalizeEvent(rawEvent, "tap");
    expect(event.detail.setPromise).toBe(setPromiseFn);
  });
});

describe("createMachinePropGetter", () => {
  it("invokes user-defined function and triggers component event", () => {
    const customOnTap = vi.fn();
    const mockInstance = { triggerEvent: vi.fn() };
    const prop = createMachinePropGetter(mockInstance as any, {
      onTap: customOnTap,
    });

    const handler = prop<Function>("onTap");
    handler({ foo: "bar" });
    expect(customOnTap).toHaveBeenCalledWith({ foo: "bar" });
    expect(mockInstance.triggerEvent).toHaveBeenCalledWith("tap", { foo: "bar" });
  });

  it("lazily creates triggerAdapter that calls instance.triggerEvent with normalized.detail", () => {
    const mockInstance = { triggerEvent: vi.fn() };
    const prop = createMachinePropGetter(mockInstance as any, {
      loading: false,
    });

    const tapHandler = prop<Function>("onTap");
    expect(typeof tapHandler).toBe("function");

    // Passing a raw payload
    tapHandler({ test: 123 });
    expect(mockInstance.triggerEvent).toHaveBeenCalledWith("tap", {
      test: 123,
    });

    // Identity is cached
    expect(prop("onTap")).toBe(tapHandler);
  });

  it("passes raw Wechat event detail unwrapped so parent does not receive e.detail.detail", () => {
    const mockInstance = { triggerEvent: vi.fn() };
    const prop = createMachinePropGetter(mockInstance as any, {});

    const tapHandler = prop<Function>("onTap");
    const rawWxEvent = {
      type: "tap",
      detail: { clickedIndex: 2 },
    };

    tapHandler(rawWxEvent);
    expect(mockInstance.triggerEvent).toHaveBeenCalledWith("tap", {
      clickedIndex: 2,
    });
  });

  it("returns regular data properties from userProps", () => {
    const prop = createMachinePropGetter(null, {
      size: "lg",
      disabled: true,
    });

    expect(prop("size")).toBe("lg");
    expect(prop("disabled")).toBe(true);
  });
});

describe("normalizeProps", () => {
  it("wraps event handlers in connect props so they receive NormalizedMiniEvent", () => {
    const handler = vi.fn();
    const props = {
      id: "root-btn",
      onTap: handler,
    };

    const normalized = normalizeProps(props);
    expect(normalized.id).toBe("root-btn");

    normalized.onTap({ detail: { x: 10, y: 20 } });
    expect(handler).toHaveBeenCalledTimes(1);
    const arg = handler.mock.calls[0][0];
    expect(arg.detail).toEqual({ x: 10, y: 20 });
  });

  it("supports Zag.js-style element / button helper methods via proxy", () => {
    const handler = vi.fn();
    const buttonProps = normalizeProps.button({
      role: "button",
      onTap: handler,
    });

    expect(buttonProps.role).toBe("button");
    buttonProps.onTap({ foo: "bar" });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("Button machine integration with createMachinePropGetter", () => {
  it("invokes prop('onTap') and triggers miniapp event without machine referencing triggerEvent directly", async () => {
    const triggerEvent = vi.fn();
    const mockComponent = { triggerEvent };

    const machine = new MiniappMachine(buttonMachine, {
      component: mockComponent,
    });
    machine.start();

    const api = connectButton(machine.service, normalizeProps);
    api.handleTap({ type: "tap", detail: { fromUser: true } });

    await Promise.resolve();

    expect(triggerEvent).toHaveBeenCalledWith("tap", { fromUser: true });

    machine.stop();
  });
});
