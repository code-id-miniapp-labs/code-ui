import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { createEventBus } from "@code-ui/utils";
import type { RadioGroupBusEvents } from "../src/radio.types";
import { radioMachine } from "../src/radio.machine";
import { connectRadio } from "../src/radio.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Radio Machine", () => {
  describe("Standalone Mode", () => {
    it("initializes in unchecked state by default", () => {
      const machine = new MiniappMachine(radioMachine, { value: "apple" });
      machine.start();

      expect(machine.state.get()).toBe("unchecked");
      expect(machine.context.get("checked")).toBe(false);

      const api = connectRadio(machine.service);
      expect(api.checked).toBe(false);
      expect(api.value).toBe("apple");
      expect(api.variant).toBe("outline");

      machine.stop();
    });

    it("initializes with defaultChecked = true", () => {
      const machine = new MiniappMachine(radioMachine, {
        value: "banana",
        defaultChecked: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("checked");
      expect(machine.context.get("checked")).toBe(true);

      const api = connectRadio(machine.service);
      expect(api.checked).toBe(true);

      machine.stop();
    });

    it("toggles checked when tapped in standalone mode", async () => {
      const machine = new MiniappMachine(radioMachine, { value: "orange" });
      machine.start();

      let api = connectRadio(machine.service);
      expect(api.checked).toBe(false);

      api.handleTap();
      await flush();

      api = connectRadio(machine.service);
      expect(api.checked).toBe(true);

      machine.stop();
    });

    it("supports variant = card", () => {
      const machine = new MiniappMachine(radioMachine, {
        value: "premium",
        variant: "card",
      });
      machine.start();

      const api = connectRadio(machine.service);
      expect(api.variant).toBe("card");

      machine.stop();
    });
  });

  describe("Group Mode via groupBus", () => {
    it("inherits groupValue and reflects checked state", async () => {
      const bus = createEventBus<RadioGroupBusEvents>();
      const machine = new MiniappMachine(radioMachine, {
        value: "opt1",
        groupBus: bus,
        groupValue: "opt1",
        groupVariant: "card",
      });
      machine.start();

      const api = connectRadio(machine.service);
      expect(api.checked).toBe(true);
      expect(api.variant).toBe("card");

      // Group changes value to opt2
      bus.emit("group:change", {
        value: "opt2",
        disabled: false,
        invalid: false,
        size: "lg",
        color: "primary",
        variant: "card",
      });
      await flush();

      expect(machine.context.get("groupValue")).toBe("opt2");
      const updatedApi = connectRadio(machine.service);
      expect(updatedApi.checked).toBe(false);
      expect(updatedApi.size).toBe("lg");

      machine.stop();
    });

    it("emits radio:select on handleTap when groupBus is present", async () => {
      const bus = createEventBus<RadioGroupBusEvents>();
      const selectListener = vi.fn();
      bus.on("radio:select", selectListener);

      const machine = new MiniappMachine(radioMachine, {
        value: "cherry",
        groupBus: bus,
      });
      machine.start();

      const api = connectRadio(machine.service);
      api.handleTap();
      await flush();

      expect(selectListener).toHaveBeenCalledWith({ value: "cherry" });

      machine.stop();
    });

    it("does not select when disabled or groupDisabled", async () => {
      const bus = createEventBus<RadioGroupBusEvents>();
      const selectListener = vi.fn();
      bus.on("radio:select", selectListener);

      const machine = new MiniappMachine(radioMachine, {
        value: "disabled-item",
        groupBus: bus,
        disabled: true,
      });
      machine.start();

      const api = connectRadio(machine.service);
      api.handleTap();
      await flush();

      expect(selectListener).not.toHaveBeenCalled();

      machine.stop();
    });

    it("inherits groupInvalid from groupBus", async () => {
      const bus = createEventBus<RadioGroupBusEvents>();
      const machine = new MiniappMachine(radioMachine, {
        value: "opt1",
        groupBus: bus,
      });
      machine.start();

      let api = connectRadio(machine.service);
      expect(api.invalid).toBe(false);

      bus.emit("group:change", {
        value: null,
        disabled: false,
        invalid: true,
        size: "md",
        color: "primary",
        variant: "card",
      });
      await flush();

      api = connectRadio(machine.service);
      expect(api.invalid).toBe(true);

      machine.stop();
    });
  });
});
