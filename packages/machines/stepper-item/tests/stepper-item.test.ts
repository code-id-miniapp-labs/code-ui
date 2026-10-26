import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { createEventBus } from "@code-ui/utils";
import type { StepperBusEvents } from "@code-ui/stepper";
import {
  stepperItemMachine,
  connectStepperItem,
} from "../src";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("StepperItem Machine", () => {
  it("initializes with default props", () => {
    const machine = new MiniappMachine(stepperItemMachine, {});
    machine.start();

    expect(machine.state.get()).toBe("idle");
    const api = connectStepperItem(machine.service);
    expect(api.resolvedIndex).toBe(0);
    expect(api.resolvedIsLast).toBe(false);
    expect(api.status).toBe("current");
    expect(api.isCurrent).toBe(true);
    expect(api.isDisabled).toBe(false);

    machine.stop();
  });

  it("calculates status correctly based on groupStep and groupLinear", async () => {
    const bus = createEventBus<StepperBusEvents>();

    const item0 = new MiniappMachine(stepperItemMachine, {
      groupBus: bus,
      groupStep: 0,
      groupCount: 3,
      groupIndex: 0,
      groupLinear: true,
      title: "Step 0",
    });
    item0.start();

    const item1 = new MiniappMachine(stepperItemMachine, {
      groupBus: bus,
      groupStep: 0,
      groupCount: 3,
      groupIndex: 1,
      groupLinear: true,
      title: "Step 1",
    });
    item1.start();

    const item2 = new MiniappMachine(stepperItemMachine, {
      groupBus: bus,
      groupStep: 0,
      groupCount: 3,
      groupIndex: 2,
      groupLinear: true,
      title: "Step 2",
    });
    item2.start();

    expect(connectStepperItem(item0.service).status).toBe("current");
    expect(connectStepperItem(item1.service).status).toBe("upcoming");
    expect(connectStepperItem(item2.service).status).toBe("disabled");

    // Emit group step change to step 1
    bus.emit("stepper:change", {
      step: 1,
      count: 3,
      linear: true,
      orientation: "horizontal",
      color: "primary",
      size: "md",
      variant: "subtle",
      disabled: false,
    });
    await flush();

    expect(connectStepperItem(item0.service).status).toBe("completed");
    expect(connectStepperItem(item1.service).status).toBe("current");
    expect(connectStepperItem(item2.service).status).toBe("upcoming");

    item0.stop();
    item1.stop();
    item2.stop();
  });

  it("handles tap and emits item:tap on bus", async () => {
    const bus = createEventBus<StepperBusEvents>();
    const onBusTap = vi.fn();
    bus.on("item:tap", onBusTap);

    const onClick = vi.fn();
    const triggerEvent = vi.fn();

    const item = new MiniappMachine(stepperItemMachine, {
      groupBus: bus,
      groupStep: 0,
      groupCount: 2,
      groupIndex: 1,
      onClick,
      component: { triggerEvent, setData: vi.fn() },
    });
    item.start();

    connectStepperItem(item.service).handleTap();
    await flush();

    expect(onClick).toHaveBeenCalledWith({
      index: 1,
      value: 1,
      status: "upcoming",
    });
    expect(triggerEvent).toHaveBeenCalledWith("click", {
      index: 1,
      value: 1,
      status: "upcoming",
    });
    expect(onBusTap).toHaveBeenCalledWith({
      index: 1,
      value: 1,
    });

    item.stop();
  });

  it("generates colon-free IDs compatible with scroll-into-view", () => {
    const item = new MiniappMachine(stepperItemMachine, {
      stepperId: "order-stepper",
      index: 2,
    });
    item.start();

    const api = connectStepperItem(item.service);
    expect(api.itemProps.id).toBe("cui-step-order-stepper-2");
    expect(api.triggerProps.id).toBe("cui-step-order-stepper-trigger-2");
    expect(api.itemProps.id).not.toContain(":");

    item.stop();
  });

  it("respects explicit completed and status props", () => {
    const itemCompleted = new MiniappMachine(stepperItemMachine, {
      index: 3,
      groupStep: 2,
      completed: true,
    });
    itemCompleted.start();
    const api1 = connectStepperItem(itemCompleted.service);
    expect(api1.isCompleted).toBe(true);
    expect(api1.status).toBe("completed");
    itemCompleted.stop();

    const itemCustomStatus = new MiniappMachine(stepperItemMachine, {
      index: 1,
      groupStep: 0,
      status: "completed",
    });
    itemCustomStatus.start();
    const api2 = connectStepperItem(itemCustomStatus.service);
    expect(api2.status).toBe("completed");
    itemCustomStatus.stop();
  });
});
