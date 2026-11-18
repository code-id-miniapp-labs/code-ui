import { describe, it, expect, vi } from "vitest";
import { signal } from "alien-signals";
import { MiniappMachine } from "@code-id-labs/miniapp";
import type { RadioGroupContext } from "@code-id-labs/radio-group";
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
      expect(api.disabled).toBe(false);
      expect(api.invalid).toBe(false);

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
  });

  describe("Group Mode via groupContext", () => {
    it("inherits group value and reflects checked state", async () => {
      const groupValue = signal<string | null>("opt1");
      const groupContext = makeGroupContext({
        value: () => groupValue(),
      });
      const machine = new MiniappMachine(radioMachine, {
        value: "opt1",
        groupContext,
      });
      machine.start();

      let api = connectRadio(machine.service);
      expect(api.checked).toBe(true);

      groupValue("opt2");
      await flush();

      api = connectRadio(machine.service);
      expect(api.checked).toBe(false);

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
  });
});
