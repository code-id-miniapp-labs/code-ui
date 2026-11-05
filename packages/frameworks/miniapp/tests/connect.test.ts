import { describe, expect, it, vi } from "vitest";
import { signal } from "alien-signals";
import { createMachine } from "@code-ui/core";
import { connectToPage } from "../src/connect";
import { MiniappMachine } from "../src/machine";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("connectToPage", () => {
  it("keeps API methods off setData while exposing them on __codeUiApi", () => {
    const setData = vi.fn();
    const instance: any = { setData };
    let onSnapshot: any;
    instance.__codeUiOnSnapshot = (snapshot: any) => {
      onSnapshot = snapshot;
    };

    const machine: any = { service: {} };

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
    const machine: any = { service: {} };
    const value = signal(1);

    connectToPage(machine, instance, () => ({
      value: value(),
      setValue: () => {},
    }));
    setData.mockClear();

    value(2);
    await flush();

    expect(setData).toHaveBeenCalledWith({ value: 2 });
  });

  it("tracks signals owned by another machine", async () => {
    const parent = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        context: ({ bindable }) => ({
          value: bindable<string>(() => ({ defaultValue: "a" })),
        }),
        states: { idle: {} },
      }),
    );
    parent.start();

    const child = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        props: ({ props }) => ({ group: undefined as any, ...props }),
        computed: {
          label: ({ prop }) => {
            const group = prop("group") as { value: () => string } | undefined;
            return group ? group.value() : "none";
          },
        },
        states: { idle: {} },
      }),
    );
    child.updateProps({
      group: { value: () => parent.context.get("value") },
    });
    child.start();

    const setData = vi.fn();
    const instance: any = { setData };
    const dispose = connectToPage(
      child,
      instance,
      (service) => ({ label: service.computed("label") }),
      "child",
    );

    expect(setData).toHaveBeenLastCalledWith({ child: { label: "a" } });

    parent.context.set("value", "b");
    await flush();

    expect(setData).toHaveBeenLastCalledWith({ "child.label": "b" });

    dispose();
    setData.mockClear();
    parent.context.set("value", "c");
    await flush();

    expect(setData).not.toHaveBeenCalled();

    parent.stop();
    child.stop();
  });
});
