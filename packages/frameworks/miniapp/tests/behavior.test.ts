import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMachine } from "@code-ui/core";
import {
  createMachineBehavior,
  createProperties,
  cuiFormParentBehavior,
  cuiFormFieldBehavior,
  withFormParent,
  withFormField,
  withFormFieldWrapper,
  withRadioGroup,
  withRadioItem,
  cuiRadioGroupBehavior,
  cuiRadioItemBehavior,
  withCheckboxGroup,
  withCheckboxItem,
  cuiCheckboxGroupBehavior,
  cuiCheckboxItemBehavior,
  withStepper,
  withStepperItem,
  cuiStepperBehavior,
  cuiStepperItemBehavior,
} from "../src";

// Mock global Behavior for Node test environment
let behaviorRegistry: any[] = [];
(globalThis as any).Behavior = vi.fn((config: any) => {
  const behaviorObj = { ...config, __isMockBehavior: true, id: behaviorRegistry.length };
  behaviorRegistry.push(behaviorObj);
  return behaviorObj;
});

afterEach(() => {
  vi.clearAllMocks();
  behaviorRegistry = [];
});

describe("createMachineBehavior - formParent & formField relations", () => {
  const dummyMachine = createMachine({
    props: () => ({ formBus: undefined, name: "", form: "" }),
    initialState: () => "idle",
    states: { idle: {} },
  });

  it("configures cuiFormParentBehavior and cuiFormField relations on formParent", () => {
    const parentBehavior = createMachineBehavior({
      machine: dummyMachine,
      plugins: [withFormParent()],
    });

    expect(parentBehavior.behaviors).toContain(cuiFormParentBehavior);
    expect(parentBehavior.relations).toBeDefined();
    expect(parentBehavior.relations.cuiFormField).toBeDefined();
    expect(parentBehavior.relations.cuiFormField.type).toBe("descendant");
    expect(parentBehavior.relations.cuiFormField.target).toBe(cuiFormFieldBehavior);
  });

  it("configures cuiFormFieldBehavior and cuiFormParent relations on formField", () => {
    const fieldBehavior = createMachineBehavior({
      machine: dummyMachine,
      plugins: [withFormField()],
    });

    expect(fieldBehavior.behaviors).toContain(cuiFormFieldBehavior);
    expect(fieldBehavior.behaviors).toContain("wx://form-field");
    expect(fieldBehavior.relations).toBeDefined();
    expect(fieldBehavior.relations.cuiFormParent).toBeDefined();
    expect(fieldBehavior.relations.cuiFormParent.type).toBe("ancestor");
    expect(fieldBehavior.relations.cuiFormParent.target).toBe(cuiFormParentBehavior);
  });

  it("links child field to parent formBus via relations.linked", () => {
    const parentBehavior = createMachineBehavior({
      machine: dummyMachine,
      plugins: [withFormParent()],
    });
    const fieldBehavior = createMachineBehavior({
      machine: dummyMachine,
      plugins: [withFormField()],
    });

    const mockBus = { emit: vi.fn(), on: vi.fn() };

    // Create parent component instance
    const parentComp: any = {
      id: "form-1",
      data: { id: "form-1" },
      __codeUiFormBus: mockBus,
    };

    // Create child component instance
    const updatePropsSpy = vi.fn();
    const childComp: any = {
      id: "field-1",
      data: { name: "testField" },
      __codeUiMachine: {
        updateProps: updatePropsSpy,
      },
    };

    // Trigger parent linked(child)
    parentBehavior.relations.cuiFormField.linked.call(parentComp, childComp);
    expect(childComp.__codeUiFormBus).toBe(mockBus);
    expect(updatePropsSpy).toHaveBeenCalledWith({ formBus: mockBus });

    // Trigger unlinked(child)
    parentBehavior.relations.cuiFormField.unlinked.call(parentComp, childComp);
    expect(childComp.__codeUiFormBus).toBeUndefined();
    expect(updatePropsSpy).toHaveBeenCalledWith({ formBus: undefined });
  });

  it("respects explicit form prop matching parent ID", () => {
    const parentBehavior = createMachineBehavior({
      machine: dummyMachine,
      plugins: [withFormParent()],
    });

    const mockBus1 = { id: "bus-1" };
    const parentComp: any = {
      id: "target-form",
      data: { id: "target-form" },
      __codeUiFormBus: mockBus1,
    };

    const updatePropsMatch = vi.fn();
    const matchingChild: any = {
      id: "field-match",
      data: { form: "target-form", name: "match" },
      __codeUiMachine: { updateProps: updatePropsMatch },
    };

    const updatePropsOther = vi.fn();
    const otherChild: any = {
      id: "field-other",
      data: { form: "other-form", name: "other" },
      __codeUiMachine: { updateProps: updatePropsOther },
    };

    // Linking matching child succeeds
    parentBehavior.relations.cuiFormField.linked.call(parentComp, matchingChild);
    expect(updatePropsMatch).toHaveBeenCalledWith({ formBus: mockBus1 });

    // Linking other child is ignored
    parentBehavior.relations.cuiFormField.linked.call(parentComp, otherChild);
    expect(updatePropsOther).not.toHaveBeenCalled();
  });

  it("dynamically propagates disabled=false from formFieldWrapper to children during runtime", () => {
    const wrapperBehavior = createMachineBehavior({
      machine: dummyMachine,
      plugins: [withFormFieldWrapper()],
      syncProps: ["disabled", "size"] as any,
    });

    const updatePropsChild = vi.fn();
    const childComp: any = {
      id: "pin-input-1",
      data: { name: "confirmPin" },
      __codeUiMachine: { updateProps: updatePropsChild },
    };

    const wrapperMachineContext = {
      get: vi.fn((key: string) => {
        if (key === "disabled") return true;
        if (key === "formDisabled") return false;
        if (key === "size") return "md";
        return undefined;
      }),
    };

    const wrapperComp: any = {
      id: "field-wrapper-1",
      data: { disabled: true, formField: { disabled: true } },
      __codeUiMachine: {
        service: { context: wrapperMachineContext },
        updateProps: vi.fn(),
      },
    };

    // 1. Link child to wrapper while disabled is true
    wrapperBehavior.relations.cuiFormFieldChild.linked.call(
      wrapperComp,
      childComp,
    );
    expect(updatePropsChild).toHaveBeenCalledWith({
      fieldDisabled: true,
      fieldSize: "md",
    });

    // 2. Runtime toggle: disabled changes from true to false
    // Simulate machine updating context to false
    wrapperMachineContext.get.mockImplementation((key: string) => {
      if (key === "disabled") return false;
      if (key === "formDisabled") return false;
      if (key === "size") return "md";
      return undefined;
    });

    // Note: wrapper.data.formField might still have stale disabled=true before setData flushes
    wrapperComp.data.disabled = false;
    wrapperComp.data.formField.disabled = true; // stale!

    // Trigger wrapper observer for disabled
    wrapperBehavior.observers.disabled.call(wrapperComp, false);

    // Child must receive fieldDisabled: false despite stale wrapper.data.formField!
    expect(updatePropsChild).toHaveBeenLastCalledWith({
      fieldDisabled: false,
      fieldSize: "md",
    });
  });

  describe("createProperties and observer sync", () => {
    it("handles null value in defaultProps as type: null in createProperties", () => {
      const props = createProperties({
        value: null,
        count: 0,
        text: "hello",
        flag: false,
      });

      expect(props.value).toEqual({ type: null, value: null });
      expect(props.count).toEqual({ type: Number, value: 0 });
      expect(props.text).toEqual({ type: String, value: "hello" });
      expect(props.flag).toEqual({ type: Boolean, value: false });
    });

    it("automatically sets up observers for null-defaulted properties like value", () => {
      const testMachine = createMachine({
        props: () => ({ value: null, size: "md" }),
        initialState: () => "idle",
        states: { idle: {} },
      });

      const behavior = createMachineBehavior({
        machine: testMachine,
      });

      expect(behavior.observers).toBeDefined();
      expect(behavior.observers.value).toBeDefined();
      expect(behavior.observers.size).toBeDefined();

      const mockMachine = {
        updateProps: vi.fn(),
      };
      const compInstance = {
        __codeUiMachine: mockMachine,
      };

      behavior.observers.value.call(compInstance, "Antigravity UI");
      expect(mockMachine.updateProps).toHaveBeenCalledWith({
        value: "Antigravity UI",
      });
    });
  });

  describe("createMachineBehavior - domain plugins", () => {
    const dummyMachine = createMachine({
      props: () => ({ value: "" }),
      initialState: () => "idle",
      states: { idle: {} },
    });

    it("configures withRadioGroup and withRadioItem", () => {
      const group = createMachineBehavior({
        machine: dummyMachine,
        plugins: [withRadioGroup()],
      });
      const item = createMachineBehavior({
        machine: dummyMachine,
        plugins: [withRadioItem()],
      });

      expect(group.behaviors).toContain(cuiRadioGroupBehavior);
      expect(group.relations?.cuiRadioChild).toBeDefined();
      expect(item.behaviors).toContain(cuiRadioItemBehavior);
    });

    it("configures withCheckboxGroup and withCheckboxItem", () => {
      const group = createMachineBehavior({
        machine: dummyMachine,
        plugins: [withCheckboxGroup()],
      });
      const item = createMachineBehavior({
        machine: dummyMachine,
        plugins: [withCheckboxItem()],
      });

      expect(group.behaviors).toContain(cuiCheckboxGroupBehavior);
      expect(group.relations?.cuiCheckboxChild).toBeDefined();
      expect(item.behaviors).toContain(cuiCheckboxItemBehavior);
    });

    it("configures withStepper and withStepperItem", () => {
      const stepper = createMachineBehavior({
        machine: dummyMachine,
        plugins: [withStepper()],
      });
      const item = createMachineBehavior({
        machine: dummyMachine,
        plugins: [withStepperItem()],
      });

      expect(stepper.behaviors).toContain(cuiStepperBehavior);
      expect(stepper.relations?.cuiStepperChild).toBeDefined();
      expect(item.behaviors).toContain(cuiStepperItemBehavior);
    });
  });
});
