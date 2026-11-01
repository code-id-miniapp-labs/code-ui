import { describe, expect, it, vi } from "vitest";
import { connectToPage } from "../src/connect";

describe("connectToPage", () => {
  it("keeps API methods off setData while exposing them on __codeUiApi", () => {
    const setData = vi.fn();
    const instance: any = { setData };
    let onSnapshot: any;
    instance.__codeUiOnSnapshot = (snapshot: any) => {
      onSnapshot = snapshot;
    };

    const machine: any = {
      service: {},
      subscribe: () => () => {},
    };

    connectToPage(machine, instance, () => ({
      value: 1,
      nested: { label: "ready", reset: () => {} },
      setValue: () => {},
    }));

    expect(setData).toHaveBeenCalledWith({
      value: 1,
      nested: { label: "ready" },
    });
    expect(instance.__codeUiApi.setValue).toBeTypeOf("function");
    expect(onSnapshot.setValue).toBeTypeOf("function");
  });

  it("keeps function values out of subsequent deltas", async () => {
    const setData = vi.fn();
    const instance: any = { setData };
    let listener: (() => void) | undefined;
    const machine: any = {
      service: {},
      subscribe: (fn: () => void) => {
        listener = fn;
        return () => {};
      },
    };

    let value = 1;
    connectToPage(machine, instance, () => ({
      value,
      setValue: () => {},
    }));
    setData.mockClear();

    value = 2;
    listener?.();
    await Promise.resolve();

    expect(setData).toHaveBeenCalledWith({ value: 2 });
  });
});
