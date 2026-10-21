import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { formMachine, connectForm } from "@code-ui/form";
import { radioGroupMachine } from "../src/radio-group.machine";
import { connectRadioGroup } from "../src/radio-group.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("RadioGroup Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes with null value and default props", () => {
      const machine = new MiniappMachine(radioGroupMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("value")).toBe(null);
      expect(machine.computed("isInteractive")).toBe(true);

      const api = connectRadioGroup(machine.service);
      expect(api.value).toBe(null);
      expect(api.isInteractive).toBe(true);
      expect(api.disabled).toBe(false);
      expect(api.readOnly).toBe(false);
      expect(api.invalid).toBe(false);
      expect(api.size).toBe("md");
      expect(api.color).toBe("primary");
      expect(api.orientation).toBe("vertical");
      expect(api.items).toEqual([]);

      machine.stop();
    });

    it("initializes with defaultValue", () => {
      const machine = new MiniappMachine(radioGroupMachine, {
        defaultValue: "apple",
      });
      machine.start();

      expect(machine.context.get("value")).toBe("apple");

      const api = connectRadioGroup(machine.service);
      expect(api.value).toBe("apple");

      machine.stop();
    });

    it("initializes with controlled value", () => {
      const machine = new MiniappMachine(radioGroupMachine, {
        value: "banana",
      });
      machine.start();

      expect(machine.context.get("value")).toBe("banana");

      const api = connectRadioGroup(machine.service);
      expect(api.value).toBe("banana");

      machine.stop();
    });
  });

  describe("Value Changes & Events", () => {
    it("selects a value via send and triggers onChange / onValueChange", async () => {
      const onValueChange = vi.fn();
      const onChange = vi.fn();
      const machine = new MiniappMachine(radioGroupMachine, {
        onValueChange,
        onChange,
      });
      machine.start();

      machine.send({ type: "SET_VALUE", value: "orange" });
      await flush();

      expect(machine.context.get("value")).toBe("orange");
      expect(onValueChange).toHaveBeenCalledWith({ value: "orange" });
      expect(onChange).toHaveBeenCalledWith({ value: "orange" });

      const api = connectRadioGroup(machine.service);
      expect(api.value).toBe("orange");

      machine.stop();
    });

    it("clears value via CLEAR event", async () => {
      const machine = new MiniappMachine(radioGroupMachine, {
        defaultValue: "grape",
      });
      machine.start();

      machine.send({ type: "CLEAR" });
      await flush();
      expect(machine.context.get("value")).toBe(null);

      machine.stop();
    });

    it("cannot change value when disabled or readOnly", async () => {
      const onValueChange = vi.fn();
      const machine = new MiniappMachine(radioGroupMachine, {
        disabled: true,
        defaultValue: "default",
        onValueChange,
      });
      machine.start();

      expect(machine.computed("isInteractive")).toBe(false);
      machine.send({ type: "SET_VALUE", value: "new-val" });
      await flush();

      expect(machine.context.get("value")).toBe("default");
      expect(onValueChange).not.toHaveBeenCalled();

      machine.stop();
    });

    it("updates when controlled value prop changes", async () => {
      const machine = new MiniappMachine(radioGroupMachine, {
        value: "first",
      });
      machine.start();

      expect(machine.context.get("value")).toBe("first");

      machine.updateProps({ value: "second" });
      await flush();

      expect(machine.context.get("value")).toBe("second");

      machine.stop();
    });
  });

  describe("connectRadioGroup and Precomputed Items", () => {
    it("precomputes items with checked, disabled, and attributes for WXML wx:for", async () => {
      const machine = new MiniappMachine(radioGroupMachine, {
        defaultValue: "opt2",
        items: [
          { value: "opt1", label: "Option 1", description: "Desc 1" },
          { value: "opt2", label: "Option 2", description: "Desc 2" },
          { value: "opt3", label: "Option 3", disabled: true },
        ],
      });
      machine.start();

      const api = connectRadioGroup(machine.service);
      expect(api.items).toHaveLength(3);

      expect(api.items[0]).toMatchObject({
        value: "opt1",
        label: "Option 1",
        description: "Desc 1",
        checked: false,
        disabled: false,
      });
      expect(api.items[0]?.controlProps["aria-checked"]).toBe(false);

      expect(api.items[1]).toMatchObject({
        value: "opt2",
        label: "Option 2",
        description: "Desc 2",
        checked: true,
        disabled: false,
      });
      expect(api.items[1]?.controlProps["aria-checked"]).toBe(true);

      expect(api.items[2]).toMatchObject({
        value: "opt3",
        label: "Option 3",
        checked: false,
        disabled: true,
      });
      expect(api.items[2]?.controlProps["aria-disabled"]).toBe("true");

      // API helper methods
      api.setValue("opt1");
      await flush();
      expect(machine.context.get("value")).toBe("opt1");

      api.clear();
      await flush();
      expect(machine.context.get("value")).toBe(null);

      machine.stop();
    });

    it("supports string items in items array", () => {
      const machine = new MiniappMachine(radioGroupMachine, {
        defaultValue: "red",
        items: ["red", "green", "blue"],
      });
      machine.start();

      const api = connectRadioGroup(machine.service);
      expect(api.items[0]?.checked).toBe(true);
      expect(api.items[1]?.checked).toBe(false);
      expect(api.items[2]?.checked).toBe(false);

      machine.stop();
    });

    it("updates item checked state when handleItemTap receives event or dataset", async () => {
      const onChange = vi.fn();
      const machine = new MiniappMachine(radioGroupMachine, {
        defaultValue: "apple",
        onChange,
        items: [
          { value: "apple", label: "Apple" },
          { value: "banana", label: "Banana" },
          { value: "orange", label: "Orange" },
        ],
      });
      machine.start();

      let api = connectRadioGroup(machine.service);
      expect(api.items[0]?.checked).toBe(true);
      expect(api.items[1]?.checked).toBe(false);

      // Tap on banana via dataset
      api.handleItemTap({ currentTarget: { dataset: { value: "banana" } } });
      await flush();

      api = connectRadioGroup(machine.service);
      expect(api.value).toBe("banana");
      expect(api.items[0]?.checked).toBe(false);
      expect(api.items[1]?.checked).toBe(true);
      expect(onChange).toHaveBeenCalledWith({ value: "banana" });

      // Tap on orange via detail.value
      api.handleItemTap({ detail: { value: "orange" } });
      await flush();

      api = connectRadioGroup(machine.service);
      expect(api.value).toBe("orange");
      expect(api.items[1]?.checked).toBe(false);
      expect(api.items[2]?.checked).toBe(true);
      expect(onChange).toHaveBeenCalledWith({ value: "orange" });

      machine.stop();
    });

    it("updates item checked state in controlled mode when value prop updates", async () => {
      const machine = new MiniappMachine(radioGroupMachine, {
        value: "apple",
        items: [
          { value: "apple", label: "Apple" },
          { value: "banana", label: "Banana" },
        ],
      });
      machine.start();

      let api = connectRadioGroup(machine.service);
      expect(api.items[0]?.checked).toBe(true);
      expect(api.items[1]?.checked).toBe(false);

      machine.updateProps({ value: "banana" });
      await flush();

      api = connectRadioGroup(machine.service);
      expect(api.value).toBe("banana");
      expect(api.items[0]?.checked).toBe(false);
      expect(api.items[1]?.checked).toBe(true);

      machine.stop();
    });
  });

  describe("Form Integration", () => {
    it("syncs with formMachine via formBus", async () => {
      const form = new MiniappMachine(formMachine, {
        defaultValues: { role: "admin" },
        rules: {
          role: [
            (val: string) => (val === "admin" ? true : "Role must be admin"),
          ],
        },
      });
      form.start();
      const formApi = connectForm(form.service);

      const radio = new MiniappMachine(radioGroupMachine, {
        name: "role",
        defaultValue: "admin",
        formBus: formApi.bus,
      });
      radio.start();
      await flush();

      expect(radio.context.get("value")).toBe("admin");

      // Validate passes
      const res1 = await formApi.validate();
      expect(res1.valid).toBe(true);

      // Change radio value to user
      const radioApi = connectRadioGroup(radio.service);
      radioApi.setValue("user");
      await flush();

      expect(form.context.get("values")).toMatchObject({ role: "user" });

      // Validate fails now
      const res2 = await formApi.validate();
      expect(res2.valid).toBe(false);

      // Form reset resets radio value
      formApi.reset();
      await flush();
      expect(radio.context.get("value")).toBe("admin");

      radio.stop();
      form.stop();
    });
  });
});
