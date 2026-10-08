import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
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
      expect(machine.computed("isFilled")).toBe(false);

      const api = connectPinInput(machine.service);
      expect(api.state).toBe("idle");
      expect(api.value).toEqual(["", "", "", ""]);
      expect(api.valueAsString).toBe("");
      expect(api.isValueComplete).toBe(false);
      expect(api.isFilled).toBe(false);
      expect(api.focusedIndex).toBe(-1);
      expect(api.inputs.length).toBe(4);
      expect(api.rootProps["data-state"]).toBe("idle");
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

  describe("Nuxt UI-style Separator", () => {
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
  });

  describe("Sequential Typing & Auto-Advance", () => {
    it("advances focus sequentially on valid single-digit input and fires callbacks", async () => {
      const onValueChange = vi.fn();
      const onValueComplete = vi.fn();

      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        onValueChange,
        onValueComplete,
      });
      machine.start();

      // Type '1' in slot 0
      machine.send({ type: "INPUT.CHANGE", index: 0, value: "1" });
      await flush();

      expect(machine.context.get("value")).toEqual(["1", "", "", ""]);
      expect(machine.context.get("focusedIndex")).toBe(1);
      expect(onValueChange).toHaveBeenCalledWith({
        value: ["1", "", "", ""],
        valueAsString: "1",
      });
      expect(onValueComplete).not.toHaveBeenCalled();

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
      expect(onValueComplete).toHaveBeenCalledWith({
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
  });

  describe("Pasting & SMS OTP Autofill", () => {
    it("distributes pasted multi-character string across all slots", async () => {
      const onValueComplete = vi.fn();
      const machine = new MiniappMachine(pinInputMachine, {
        length: 4,
        onValueComplete,
      });
      machine.start();

      // Paste "8765" into index 0
      machine.send({ type: "INPUT.CHANGE", index: 0, value: "8765" });
      await flush();

      expect(machine.context.get("value")).toEqual(["8", "7", "6", "5"]);
      expect(machine.computed("isValueComplete")).toBe(true);
      expect(machine.computed("valueAsString")).toBe("8765");
      expect(onValueComplete).toHaveBeenCalledWith({
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
      const onValueInvalid = vi.fn();
      const machine = new MiniappMachine(pinInputMachine, {
        type: "numeric",
        onValueInvalid,
      });
      machine.start();

      machine.send({ type: "INPUT.CHANGE", index: 0, value: "a" });
      await flush();

      // Value remains empty
      expect(machine.context.get("value")).toEqual(["", "", "", ""]);
      expect(onValueInvalid).toHaveBeenCalledWith({ value: "a", index: 0 });

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
});
