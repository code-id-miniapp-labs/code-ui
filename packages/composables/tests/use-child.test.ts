import { describe, it, expect, vi } from "vitest";
import { createMachine } from "@code-ui/core";
import { MiniappMachine } from "@code-ui/miniapp";
import { useChild } from "../src/use-child";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("useChild composable", () => {
  // A test state machine
  const counterMachine = createMachine({
    initialState: () => "idle",
    props: () => ({ id: "counter" }),
    context: ({ bindable }) => ({
      count: bindable<number>(() => ({ defaultValue: 0 })),
    }),
    states: {
      idle: {
        on: {
          INC: {
            actions: ["increment"],
          },
          SET: {
            actions: ["setVal"],
          },
        },
      },
    },
    implementations: {
      actions: {
        increment: ({ context }) => {
          context.set("count", (context.get("count") ?? 0) + 1);
        },
        setVal: ({ context, event }) => {
          context.set("count", (event as any).value);
        },
      },
    },
  });

  function createMockChildComponent(id: string) {
    const machine = new MiniappMachine(counterMachine, () => ({ id }));
    machine.start();

    const connect = (service: any) => ({
      count: service.context.get("count"),
      isPositive: (service.context.get("count") ?? 0) > 0,
      increment: () => machine.send({ type: "INC" }),
      setCount: (value: number) => machine.send({ type: "SET", value }),
    });

    const compInstance = {
      id,
      __codeUiMachine: machine,
      __codeUiApi: connect(machine.service),
      getMachine: () => machine,
      getService: () => machine.service,
      setData: vi.fn(),
    };

    // Update child __codeUiApi on transitions
    machine.subscribe(() => {
      compInstance.__codeUiApi = connect(machine.service);
    });

    return {
      compInstance,
      machine,
      // Mock wx://component-export proxy
      exportProxy: {
        __codeUiInstance: compInstance,
        service: machine.service,
        send: machine.send,
        getSnapshot: () => compInstance.__codeUiApi,
        increment: () => machine.send({ type: "INC" }),
      },
    };
  }

  function createMockParentInstance(children: Record<string, any> = {}) {
    return {
      data: {} as Record<string, any>,
      setData: vi.fn(function (this: any, delta: Record<string, any>) {
        Object.assign(this.data, delta);
      }),
      selectComponent: vi.fn((selector: string) => children[selector] ?? null),
    };
  }

  it("syncs initial snapshot to parent data under the specified key", async () => {
    const { exportProxy } = createMockChildComponent("c1");
    const parent = createMockParentInstance({ "#counter": exportProxy });

    const child = useChild(parent as any, "#counter", { key: "counter" });
    await flush();

    expect(parent.setData).toHaveBeenCalledWith({
      counter: {
        count: 0,
        isPositive: false,
        increment: expect.any(Function),
        setCount: expect.any(Function),
      },
    });
    expect(parent.data.counter.count).toBe(0);
    expect(child.snapshot?.count).toBe(0);
    expect(child.getSnapshot()?.count).toBe(0);
  });

  it("reactively pushes diffed and batched setData when child machine transitions", async () => {
    const { machine, exportProxy } = createMockChildComponent("c1");
    const parent = createMockParentInstance({ "#counter": exportProxy });

    const child = useChild(parent as any, "#counter", { key: "counter" });
    parent.setData.mockClear();

    // Transition child machine
    machine.send({ type: "INC" });
    await flush();

    expect(parent.setData).toHaveBeenCalled();
    expect(parent.data["counter.count"]).toBe(1);
    expect(parent.data["counter.isPositive"]).toBe(true);
    expect(child.snapshot?.count).toBe(1);
  });

  it("calls onChange callback on each transition", async () => {
    const { machine, exportProxy } = createMockChildComponent("c1");
    const parent = createMockParentInstance({ "#counter": exportProxy });
    const onChange = vi.fn();

    useChild(parent as any, "#counter", { onChange });

    // Initial snapshot call
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ count: 0 }),
    );

    machine.send({ type: "INC" });
    await flush();

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ count: 1 }),
    );
  });

  it("supports custom connect projection function", async () => {
    const { machine, exportProxy } = createMockChildComponent("c1");
    const parent = createMockParentInstance({ "#counter": exportProxy });

    const child = useChild(parent as any, "#counter", {
      key: "custom",
      connect: (service) => ({
        customCount: (service.context.get("count") ?? 0) * 10,
      }),
    });
    await flush();

    expect(parent.data.custom).toEqual({ customCount: 0 });

    machine.send({ type: "INC" });
    await flush();

    expect(parent.data["custom.customCount"]).toBe(10);
    expect(child.snapshot?.customCount).toBe(10);
  });

  it("forwards action calls through the api proxy", async () => {
    const { machine, exportProxy } = createMockChildComponent("c1");
    const parent = createMockParentInstance({ "#counter": exportProxy });

    const child = useChild(parent as any, "#counter", { key: "counter" });

    // Object.keys(child.api) should enumerate methods and not be empty
    const apiKeys = Object.keys(child.api);
    expect(apiKeys).toContain("increment");
    expect(apiKeys).toContain("setCount");

    // Call through child.api
    child.api.increment();
    await flush();
    expect(machine.service.context.get("count")).toBe(1);

    child.send({ type: "SET", value: 42 });
    await flush();
    expect(machine.service.context.get("count")).toBe(42);
  });

  it("handles multiple child instances on the same parent without collision", async () => {
    const child1 = createMockChildComponent("c1");
    const child2 = createMockChildComponent("c2");

    const parent = createMockParentInstance({
      "#c1": child1.exportProxy,
      "#c2": child2.exportProxy,
    });

    useChild(parent as any, "#c1", { key: "counter1" });
    useChild(parent as any, "#c2", { key: "counter2" });
    await flush();

    expect(parent.data.counter1.count).toBe(0);
    expect(parent.data.counter2.count).toBe(0);

    // Update c1 only
    child1.machine.send({ type: "INC" });
    await flush();

    expect(parent.data["counter1.count"]).toBe(1);
    expect(parent.data.counter2.count).toBe(0);
  });

  it("stops syncing when stop() is called", async () => {
    const { machine, exportProxy } = createMockChildComponent("c1");
    const parent = createMockParentInstance({ "#counter": exportProxy });

    const child = useChild(parent as any, "#counter", { key: "counter" });
    await flush();
    parent.setData.mockClear();

    child.stop();

    machine.send({ type: "INC" });
    await flush();

    expect(parent.setData).not.toHaveBeenCalled();
  });

  it("auto-cleans up on parent onUnload lifecycle", async () => {
    const { machine, exportProxy } = createMockChildComponent("c1");
    const parent = {
      ...createMockParentInstance({ "#counter": exportProxy }),
      onUnload: vi.fn(),
    };

    useChild(parent as any, "#counter", { key: "counter" });
    await flush();
    parent.setData.mockClear();

    // Trigger parent page unload
    parent.onUnload();

    machine.send({ type: "INC" });
    await flush();

    expect(parent.setData).not.toHaveBeenCalled();
  });

  it("defers binding if child is not yet attached at init and binds on onReady", async () => {
    const { exportProxy } = createMockChildComponent("c1");
    const childrenMap: Record<string, any> = {};

    const parent = {
      ...createMockParentInstance(childrenMap),
      onReady: vi.fn(),
    };

    // Child is not in childrenMap yet!
    const child = useChild(parent as any, "#counter", { key: "counter" });
    expect(child.snapshot).toBeUndefined();

    // Child attaches later, then onReady triggers
    childrenMap["#counter"] = exportProxy;
    parent.onReady();
    await flush();

    expect(parent.data.counter.count).toBe(0);
    expect(child.snapshot?.count).toBe(0);
  });

  it("supports Component lifecycles (ready and detached)", async () => {
    const { machine, exportProxy } = createMockChildComponent("c1");
    const childrenMap: Record<string, any> = {};

    const componentParent = {
      ...createMockParentInstance(childrenMap),
      ready: vi.fn(),
      detached: vi.fn(),
    };

    const child = useChild(componentParent as any, "#counter", {
      key: "counter",
    });
    expect(child.snapshot).toBeUndefined();

    // Child attaches and Component.ready triggers
    childrenMap["#counter"] = exportProxy;
    componentParent.ready();
    await flush();

    expect(componentParent.data.counter.count).toBe(0);

    // Detached cleans up
    componentParent.setData.mockClear();
    componentParent.detached();

    machine.send({ type: "INC" });
    await flush();

    expect(componentParent.setData).not.toHaveBeenCalled();
  });

  it("supports multiple useChild subscribers via __codeUiSnapshotListeners", async () => {
    const compInstance = {
      id: "raw-comp",
      __codeUiApi: { value: "initial" },
      __codeUiOnSnapshot: undefined as any,
    };
    const parent = createMockParentInstance({ "#raw": compInstance });

    const onChange1 = vi.fn();
    const onChange2 = vi.fn();

    const child1 = useChild(parent as any, "#raw", { onChange: onChange1 });
    const child2 = useChild(parent as any, "#raw", { onChange: onChange2 });

    expect(onChange1).toHaveBeenCalledWith({ value: "initial" });
    expect(onChange2).toHaveBeenCalledWith({ value: "initial" });

    // Simulate child component update via __codeUiOnSnapshot
    compInstance.__codeUiApi = { value: "updated" };
    compInstance.__codeUiOnSnapshot({ value: "updated" });

    expect(onChange1).toHaveBeenCalledWith({ value: "updated" });
    expect(onChange2).toHaveBeenCalledWith({ value: "updated" });

    // Stop child1; child2 should still receive updates
    child1.stop();
    compInstance.__codeUiApi = { value: "next" };
    compInstance.__codeUiOnSnapshot({ value: "next" });

    expect(onChange1).toHaveBeenCalledTimes(2);
    expect(onChange2).toHaveBeenCalledWith({ value: "next" });
  });

  it("reuses cached latestSnapshot when reading snapshot or getSnapshot", async () => {
    const { exportProxy } = createMockChildComponent("c1");
    const parent = createMockParentInstance({ "#counter": exportProxy });

    let computeCount = 0;
    const child = useChild(parent as any, "#counter", {
      key: "counter",
      connect: (service) => {
        computeCount++;
        return { count: service.context.get("count") };
      },
    });

    expect(computeCount).toBe(1);

    // Reading snapshot repeatedly should return cached value without calling connect again
    const snap1 = child.snapshot;
    const snap2 = child.getSnapshot();
    expect(snap1).toEqual({ count: 0 });
    expect(snap2).toEqual({ count: 0 });
    expect(computeCount).toBe(1);
  });

  it("does not throw circular structure error when serialized to JSON or assigned to page.data", async () => {
    const { compInstance, exportProxy } = createMockChildComponent("c1");
    // Simulate circular reference between component and machine/scope
    const circularScope: any = { id: "test", component: compInstance };
    compInstance.__codeUiMachine.paramsCache = { scope: circularScope };
    circularScope.component = compInstance;

    const parent = createMockParentInstance({ "#counter": exportProxy });

    const child = useChild(parent as any, "#counter", {
      key: "counter",
      connect: (service) => ({ count: service.context.get("count") }),
    });

    // 1. Direct JSON serialization of useChild return object
    expect(() => JSON.stringify(child)).not.toThrow();
    expect(JSON.stringify(child)).toBeUndefined();

    // 2. Simulated accidental assignment to parent.data
    await Promise.resolve();
    parent.data.counterChild = child;
    let serialized: string | undefined;
    expect(() => {
      serialized = JSON.stringify(parent.data);
    }).not.toThrow();

    // counterChild is safely omitted from JSON
    const parsed = JSON.parse(serialized as string);
    expect(parsed.counterChild).toBeUndefined();
    expect(parsed.counter).toEqual({ count: 0 });

    // 3. service property is non-enumerable
    expect(Object.keys(child)).not.toContain("service");
    expect(child.service).toBeDefined();
  });
});
