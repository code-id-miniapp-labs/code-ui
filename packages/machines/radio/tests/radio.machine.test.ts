import { describe, it, expect, vi } from "vitest";
import { signal } from "alien-signals";
import { MiniappMachine } from "@code-ui/miniapp";
import type { RadioGroupContext } from "@code-ui/radio-group";
import type { RadioSize } from "../src/radio.types";
import { radioMachine } from "../src/radio.machine";
import { connectRadio } from "../src/radio.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function makeGroupContext(
  overrides: Partial<RadioGroupContext> = {},
): RadioGroupContext {
  return {
    value: () => null,
    disabled: () => false,
    readOnly: () => false,
    invalid: () => false,
    color: () => "primary",
    size: () => "md",
    variant: () => "outline",
    select: vi.fn(),
    setValue: vi.fn(),
    clear: vi.fn(),
    ...overrides,
  };
}

describe("Radio Machine", () => {
  describe("Standalone Mode", () => {
    it("initializes in unchecked state by default", () => {
      const machine = new MiniappMachine(radioMachine, { value: "apple" });
      machine.start();

      expect(machine.state.get()).toBe("unchecked");
      expect(machine.computed("isChecked")).toBe(false);

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
      expect(machine.computed("isChecked")).toBe(true);

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

  describe("Group Mode via groupContext", () => {
    it("inherits group value and reflects checked state", async () => {
      const groupValue = signal<string | null>("opt1");
      const groupSize = signal<RadioSize>("md");
      const groupContext = makeGroupContext({
        value: () => groupValue(),
        size: () => groupSize(),
        variant: () => "card",
      });
      const machine = new MiniappMachine(radioMachine, {
        value: "opt1",
        groupContext,
      });
      machine.start();

      let api = connectRadio(machine.service);
      expect(api.checked).toBe(true);
      expect(api.variant).toBe("card");

      groupValue("opt2");
      groupSize("lg");
      await flush();

      api = connectRadio(machine.service);
      expect(api.checked).toBe(false);
      expect(api.size).toBe("lg");

      machine.stop();
    });

    it("dispatches select intents to the group context on tap", async () => {
      const select = vi.fn();
      const machine = new MiniappMachine(radioMachine, {
        value: "cherry",
        groupContext: makeGroupContext({ select }),
      });
      machine.start();

      const api = connectRadio(machine.service);
      api.handleTap();
      await flush();

      expect(select).toHaveBeenCalledWith("cherry");

      machine.stop();
    });

    it("does not select when disabled or group disabled", async () => {
      const select = vi.fn();
      const disabledMachine = new MiniappMachine(radioMachine, {
        value: "disabled-item",
        disabled: true,
        groupContext: makeGroupContext({ select }),
      });
      disabledMachine.start();

      connectRadio(disabledMachine.service).handleTap();
      await flush();
      expect(select).not.toHaveBeenCalled();
      disabledMachine.stop();

      const groupSelect = vi.fn();
      const groupDisabledMachine = new MiniappMachine(radioMachine, {
        value: "group-disabled-item",
        groupContext: makeGroupContext({
          disabled: () => true,
          select: groupSelect,
        }),
      });
      groupDisabledMachine.start();

      connectRadio(groupDisabledMachine.service).handleTap();
      await flush();
      expect(groupSelect).not.toHaveBeenCalled();
      groupDisabledMachine.stop();
    });

    it("inherits invalid state from the group context", async () => {
      const groupInvalid = signal(false);
      const machine = new MiniappMachine(radioMachine, {
        value: "opt1",
        groupContext: makeGroupContext({ invalid: () => groupInvalid() }),
      });
      machine.start();

      let api = connectRadio(machine.service);
      expect(api.invalid).toBe(false);

      groupInvalid(true);
      await flush();

      api = connectRadio(machine.service);
      expect(api.invalid).toBe(true);

      machine.stop();
    });

    it("resolves presentation values from the group context", () => {
      const machine = new MiniappMachine(radioMachine, {
        value: "opt1",
        groupContext: makeGroupContext({
          color: () => "danger",
          size: () => "lg",
          variant: () => "card",
        }),
      });
      machine.start();

      const api = connectRadio(machine.service);
      expect(api.color).toBe("danger");
      expect(api.size).toBe("lg");
      expect(api.variant).toBe("card");

      machine.stop();
    });
  });
});
