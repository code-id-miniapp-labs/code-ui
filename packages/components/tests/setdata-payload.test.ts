import { describe, expect, it, vi } from "vitest";
import {
  MiniappMachine,
  connectToComponent,
  setupComputed,
} from "@code-ui/miniapp";
import { checkboxMachine, connectCheckbox } from "@code-ui/checkbox";
import { sliderMachine, connectSlider } from "@code-ui/slider";
import { stepperMachine, connectStepper } from "@code-ui/stepper";
import { tabsMachine, connectTabs } from "@code-ui/tabs";
import { drawerMachine, connectDrawer } from "@code-ui/drawer";

const flush = () =>
  new Promise<void>((resolve) => queueMicrotask(() => queueMicrotask(resolve)));

function createMockInstance(
  initialData: Record<string, any> = {},
  computedDefs?: Record<string, () => any>,
) {
  const calls: Array<{ keys: number; bytes: number; payload: Record<string, any> }> = [];
  const data: Record<string, any> = { ...initialData };

  const rawSetData = vi.fn((patch: Record<string, any>) => {
    Object.assign(data, patch);
    const json = JSON.stringify(patch);
    calls.push({
      keys: Object.keys(patch).length,
      bytes: Buffer.byteLength(json, "utf8"),
      payload: patch,
    });
  });

  const instance: any = {
    data,
    properties: data,
    setData: rawSetData,
    triggerEvent: vi.fn(),
  };

  if (computedDefs) {
    setupComputed(instance, computedDefs, { immediate: true });
    calls.length = 0;
  }

  return { instance, calls, rawSetData };
}

describe("setData call count & payload budget", () => {
  it("checkbox toggle emits <= 1 setData call per tap", async () => {
    const { instance, calls } = createMockInstance({ checked: false }, {
      classes() {
        const api = this.data.cCheckbox;
        return { root: api?.checked ? "checked" : "unchecked" };
      },
    });

    const machine = new MiniappMachine(checkboxMachine, {
      id: "cb1",
      label: "Accept terms",
      description: "Read carefully",
    });
    machine.start();
    const dispose = connectToComponent(
      machine,
      instance,
      connectCheckbox,
      "cCheckbox",
    );

    const mountBytes = calls.reduce((sum, c) => sum + c.bytes, 0);
    expect(calls.length).toBe(1);
    calls.length = 0;

    instance.__codeUiApi.handleTap();
    await flush();

    expect(calls.length).toBe(1);
    expect(mountBytes).toBeGreaterThan(0);
    // Granular delta diff sends only modified keys, saving >50% relative to mount snapshot
    expect(calls[0]!.bytes).toBeLessThan(mountBytes * 0.7);
    expect(Object.keys(calls[0]!.payload)).toContain("cCheckbox.checked");

    dispose();
    machine.stop();
  });

  it("slider stepUp emits <= 1 setData call per step", async () => {
    const { instance, calls } = createMockInstance({}, {
      classes() {
        const api = this.data.slider;
        return { root: api?.dragging ? "dragging" : "idle" };
      },
    });

    const machine = new MiniappMachine(sliderMachine, {
      id: "s1",
      defaultValue: 20,
      min: 0,
      max: 100,
      step: 5,
    });
    machine.start();
    const dispose = connectToComponent(
      machine,
      instance,
      connectSlider,
      "slider",
    );

    const mountBytes = calls.reduce((sum, c) => sum + c.bytes, 0);
    expect(calls.length).toBe(1);
    calls.length = 0;

    instance.__codeUiApi.stepUp();
    await flush();

    expect(calls.length).toBe(1);
    expect(calls[0]!.bytes).toBeLessThan(mountBytes);

    dispose();
    machine.stop();
  });

  it("stepper nextStep emits <= 1 setData call per step", async () => {
    const { instance, calls } = createMockInstance({}, {
      classes() {
        const api = this.data.stepper;
        return { root: `step-${api?.step ?? 0}` };
      },
    });

    const machine = new MiniappMachine(stepperMachine, {
      id: "st1",
      count: 4,
      defaultStep: 0,
    });
    machine.start();
    const dispose = connectToComponent(
      machine,
      instance,
      connectStepper,
      "stepper",
    );

    const mountBytes = calls.reduce((sum, c) => sum + c.bytes, 0);
    expect(calls.length).toBe(1);
    calls.length = 0;

    instance.__codeUiApi.nextStep();
    await flush();

    expect(calls.length).toBe(1);
    expect(calls[0]!.bytes).toBeLessThan(mountBytes);

    dispose();
    machine.stop();
  });

  it("tabs setValue emits <= 1 setData call per tab switch", async () => {
    const { instance, calls } = createMockInstance({}, {
      classes() {
        const api = this.data.tabs;
        return { root: `tab-${api?.value ?? ""}` };
      },
    });

    const machine = new MiniappMachine(tabsMachine, {
      id: "t1",
      defaultValue: "a",
      items: [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ],
    });
    machine.start();
    const dispose = connectToComponent(machine, instance, connectTabs, "tabs");

    const mountBytes = calls.reduce((sum, c) => sum + c.bytes, 0);
    expect(calls.length).toBe(1);
    calls.length = 0;

    instance.__codeUiApi.setValue("b");
    await flush();

    expect(calls.length).toBe(1);
    expect(calls[0]!.bytes).toBeLessThan(mountBytes);

    dispose();
    machine.stop();
  });

  it("drawer open/close emits <= 1 setData call per transition", async () => {
    const { instance, calls } = createMockInstance({}, {
      classes() {
        const api = this.data.drawer;
        return { root: api?.open ? "open" : "closed" };
      },
    });

    const machine = new MiniappMachine(drawerMachine, {
      id: "d1",
      duration: 0,
    });
    machine.start();
    const dispose = connectToComponent(
      machine,
      instance,
      connectDrawer,
      "drawer",
    );

    const mountBytes = calls.reduce((sum, c) => sum + c.bytes, 0);
    expect(calls.length).toBe(1);
    calls.length = 0;

    instance.__codeUiApi.setOpen(true);
    await flush();

    expect(calls.length).toBe(1);
    expect(calls[0]!.bytes).toBeLessThan(mountBytes * 0.7);

    dispose();
    machine.stop();
  });

  it("coalesces simultaneous computed prop sync and machine updateProps into 1 setData call", async () => {
    const { instance, calls } = createMockInstance(
      { checked: false, variant: "outline" },
      {
        classes() {
          const api = this.data.cCheckbox;
          return {
            root: `${this.data.variant}-${Boolean(api?.checked ?? this.data.checked)}`,
          };
        },
      },
    );

    const machine = new MiniappMachine(checkboxMachine, {
      id: "cb2",
      checked: false,
    });
    machine.start();
    const dispose = connectToComponent(
      machine,
      instance,
      connectCheckbox,
      "cCheckbox",
    );

    expect(calls.length).toBe(1);
    calls.length = 0;

    // Simulate parent updating both component property (observed by computedBehavior)
    // and forwarding to machine.updateProps in the same synchronous turn.
    instance.data.checked = true;
    instance.data.variant = "card";
    instance.__cui_computedSyncProp__?.("checked", true);
    instance.__cui_computedSyncProp__?.("variant", "card");
    machine.updateProps({ checked: true });

    await flush();

    expect(calls.length).toBe(1);
    expect(instance.data.classes).toEqual({ root: "card-true" });

    dispose();
    machine.stop();
  });
});
