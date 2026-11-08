import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { formMachine, connectForm } from "@code-ui/form";
import { textareaMachine } from "../src/textarea.machine";
import { connectTextarea } from "../src/textarea.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Textarea Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes with default props (empty value, idle state)", () => {
      const machine = new MiniappMachine(textareaMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("value")).toBe("");
      expect(machine.computed("isEmpty")).toBe(true);
      expect(machine.computed("isFilled")).toBe(false);
      expect(machine.computed("isClearable")).toBe(false);
      expect(machine.computed("characterCount")).toBe(0);

      const api = connectTextarea(machine.service);
      expect(api.state).toBe("idle");
      expect(api.value).toBe("");
      expect(api.isEmpty).toBe(true);
      expect(api.isFilled).toBe(false);
      expect(api.isClearable).toBe(false);
      expect(api.characterCount).toBe(0);
      expect(api.disabled).toBe(false);
      expect(api.readOnly).toBe(false);
      expect(api.invalid).toBe(false);
      expect(api.size).toBe("md");
      expect(api.rootProps["data-state"]).toBe("idle");
      expect(api.rootProps["data-disabled"]).toBe("false");
      expect(api.textareaProps["data-focused"]).toBe("false");
      expect(api.inputProps["data-focused"]).toBe("false");
      expect(api.textareaProps["aria-multiline"]).toBe(true);

      machine.stop();
    });

    it("initializes with custom defaultValue and tracks characterCount", () => {
      const machine = new MiniappMachine(textareaMachine, {
        defaultValue: "Hello Textarea",
      });
      machine.start();

      expect(machine.context.get("value")).toBe("Hello Textarea");
      expect(machine.computed("isFilled")).toBe(true);
      expect(machine.computed("characterCount")).toBe(14);

      const api = connectTextarea(machine.service);
      expect(api.value).toBe("Hello Textarea");
      expect(api.characterCount).toBe(14);
      expect(api.isFilled).toBe(true);

      machine.stop();
    });

    it("initializes in focused state when autoFocus is true", () => {
      const machine = new MiniappMachine(textareaMachine, {
        autoFocus: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("focused");

      const api = connectTextarea(machine.service);
      expect(api.state).toBe("focused");
      expect(api.textareaProps["data-focused"]).toBe("true");
      expect(api.textareaProps.focus).toBe(true);

      machine.stop();
    });
  });

  describe("Controlled Value", () => {
    it("syncs value prop updates to machine context", async () => {
      const machine = new MiniappMachine(textareaMachine, {
        value: "Initial content",
      });
      machine.start();

      let api = connectTextarea(machine.service);
      expect(api.value).toBe("Initial content");
      expect(api.characterCount).toBe(15);

      machine.updateProps({ value: "Updated content" });
      await flush();

      api = connectTextarea(machine.service);
      expect(api.value).toBe("Updated content");
      expect(api.characterCount).toBe(15);
      expect(machine.context.get("value")).toBe("Updated content");

      machine.stop();
    });
  });

  describe("User Input & Event Handlers", () => {
    it("handles input change, fires change event and onChange", async () => {
      const onChange = vi.fn();
      const triggerEvent = vi.fn();
      const machine = new MiniappMachine(textareaMachine, {
        onChange,
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      const api = connectTextarea(machine.service);
      const returnedVal = api.handleInput({
        detail: { value: "Line 1\nLine 2" },
      });
      await flush();

      expect(returnedVal).toBe("Line 1\nLine 2");
      expect(machine.context.get("value")).toBe("Line 1\nLine 2");
      expect(machine.computed("characterCount")).toBe(13);
      expect(onChange).toHaveBeenCalledWith({ value: "Line 1\nLine 2" });
      expect(triggerEvent).toHaveBeenCalledWith("change", {
        value: "Line 1\nLine 2",
      });

      machine.stop();
    });

    it("transitions between idle and focused on focus and blur", async () => {
      const triggerEvent = vi.fn();
      const machine = new MiniappMachine(textareaMachine, {
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      let api = connectTextarea(machine.service);
      expect(api.state).toBe("idle");

      api.handleFocus({});
      await flush();

      api = connectTextarea(machine.service);
      expect(api.state).toBe("focused");
      expect(triggerEvent).toHaveBeenCalledWith("focus", { value: "" });

      api.handleBlur({});
      await flush();

      api = connectTextarea(machine.service);
      expect(api.state).toBe("idle");
      expect(triggerEvent).toHaveBeenCalledWith("blur", { value: "" });

      machine.stop();
    });

    it("handles confirm event", async () => {
      const triggerEvent = vi.fn();
      const machine = new MiniappMachine(textareaMachine, {
        defaultValue: "multi\nline",
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      const api = connectTextarea(machine.service);
      api.handleConfirm({ detail: { value: "multi\nline" } });
      await flush();

      expect(triggerEvent).toHaveBeenCalledWith("confirm", {
        value: "multi\nline",
      });

      machine.stop();
    });

    it("handles linechange event and normalizes subpixel lineCount", async () => {
      const triggerEvent = vi.fn();
      const onLineChange = vi.fn();
      const machine = new MiniappMachine(textareaMachine, {
        onLineChange,
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      const api = connectTextarea(machine.service);

      // WeChat subpixel bug case: empty textarea reporting height: 23, lineHeight: 22.8571, lineCount: 2
      api.handleLineChange({
        detail: { height: 23, lineCount: 2, lineHeight: 22.8571 },
      });
      await flush();

      expect(triggerEvent).toHaveBeenCalledWith("linechange", {
        height: 23,
        lineCount: 1, // Normalized to 1 line
        lineHeight: 22.8571,
      });
      expect(onLineChange).toHaveBeenCalledWith({
        height: 23,
        lineCount: 1,
        lineHeight: 22.8571,
      });

      // Multiline case
      api.setValue("Line 1\nLine 2");
      await flush();
      const updatedApi = connectTextarea(machine.service);
      updatedApi.handleLineChange({
        detail: { height: 46, lineCount: 2, lineHeight: 22.8571 },
      });
      await flush();

      expect(triggerEvent).toHaveBeenCalledWith("linechange", {
        height: 46,
        lineCount: 2,
        lineHeight: 22.8571,
      });

      machine.stop();
    });
  });

  describe("Clearable Support", () => {
    it("computes isClearable correctly and clears value on clear button tap", async () => {
      const triggerEvent = vi.fn();
      const machine = new MiniappMachine(textareaMachine, {
        clearable: true,
        defaultValue: "clear this comment",
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      let api = connectTextarea(machine.service);
      expect(api.isClearable).toBe(true);

      api.handleClear();
      await flush();

      api = connectTextarea(machine.service);
      expect(api.value).toBe("");
      expect(api.characterCount).toBe(0);
      expect(api.isClearable).toBe(false);
      expect(triggerEvent).toHaveBeenCalledWith("clear", {});

      machine.stop();
    });

    it("does not allow clear if disabled or readOnly", async () => {
      const machine = new MiniappMachine(textareaMachine, {
        clearable: true,
        defaultValue: "text",
        disabled: true,
      });
      machine.start();

      const api = connectTextarea(machine.service);
      expect(api.isClearable).toBe(false);

      machine.stop();
    });
  });

  describe("Programmatic API Controls", () => {
    it("setValue, clearValue, and resetValue via API", async () => {
      const machine = new MiniappMachine(textareaMachine, {
        defaultValue: "initial comment",
      });
      machine.start();

      const api = connectTextarea(machine.service);
      api.setValue("new note content");
      await flush();

      expect(machine.context.get("value")).toBe("new note content");
      expect(machine.computed("characterCount")).toBe(16);

      api.clearValue();
      await flush();
      expect(machine.context.get("value")).toBe("");
      expect(machine.computed("characterCount")).toBe(0);

      api.resetValue();
      await flush();
      expect(machine.context.get("value")).toBe("initial comment");
      expect(machine.computed("characterCount")).toBe(15);

      machine.stop();
    });

    it("focus() and blur() programmatically", async () => {
      const machine = new MiniappMachine(textareaMachine, {});
      machine.start();

      const api = connectTextarea(machine.service);
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
      const machine = new MiniappMachine(textareaMachine, {
        defaultValue: "locked text",
        disabled: true,
      });
      machine.start();

      machine.send({ type: "TEXTAREA.CHANGE", value: "should not change" });
      await flush();

      expect(machine.context.get("value")).toBe("locked text");

      const api = connectTextarea(machine.service);
      expect(api.disabled).toBe(true);
      expect(api.rootProps["data-disabled"]).toBe("true");
      expect(api.textareaProps.disabled).toBe(true);

      machine.stop();
    });

    it("blocks input when readOnly is true", async () => {
      const machine = new MiniappMachine(textareaMachine, {
        defaultValue: "read-only text",
        readOnly: true,
      });
      machine.start();

      machine.send({ type: "TEXTAREA.CHANGE", value: "should not change" });
      await flush();

      expect(machine.context.get("value")).toBe("read-only text");

      const api = connectTextarea(machine.service);
      expect(api.readOnly).toBe(true);
      expect(api.rootProps["data-readonly"]).toBe("true");
      expect(api.textareaProps.disabled).toBe(true);

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
      const machine = new MiniappMachine(textareaMachine, {
        name: "bio",
        formContext: host,
      });
      machine.start();
      await flush();
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ name: "bio" }),
      );
      connectTextarea(machine.service).handleInput({
        detail: { value: "updated" },
      });
      await flush();
      expect(notify).toHaveBeenCalledWith(
        "input",
        expect.objectContaining({ name: "bio", value: "updated" }),
      );
      expect(notify).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({ name: "bio", value: "updated" }),
      );
      machine.stop();
      form.stop();
    });

    it("notifies the form host on focus and blur", async () => {
      const form = new MiniappMachine(formMachine, {});
      form.start();
      const host = connectForm(form.service).formContext;
      const notify = vi.spyOn(host, "notify");
      const machine = new MiniappMachine(textareaMachine, {
        name: "bio",
        formContext: host,
      });
      machine.start();
      connectTextarea(machine.service).handleFocus({});
      await flush();
      connectTextarea(machine.service).handleBlur({});
      await flush();
      expect(notify).toHaveBeenCalledWith(
        "focus",
        expect.objectContaining({ name: "bio" }),
      );
      expect(notify).toHaveBeenCalledWith(
        "blur",
        expect.objectContaining({ name: "bio" }),
      );
      machine.stop();
      form.stop();
    });

    it("derives wrapper disabled and size from the form host", async () => {
      const form = new MiniappMachine(formMachine, {});
      form.start();
      const host = connectForm(form.service).formContext;
      const machine = new MiniappMachine(textareaMachine, {
        name: "bio",
        formContext: host,
      });
      machine.start();
      await flush();
      host.setFieldState("bio", { disabled: true, size: "sm" });
      await flush();
      expect(connectTextarea(machine.service).disabled).toBe(true);
      expect(connectTextarea(machine.service).size).toBe("sm");
      host.setFieldState("bio", { disabled: false, size: "lg" });
      await flush();
      expect(connectTextarea(machine.service).disabled).toBe(false);
      expect(connectTextarea(machine.service).size).toBe("lg");
      machine.stop();
      form.stop();
    });

    it("derives disabled and readOnly from the reactive form host", async () => {
      const form = new MiniappMachine(formMachine, {});
      form.start();
      const host = connectForm(form.service).formContext;
      const machine = new MiniappMachine(textareaMachine, {
        name: "bio",
        formContext: host,
      });
      machine.start();
      form.updateProps({ disabled: true, readOnly: true });
      await flush();
      expect(connectTextarea(machine.service).disabled).toBe(true);
      expect(connectTextarea(machine.service).readOnly).toBe(true);
      form.updateProps({ disabled: false, readOnly: false });
      await flush();
      expect(connectTextarea(machine.service).disabled).toBe(false);
      expect(connectTextarea(machine.service).readOnly).toBe(false);
      machine.stop();
      form.stop();
    });

    it("handles full end-to-end integration with formMachine", async () => {
      const formService = new MiniappMachine(formMachine, {
        defaultValue: { bio: "Original bio" },
        rules: {
          bio: [
            {
              validator: (val: any) =>
                val && String(val).length >= 5
                  ? true
                  : "Bio must be at least 5 chars",
            },
          ],
        },
      });
      formService.start();
      const host = connectForm(formService.service).formContext;

      const textareaService = new MiniappMachine(textareaMachine, {
        name: "bio",
        defaultValue: "Original bio",
        formContext: host,
      });
      textareaService.start();

      const formApi = connectForm(formService.service);
      let textareaApi = connectTextarea(textareaService.service);

      expect(textareaApi.value).toBe("Original bio");
      expect(textareaApi.invalid).toBe(false);

      // Input invalid short value
      textareaApi.handleInput({ detail: { value: "Hi" } });
      await flush();

      const submitResult = await formApi.submit();
      expect(submitResult.valid).toBe(false);

      textareaApi = connectTextarea(textareaService.service);
      expect(textareaApi.invalid).toBe(true);

      // Reset form restores original value and resets invalid state
      formApi.reset();
      await flush();

      textareaApi = connectTextarea(textareaService.service);
      expect(textareaApi.value).toBe("Original bio");
      expect(textareaApi.invalid).toBe(false);

      textareaService.stop();
      formService.stop();
    });
  });
});
