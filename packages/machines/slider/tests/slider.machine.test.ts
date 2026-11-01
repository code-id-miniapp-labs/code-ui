import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { formMachine, connectForm } from "@code-ui/form";
import { sliderMachine } from "../src/slider.machine";
import { connectSlider } from "../src/slider.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Slider Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes with single value default", () => {
      const machine = new MiniappMachine(sliderMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("isDisabled")).toBe(false);
      expect(machine.computed("isReadOnly")).toBe(false);
      expect(machine.computed("isInteractive")).toBe(true);
      expect(machine.computed("value")).toBe(0);
      expect(machine.computed("values")).toEqual([0]);

      const api = connectSlider(machine.service);
      expect(api.state).toBe("idle");
      expect(api.value).toBe(0);
      expect(api.values).toEqual([0]);
      expect(api.min).toBe(0);
      expect(api.max).toBe(100);
      expect(api.step).toBe(1);
      expect(api.disabled).toBe(false);
      expect(api.thumbs.length).toBe(1);
      expect(api.thumbs[0]?.value).toBe(0);
      expect(api.thumbs[0]?.percent).toBe(0);
      expect(api.rangeStyle).toBe("left: 0%; width: 0%;");

      machine.stop();
    });

    it("initializes with custom defaultValue", () => {
      const machine = new MiniappMachine(sliderMachine, {
        defaultValue: 40,
        min: 0,
        max: 100,
      });
      machine.start();

      expect(machine.computed("value")).toBe(40);
      const api = connectSlider(machine.service);
      expect(api.value).toBe(40);
      expect(api.thumbs[0]?.percent).toBe(40);
      expect(api.rangeStyle).toBe("left: 0%; width: 40%;");

      machine.stop();
    });

    it("initializes range slider with array defaultValue", () => {
      const machine = new MiniappMachine(sliderMachine, {
        defaultValue: [25, 75],
        min: 0,
        max: 100,
      });
      machine.start();

      expect(machine.computed("value")).toEqual([25, 75]);
      expect(machine.computed("values")).toEqual([25, 75]);

      const api = connectSlider(machine.service);
      expect(api.thumbs.length).toBe(2);
      expect(api.thumbs[0]?.value).toBe(25);
      expect(api.thumbs[0]?.percent).toBe(25);
      expect(api.thumbs[1]?.value).toBe(75);
      expect(api.thumbs[1]?.percent).toBe(75);
      expect(api.rangeStyle).toBe("left: 25%; width: 50%;");
      expect(api.valueText).toBe("25 - 75");

      machine.stop();
    });
  });

  describe("Controlled Value & Props", () => {
    it("updates when controlled value prop changes", async () => {
      const machine = new MiniappMachine(sliderMachine, {
        value: 10,
        min: 0,
        max: 100,
      });
      machine.start();

      expect(machine.computed("value")).toBe(10);

      machine.updateProps({ value: 60 });
      await flush();

      expect(machine.computed("value")).toBe(60);
      const api = connectSlider(machine.service);
      expect(api.value).toBe(60);
      expect(api.thumbs[0]?.percent).toBe(60);

      machine.stop();
    });
  });

  describe("Interaction (Pointer Events)", () => {
    const mockRect = {
      left: 0,
      top: 0,
      right: 200,
      bottom: 20,
      width: 200,
      height: 20,
    };

    it("handles POINTER_DOWN, POINTER_MOVE, and POINTER_UP", async () => {
      const onChange = vi.fn();
      const onChangeEnd = vi.fn();

      const machine = new MiniappMachine(sliderMachine, {
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        onChange,
        onChangeEnd,
      });
      machine.start();

      // Touch at 50% (x: 100 on 200 width)
      machine.send({
        type: "POINTER_DOWN",
        point: { x: 100, y: 10 },
        rect: mockRect,
      });
      await flush();

      expect(machine.state.get()).toBe("dragging");
      expect(machine.computed("value")).toBe(50);
      expect(onChange).toHaveBeenCalledWith({ value: 50, values: [50] });

      // Move to 75% (x: 150)
      machine.send({
        type: "POINTER_MOVE",
        point: { x: 150, y: 10 },
      });
      await flush();

      expect(machine.computed("value")).toBe(75);
      expect(onChange).toHaveBeenCalledWith({ value: 75, values: [75] });

      // Release touch
      machine.send({
        type: "POINTER_UP",
      });
      await flush();

      expect(machine.state.get()).toBe("idle");
      expect(onChangeEnd).toHaveBeenCalledWith({ value: 75, values: [75] });

      machine.stop();
    });

    it("respects step increments during drag", async () => {
      const machine = new MiniappMachine(sliderMachine, {
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 10,
      });
      machine.start();

      // Touch at 23% (x: 46 on 200 width) -> snaps to 20
      machine.send({
        type: "POINTER_DOWN",
        point: { x: 46, y: 10 },
        rect: mockRect,
      });
      await flush();

      expect(machine.computed("value")).toBe(20);

      // Move to 37% (x: 74 on 200 width) -> snaps to 40
      machine.send({
        type: "POINTER_MOVE",
        point: { x: 74, y: 10 },
      });
      await flush();

      expect(machine.computed("value")).toBe(40);

      machine.stop();
    });

    it("drags the closest thumb in dual-thumb range mode", async () => {
      const machine = new MiniappMachine(sliderMachine, {
        defaultValue: [20, 80],
        min: 0,
        max: 100,
      });
      machine.start();

      // Touch at 85% (closer to 80 than 20)
      machine.send({
        type: "POINTER_DOWN",
        point: { x: 170, y: 10 },
        rect: mockRect,
      });
      await flush();

      expect(machine.context.get("activeThumbIndex")).toBe(1);
      expect(machine.computed("value")).toEqual([20, 85]);

      // Move thumb 1 down towards thumb 0, but cannot cross it
      machine.send({
        type: "POINTER_MOVE",
        point: { x: 20, y: 10 }, // 10%
      });
      await flush();

      // Clamped at thumb 0's value (20)
      expect(machine.computed("value")).toEqual([20, 20]);

      machine.send({ type: "POINTER_UP" });
      await flush();

      machine.stop();
    });

    it("ignores pointer events when disabled or readOnly", async () => {
      const onChange = vi.fn();
      const machine = new MiniappMachine(sliderMachine, {
        disabled: true,
        defaultValue: 20,
        onChange,
      });
      machine.start();

      machine.send({
        type: "POINTER_DOWN",
        point: { x: 100, y: 10 },
        rect: mockRect,
      });
      await flush();

      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("value")).toBe(20);
      expect(onChange).not.toHaveBeenCalled();

      machine.stop();
    });
  });

  describe("Programmatic API Methods", () => {
    it("supports setValue, stepUp, stepDown, reset", async () => {
      const machine = new MiniappMachine(sliderMachine, {
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
      });
      machine.start();

      let api = connectSlider(machine.service);

      api.setValue(50);
      await flush();
      api = connectSlider(machine.service);
      expect(api.value).toBe(50);

      api.stepUp();
      await flush();
      api = connectSlider(machine.service);
      expect(api.value).toBe(55);

      api.stepDown();
      await flush();
      api = connectSlider(machine.service);
      expect(api.value).toBe(50);

      api.reset();
      await flush();
      api = connectSlider(machine.service);
      expect(api.value).toBe(20);

      machine.stop();
    });
  });

  describe("Orientation & Inverted", () => {
    it("handles vertical orientation correctly", async () => {
      const mockVerticalRect = {
        left: 0,
        top: 0,
        right: 20,
        bottom: 200,
        width: 20,
        height: 200,
      };

      const machine = new MiniappMachine(sliderMachine, {
        orientation: "vertical",
        defaultValue: 0,
        min: 0,
        max: 100,
      });
      machine.start();

      // In vertical, y: 50 from top means bottom is 150 -> 75%
      machine.send({
        type: "POINTER_DOWN",
        point: { x: 10, y: 50 },
        rect: mockVerticalRect,
      });
      await flush();

      expect(machine.computed("value")).toBe(75);
      const api = connectSlider(machine.service);
      expect(api.rangeStyle).toBe("bottom: 0%; height: 75%;");
      expect(api.thumbs[0]?.style).toContain("bottom: 75%");

      machine.stop();
    });
  });

  describe("Form Integration", () => {
    it("registers with parent FormBus, validates on change, and resets on form reset", async () => {
      const formComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn(),
      };
      const sliderComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn(),
        selectOwnerComponent: () => formComp,
      };

      const formM = new MiniappMachine(formMachine, {
        component: formComp,
        rules: {
          score: [
            (val: number) =>
              Number(val) >= 50 ? true : "Score must be at least 50",
          ],
        },
      });
      formM.start();

      const formApi = connectForm(formM.service);
      const bus = formApi.bus;

      const sliderM = new MiniappMachine(sliderMachine, {
        component: sliderComp,
        formBus: bus,
        name: "score",
        defaultValue: 40,
        min: 0,
        max: 100,
      });
      sliderM.start();
      await flush();

      let sliderApi = connectSlider(sliderM.service);
      expect(sliderApi.invalid).toBe(false);

      // Validate form -> should fail because score is 40 (< 50)
      const result = await formApi.validate();
      await flush();

      expect(result.valid).toBe(false);
      sliderApi = connectSlider(sliderM.service);
      expect(sliderApi.invalid).toBe(true);

      // Adjust slider to valid value
      sliderApi.setValue(70);
      await flush();

      const result2 = await formApi.validate();
      await flush();

      expect(result2.valid).toBe(true);
      sliderApi = connectSlider(sliderM.service);
      expect(sliderApi.invalid).toBe(false);

      // Reset form
      formApi.reset();
      await flush();

      sliderApi = connectSlider(sliderM.service);
      expect(sliderApi.value).toBe(40);
      expect(sliderApi.invalid).toBe(false);

      sliderM.stop();
      formM.stop();
    });
  });
});
