import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import {
  stepperMachine,
  connectStepper,
} from "../src";
import {
  stepperItemMachine,
  connectStepperItem,
} from "@code-ui/stepper-item";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Stepper Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes with default props", () => {
      const machine = new MiniappMachine(stepperMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("step")).toBe(0);

      const api = connectStepper(machine.service);
      expect(api.step).toBe(0);
      expect(api.count).toBe(0);
      expect(api.percent).toBe(0);
      expect(api.isFirst).toBe(true);
      expect(api.isLast).toBe(true);
      expect(api.hasNext).toBe(false);
      expect(api.hasPrev).toBe(false);
      expect(api.linear).toBe(false);
      expect(api.orientation).toBe("horizontal");
      expect(api.color).toBe("primary");
      expect(api.size).toBe("md");
      expect(api.variant).toBe("subtle");
      expect(api.disabled).toBe(false);
      expect(api.steps).toEqual([]);

      machine.stop();
    });

    it("initializes with items and defaultStep", () => {
      const machine = new MiniappMachine(stepperMachine, {
        defaultStep: 1,
        items: [
          { title: "Step 1", description: "Desc 1" },
          { title: "Step 2", description: "Desc 2" },
          { title: "Step 3", description: "Desc 3" },
        ],
      });
      machine.start();

      const api = connectStepper(machine.service);
      expect(api.step).toBe(1);
      expect(api.count).toBe(3);
      expect(api.percent).toBe(50);
      expect(api.isFirst).toBe(false);
      expect(api.isLast).toBe(false);
      expect(api.hasNext).toBe(true);
      expect(api.hasPrev).toBe(true);
      expect(api.steps).toHaveLength(3);
      expect(api.steps[0]?.status).toBe("completed");
      expect(api.steps[1]?.status).toBe("current");
      expect(api.steps[2]?.status).toBe("upcoming");

      machine.stop();
    });

    it("supports controlled value / modelValue / step", () => {
      const machine = new MiniappMachine(stepperMachine, {
        value: 2,
        count: 3,
      });
      machine.start();

      let api = connectStepper(machine.service);
      expect(api.step).toBe(2);
      expect(api.percent).toBe(100);
      expect(api.isLast).toBe(true);
      expect(api.isCompleted).toBe(true);

      machine.updateProps({ value: 0 });
      api = connectStepper(machine.service);
      expect(api.step).toBe(0);
      expect(api.percent).toBe(0);

      machine.stop();
    });
  });

  describe("Step Navigation & Guards", () => {
    it("navigates forward, backward, and resets in non-linear mode", async () => {
      const onChange = vi.fn();
      const onComplete = vi.fn();
      const triggerEvent = vi.fn();

      const machine = new MiniappMachine(stepperMachine, {
        items: [
          { title: "Account", value: "account" },
          { title: "Profile", value: "profile" },
          { title: "Done", value: "done" },
        ],
        onChange,
        onComplete,
        component: { triggerEvent, setData: vi.fn() },
      });
      machine.start();

      let api = connectStepper(machine.service);
      expect(api.step).toBe(0);

      // Jump directly to step 2 (non-linear)
      api.setStep(2);
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(2);
      expect(api.value).toBe("done");
      expect(onChange).toHaveBeenCalledWith({
        step: 2,
        value: "done",
        previousStep: 0,
      });
      expect(onComplete).toHaveBeenCalledWith({ step: 2 });
      expect(triggerEvent).toHaveBeenCalledWith("change", {
        step: 2,
        value: "done",
        previousStep: 0,
      });
      expect(triggerEvent).toHaveBeenCalledWith("update:modelValue", 2);
      expect(triggerEvent).toHaveBeenCalledWith("complete", { step: 2 });

      // Go back
      api.prevStep();
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(1);

      // Reset
      api.resetStep();
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(0);

      machine.stop();
    });

    it("enforces sequential navigation in linear mode", async () => {
      const machine = new MiniappMachine(stepperMachine, {
        linear: true,
        items: [{ title: "Step 1" }, { title: "Step 2" }, { title: "Step 3" }],
      });
      machine.start();

      let api = connectStepper(machine.service);
      expect(api.step).toBe(0);
      expect(api.steps[2]?.status).toBe("disabled");
      expect(api.steps[2]?.isDisabled).toBe(true);

      // Attempting to skip from 0 -> 2 is blocked by linear guard
      api.goToStep(2);
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(0);

      // Advancing from 0 -> 1 is allowed
      api.goToStep(1);
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(1);
      expect(api.steps[2]?.status).toBe("upcoming");
      expect(api.steps[2]?.isDisabled).toBe(false);

      // Advancing from 1 -> 2 is now allowed
      api.goToStep(2);
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(2);

      // Returning to completed step 0 is always allowed
      api.goToStep(0);
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(0);

      machine.stop();
    });

    it("dynamically reacts to linear prop updates (toggling linear on/off)", async () => {
      const machine = new MiniappMachine(stepperMachine, {
        linear: true,
        items: [{ title: "Step 0" }, { title: "Step 1" }, { title: "Step 2" }],
      });
      machine.start();

      let api = connectStepper(machine.service);
      expect(api.linear).toBe(true);
      expect(api.steps[2]?.status).toBe("disabled");

      // While linear is true, jumping 0 -> 2 is blocked
      api.goToStep(2);
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(0);

      // Dynamically toggle linear to false
      machine.updateProps({ linear: false });
      await flush();
      api = connectStepper(machine.service);
      expect(api.linear).toBe(false);
      expect(api.steps[2]?.status).toBe("upcoming");
      expect(api.steps[2]?.isDisabled).toBe(false);

      // Now jumping 0 -> 2 is permitted
      api.goToStep(2);
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(2);

      // Toggle linear back to true
      machine.updateProps({ linear: true });
      await flush();
      api = connectStepper(machine.service);
      expect(api.linear).toBe(true);

      machine.stop();
    });

    it("prevents selecting disabled items or navigating when globally disabled", async () => {
      const machine = new MiniappMachine(stepperMachine, {
        items: [
          { title: "Step 1" },
          { title: "Step 2", disabled: true },
          { title: "Step 3" },
        ],
      });
      machine.start();

      let api = connectStepper(machine.service);
      api.setStep(1);
      await flush();
      api = connectStepper(machine.service);
      expect(api.step).toBe(0);

      // Disable entire stepper
      machine.updateProps({ disabled: true });
      api = connectStepper(machine.service);
      api.setStep(2);
      await flush();
      expect(connectStepper(machine.service).step).toBe(0);

      machine.stop();
    });
  });

  describe("Compound Mode (Stepper + StepperItem via EventBus)", () => {
    it("connects declarative StepperItems to parent Stepper machine and enforces linear guards", async () => {
      const parentMachine = new MiniappMachine(stepperMachine, {
        linear: true,
        linkedCount: 3,
      });
      parentMachine.start();

      const bus = parentMachine.service.refs.get("bus");

      const item0 = new MiniappMachine(stepperItemMachine, {
        groupBus: bus,
        groupStep: 0,
        groupCount: 3,
        groupIndex: 0,
        groupIsLast: false,
        groupLinear: true,
        title: "Personal",
      });
      item0.start();

      const item1 = new MiniappMachine(stepperItemMachine, {
        groupBus: bus,
        groupStep: 0,
        groupCount: 3,
        groupIndex: 1,
        groupIsLast: false,
        groupLinear: true,
        title: "Verification",
      });
      item1.start();

      const item2 = new MiniappMachine(stepperItemMachine, {
        groupBus: bus,
        groupStep: 0,
        groupCount: 3,
        groupIndex: 2,
        groupIsLast: true,
        groupLinear: true,
        title: "Review",
      });
      item2.start();

      expect(connectStepperItem(item0.service).status).toBe("current");
      expect(connectStepperItem(item1.service).status).toBe("upcoming");
      expect(connectStepperItem(item2.service).status).toBe("disabled");
      expect(connectStepperItem(item2.service).resolvedIsLast).toBe(true);

      // Tap item 2 (should be ignored because it's disabled in linear mode when step is 0)
      connectStepperItem(item2.service).handleTap();
      await flush();
      expect(connectStepper(parentMachine.service).step).toBe(0);

      // Tap item 1 (allowed in linear mode: 0 -> 1)
      connectStepperItem(item1.service).handleTap();
      await flush();
      await flush();
      expect(connectStepper(parentMachine.service).step).toBe(1);
      expect(connectStepperItem(item0.service).status).toBe("completed");
      expect(connectStepperItem(item1.service).status).toBe("current");
      expect(connectStepperItem(item2.service).status).toBe("upcoming");

      // Tap item 2 (now allowed: 1 -> 2)
      connectStepperItem(item2.service).handleTap();
      await flush();
      await flush();
      expect(connectStepper(parentMachine.service).step).toBe(2);
      expect(connectStepperItem(item0.service).status).toBe("completed");
      expect(connectStepperItem(item1.service).status).toBe("completed");
      expect(connectStepperItem(item2.service).status).toBe("current");

      // External controlled value update (e.g. from page setData)
      parentMachine.updateProps({ value: 0 });
      await flush();
      await flush();
      expect(connectStepper(parentMachine.service).step).toBe(0);
      expect(connectStepperItem(item0.service).status).toBe("current");
      expect(connectStepperItem(item1.service).status).toBe("upcoming");
      expect(connectStepperItem(item2.service).status).toBe("disabled");

      parentMachine.updateProps({ value: 2 });
      await flush();
      await flush();
      expect(connectStepper(parentMachine.service).step).toBe(2);
      expect(connectStepperItem(item0.service).status).toBe("completed");
      expect(connectStepperItem(item1.service).status).toBe("completed");
      expect(connectStepperItem(item2.service).status).toBe("current");

      item0.stop();
      item1.stop();
      item2.stop();
      parentMachine.stop();
    });
  });

  describe("Scroll Management & Auto-Slide Navigation", () => {
    it("computes scrollTargetIndex, scrollIntoViewId, and scrollLeft on step navigation", async () => {
      const machine = new MiniappMachine(stepperMachine, {
        id: "demo",
        items: [
          { title: "Step 0" },
          { title: "Step 1" },
          { title: "Step 2" },
          { title: "Step 3" },
        ],
      });
      machine.start();

      let api = connectStepper(machine.service);
      // Initially at step 0
      expect(api.step).toBe(0);
      expect(api.scrollTargetIndex).toBe(0);
      expect(api.scrollIntoViewId).toBe("cui-step-demo-0");
      expect(api.scrollLeft).toBe(0);
      expect(api.listProps["enable-flex"]).toBe(true);
      expect(api.listProps["scroll-x"]).toBe(true);
      expect(api.listProps["scroll-into-view"]).toBe("cui-step-demo-0");
      expect(api.listProps["scroll-left"]).toBe(0);

      // Advance to step 1 -> scrollTargetIndex becomes 2 to reveal next upcoming step
      api.nextStep();
      await flush();
      api = connectStepper(machine.service);

      expect(api.step).toBe(1);
      expect(api.scrollTargetIndex).toBe(2);
      expect(api.scrollIntoViewId).toBe("cui-step-demo-2");
      expect(api.scrollLeft).toBeGreaterThan(0);
      expect(api.listProps["scroll-into-view"]).toBe("cui-step-demo-2");

      // Advance to step 2 -> scrollTargetIndex becomes 3
      api.nextStep();
      await flush();
      api = connectStepper(machine.service);

      expect(api.step).toBe(2);
      expect(api.scrollTargetIndex).toBe(3);
      expect(api.scrollIntoViewId).toBe("cui-step-demo-3");

      // Programmatic scrollTo
      api.scrollTo(1);
      await flush();
      api = connectStepper(machine.service);
      expect(api.scrollTargetIndex).toBe(1);

      machine.stop();
    });

    it("updates step and scroll properly when clicking stepper-item followed by controlled value navigation", async () => {
      const setDataSpy = vi.fn();
      const triggerEventSpy = vi.fn();
      const mockComp = {
        setData: setDataSpy,
        triggerEvent: triggerEventSpy,
      };

      const parentMachine = new MiniappMachine(stepperMachine, {
        id: "interactive",
        step: null,
        value: 0,
        items: [
          { title: "Account" },
          { title: "Profile" },
          { title: "Billing" },
          { title: "Complete" },
        ],
        component: mockComp,
      });
      parentMachine.start();

      const bus = parentMachine.service.refs.get("bus");
      const item2 = new MiniappMachine(stepperItemMachine, {
        groupBus: bus,
        groupStep: 0,
        groupCount: 4,
        groupIndex: 2,
        groupIsLast: false,
        groupLinear: false,
        title: "Billing",
      });
      item2.start();

      // 1. Click stepper item 2
      connectStepperItem(item2.service).handleTap();
      await flush();
      await flush();

      expect(connectStepper(parentMachine.service).step).toBe(2);
      expect(connectStepperItem(item2.service).status).toBe("current");
      // Ensure machine did not pollute component.setData({ step })
      expect(setDataSpy).not.toHaveBeenCalledWith({ step: 2 });

      // Simulate page bind:change handler syncing value=2 while step remains null
      parentMachine.updateProps({ step: null, value: 2 });
      await flush();
      expect(connectStepper(parentMachine.service).step).toBe(2);
      expect(connectStepper(parentMachine.service).scrollTargetIndex).toBe(3);

      // 2. Navigate via external Previous button (updates value=1, step remains null)
      parentMachine.updateProps({ step: null, value: 1 });
      await flush();
      await flush();

      expect(connectStepper(parentMachine.service).step).toBe(1);
      expect(connectStepper(parentMachine.service).steps[1]?.status).toBe("current");
      expect(connectStepper(parentMachine.service).steps[2]?.status).toBe("upcoming");
      expect(connectStepperItem(item2.service).status).toBe("upcoming");
      expect(connectStepper(parentMachine.service).scrollTargetIndex).toBe(2);
      expect(connectStepper(parentMachine.service).scrollLeft).toBeGreaterThan(0);

      // 3. Navigate via external Reset button (updates value=0, step remains null)
      parentMachine.updateProps({ step: null, value: 0 });
      await flush();
      await flush();

      expect(connectStepper(parentMachine.service).step).toBe(0);
      expect(connectStepper(parentMachine.service).steps[0]?.status).toBe("current");
      expect(connectStepperItem(item2.service).status).toBe("upcoming");
      expect(connectStepper(parentMachine.service).scrollTargetIndex).toBe(0);
      expect(connectStepper(parentMachine.service).scrollLeft).toBe(0);

      item2.stop();
      parentMachine.stop();
    });

    it("allows completing/resolving the final step so all steps show completed status", async () => {
      const parentMachine = new MiniappMachine(stepperMachine, {
        id: "resolve-test",
        step: 0,
        items: [
          { title: "Account" },
          { title: "Profile" },
          { title: "Done" },
        ],
      });
      parentMachine.start();

      const bus = parentMachine.service.refs.get("bus");
      const itemDone = new MiniappMachine(stepperItemMachine, {
        groupBus: bus,
        groupStep: 0,
        groupCount: 3,
        groupIndex: 2,
        groupIsLast: true,
        title: "Done",
      });
      itemDone.start();

      // At step 2 (final step):
      connectStepper(parentMachine.service).setStep(2);
      await flush();
      await flush();

      expect(connectStepper(parentMachine.service).step).toBe(2);
      expect(connectStepper(parentMachine.service).steps[2]?.status).toBe("current");
      expect(connectStepperItem(itemDone.service).status).toBe("current");

      // Complete the final step via completeStep() (step = count = 3)
      connectStepper(parentMachine.service).completeStep();
      await flush();
      await flush();

      expect(connectStepper(parentMachine.service).step).toBe(3);
      expect(connectStepper(parentMachine.service).steps[0]?.status).toBe("completed");
      expect(connectStepper(parentMachine.service).steps[1]?.status).toBe("completed");
      expect(connectStepper(parentMachine.service).steps[2]?.status).toBe("completed");
      expect(connectStepperItem(itemDone.service).status).toBe("completed");
      expect(connectStepper(parentMachine.service).isCompleted).toBe(true);

      itemDone.stop();
      parentMachine.stop();
    });
  });
});
