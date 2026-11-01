import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { formMachine, connectForm } from "@code-ui/form";
import { switchMachine } from "../src/switch.machine";
import { connectSwitch } from "../src/switch.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Switch Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes in unchecked state by default", () => {
      const machine = new MiniappMachine(switchMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("unchecked");
      expect(machine.computed("isChecked")).toBe(false);
      expect(machine.computed("isInteractive")).toBe(true);

      const api = connectSwitch(machine.service);
      expect(api.state).toBe("unchecked");
      expect(api.checked).toBe(false);
      expect(api.isChecked).toBe(false);
      expect(api.isInteractive).toBe(true);
      expect(api.disabled).toBe(false);
      expect(api.readOnly).toBe(false);
      expect(api.loading).toBe(false);
      expect(api.invalid).toBe(false);
      expect(api.size).toBe("md");
      expect(api.color).toBe("primary");
      expect(api.rootProps["data-state"]).toBe("unchecked");
      expect(api.rootProps["data-checked"]).toBe("false");
      expect(api.baseProps["aria-checked"]).toBe(false);
      expect(api.hiddenInputProps.checked).toBe(false);

      machine.stop();
    });

    it("initializes with defaultChecked = true", () => {
      const machine = new MiniappMachine(switchMachine, {
        defaultChecked: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("checked");
      expect(machine.computed("isChecked")).toBe(true);

      const api = connectSwitch(machine.service);
      expect(api.state).toBe("checked");
      expect(api.checked).toBe(true);
      expect(api.baseProps["aria-checked"]).toBe(true);

      machine.stop();
    });

    it("initializes with controlled checked = true", () => {
      const machine = new MiniappMachine(switchMachine, {
        checked: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("checked");
      expect(machine.computed("isChecked")).toBe(true);

      const api = connectSwitch(machine.service);
      expect(api.checked).toBe(true);

      machine.stop();
    });
  });

  describe("Toggling & State Transitions", () => {
    it("toggles state via toggle() and handleTap()", async () => {
      const machine = new MiniappMachine(switchMachine, {});
      machine.start();

      const api = connectSwitch(machine.service);
      expect(api.checked).toBe(false);

      api.toggle();
      await flush();

      expect(machine.state.get()).toBe("checked");
      expect(machine.computed("isChecked")).toBe(true);

      const apiChecked = connectSwitch(machine.service);
      expect(apiChecked.checked).toBe(true);

      apiChecked.handleTap();
      await flush();

      expect(machine.state.get()).toBe("unchecked");
      expect(machine.computed("isChecked")).toBe(false);

      machine.stop();
    });

    it("sets checked programmatically via setChecked()", async () => {
      const machine = new MiniappMachine(switchMachine, {});
      machine.start();

      const api = connectSwitch(machine.service);
      api.setChecked(true);
      await flush();

      expect(machine.state.get()).toBe("checked");
      expect(machine.computed("isChecked")).toBe(true);

      api.setChecked(false);
      await flush();

      expect(machine.state.get()).toBe("unchecked");
      expect(machine.computed("isChecked")).toBe(false);

      machine.stop();
    });

    it("dispatches onChange and component events", async () => {
      const onChange = vi.fn();
      const triggerEvent = vi.fn();
      const setData = vi.fn();

      const machine = new MiniappMachine(switchMachine, {
        onChange,
        component: {
          triggerEvent,
          setData,
        } as any,
      });
      machine.start();

      const api = connectSwitch(machine.service);
      api.toggle();
      await flush();

      expect(onChange).toHaveBeenCalledWith({ checked: true });
      expect(triggerEvent).toHaveBeenCalledWith("change", {
        value: true,
        checked: true,
      });

      machine.stop();
    });
  });

  describe("Controlled Mode", () => {
    it("syncs controlled checked prop updates", async () => {
      const machine = new MiniappMachine(switchMachine, {
        checked: false,
      });
      machine.start();

      expect(machine.state.get()).toBe("unchecked");

      machine.updateProps({ checked: true });
      await flush();

      expect(machine.state.get()).toBe("checked");
      expect(machine.computed("isChecked")).toBe(true);

      machine.updateProps({ checked: false });
      await flush();

      expect(machine.state.get()).toBe("unchecked");
      expect(machine.computed("isChecked")).toBe(false);

      machine.stop();
    });
  });

  describe("Disabled, ReadOnly, and Loading States", () => {
    it("ignores toggle when disabled = true", async () => {
      const machine = new MiniappMachine(switchMachine, {
        disabled: true,
      });
      machine.start();

      const api = connectSwitch(machine.service);
      expect(api.disabled).toBe(true);
      expect(api.isInteractive).toBe(false);

      api.toggle();
      await flush();

      expect(machine.state.get()).toBe("unchecked");
      expect(machine.computed("isChecked")).toBe(false);

      machine.stop();
    });

    it("ignores toggle when readOnly = true", async () => {
      const machine = new MiniappMachine(switchMachine, {
        readOnly: true,
      });
      machine.start();

      const api = connectSwitch(machine.service);
      expect(api.readOnly).toBe(true);
      expect(api.isInteractive).toBe(false);

      api.toggle();
      await flush();

      expect(machine.state.get()).toBe("unchecked");

      machine.stop();
    });

    it("ignores toggle when loading = true", async () => {
      const machine = new MiniappMachine(switchMachine, {
        loading: true,
      });
      machine.start();

      const api = connectSwitch(machine.service);
      expect(api.loading).toBe(true);
      expect(api.isInteractive).toBe(false);

      api.toggle();
      await flush();

      expect(machine.state.get()).toBe("unchecked");

      machine.stop();
    });

    it("respects fieldDisabled and fieldSize from formField wrapper", () => {
      const machine = new MiniappMachine(switchMachine, {
        fieldDisabled: true,
        fieldSize: "lg",
      });
      machine.start();

      const api = connectSwitch(machine.service);
      expect(api.disabled).toBe(true);
      expect(api.size).toBe("lg");
      expect(api.isInteractive).toBe(false);

      machine.stop();
    });
  });

  describe("Resetting Value", () => {
    it("resets back to defaultChecked state", async () => {
      const machine = new MiniappMachine(switchMachine, {
        defaultChecked: true,
      });
      machine.start();

      const api = connectSwitch(machine.service);
      api.toggle();
      await flush();
      expect(machine.state.get()).toBe("unchecked");

      api.resetChecked();
      await flush();
      expect(machine.state.get()).toBe("checked");
      expect(machine.computed("isChecked")).toBe(true);

      machine.stop();
    });
  });

  describe("Form Integration", () => {
    it("binds to form and syncs values, validation, and reset", async () => {
      const formComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn(),
      };
      const switchComp = {
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

      const switchM = new MiniappMachine(switchMachine, {
        name: "agreement",
        defaultChecked: false,
        formBus: bus,
        component: switchComp,
      });
      switchM.start();
      await flush();

      let sApi = connectSwitch(switchM.service);
      expect(sApi.checked).toBe(false);
      expect(sApi.invalid).toBe(false);

      // Validate form -> should fail because agreement is false
      const result = await formApi.validate();
      await flush();

      expect(result.valid).toBe(false);
      sApi = connectSwitch(switchM.service);
      expect(sApi.invalid).toBe(true);

      // User toggles switch -> checked = true
      sApi.toggle();
      await flush();

      const result2 = await formApi.validate();
      await flush();

      expect(result2.valid).toBe(true);
      sApi = connectSwitch(switchM.service);
      expect(sApi.checked).toBe(true);
      expect(sApi.invalid).toBe(false);

      // Reset form
      formApi.reset();
      await flush();

      sApi = connectSwitch(switchM.service);
      expect(sApi.checked).toBe(false);
      expect(sApi.invalid).toBe(false);

      switchM.stop();
      formM.stop();
    });
  });

  describe("DOM Props & Accessibility", () => {
    it("provides accessible ARIA attributes and data attributes", () => {
      const machine = new MiniappMachine(switchMachine, {
        id: "my-switch",
        label: "Enable notifications",
        description: "Receive push notifications",
        name: "notifications",
        value: "yes",
        required: true,
      });
      machine.start();

      const api = connectSwitch(machine.service);
      expect(api.rootProps.id).toBe("switch:my-switch:root");
      expect(api.rootProps["data-scope"]).toBe("switch");
      expect(api.rootProps["data-part"]).toBe("root");
      expect(api.rootProps["data-state"]).toBe("unchecked");
      expect(api.rootProps.role).toBe("group");

      expect(api.baseProps.id).toBe("switch:my-switch:base");
      expect(api.baseProps.role).toBe("switch");
      expect(api.baseProps["aria-checked"]).toBe(false);
      expect(api.baseProps["data-scope"]).toBe("switch");
      expect(api.baseProps["data-part"]).toBe("base");

      expect(api.thumbProps.id).toBe("switch:my-switch:thumb");
      expect(api.thumbProps["data-scope"]).toBe("switch");
      expect(api.thumbProps["data-part"]).toBe("thumb");

      expect(api.labelProps.id).toBe("switch:my-switch:label");
      expect(api.descriptionProps.id).toBe("switch:my-switch:description");

      expect(api.hiddenInputProps.name).toBe("notifications");
      expect(api.hiddenInputProps.value).toBe("yes");
      expect(api.hiddenInputProps.type).toBe("checkbox");
      expect(api.hiddenInputProps.required).toBe(true);

      machine.stop();
    });
  });
});
