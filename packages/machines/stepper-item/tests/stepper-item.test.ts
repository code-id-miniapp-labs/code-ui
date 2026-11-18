import { describe, it, expect, vi } from "vitest";
import { signal } from "alien-signals";
import { MiniappMachine } from "@code-id-labs/miniapp";
import type { StepperGroupContext } from "@code-id-labs/stepper";
import { stepperItemMachine, connectStepperItem } from "../src";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function makeGroupContext(
  overrides: Partial<StepperGroupContext> = {},
): StepperGroupContext {
  return {
    step: () => 0,
    count: () => 0,
    linear: () => false,
    disabled: () => false,
    setStep: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

describe("StepperItem Machine", () => {
  it("initializes with default props", () => {
    const machine = new MiniappMachine(stepperItemMachine, {});
    machine.start();

    expect(machine.state.get()).toBe("current");
    const api = connectStepperItem(machine.service);
    expect(api.state).toBe("current");
    expect(api.index).toBe(0);
    expect(api.isLast).toBe(false);
    expect(api.status).toBe("current");
    expect(api.isCurrent).toBe(true);
    expect(api.disabled).toBe(false);

    machine.stop();
  });

  it("calculates status correctly based on group step and linear mode", async () => {
    const currentStep = signal(0);
    const group = makeGroupContext({
      step: () => currentStep(),
      count: () => 3,
      linear: () => true,
    });

    const item0 = new MiniappMachine(stepperItemMachine, {
      groupContext: group,
      groupIndex: 0,
    });
    item0.start();

    const item1 = new MiniappMachine(stepperItemMachine, {
      groupContext: group,
      groupIndex: 1,
    });
    item1.start();

    const item2 = new MiniappMachine(stepperItemMachine, {
      groupContext: group,
      groupIndex: 2,
    });
    item2.start();

    expect(connectStepperItem(item0.service).status).toBe("current");
    expect(connectStepperItem(item1.service).status).toBe("upcoming");
    expect(connectStepperItem(item2.service).status).toBe("disabled");

    currentStep(1);
    await flush();

    expect(connectStepperItem(item0.service).status).toBe("completed");
    expect(connectStepperItem(item1.service).status).toBe("current");
    expect(connectStepperItem(item2.service).status).toBe("upcoming");

    item0.stop();
    item1.stop();
    item2.stop();
  });

  it("dispatches tap intents to the group context", async () => {
    const setStep = vi.fn();
    const onTap = vi.fn();
    const triggerEvent = vi.fn();

    const item = new MiniappMachine(stepperItemMachine, {
      groupContext: makeGroupContext({
        step: () => 0,
        count: () => 2,
        setStep,
      }),
      groupIndex: 1,
      onTap,
      component: { triggerEvent, setData: vi.fn() },
    });
    item.start();

    connectStepperItem(item.service).handleTap();
    await flush();

    expect(onTap).toHaveBeenCalledWith({
      index: 1,
      value: 1,
      status: "upcoming",
    });
    expect(triggerEvent).toHaveBeenCalledWith("tap", {
      index: 1,
      value: 1,
      status: "upcoming",
    });
    expect(setStep).toHaveBeenCalledWith(1);

    item.stop();
  });

  it("blocks taps to unreachable steps in linear mode", async () => {
    const setStep = vi.fn();
    const item = new MiniappMachine(stepperItemMachine, {
      groupContext: makeGroupContext({
        step: () => 0,
        count: () => 3,
        linear: () => true,
        setStep,
      }),
      groupIndex: 2,
    });
    item.start();

    connectStepperItem(item.service).handleTap();
    await flush();

    expect(setStep).not.toHaveBeenCalled();
    item.stop();
  });

  it("generates colon-free IDs compatible with scroll-into-view", () => {
    const item = new MiniappMachine(stepperItemMachine, {
      stepperId: "order-stepper",
      index: 2,
    });
    item.start();

    const api = connectStepperItem(item.service);
    expect(api.itemProps.id).toBe("st-order-stepper-i-2");
    expect(api.triggerProps.id).toBe("st-order-stepper-tr-2");
    expect(api.itemProps.id).not.toContain(":");

    item.stop();
  });

  it("respects explicit completed and status props", () => {
    const itemCompleted = new MiniappMachine(stepperItemMachine, {
      index: 3,
      completed: true,
    });
    itemCompleted.start();
    const api1 = connectStepperItem(itemCompleted.service);
    expect(api1.isCompleted).toBe(true);
    expect(api1.status).toBe("completed");
    itemCompleted.stop();

    const itemCustomStatus = new MiniappMachine(stepperItemMachine, {
      index: 1,
      status: "completed",
    });
    itemCustomStatus.start();
    const api2 = connectStepperItem(itemCustomStatus.service);
    expect(api2.status).toBe("completed");
    itemCustomStatus.stop();
  });

  it("resolves disabled state from the group context", () => {
    const item = new MiniappMachine(stepperItemMachine, {
      groupContext: makeGroupContext({
        disabled: () => true,
      }),
      groupIndex: 0,
    });
    item.start();

    const api = connectStepperItem(item.service);
    expect(item.state.get()).toBe("disabled");
    expect(api.state).toBe("disabled");
    expect(api.disabled).toBe(true);
    expect(api.status).toBe("disabled");

    item.stop();
  });

  it("tracks machine state transitions alongside status", async () => {
    const currentStep = signal(0);
    const item = new MiniappMachine(stepperItemMachine, {
      groupContext: makeGroupContext({
        step: () => currentStep(),
        count: () => 2,
      }),
      groupIndex: 1,
    });
    item.start();
    expect(item.state.get()).toBe("upcoming");

    currentStep(1);
    await flush();
    expect(item.state.get()).toBe("current");

    currentStep(2);
    await flush();
    expect(item.state.get()).toBe("completed");

    item.stop();
  });
});
