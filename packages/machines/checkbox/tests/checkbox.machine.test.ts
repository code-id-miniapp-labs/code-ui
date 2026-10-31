import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { formMachine, connectForm } from "@code-ui/form";
import { checkboxMachine } from "../src/checkbox.machine";
import { connectCheckbox } from "../src/checkbox.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Checkbox Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes in unchecked state by default", () => {
      const machine = new MiniappMachine(checkboxMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("unchecked");
      expect(machine.computed("isChecked")).toBe(false);
      expect(machine.computed("isIndeterminate")).toBe(false);
      expect(machine.computed("isInteractive")).toBe(true);

      const api = connectCheckbox(machine.service);
      expect(api.state).toBe("unchecked");
      expect(api.checked).toBe(false);
      expect(api.isChecked).toBe(false);
      expect(api.indeterminate).toBe(false);
      expect(api.isIndeterminate).toBe(false);
      expect(api.isInteractive).toBe(true);
      expect(api.disabled).toBe(false);
      expect(api.readOnly).toBe(false);
      expect(api.invalid).toBe(false);
      expect(api.size).toBe("md");
      expect(api.color).toBe("primary");
      expect(api.icon).toBe("check");
      expect(api.indeterminateIcon).toBe("minus");
      expect(api.rootProps["data-state"]).toBe("unchecked");
      expect(api.rootProps["data-checked"]).toBe("false");
      expect(api.baseProps["aria-checked"]).toBe(false);
      expect(api.hiddenInputProps.checked).toBe(false);

      machine.stop();
    });

    it("initializes with defaultChecked = true", () => {
      const machine = new MiniappMachine(checkboxMachine, {
        defaultChecked: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("checked");
      expect(machine.computed("isChecked")).toBe(true);
      expect(machine.computed("isChecked")).toBe(true);

      const api = connectCheckbox(machine.service);
      expect(api.state).toBe("checked");
      expect(api.checked).toBe(true);
      expect(api.baseProps["aria-checked"]).toBe(true);
      expect(api.baseProps["data-state"]).toBe("checked");

      machine.stop();
    });

    it("initializes with indeterminate = true", () => {
      const machine = new MiniappMachine(checkboxMachine, {
        indeterminate: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("indeterminate");
      expect(machine.computed("isIndeterminate")).toBe(true);
      expect(machine.computed("isIndeterminate")).toBe(true);

      const api = connectCheckbox(machine.service);
      expect(api.state).toBe("indeterminate");
      expect(api.indeterminate).toBe(true);
      expect(api.baseProps["aria-checked"]).toBe("mixed");
      expect(api.baseProps["data-state"]).toBe("indeterminate");

      machine.stop();
    });
  });

  describe("Toggling & State Transitions", () => {
    it("toggles state via toggle() and handleTap()", async () => {
      const machine = new MiniappMachine(checkboxMachine, {});
      machine.start();

      const api = connectCheckbox(machine.service);
      expect(api.checked).toBe(false);

      api.toggle();
      await flush();
      expect(connectCheckbox(machine.service).checked).toBe(true);
      expect(machine.state.get()).toBe("checked");

      api.handleTap();
      await flush();
      expect(connectCheckbox(machine.service).checked).toBe(false);
      expect(machine.state.get()).toBe("unchecked");

      machine.stop();
    });

    it("toggles state when initialized with defaultChecked = true", async () => {
      const machine = new MiniappMachine(checkboxMachine, {
        defaultChecked: true,
      });
      machine.start();

      let api = connectCheckbox(machine.service);
      expect(api.checked).toBe(true);
      expect(machine.state.get()).toBe("checked");

      // First toggle: checked -> unchecked
      api.handleTap();
      await flush();
      api = connectCheckbox(machine.service);
      expect(api.checked).toBe(false);
      expect(machine.state.get()).toBe("unchecked");

      // Second toggle: unchecked -> checked
      api.handleTap();
      await flush();
      api = connectCheckbox(machine.service);
      expect(api.checked).toBe(true);
      expect(machine.state.get()).toBe("checked");

      // Third toggle: checked -> unchecked
      api.toggle();
      await flush();
      api = connectCheckbox(machine.service);
      expect(api.checked).toBe(false);
      expect(machine.state.get()).toBe("unchecked");

      machine.stop();
    });

    it("supports WXML boolean attributes for defaultChecked (empty string and string boolean)", async () => {
      // Empty string attribute (e.g. <c-checkbox defaultChecked />)
      const machineEmpty = new MiniappMachine(checkboxMachine, {
        defaultChecked: "",
      });
      machineEmpty.start();

      const apiEmpty = connectCheckbox(machineEmpty.service);
      expect(apiEmpty.checked).toBe(true);
      expect(machineEmpty.state.get()).toBe("checked");

      apiEmpty.handleTap();
      await flush();
      expect(connectCheckbox(machineEmpty.service).checked).toBe(false);
      expect(machineEmpty.state.get()).toBe("unchecked");

      machineEmpty.stop();

      // String boolean (e.g. defaultChecked="true")
      const machineString = new MiniappMachine(checkboxMachine, {
        defaultChecked: "true",
      });
      machineString.start();

      const apiString = connectCheckbox(machineString.service);
      expect(apiString.checked).toBe(true);
      expect(machineString.state.get()).toBe("checked");

      apiString.handleTap();
      await flush();
      expect(connectCheckbox(machineString.service).checked).toBe(false);
      expect(machineString.state.get()).toBe("unchecked");

      machineString.stop();
    });

    it("toggles repeatedly without falling into false controlled lock when component observer runs", async () => {
      const comp = {
        data: { defaultChecked: true, checked: null },
        setData(d: any) {
          Object.assign(this.data, d);
          if (d.checked !== undefined) {
            machine.updateProps({ checked: d.checked });
          }
        },
        triggerEvent: vi.fn(),
      };

      const machine = new MiniappMachine(checkboxMachine, {
        component: comp,
        defaultChecked: true,
        checked: null,
      });
      machine.start();

      let api = connectCheckbox(machine.service);
      expect(api.checked).toBe(true);

      // Tap 1 -> unchecked
      api.handleTap();
      await flush();
      api = connectCheckbox(machine.service);
      expect(api.checked).toBe(false);
      expect(machine.state.get()).toBe("unchecked");

      // Tap 2 -> checked
      api.handleTap();
      await flush();
      api = connectCheckbox(machine.service);
      expect(api.checked).toBe(true);
      expect(machine.state.get()).toBe("checked");

      // Tap 3 -> unchecked
      api.handleTap();
      await flush();
      api = connectCheckbox(machine.service);
      expect(api.checked).toBe(false);
      expect(machine.state.get()).toBe("unchecked");

      machine.stop();
    });

    it("transitions from indeterminate to checked when toggled", async () => {
      const machine = new MiniappMachine(checkboxMachine, {
        defaultIndeterminate: true,
      });
      machine.start();

      const api = connectCheckbox(machine.service);
      expect(api.state).toBe("indeterminate");

      api.toggle();
      await flush();

      const updated = connectCheckbox(machine.service);
      expect(updated.state).toBe("checked");
      expect(updated.checked).toBe(true);
      expect(updated.indeterminate).toBe(false);

      machine.stop();
    });

    it("programmatically sets checked and indeterminate", async () => {
      const machine = new MiniappMachine(checkboxMachine, {});
      machine.start();

      const api = connectCheckbox(machine.service);
      api.setChecked(true);
      await flush();
      expect(connectCheckbox(machine.service).checked).toBe(true);

      api.setIndeterminate(true);
      await flush();
      expect(connectCheckbox(machine.service).indeterminate).toBe(true);
      expect(machine.state.get()).toBe("indeterminate");

      machine.stop();
    });

    it("restores checked state when indeterminate clears", async () => {
      const machine = new MiniappMachine(checkboxMachine, {
        defaultChecked: true,
      });
      machine.start();

      const api = connectCheckbox(machine.service);
      api.setIndeterminate(true);
      await flush();
      expect(machine.state.get()).toBe("indeterminate");

      api.setIndeterminate(false);
      await flush();
      expect(machine.state.get()).toBe("checked");

      machine.stop();
    });

    it("does not toggle when disabled", async () => {
      const machine = new MiniappMachine(checkboxMachine, {
        disabled: true,
      });
      machine.start();

      const api = connectCheckbox(machine.service);
      expect(api.isInteractive).toBe(false);

      api.toggle();
      await flush();
      expect(connectCheckbox(machine.service).checked).toBe(false);

      machine.stop();
    });

    it("does not toggle when readOnly", async () => {
      const machine = new MiniappMachine(checkboxMachine, {
        readOnly: true,
      });
      machine.start();

      const api = connectCheckbox(machine.service);
      expect(api.isInteractive).toBe(false);

      api.toggle();
      await flush();
      expect(connectCheckbox(machine.service).checked).toBe(false);

      machine.stop();
    });
  });

  describe("Callbacks & Events", () => {
    it("calls onCheckedChange and onChange on toggle", async () => {
      const onCheckedChange = vi.fn();
      const onChange = vi.fn();

      const machine = new MiniappMachine(checkboxMachine, {
        onCheckedChange,
        onChange,
      });
      machine.start();

      const api = connectCheckbox(machine.service);
      api.toggle();
      await flush();

      expect(onCheckedChange).toHaveBeenCalledWith({ value: true, checked: true });
      expect(onChange).toHaveBeenCalledWith({ value: true, checked: true });

      machine.stop();
    });

    it("calls onChange with custom value when value prop is passed", async () => {
      const onChange = vi.fn();
      const component = { triggerEvent: vi.fn(), setData: vi.fn() };

      const machine = new MiniappMachine(checkboxMachine, {
        value: "apple",
        onChange,
        component,
      });
      machine.start();

      const api = connectCheckbox(machine.service);
      api.toggle();
      await flush();

      expect(onChange).toHaveBeenCalledWith({ value: "apple", checked: true });
      expect(component.triggerEvent).toHaveBeenCalledWith("change", {
        value: "apple",
        checked: true,
      });

      machine.stop();
    });

    it("resets value via resetChecked()", async () => {
      const machine = new MiniappMachine(checkboxMachine, {
        defaultChecked: true,
      });
      machine.start();

      const api = connectCheckbox(machine.service);
      api.toggle();
      await flush();
      expect(connectCheckbox(machine.service).checked).toBe(false);

      api.resetChecked();
      await flush();
      expect(connectCheckbox(machine.service).checked).toBe(true);

      machine.stop();
    });

    it("handles controlled checked mode without premature state mutation", async () => {
      const onChange = vi.fn();
      const onCheckedChange = vi.fn();
      const component = { triggerEvent: vi.fn(), setData: vi.fn() };

      const machine = new MiniappMachine(checkboxMachine, {
        checked: false,
        value: "terms",
        onChange,
        onCheckedChange,
        component,
      });
      machine.start();

      let api = connectCheckbox(machine.service);
      expect(api.checked).toBe(false);
      expect(api.state).toBe("unchecked");

      // User taps controlled checkbox:
      api.handleTap();
      await flush();

      // Should emit change event requesting checked = true
      expect(onChange).toHaveBeenCalledWith({ value: "terms", checked: true });
      expect(onCheckedChange).toHaveBeenCalledWith({ value: "terms", checked: true });
      expect(component.triggerEvent).toHaveBeenCalledWith("change", {
        value: "terms",
        checked: true,
      });

      // But state and api.checked remain unchanged because prop has not changed!
      api = connectCheckbox(machine.service);
      expect(api.checked).toBe(false);
      expect(api.state).toBe("unchecked");

      // Parent accepts change and passes new prop checked: true
      machine.updateProps({ checked: true });
      await flush();

      api = connectCheckbox(machine.service);
      expect(api.checked).toBe(true);
      expect(api.state).toBe("checked");

      // User taps again:
      api.handleTap();
      await flush();

      expect(onChange).toHaveBeenCalledWith({ value: "terms", checked: false });
      expect(api.checked).toBe(true);
      expect(api.state).toBe("checked");

      // Parent updates prop to checked: false
      machine.updateProps({ checked: false });
      await flush();

      api = connectCheckbox(machine.service);
      expect(api.checked).toBe(false);
      expect(api.state).toBe("unchecked");

      machine.stop();
    });

    it("syncs controlled indeterminate props through updateProps", async () => {
      const machine = new MiniappMachine(checkboxMachine, {
        checked: false,
        indeterminate: false,
      });
      machine.start();

      machine.updateProps({ indeterminate: true });
      await flush();

      expect(machine.computed("isIndeterminate")).toBe(true);
      expect(machine.state.get()).toBe("indeterminate");

      machine.updateProps({ indeterminate: false, checked: true });
      await flush();

      expect(machine.computed("isIndeterminate")).toBe(false);
      expect(machine.computed("isChecked")).toBe(true);
      expect(machine.state.get()).toBe("checked");

      machine.stop();
    });
  });

  describe("Form Integration", () => {
    it("synchronizes with Form bus", async () => {
      const formComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn(),
      };
      const checkboxComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn(),
        selectOwnerComponent: () => formComp,
      };

      const formM = new MiniappMachine(formMachine, {
        component: formComp,
        rules: {
          agreement: [
            (val: boolean) => (val === true ? true : "Must agree to terms"),
          ],
        },
      });
      formM.start();

      const formApi = connectForm(formM.service);
      const bus = formApi.bus;

      const checkboxM = new MiniappMachine(checkboxMachine, {
        name: "agreement",
        defaultChecked: false,
        formBus: bus,
        component: checkboxComp,
      });
      checkboxM.start();
      await flush();

      let cApi = connectCheckbox(checkboxM.service);
      expect(cApi.checked).toBe(false);
      expect(cApi.invalid).toBe(false);

      // Validate form -> should fail because agreement is false
      const result = await formApi.validate();
      await flush();

      expect(result.valid).toBe(false);
      cApi = connectCheckbox(checkboxM.service);
      expect(cApi.invalid).toBe(true);

      // User toggles checkbox -> checked = true
      cApi.toggle();
      await flush();

      const revalidated = await formApi.validate();
      expect(revalidated.valid).toBe(true);

      checkboxM.stop();
      formM.stop();
    });

    it("validates controlled checkbox accurately when toggled with form-field rules", async () => {
      let formAgreement = false;
      const formComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn(),
      };

      const formM = new MiniappMachine(formMachine, {
        component: formComp,
      });
      formM.start();

      const formApi = connectForm(formM.service);
      const bus = formApi.bus;

      // Simulate c-form-field registering required rule for "agreement"
      const serializedRules = JSON.parse(
        JSON.stringify([
          {
            required: true,
            message: "You must accept the terms of service to proceed",
          },
        ]),
      );
      bus?.emit("field:rules", {
        name: "agreement",
        getRules: () => serializedRules,
        required: true,
      });

      const checkboxComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn((eventName: string, detail: any) => {
          if (eventName === "change") {
            formAgreement = Boolean(detail.checked);
            checkboxM.updateProps({ checked: formAgreement });
          }
        }),
        selectOwnerComponent: () => formComp,
      };

      const checkboxM = new MiniappMachine(checkboxMachine, {
        name: "agreement",
        checked: formAgreement,
        formBus: bus,
        component: checkboxComp,
      });
      checkboxM.start();
      await flush();

      let cApi = connectCheckbox(checkboxM.service);
      expect(cApi.checked).toBe(false);
      expect(cApi.invalid).toBe(false);

      // 1. User taps checkbox to check it (false -> true)
      cApi.handleTap();
      await flush();

      cApi = connectCheckbox(checkboxM.service);
      expect(formAgreement).toBe(true);
      expect(cApi.checked).toBe(true);
      expect(cApi.invalid).toBe(false);
      expect( connectForm(formM.service).isValid).toBe(true);
      expect(connectForm(formM.service).errorBag).toEqual({});

      // 2. User taps checkbox to uncheck it (true -> false)
      cApi.handleTap();
      await flush();

      cApi = connectCheckbox(checkboxM.service);
      expect(formAgreement).toBe(false);
      expect(cApi.checked).toBe(false);
      expect(cApi.invalid).toBe(true);
      expect(connectForm(formM.service).isValid).toBe(false);
      expect(connectForm(formM.service).errorBag).toEqual({
        agreement: ["You must accept the terms of service to proceed"],
      });

      // 3. User taps checkbox to check it again (false -> true) -> error clears immediately
      cApi.handleTap();
      await flush();

      cApi = connectCheckbox(checkboxM.service);
      expect(formAgreement).toBe(true);
      expect(cApi.checked).toBe(true);
      expect(cApi.invalid).toBe(false);
      expect(connectForm(formM.service).isValid).toBe(true);
      expect(connectForm(formM.service).errorBag).toEqual({});

      checkboxM.stop();
      formM.stop();
    });
  });
});
