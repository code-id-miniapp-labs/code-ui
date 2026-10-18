import { describe, expect, it } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { createEventBus } from "@code-ui/utils";
import type { FormBusEvents } from "@code-ui/form";
import { formFieldMachine } from "../src/form-field.machine";
import { connectFormField } from "../src/form-field.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("formFieldMachine", () => {
  it("initializes in valid state by default", () => {
    const machine = new MiniappMachine(formFieldMachine, {
      name: "username",
      label: "Username",
    });
    machine.start();

    expect(machine.state.get()).toBe("valid");
    expect(machine.computed("invalid")).toBe(false);
    expect(machine.computed("displayError")).toBe("");

    machine.stop();
  });

  it("initializes in invalid state if prop error is provided", () => {
    const machine = new MiniappMachine(formFieldMachine, {
      name: "username",
      label: "Username",
      error: "Username is taken",
    });
    machine.start();

    expect(machine.state.get()).toBe("invalid");
    expect(machine.computed("invalid")).toBe(true);
    expect(machine.computed("displayError")).toBe("Username is taken");

    machine.stop();
  });

  it("computes effective rules with auto-required injection", () => {
    const machine = new MiniappMachine(formFieldMachine, {
      name: "email",
      label: "Email Address",
      required: true,
    });
    machine.start();

    const rules = machine.computed("effectiveRules");
    expect(rules.length).toBe(1);
    expect(rules[0]?.required).toBe(true);
    expect(rules[0]?.message).toBe("Email Address is required");

    machine.stop();
  });

  it("returns empty effective rules when disabled", () => {
    const machine = new MiniappMachine(formFieldMachine, {
      name: "email",
      required: true,
      disabled: true,
      rules: [{ required: true, message: "Required" }],
    });
    machine.start();

    expect(machine.computed("effectiveRules")).toEqual([]);

    machine.stop();
  });

  it("binds to form EventBus and responds to field:error, reset, and clear-errors", async () => {
    const bus = createEventBus<FormBusEvents>();
    let broadcastedRules: any = null;

    bus.on("field:rules", (payload) => {
      broadcastedRules = payload;
    });

    const machine = new MiniappMachine(formFieldMachine, {
      name: "pin",
      label: "PIN",
      required: true,
      formBus: bus,
    });
    machine.start();

    // Verify rules were broadcasted on bus
    expect(broadcastedRules).not.toBeNull();
    expect(broadcastedRules.name).toBe("pin");
    expect(broadcastedRules.getRules().length).toBe(1);

    // Simulate validation error from Form
    bus.emit("field:error", {
      name: "pin",
      errors: ["PIN must be 4 digits"],
      isValid: false,
    });
    await flush();

    expect(machine.state.get()).toBe("invalid");
    expect(machine.computed("displayError")).toBe("PIN must be 4 digits");

    const api = connectFormField(machine.service);
    expect(api.invalid).toBe(true);
    expect(api.displayError).toBe("PIN must be 4 digits");
    expect(api.rootProps["data-invalid"]).toBe("true");

    // Simulate clear-errors
    bus.emit("clear-errors", { name: "pin" });
    await flush();

    expect(machine.state.get()).toBe("valid");
    expect(machine.computed("displayError")).toBe("");
    expect(connectFormField(machine.service).invalid).toBe(false);

    // Simulate error again and then reset
    bus.emit("field:error", {
      name: "pin",
      errors: ["Invalid PIN"],
      isValid: false,
    });
    await flush();
    expect(machine.state.get()).toBe("invalid");

    bus.emit("reset", { name: "pin" });
    await flush();
    expect(machine.state.get()).toBe("valid");
    expect(machine.computed("displayError")).toBe("");

    machine.stop();
  });

  it("reactively updates disabled state when form:state is emitted on bus", async () => {
    const bus = createEventBus<FormBusEvents>();
    const machine = new MiniappMachine(formFieldMachine, {
      name: "pin",
      formBus: bus,
    });
    machine.start();

    expect(connectFormField(machine.service).disabled).toBe(false);

    bus.emit("form:state", { disabled: true, readOnly: false });
    await flush();

    const api = connectFormField(machine.service);
    expect(api.disabled).toBe(true);
    expect(api.rootProps["data-disabled"]).toBe("true");
    expect(api.labelProps["data-disabled"]).toBe("true");

    bus.emit("form:state", { disabled: false, readOnly: false });
    await flush();

    expect(connectFormField(machine.service).disabled).toBe(false);
    machine.stop();
  });

  it("broadcasts field:state with disabled and size on bus, updating reactively", async () => {
    const bus = createEventBus<FormBusEvents>();
    const stateEvents: any[] = [];

    bus.on("field:state", (payload) => {
      stateEvents.push(payload);
    });

    const machine = new MiniappMachine(formFieldMachine, {
      name: "otp",
      size: "lg",
      disabled: false,
      formBus: bus,
    });
    machine.start();

    // Initial broadcast
    expect(stateEvents.length).toBeGreaterThanOrEqual(1);
    const lastEvent = stateEvents[stateEvents.length - 1];
    expect(lastEvent).toEqual({
      name: "otp",
      disabled: false,
      size: "lg",
    });

    // When form:state disables the form
    bus.emit("form:state", { disabled: true, readOnly: false });
    await flush();

    const disabledEvent = stateEvents[stateEvents.length - 1];
    expect(disabledEvent).toEqual({
      name: "otp",
      disabled: true,
      size: "lg",
    });

    // When form-field size changes
    machine.updateProps({ size: "sm" });
    await flush();

    const sizeEvent = stateEvents[stateEvents.length - 1];
    expect(sizeEvent).toEqual({
      name: "otp",
      disabled: true,
      size: "sm",
    });

    machine.stop();
  });
});
