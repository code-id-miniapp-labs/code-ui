import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { createEventBus } from "@code-ui/utils";
import type { FormBusEvents } from "@code-ui/form";
import { pinInputMachine } from "../src/pin-input.machine";
import { connectPinInput } from "../src/pin-input.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Pin Input Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes with default props (length 4, idle state)", () => {
      const machine = new MiniappMachine(pinInputMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("length")).toBe(4);
      expect(machine.context.get("value")).toEqual(["", "", "", ""]);
      expect(machine.computed("valueAsString")).toBe("");
      expect(machine.computed("isValueComplete")).toBe(false);
      expect(machine.computed("isEmpty")).toBe(true);
      expect(machine.computed("isFilled")).toBe(false);

      const api = connectPinInput(machine.service);
      expect(api.state).toBe("idle");
      expect(api.value).toEqual(["", "", "", ""]);
      expect(api.valueAsString).toBe("");
      expect(api.isValueComplete).toBe(false);
      expect(api.isEmpty).toBe(true);
      expect(api.isFilled).toBe(false);
      expect(api.focusedIndex).toBe(-1);
      expect(api.inputs.length).toBe(4);
      expect(api.rootProps["data-state"]).toBe("idle");
      expect(api.rootProps["data-empty"]).toBe("true");
      expect(api.rootProps["data-complete"]).toBe("false");

      machine.stop();
    });

    it("initializes with custom length and defaultValue", () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 6,
        defaultValue: ["1", "2", "", "", "", ""],
      });
      machine.start();

      expect(machine.context.get("length")).toBe(6);
      expect(machine.context.get("value")).toEqual(["1", "2", "", "", "", ""]);
      expect(machine.computed("valueAsString")).toBe("12");
      expect(machine.computed("isFilled")).toBe(true);
      expect(machine.computed("isValueComplete")).toBe(false);

      const api = connectPinInput(machine.service);
      expect(api.inputs.length).toBe(6);
      expect(api.inputs[0].value).toBe("1");
      expect(api.inputs[1].value).toBe("2");
      expect(api.inputs[2].value).toBe("");

      machine.stop();
    });
  });

  describe("style Separator", () => {
    it("renders separators at regular intervals (e.g. separator: 3 for length 6)", () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 6,
        separator: 3,
      });
      machine.start();

      const api = connectPinInput(machine.service);
      // After index 2 (the 3rd input), hasSeparator should be true
      expect(api.inputs[0].hasSeparator).toBe(false);
      expect(api.inputs[1].hasSeparator).toBe(false);
      expect(api.inputs[2].hasSeparator).toBe(true);
      expect(api.inputs[3].hasSeparator).toBe(false);
      expect(api.inputs[4].hasSeparator).toBe(false);
      expect(api.inputs[5].hasSeparator).toBe(false); // Never after last!

      machine.stop();
    });

    it("renders separators at specific positions array (e.g. separator: [2, 4])", () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 6,
        separator: [2, 4],
        separatorChar: "/",
      });
      machine.start();

      const api = connectPinInput(machine.service);
      expect(api.inputs[1].hasSeparator).toBe(true); // After 2nd input
      expect(api.inputs[1].separatorChar).toBe("/");
      expect(api.inputs[3].hasSeparator).toBe(true); // After 4th input
      expect(api.inputs[0].hasSeparator).toBe(false);
      expect(api.inputs[2].hasSeparator).toBe(false);

      machine.stop();
    });

    it("defaults separator: true to the middle position", () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        separator: true,
      });
      machine.start();

      const api = connectPinInput(machine.service);
      // Math.floor(4 / 2) = 2, so after 2nd input (index 1)
      expect(api.inputs[1].hasSeparator).toBe(true);
      expect(api.inputs[0].hasSeparator).toBe(false);
      expect(api.inputs[2].hasSeparator).toBe(false);

      machine.stop();
    });
  });

  describe("Focus & Blur Lifecycle", () => {
    it("transitions from idle to focused on INPUT.FOCUS and back on INPUT.BLUR", async () => {
      const machine = new MiniappMachine(pinInputMachine, {});
      machine.start();

      machine.send({ type: "INPUT.FOCUS", index: 0 });
      await flush();

      expect(machine.state.get()).toBe("focused");
      expect(machine.context.get("focusedIndex")).toBe(0);

      const api = connectPinInput(machine.service);
      expect(api.focusedIndex).toBe(0);
      expect(api.inputs[0].isFocused).toBe(true);
      expect(api.inputs[1].isFocused).toBe(false);

      machine.send({ type: "INPUT.BLUR" });
      await flush();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("focusedIndex")).toBe(-1);

      machine.stop();
    });

    it("autoFocus starts in focused state at index 0", () => {
      const machine = new MiniappMachine(pinInputMachine, {
        autoFocus: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("focused");
      expect(machine.context.get("focusedIndex")).toBe(0);

      machine.stop();
    });

    it("focuses the first not filled slot when navigating or clicking any box input", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        defaultValue: ["1", "2", "", ""],
      });
      machine.start();

      // User clicks slot 3, should focus first empty slot (slot 2)
      machine.send({ type: "INPUT.FOCUS", index: 3 });
      await flush();
      expect(machine.context.get("focusedIndex")).toBe(2);

      // User clicks slot 0, should still focus first empty slot (slot 2)
      machine.send({ type: "INPUT.FOCUS", index: 0 });
      await flush();
      expect(machine.context.get("focusedIndex")).toBe(2);

      // When all are filled, focusing specific slot is allowed
      machine.context.set("value", ["1", "2", "3", "4"]);
      machine.send({ type: "INPUT.FOCUS", index: 1 });
      await flush();
      expect(machine.context.get("focusedIndex")).toBe(1);

      machine.stop();
    });

    it("cycles focusedIndex (-1 then target) via flush when clicking out-of-order slot while already focused", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        defaultValue: ["", "", "", ""],
      });
      machine.start();

      // Initially focus slot 0
      machine.send({ type: "INPUT.FOCUS", index: 0 });
      await flush();
      expect(machine.context.get("focusedIndex")).toBe(0);

      const focusHistory: number[] = [];
      machine.subscribe(() => {
        focusHistory.push(machine.context.get("focusedIndex"));
      });

      // User clicks slot 1 while slot 0 was already focused and empty
      machine.send({ type: "INPUT.FOCUS", index: 1 });
      await flush();

      // Focus should cycle through -1 then back to 0, ensuring false -> true transition for WeChat input
      expect(focusHistory).toContain(-1);
      expect(machine.context.get("focusedIndex")).toBe(0);

      machine.stop();
    });
  });

  describe("Sequential Typing & Auto-Advance", () => {
    it("advances focus sequentially on valid single-digit input and fires callbacks", async () => {
      const onChange = vi.fn();
      const onComplete = vi.fn();

      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        onChange,
        onComplete,
      });
      machine.start();

      // Type '1' in slot 0
      machine.send({ type: "INPUT.CHANGE", index: 0, value: "1" });
      await flush();

      expect(machine.context.get("value")).toEqual(["1", "", "", ""]);
      expect(machine.context.get("focusedIndex")).toBe(1);
      expect(onChange).toHaveBeenCalledWith({
        value: ["1", "", "", ""],
        valueAsString: "1",
      });
      expect(onComplete).not.toHaveBeenCalled();

      // Type '2' in slot 1
      machine.send({ type: "INPUT.CHANGE", index: 1, value: "2" });
      await flush();
      expect(machine.context.get("value")).toEqual(["1", "2", "", ""]);
      expect(machine.context.get("focusedIndex")).toBe(2);

      // Type '3' in slot 2
      machine.send({ type: "INPUT.CHANGE", index: 2, value: "3" });
      await flush();
      expect(machine.context.get("value")).toEqual(["1", "2", "3", ""]);
      expect(machine.context.get("focusedIndex")).toBe(3);

      // Type '4' in slot 3 (completes)
      machine.send({ type: "INPUT.CHANGE", index: 3, value: "4" });
      await flush();
      expect(machine.context.get("value")).toEqual(["1", "2", "3", "4"]);
      expect(machine.computed("isValueComplete")).toBe(true);
      expect(machine.computed("valueAsString")).toBe("1234");
      expect(onComplete).toHaveBeenCalledWith({
        value: ["1", "2", "3", "4"],
        valueAsString: "1234",
      });

      machine.stop();
    });

    it("blurs focus on completion if blurOnComplete is true", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 3,
        defaultValue: ["1", "2", ""],
        blurOnComplete: true,
      });
      machine.start();

      machine.send({ type: "INPUT.CHANGE", index: 2, value: "3" });
      await flush();

      expect(machine.computed("isValueComplete")).toBe(true);
      expect(machine.context.get("focusedIndex")).toBe(-1);

      machine.stop();
    });
  });

  describe("Backspace & Deletion Handling", () => {
    it("clears current slot and retreats focus to previous slot when input is cleared", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        defaultValue: ["1", "2", "3", ""],
      });
      machine.start();

      // Clear slot 2 (user presses backspace)
      machine.send({ type: "INPUT.CHANGE", index: 2, value: "" });
      await flush();

      expect(machine.context.get("value")).toEqual(["1", "2", "", ""]);
      expect(machine.context.get("focusedIndex")).toBe(1); // Auto-retreated to slot 1!

      // Clear slot 1
      machine.send({ type: "INPUT.CHANGE", index: 1, value: "" });
      await flush();

      expect(machine.context.get("value")).toEqual(["1", "", "", ""]);
      expect(machine.context.get("focusedIndex")).toBe(0); // Auto-retreated to slot 0!

      // Clear slot 0
      machine.send({ type: "INPUT.CHANGE", index: 0, value: "" });
      await flush();

      expect(machine.context.get("value")).toEqual(["", "", "", ""]);
      expect(machine.context.get("focusedIndex")).toBe(0); // Clamped at 0

      machine.stop();
    });

    it("clears previous slot and retreats focus when backspace is pressed on an already-empty slot (u200B deletion)", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        defaultValue: ["1", "2", "", ""],
      });
      machine.start();

      // Focus is at empty slot 2 (which displays "\u200B")
      machine.send({ type: "INPUT.FOCUS", index: 2 });
      await flush();
      expect(machine.context.get("focusedIndex")).toBe(2);

      const apiBefore = connectPinInput(machine.service);
      expect(apiBefore.inputs[2].inputProps.value).toBe("\u200B");
      expect(apiBefore.inputs[1].inputProps.value).toBe("2");

      // User presses backspace on slot 2: "\u200B" is deleted -> value becomes ""
      machine.send({ type: "INPUT.CHANGE", index: 2, value: "" });
      await flush();

      // Slot 1 is now cleared and focus retreats to slot 1!
      expect(machine.context.get("value")).toEqual(["1", "", "", ""]);
      expect(machine.context.get("focusedIndex")).toBe(1);

      const apiAfter = connectPinInput(machine.service);
      expect(apiAfter.inputs[1].inputProps.value).toBe("\u200B"); // slot 1 is now focused & empty
      expect(apiAfter.inputs[2].inputProps.value).toBe(""); // slot 2 is unfocused & empty

      machine.stop();
    });

    it("remains focused on the last slot when clearing value from the last slot without blipping to previous slot", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        defaultValue: ["1", "2", "3", "4"],
      });
      machine.start();

      // Focus last slot
      machine.send({ type: "INPUT.FOCUS", index: 3 });
      await flush();
      expect(machine.context.get("focusedIndex")).toBe(3);

      // Clear slot 3 (user presses backspace once)
      machine.send({ type: "INPUT.CHANGE", index: 3, value: "" });
      await flush();

      // Value in last slot cleared, but focus stays on last slot (no blip to slot 2)
      expect(machine.context.get("value")).toEqual(["1", "2", "3", ""]);
      expect(machine.context.get("focusedIndex")).toBe(3);

      const api = connectPinInput(machine.service);
      expect(api.inputs[3].isFocused).toBe(true);
      expect(api.inputs[2].isFocused).toBe(false);
      expect(api.inputs[3].inputProps.value).toBe("\u200B");

      // Press backspace again on now-empty slot 3: retreats to slot 2 and clears slot 2
      machine.send({ type: "INPUT.CHANGE", index: 3, value: "" });
      await flush();

      expect(machine.context.get("value")).toEqual(["1", "2", "", ""]);
      expect(machine.context.get("focusedIndex")).toBe(2);

      machine.stop();
    });
  });

  describe("Pasting & SMS OTP Autofill", () => {
    it("distributes pasted multi-character string across all slots", async () => {
      const onComplete = vi.fn();
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        onComplete,
      });
      machine.start();

      // Paste "8765" into index 0
      machine.send({ type: "INPUT.CHANGE", index: 0, value: "8765" });
      await flush();

      expect(machine.context.get("value")).toEqual(["8", "7", "6", "5"]);
      expect(machine.computed("isValueComplete")).toBe(true);
      expect(machine.computed("valueAsString")).toBe("8765");
      expect(onComplete).toHaveBeenCalledWith({
        value: ["8", "7", "6", "5"],
        valueAsString: "8765",
      });

      machine.stop();
    });

    it("truncates paste if characters exceed PIN length", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
      });
      machine.start();

      machine.send({ type: "INPUT.CHANGE", index: 0, value: "987654321" });
      await flush();

      expect(machine.context.get("value")).toEqual(["9", "8", "7", "6"]);
      expect(machine.computed("valueAsString")).toBe("9876");

      machine.stop();
    });
  });

  describe("Character Validation", () => {
    it("rejects non-numeric characters when type is numeric", async () => {
      const onInvalid = vi.fn();
      const machine = new MiniappMachine(pinInputMachine, {
        type: "numeric",
        onInvalid,
      });
      machine.start();

      machine.send({ type: "INPUT.CHANGE", index: 0, value: "a" });
      await flush();

      // Value remains empty
      expect(machine.context.get("value")).toEqual(["", "", "", ""]);
      expect(onInvalid).toHaveBeenCalledWith({ value: "a", index: 0 });

      machine.stop();
    });

    it("accepts alphabetic characters when type is alphabetic", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        type: "alphabetic",
      });
      machine.start();

      machine.send({ type: "INPUT.CHANGE", index: 0, value: "A" });
      await flush();

      expect(machine.context.get("value")).toEqual(["A", "", "", ""]);

      machine.stop();
    });
  });

  describe("Programmatic API Controls", () => {
    it("setValue and clearValue via connect API", async () => {
      const machine = new MiniappMachine(pinInputMachine, { length: 4 });
      machine.start();

      const api = connectPinInput(machine.service);
      api.setValue(["9", "9", "9", "9"]);
      await flush();

      expect(machine.context.get("value")).toEqual(["9", "9", "9", "9"]);
      expect(machine.computed("valueAsString")).toBe("9999");
      expect(machine.computed("isValueComplete")).toBe(true);

      api.clearValue();
      await flush();

      expect(machine.context.get("value")).toEqual(["", "", "", ""]);
      expect(machine.computed("valueAsString")).toBe("");
      expect(machine.computed("isValueComplete")).toBe(false);

      machine.stop();
    });
  });

  describe("Disabled & ReadOnly State", () => {
    it("blocks input when disabled is true", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        disabled: true,
      });
      machine.start();

      machine.send({ type: "INPUT.CHANGE", index: 0, value: "1" });
      await flush();

      expect(machine.context.get("value")).toEqual(["", "", "", ""]);

      const api = connectPinInput(machine.service);
      expect(api.rootProps["data-disabled"]).toBe("true");
      expect(api.getInputProps(0).disabled).toBe(true);

      machine.stop();
    });
  });

  describe("Per-Cell Input Props & Hidden Input", () => {
    it("embeds inputProps and separatorProps on every cell in inputs for each length", async () => {
      const triggerEvent = vi.fn();
      const machine = new MiniappMachine(pinInputMachine, {
        id: "otp-1",
        length: 5,
        name: "verificationCode",
        separator: 3,
        component: {
          setData: vi.fn(),
          triggerEvent,
        },
      });
      machine.start();

      const api = connectPinInput(machine.service);
      expect(api.inputs).toHaveLength(5);

      for (let i = 0; i < 5; i++) {
        const cell = api.inputs[i];
        expect(cell?.index).toBe(i);
        expect(cell?.inputProps).toMatchObject({
          id: `pin-input:otp-1:input:${i}`,
          "data-scope": "pin-input",
          "data-part": "input",
          "data-index": i,
          "data-focused": "false",
          "data-disabled": "false",
          "data-readonly": "false",
          "data-complete": "false",
          "data-state": "idle",
          value: "",
          focus: false,
          disabled: false,
          type: "number",
          password: false,
          maxlength: i === 0 ? 5 : 2,
          role: "textbox",
          "aria-label": `Digit ${i + 1}`,
        });
        expect(cell?.separatorProps).toMatchObject({
          id: `pin-input:otp-1:separator:${i}`,
          "data-scope": "pin-input",
          "data-part": "separator",
          "aria-hidden": "true",
        });
      }

      expect(api.hiddenInputProps).toMatchObject({
        id: "pin-input:otp-1:hidden-input",
        type: "text",
        tabIndex: -1,
        name: "verificationCode",
        value: "",
        disabled: false,
        "aria-hidden": "true",
      });

      // Paste full 5-digit OTP and verify component.triggerEvent + data-complete on each input
      machine.send({ type: "INPUT.CHANGE", index: 0, value: "12345" });
      await flush();

      expect(triggerEvent).toHaveBeenCalledWith("change", {
        value: ["1", "2", "3", "4", "5"],
        valueAsString: "12345",
      });
      expect(triggerEvent).toHaveBeenCalledWith("complete", {
        value: ["1", "2", "3", "4", "5"],
        valueAsString: "12345",
      });

      const updatedApi = connectPinInput(machine.service);
      expect(updatedApi.hiddenInputProps.value).toBe("12345");
      for (let i = 0; i < 5; i++) {
        expect(updatedApi.inputs[i]?.inputProps["data-complete"]).toBe("true");
        expect(updatedApi.inputs[i]?.inputProps.value).toBe(String(i + 1));
      }

      machine.stop();
    });

    it("handles typing the same number into the last input box without accumulating extra digits", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        defaultValue: ["2", "2", "2", "2"],
      });
      machine.start();

      const api = connectPinInput(machine.service);
      expect(api.inputs[3]?.inputProps?.maxlength).toBe(2);

      const res1 = api.handleInput({
        currentTarget: { dataset: { index: 3 } },
        detail: { value: "22" },
      });
      await flush();

      expect(res1).toBe("2");
      expect(machine.context.get("value")).toEqual(["2", "2", "2", "2"]);

      const res2 = api.handleInput({
        currentTarget: { dataset: { index: 3 } },
        detail: { value: "222" },
      });
      await flush();

      expect(res2).toBe("2");
      expect(machine.context.get("value")).toEqual(["2", "2", "2", "2"]);

      // User types a different number '5' in the last box
      const res3 = api.handleInput({
        currentTarget: { dataset: { index: 3 } },
        detail: { value: "25" },
      });
      await flush();

      expect(res3).toBe("5");
      expect(machine.context.get("value")).toEqual(["2", "2", "2", "5"]);

      machine.stop();
    });
  });

  describe("FormField & Form Cascading (Disabled and Size)", () => {
    it("inherits disabled and size from form-field via field:state bus event", async () => {
      const bus = createEventBus<FormBusEvents>();
      const machine = new MiniappMachine(pinInputMachine, {
        name: "otp",
        formBus: bus,
      });
      machine.start();

      let api = connectPinInput(machine.service);
      expect(api.disabled).toBe(false);
      expect(api.size).toBe("md");
      expect(api.inputs[0]?.inputProps.disabled).toBe(false);

      // Wrapper form-field broadcasts disabled=true and size="sm"
      bus.emit("field:state", { name: "otp", disabled: true, size: "sm" });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.disabled).toBe(true);
      expect(api.size).toBe("sm");
      expect(api.inputs[0]?.inputProps.disabled).toBe(true);

      // Wrapper form-field updates to disabled=false and size="lg"
      bus.emit("field:state", { name: "otp", disabled: false, size: "lg" });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.disabled).toBe(false);
      expect(api.size).toBe("lg");
      expect(api.inputs[0]?.inputProps.disabled).toBe(false);

      machine.stop();
    });

    it("allows explicit child size to override wrapper size", async () => {
      const bus = createEventBus<FormBusEvents>();
      const machine = new MiniappMachine(pinInputMachine, {
        name: "otp",
        size: "lg",
        formBus: bus,
      });
      machine.start();

      let api = connectPinInput(machine.service);
      expect(api.size).toBe("lg");

      // Wrapper sets size="sm", but explicit child prop is "lg"
      bus.emit("field:state", { name: "otp", size: "sm" });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.size).toBe("lg");

      machine.stop();
    });

    it("supports direct fieldDisabled and fieldSize props from WeChat relations", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        name: "otp",
      });
      machine.start();

      let api = connectPinInput(machine.service);
      expect(api.disabled).toBe(false);
      expect(api.size).toBe("md");

      // Relations bridge updates child props directly
      machine.updateProps({ fieldDisabled: true, fieldSize: "sm" });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.disabled).toBe(true);
      expect(api.size).toBe("sm");

      // Reset
      machine.updateProps({ fieldDisabled: false, fieldSize: "lg" });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.disabled).toBe(false);
      expect(api.size).toBe("lg");

      machine.stop();
    });

    it("reacts when form:state disables the entire form", async () => {
      const bus = createEventBus<FormBusEvents>();
      const machine = new MiniappMachine(pinInputMachine, {
        name: "otp",
        formBus: bus,
      });
      machine.start();

      let api = connectPinInput(machine.service);
      expect(api.disabled).toBe(false);

      // Form disabled
      bus.emit("form:state", { disabled: true, readOnly: false });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.disabled).toBe(true);
      expect(api.inputs[0]?.inputProps.disabled).toBe(true);

      // Form re-enabled
      bus.emit("form:state", { disabled: false, readOnly: false });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.disabled).toBe(false);
      expect(api.inputs[0]?.inputProps.disabled).toBe(false);

      machine.stop();
    });

    it("syncs state when controlled value prop is dynamically updated via updateProps", async () => {
      const machine = new MiniappMachine(pinInputMachine, {
        value: ["1", "2", "", ""],
      });
      machine.start();

      let api = connectPinInput(machine.service);
      expect(api.value).toEqual(["1", "2", "", ""]);
      expect(api.valueAsString).toBe("12");
      expect(api.inputs[0].value).toBe("1");
      expect(api.inputs[1].value).toBe("2");
      expect(api.inputs[2].value).toBe("");

      // Parent programmatically fills PIN "9876" as array
      machine.updateProps({ value: ["9", "8", "7", "6"] });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.value).toEqual(["9", "8", "7", "6"]);
      expect(api.valueAsString).toBe("9876");
      expect(api.isValueComplete).toBe(true);
      expect(api.inputs[0].value).toBe("9");
      expect(api.inputs[1].value).toBe("8");
      expect(api.inputs[2].value).toBe("7");
      expect(api.inputs[3].value).toBe("6");

      // Parent programmatically updates value as string "4321"
      machine.updateProps({ value: "4321" });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.value).toEqual(["4", "3", "2", "1"]);
      expect(api.valueAsString).toBe("4321");
      expect(api.isValueComplete).toBe(true);

      // Parent programmatically clears PIN
      machine.updateProps({ value: ["", "", "", ""] });
      await flush();

      api = connectPinInput(machine.service);
      expect(api.value).toEqual(["", "", "", ""]);
      expect(api.valueAsString).toBe("");
      expect(api.isValueComplete).toBe(false);

      machine.stop();
    });
  });
});
