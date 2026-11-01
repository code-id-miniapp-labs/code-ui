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

    it("initializes range slider with array defaultValue [25, 60] and custom min 18, max 80", () => {
      const machine = new MiniappMachine(sliderMachine, {
        defaultValue: [25, 60],
        min: 18,
        max: 80,
      });
      machine.start();

      expect(machine.computed("value")).toEqual([25, 60]);
      expect(machine.computed("values")).toEqual([25, 60]);

      const api = connectSlider(machine.service);
      expect(api.thumbs.length).toBe(2);
      expect(api.thumbs[0]?.value).toBe(25);
      expect(api.thumbs[1]?.value).toBe(60);
      expect(api.valueText).toBe("25 - 60");

      machine.stop();
    });

    it("normalizes array from JSON string defaultValue '[25, 60]'", () => {
      const machine = new MiniappMachine(sliderMachine, {
        defaultValue: "[25, 60]" as any,
        min: 18,
        max: 80,
      });
      machine.start();

      expect(machine.computed("value")).toEqual([25, 60]);
      const api = connectSlider(machine.service);
      expect(api.thumbs.length).toBe(2);
      expect(api.thumbs[0]?.value).toBe(25);
      expect(api.thumbs[1]?.value).toBe(60);

      machine.stop();
    });
  });

  describe("Controlled Value & Props", () => {
    it("defines value, name, form, and formBus in defaultSliderProps for MiniProgram observer syncing", () => {
      const defaultProps = sliderMachine.props?.({ props: {}, scope: {} as any });
      expect(defaultProps).toHaveProperty("value");
      expect(defaultProps?.value).toBeNull();
      expect(defaultProps).toHaveProperty("defaultValue");
      expect(defaultProps?.defaultValue).toBeNull();
      expect(defaultProps).toHaveProperty("name");
      expect(defaultProps?.name).toBe("");
      expect(defaultProps).toHaveProperty("form");
      expect(defaultProps?.form).toBe("");
      expect(defaultProps).toHaveProperty("formBus");
    });

    it("updates thumb and range when value prop changes via button (e.g. Set to 70)", async () => {
      // Simulates page with initial singleValue = 35, then button sets singleValue = 70
      const machine = new MiniappMachine(sliderMachine, {
        value: 35,
        min: 0,
        max: 100,
      });
      machine.start();

      let api = connectSlider(machine.service);
      expect(api.value).toBe(35);
      expect(api.thumbs[0]?.percent).toBe(35);
      expect(api.rangeStyle).toBe("left: 0%; width: 35%;");

      // User taps button: Set to 70
      machine.updateProps({ value: 70 });
      await flush();

      api = connectSlider(machine.service);
      expect(machine.computed("value")).toBe(70);
      expect(api.value).toBe(70);
      expect(api.thumbs[0]?.percent).toBe(70);
      expect(api.rangeStyle).toBe("left: 0%; width: 70%;");

      machine.stop();
    });

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

    it("exposes thumbIds and thumbPercents for WXS bindings", () => {
      const singleMachine = new MiniappMachine(sliderMachine, {
        defaultValue: 30,
      });
      singleMachine.start();
      const singleApi = connectSlider(singleMachine.service);
      expect(singleApi.thumbIds).toBeTruthy();
      expect(singleApi.thumbPercents).toEqual([30]);
      singleMachine.stop();

      const rangeMachine = new MiniappMachine(sliderMachine, {
        defaultValue: [20, 80],
      });
      rangeMachine.start();
      const rangeApi = connectSlider(rangeMachine.service);
      expect(rangeApi.thumbIds.split(",").length).toBe(2);
      expect(rangeApi.thumbPercents).toEqual([20, 80]);
      rangeMachine.stop();
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

    it("handles touch events dispatched from WXS gesture handler", async () => {
      const machine = new MiniappMachine(sliderMachine, {
        defaultValue: 0,
        min: 0,
        max: 100,
      });
      machine.start();
      machine.refs.set("rect", mockRect);

      const api = connectSlider(machine.service);

      // WXS calls handleTouchStart({ clientX: 40, clientY: 10 })
      await api.handleTouchStart({ clientX: 40, clientY: 10 });
      await flush();
      expect(machine.state.get()).toBe("dragging");
      expect(machine.computed("value")).toBe(20);

      // WXS calls handleTouchMove({ clientX: 160, clientY: 10 })
      api.handleTouchMove({ clientX: 160, clientY: 10 });
      await flush();
      expect(machine.computed("value")).toBe(80);

      // WXS calls handleTouchEnd()
      api.handleTouchEnd();
      await flush();
      expect(machine.state.get()).toBe("idle");
      expect(machine.computed("value")).toBe(80);

      // Tap at x: 100 (50%)
      await api.handleTap({ clientX: 100, clientY: 10 });
      await flush();
      expect(machine.computed("value")).toBe(50);

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

    it("collects single and range slider values on form submit", async () => {
      const formComp = { setData: vi.fn(), triggerEvent: vi.fn() };
      const slider1Comp = { setData: vi.fn(), triggerEvent: vi.fn() };
      const slider2Comp = { setData: vi.fn(), triggerEvent: vi.fn() };

      const formM = new MiniappMachine(formMachine, {
        component: formComp,
      });
      formM.start();
      const formApi = connectForm(formM.service);
      const bus = formApi.bus;

      // 1. Single slider
      const singleM = new MiniappMachine(sliderMachine, {
        component: slider1Comp,
        formBus: bus,
        name: "budget",
        defaultValue: 25,
      });
      singleM.start();

      // 2. Range slider
      const rangeM = new MiniappMachine(sliderMachine, {
        component: slider2Comp,
        formBus: bus,
        name: "ageBracket",
        defaultValue: [25, 60],
      });
      rangeM.start();
      await flush();

      // Form submit collects both values
      const submitResult = await formApi.submit();
      await flush();

      expect(submitResult.valid).toBe(true);
      expect(submitResult.values).toEqual({
        budget: 25,
        ageBracket: [25, 60],
      });

      singleM.stop();
      rangeM.stop();
      formM.stop();
    });

    it("binds name dynamically when wrapper updates props after initialization", async () => {
      const formComp = { setData: vi.fn(), triggerEvent: vi.fn() };
      const sliderComp = { setData: vi.fn(), triggerEvent: vi.fn() };

      const formM = new MiniappMachine(formMachine, {
        component: formComp,
      });
      formM.start();
      const formApi = connectForm(formM.service);
      const bus = formApi.bus;

      // Starts without name or bus (before relations link)
      const sliderM = new MiniappMachine(sliderMachine, {
        component: sliderComp,
        defaultValue: 55,
      });
      sliderM.start();
      await flush();

      // Relations link: updateProps simulates updateChildFromFormFieldWrapper
      sliderM.updateProps({
        name: "inferredBudget",
        formBus: bus,
      });
      await flush();

      // Form submit collects the newly bound field
      const submitResult = await formApi.submit();
      await flush();

      expect(submitResult.values).toHaveProperty("inferredBudget", 55);

      sliderM.stop();
      formM.stop();
    });
  });
});
