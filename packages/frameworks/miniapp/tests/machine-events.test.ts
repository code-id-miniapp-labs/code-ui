import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "../src/machine";
import { createMachine } from "@code-ui/core";

describe("MiniappMachine Event & Promise Interception", () => {
  const originalGetCurrentPages = (globalThis as any).getCurrentPages;

  afterEach(() => {
    (globalThis as any).getCurrentPages = originalGetCurrentPages;
  });

  it("intercepts async promise from page method when selectOwnerComponent returns null", async () => {
    let resolveAction!: () => void;
    const asyncPromise = new Promise<void>((res) => {
      resolveAction = res;
    });

    // Mock page with prototype / method
    const mockPage = {
      async handleAsyncAction() {
        return asyncPromise;
      },
    };

    (globalThis as any).getCurrentPages = () => [mockPage];

    const mockComponent = {
      selectOwnerComponent: () => null, // Component is in page, not in another component
      triggerEvent: vi.fn((eventName: string, detail: any) => {
        // WeChat MiniProgram invokes page handler synchronously
        return mockPage.handleAsyncAction();
      }),
    };

    const schema = createMachine({
      initialState: () => "idle",
      states: {
        idle: {},
      },
      props: () => ({
        loadingAuto: true,
      }),
    });

    const machine = new MiniappMachine(schema, {
      component: mockComponent,
      loadingAuto: true,
    });
    machine.start();

    // Invoking prop("onTap") should trigger the component event and capture the promise from mockPage
    const onTapFn = machine.prop("onTap");
    expect(typeof onTapFn).toBe("function");

    const returnedPromise = onTapFn?.({});
    expect(returnedPromise !== null && typeof returnedPromise === "object" && typeof (returnedPromise as any).then === "function").toBe(true);

    resolveAction();
    await returnedPromise;
    machine.stop();
  });

  const createSchema = () =>
    createMachine({
      initialState: () => "idle",
      states: { idle: {} },
    });

  it("captures the promise returned by a page handler invoked from triggerEvent", async () => {
    let resolveAction!: () => void;
    const pending = new Promise<void>((res) => {
      resolveAction = res;
    });

    const page: Record<string, any> = {
      onTap: vi.fn(() => pending),
    };
    (globalThis as any).getCurrentPages = () => [page];

    const component = {
      selectOwnerComponent: () => null,
      triggerEvent: vi.fn(() => {
        page.onTap();
      }),
    };

    const machine = new MiniappMachine(createSchema(), { component });
    machine.start();

    const result = (machine.prop as any)("onTap")({}) as Promise<void>;
    expect(result).toBe(pending);

    resolveAction();
    await result;
    machine.stop();
  });

  it("restores owner methods and leaves accessors and setData untouched", () => {
    const handler = vi.fn();
    const setData = vi.fn();
    const getter = vi.fn(() => 1);

    const page: Record<string, any> = { handler, setData };
    Object.defineProperty(page, "computedValue", {
      configurable: true,
      enumerable: true,
      get: getter,
      set: () => {
        throw new Error("setter must not be invoked");
      },
    });
    (globalThis as any).getCurrentPages = () => [page];

    const seen: Record<string, unknown> = {};
    const component = {
      selectOwnerComponent: () => null,
      triggerEvent: vi.fn(() => {
        seen.handler = page.handler;
        seen.setData = page.setData;
      }),
    };

    const machine = new MiniappMachine(createSchema(), { component });
    machine.start();
    (machine.prop as any)("onTap")({});

    expect(seen.handler).not.toBe(handler);
    expect(seen.setData).toBe(setData);
    expect(page.handler).toBe(handler);
    expect(page.setData).toBe(setData);
    machine.stop();
  });

  it("does not double-wrap methods on re-entrant bridge calls", () => {
    const handler = vi.fn();
    const page: Record<string, any> = { handler };
    (globalThis as any).getCurrentPages = () => [page];

    let machine!: MiniappMachine<any>;
    let nestedWrapper: unknown;
    let outerWrapper: unknown;

    const component = {
      selectOwnerComponent: () => null,
      triggerEvent: vi.fn((name: string) => {
        if (name === "tap") {
          outerWrapper = page.handler;
          (machine.prop as any)("onInner")({});
        } else {
          nestedWrapper = page.handler;
        }
      }),
    };

    machine = new MiniappMachine(createSchema(), { component });
    machine.start();
    (machine.prop as any)("onTap")({});

    expect(nestedWrapper).toBe(outerWrapper);
    expect(page.handler).toBe(handler);
    machine.stop();
  });
});

