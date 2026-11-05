import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { formMachine, connectForm } from "@code-ui/form";
import { inputMachine } from "../src/input.machine";
import { connectInput } from "../src/input.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Input Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes with default props (empty value, idle state)", () => {
      const machine = new MiniappMachine(inputMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("value")).toBe("");
      expect(machine.computed("isEmpty")).toBe(true);
      expect(machine.computed("isFilled")).toBe(false);
      expect(machine.computed("isClearable")).toBe(false);

      const api = connectInput(machine.service);
      expect(api.state).toBe("idle");
      expect(api.value).toBe("");
      expect(api.isEmpty).toBe(true);
      expect(api.isFilled).toBe(false);
      expect(api.isClearable).toBe(false);
      expect(api.disabled).toBe(false);
      expect(api.readOnly).toBe(false);
      expect(api.invalid).toBe(false);
      expect(api.size).toBe("md");
      expect(api.rootProps["data-state"]).toBe("idle");
      expect(api.rootProps["data-disabled"]).toBe("false");
      expect(api.inputProps["data-focused"]).toBe("false");

      machine.stop();
    });

    it("initializes with custom defaultValue", () => {
      const machine = new MiniappMachine(inputMachine, {
        defaultValue: "Hello World",
      });
      machine.start();

      expect(machine.context.get("value")).toBe("Hello World");
      expect(machine.computed("isFilled")).toBe(true);

      const api = connectInput(machine.service);
      expect(api.value).toBe("Hello World");
      expect(api.isFilled).toBe(true);

      machine.stop();
    });

    it("initializes in focused state when autoFocus is true", () => {
      const machine = new MiniappMachine(inputMachine, {
        autoFocus: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("focused");

      const api = connectInput(machine.service);
      expect(api.state).toBe("focused");
      expect(api.inputProps["data-focused"]).toBe("true");
      expect(api.inputProps.focus).toBe(true);

      machine.stop();
    });
  });

  describe("Controlled Value", () => {
    it("syncs value prop updates to machine context", async () => {
      const machine = new MiniappMachine(inputMachine, {
        value: "Initial",
      });
      machine.start();

      let api = connectInput(machine.service);
      expect(api.value).toBe("Initial");

      machine.updateProps({ value: "Updated" });
      await flush();

      api = connectInput(machine.service);
      expect(api.value).toBe("Updated");
      expect(machine.context.get("value")).toBe("Updated");

      machine.stop();
    });
  });

  describe("User Input & Event Handlers", () => {
    it("handles input change, fires change event and onChange", async () => {
      const onChange = vi.fn();
      const triggerEvent = vi.fn();
      const machine = new MiniappMachine(inputMachine, {
        onChange,
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      const api = connectInput(machine.service);
      const returnedVal = api.handleInput({
        detail: { value: "test@example.com" },
      });
      await flush();

      expect(returnedVal).toBe("test@example.com");
      expect(machine.context.get("value")).toBe("test@example.com");
      expect(onChange).toHaveBeenCalledWith({ value: "test@example.com" });
      expect(triggerEvent).toHaveBeenCalledWith("change", {
        value: "test@example.com",
      });

      machine.stop();
    });

    it("transitions between idle and focused on focus and blur", async () => {
      const triggerEvent = vi.fn();
      const machine = new MiniappMachine(inputMachine, {
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      let api = connectInput(machine.service);
      expect(api.state).toBe("idle");

      api.handleFocus({});
      await flush();

      api = connectInput(machine.service);
      expect(api.state).toBe("focused");
      expect(triggerEvent).toHaveBeenCalledWith("focus", { value: "" });

      api.handleBlur({});
      await flush();

      api = connectInput(machine.service);
      expect(api.state).toBe("idle");
      expect(triggerEvent).toHaveBeenCalledWith("blur", { value: "" });

      machine.stop();
    });

    it("handles confirm event", async () => {
      const triggerEvent = vi.fn();
      const machine = new MiniappMachine(inputMachine, {
        defaultValue: "search term",
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      const api = connectInput(machine.service);
      api.handleConfirm({ detail: { value: "search term" } });
      await flush();

      expect(triggerEvent).toHaveBeenCalledWith("confirm", {
        value: "search term",
      });

      machine.stop();
    });
  });

  describe("Clearable Support", () => {
    it("computes isClearable correctly and clears value on clear button tap", async () => {
      const triggerEvent = vi.fn();
      const machine = new MiniappMachine(inputMachine, {
        clearable: true,
        defaultValue: "clear me",
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      let api = connectInput(machine.service);
      expect(api.isClearable).toBe(true);

      api.handleClear();
      await flush();

      api = connectInput(machine.service);
      expect(api.value).toBe("");
      expect(api.isClearable).toBe(false);
      expect(triggerEvent).toHaveBeenCalledWith("clear", {});

      machine.stop();
    });

    it("does not allow clear if disabled or readOnly", async () => {
      const machine = new MiniappMachine(inputMachine, {
        clearable: true,
        defaultValue: "text",
        disabled: true,
      });
      machine.start();

      const api = connectInput(machine.service);
      expect(api.isClearable).toBe(false);

      machine.stop();
    });
  });

  describe("Programmatic API Controls", () => {
    it("setValue, clearValue, and resetValue via API", async () => {
      const machine = new MiniappMachine(inputMachine, {
        defaultValue: "default",
      });
      machine.start();

      const api = connectInput(machine.service);
      api.setValue("programmatic value");
      await flush();

      expect(machine.context.get("value")).toBe("programmatic value");

      api.clearValue();
      await flush();
      expect(machine.context.get("value")).toBe("");

      api.resetValue();
      await flush();
      expect(machine.context.get("value")).toBe("default");

      machine.stop();
    });

    it("focus() and blur() programmatically", async () => {
      const machine = new MiniappMachine(inputMachine, {});
      machine.start();

      const api = connectInput(machine.service);
      expect(api.state).toBe("idle");

      api.focus();
      await flush();
      expect(machine.state.get()).toBe("focused");

      api.blur();
      await flush();
      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });
  });

  describe("Disabled & ReadOnly State", () => {
    it("blocks input when disabled is true", async () => {
      const machine = new MiniappMachine(inputMachine, {
        defaultValue: "untouchable",
        disabled: true,
      });
      machine.start();

      machine.send({ type: "INPUT.CHANGE", value: "new value" });
      await flush();

      expect(machine.context.get("value")).toBe("untouchable");

      const api = connectInput(machine.service);
      expect(api.disabled).toBe(true);
      expect(api.rootProps["data-disabled"]).toBe("true");
      expect(api.inputProps.disabled).toBe(true);

      machine.stop();
    });

    it("blocks input when readOnly is true", async () => {
      const machine = new MiniappMachine(inputMachine, {
        defaultValue: "read-only text",
        readOnly: true,
      });
      machine.start();

      machine.send({ type: "INPUT.CHANGE", value: "new value" });
      await flush();

      expect(machine.context.get("value")).toBe("read-only text");

      const api = connectInput(machine.service);
      expect(api.readOnly).toBe(true);
      expect(api.rootProps["data-readonly"]).toBe("true");
      expect(api.inputProps.disabled).toBe(true);

      machine.stop();
    });
  });

  describe("Form & FormField Connection", () => {
    it("registers with the form host and notifies input/change", async () => {
      const form = new MiniappMachine(formMachine, {});
      form.start();
      const host = connectForm(form.service).formContext;
      const register = vi.spyOn(host, "register");
      const notify = vi.spyOn(host, "notify");
      const machine = new MiniappMachine(inputMachine, {
        name: "email",
        formContext: host,
      });
      machine.start();
      await flush();
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ name: "email" }),
      );
      connectInput(machine.service).handleInput({
        detail: { value: "updated" },
      });
      await flush();
      expect(notify).toHaveBeenCalledWith(
        "input",
        expect.objectContaining({ name: "email", value: "updated" }),
      );
      expect(notify).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({ name: "email", value: "updated" }),
      );
      machine.stop();
      form.stop();
    });

    it("notifies the form host on focus and blur", async () => {
      const form = new MiniappMachine(formMachine, {});
      form.start();
      const host = connectForm(form.service).formContext;
      const notify = vi.spyOn(host, "notify");
      const machine = new MiniappMachine(inputMachine, {
        name: "email",
        formContext: host,
      });
      machine.start();
      connectInput(machine.service).handleFocus({});
      await flush();
      connectInput(machine.service).handleBlur({});
      await flush();
      expect(notify).toHaveBeenCalledWith(
        "focus",
        expect.objectContaining({ name: "email" }),
      );
      expect(notify).toHaveBeenCalledWith(
        "blur",
        expect.objectContaining({ name: "email" }),
      );
      machine.stop();
      form.stop();
    });

    it("derives wrapper disabled and size from the form host", async () => {
      const form = new MiniappMachine(formMachine, {});
      form.start();
      const host = connectForm(form.service).formContext;
      const machine = new MiniappMachine(inputMachine, {
        name: "email",
        formContext: host,
      });
      machine.start();
      await flush();
      host.setFieldState("email", { disabled: true, size: "sm" });
      await flush();
      expect(connectInput(machine.service).disabled).toBe(true);
      expect(connectInput(machine.service).size).toBe("sm");
      host.setFieldState("email", { disabled: false, size: "lg" });
      await flush();
      expect(connectInput(machine.service).disabled).toBe(false);
      expect(connectInput(machine.service).size).toBe("lg");
      machine.stop();
      form.stop();
    });

    it("derives disabled and readOnly from the reactive form host", async () => {
      const form = new MiniappMachine(formMachine, {});
      form.start();
      const host = connectForm(form.service).formContext;
      const machine = new MiniappMachine(inputMachine, {
        name: "email",
        formContext: host,
      });
      machine.start();
      form.updateProps({ disabled: true, readOnly: true });
      await flush();
      expect(connectInput(machine.service).disabled).toBe(true);
      expect(connectInput(machine.service).readOnly).toBe(true);
      form.updateProps({ disabled: false, readOnly: false });
      await flush();
      expect(connectInput(machine.service).disabled).toBe(false);
      expect(connectInput(machine.service).readOnly).toBe(false);
      machine.stop();
      form.stop();
    });

    it("integrates with formMachine: validation error sets invalid=true, reset restores initial value", async () => {
      const formComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn(),
      };
      const inputComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn(),
        selectOwnerComponent: () => formComp,
      };

      const formM = new MiniappMachine(formMachine, {
        component: formComp,
        rules: {
          email: [
            (val: string) =>
              val && val.includes("@") ? true : "Invalid email",
          ],
        },
      });
      formM.start();

      const formApi = connectForm(formM.service);
      const host = formApi.formContext;

      const inputM = new MiniappMachine(inputMachine, {
        name: "email",
        defaultValue: "initial_text",
        formContext: host,
        component: inputComp,
      });
      inputM.start();

      let inputApi = connectInput(inputM.service);
      expect(inputApi.value).toBe("initial_text");
      expect(inputApi.invalid).toBe(false);

      // Validate form
      const result = await formApi.validate();
      await flush();

      expect(result.valid).toBe(false);
      inputApi = connectInput(inputM.service);
      expect(inputApi.invalid).toBe(true);

      // Now set a valid value
      inputApi.handleInput({ detail: { value: "test@domain.com" } });
      await flush();

      const result2 = await formApi.validate();
      await flush();

      expect(result2.valid).toBe(true);
      inputApi = connectInput(inputM.service);
      expect(inputApi.invalid).toBe(false);

      // Reset form
      formApi.reset();
      await flush();

      inputApi = connectInput(inputM.service);
      expect(inputApi.value).toBe("initial_text");
      expect(inputApi.invalid).toBe(false);

      inputM.stop();
      formM.stop();
    });

    it("renders hiddenInputProps for native MiniProgram form submit", () => {
      const machine = new MiniappMachine(inputMachine, {
        id: "inp-1",
        name: "username",
        defaultValue: "alice",
      });
      machine.start();

      const api = connectInput(machine.service);
      expect(api.inputProps.name).toBe("username");
      expect(api.hiddenInputProps).toEqual({
        id: "input:inp-1:hidden-input",
        type: "text",
        tabIndex: -1,
        name: "username",
        value: "alice",
        disabled: false,
        "aria-hidden": "true",
      });

      machine.stop();
    });

    it("syncs state when controlled value prop is dynamically updated via updateProps", async () => {
      const machine = new MiniappMachine(inputMachine, {
        value: "Initial Value",
      });
      machine.start();

      let api = connectInput(machine.service);
      expect(api.value).toBe("Initial Value");
      expect(api.inputProps.value).toBe("Initial Value");

      // Parent programmatically updates value to "Antigravity UI"
      machine.updateProps({ value: "Antigravity UI" });
      await flush();

      api = connectInput(machine.service);
      expect(api.value).toBe("Antigravity UI");
      expect(api.inputProps.value).toBe("Antigravity UI");
      expect(machine.context.get("value")).toBe("Antigravity UI");

      // Parent programmatically clears value
      machine.updateProps({ value: "" });
      await flush();

      api = connectInput(machine.service);
      expect(api.value).toBe("");
      expect(api.inputProps.value).toBe("");
      expect(machine.context.get("value")).toBe("");

      machine.stop();
    });
  });
});
