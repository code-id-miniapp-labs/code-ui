import { describe, expect, it } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { formMachine, connectForm } from "@code-ui/form";
import { provideFormHost, resolveContextRequest } from "@code-ui/form/context";
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

  it("derives validation errors and clears them on reset", async () => {
    const form = new MiniappMachine(formMachine, {});
    form.start();
    const api = connectForm(form.service);
    const unregister = api.formContext.register({ name: "pin", id: "pin-input", getValue: () => "" });
    const machine = new MiniappMachine(formFieldMachine, {
      name: "pin", label: "PIN", required: true, formContext: api.formContext,
    });
    machine.start();
    await flush();
    expect(form.refs.get("fieldRules").get("pin")?.()).toHaveLength(1);
    api.setErrors({ pin: ["Invalid PIN"] });
    await flush();
    expect(machine.state.get()).toBe("invalid");
    expect(connectFormField(machine.service).displayError).toBe("Invalid PIN");
    api.clearErrors("pin");
    await flush();
    expect(machine.state.get()).toBe("valid");
    api.setErrors({ pin: ["Invalid PIN"] });
    api.reset();
    await flush();
    expect(connectFormField(machine.service).invalid).toBe(false);
    machine.stop();
    unregister();
    form.stop();
  });

  it("derives disabled/readOnly and publishes only local wrapper overrides", async () => {
    const form = new MiniappMachine(formMachine, {});
    form.start();
    const host = connectForm(form.service).formContext;
    const machine = new MiniappMachine(formFieldMachine, {
      name: "otp", size: "lg", required: true, formContext: host,
    });
    machine.start();
    await flush();
    expect(host.fieldState("otp")).toEqual({ disabled: false, size: "lg" });
    form.updateProps({ disabled: true, readOnly: true });
    await flush();
    expect(connectFormField(machine.service).disabled).toBe(true);
    expect(machine.computed("isReadOnly")).toBe(true);
    expect(machine.computed("effectiveRules")).toEqual([]);
    expect(host.fieldState("otp")?.disabled).toBe(false);
    machine.updateProps({ size: "sm" });
    await flush();
    expect(host.fieldState("otp")?.size).toBe("sm");
    machine.stop();
    await flush();
    expect(host.fieldState("otp")).toEqual({});
    expect(form.refs.get("fieldRules").get("otp")?.()).toEqual([]);
    form.stop();
  });

  it("cleans old publications on name and host changes and tracks same-length rule replacement", async () => {
    const first = new MiniappMachine(formMachine, {});
    const second = new MiniappMachine(formMachine, {});
    first.start(); second.start();
    const host = connectForm(first.service).formContext;
    const nextHost = connectForm(second.service).formContext;
    const machine = new MiniappMachine(formFieldMachine, {
      name: "old", formContext: host, rules: [{ minLength: 2 }],
    });
    machine.start();
    machine.updateProps({ name: "new", rules: [{ minLength: 4 }] });
    await flush();
    expect(host.fieldState("old")).toEqual({});
    expect(first.refs.get("fieldRules").get("old")?.()).toEqual([]);
    expect(first.refs.get("fieldRules").get("new")?.()).toEqual([{ minLength: 4 }]);
    machine.updateProps({ formContext: nextHost });
    await flush();
    expect(host.fieldState("new")).toEqual({});
    expect(nextHost.fieldState("new")?.size).toBe("md");
    machine.stop(); first.stop(); second.stop();
  });

  it("updates scoped injection when the explicit form changes", async () => {
    const provider: any = {};
    const component: any = {
      triggerEvent: (_name: string, detail: unknown) => resolveContextRequest(provider, { detail }),
    };
    const first = new MiniappMachine(formMachine, {});
    const second = new MiniappMachine(formMachine, {});
    first.start(); second.start();
    const firstHost = connectForm(first.service).formContext;
    const secondHost = connectForm(second.service).formContext;
    provideFormHost(provider, firstHost, "first");
    provideFormHost(provider, secondHost, "second");
    const machine = new MiniappMachine(formFieldMachine, {
      name: "scoped", form: "first", component, required: true,
    });
    machine.start();
    await flush();
    expect(machine.computed("host")).toBe(firstHost);
    machine.updateProps({ form: "second" });
    await flush();
    expect(machine.computed("host")).toBe(secondHost);
    expect(firstHost.fieldState("scoped")).toEqual({});
    expect(secondHost.fieldState("scoped")?.size).toBe("md");
    machine.stop(); first.stop(); second.stop();
  });

  it("keeps null disconnected from scoped injection until undefined restores fallback", async () => {
    const provider: any = {};
    const component: any = {
      triggerEvent: (_name: string, detail: unknown) => resolveContextRequest(provider, { detail }),
    };
    const form = new MiniappMachine(formMachine, {});
    form.start();
    const host = connectForm(form.service).formContext;
    provideFormHost(provider, host, "scoped");
    const machine = new MiniappMachine(formFieldMachine, {
      name: "field", form: "scoped", component, required: true,
    });
    machine.start();
    await flush();
    expect(machine.computed("host")).toBe(host);
    expect(form.refs.get("fieldRules").get("field")?.()).toHaveLength(1);

    machine.updateProps({ formContext: null });
    await flush();
    expect(machine.computed("host")).toBeNull();
    expect(host.fieldState("field")).toEqual({});
    expect(form.refs.get("fieldRules").get("field")?.()).toEqual([]);
    form.updateProps({ disabled: true, readOnly: true });
    connectForm(form.service).setErrors({ field: ["Stale error"] });
    provideFormHost(provider, host, "scoped");
    await flush();
    expect(machine.computed("host")).toBeNull();
    expect(machine.computed("isDisabled")).toBe(false);
    expect(machine.computed("isReadOnly")).toBe(false);
    expect(machine.computed("displayError")).toBe("");

    machine.updateProps({ formContext: undefined });
    await flush();
    expect(machine.computed("host")).toBe(host);
    expect(machine.computed("isDisabled")).toBe(true);
    expect(machine.computed("displayError")).toBe("Stale error");
    machine.stop();
    form.stop();
  });

  it("starts explicitly disconnected and ignores late scoped injection", async () => {
    const provider: any = {};
    const component: any = {
      triggerEvent: (_name: string, detail: unknown) => resolveContextRequest(provider, { detail }),
    };
    const form = new MiniappMachine(formMachine, {});
    form.start();
    const host = connectForm(form.service).formContext;
    const machine = new MiniappMachine(formFieldMachine, {
      name: "field", form: "scoped", component, formContext: null, required: true,
    });
    machine.start();
    expect(machine.computed("host")).toBeNull();
    provideFormHost(provider, host, "scoped");
    await flush();
    expect(machine.computed("host")).toBeNull();
    expect(host.fieldState("field")).toBeUndefined();
    expect(form.refs.get("fieldRules").has("field")).toBe(false);
    machine.stop();
    form.stop();
  });

  it("injects a late scoped host through deep slots and disposes its listener", async () => {
    const provider: any = { id: "deep-form" };
    const component: any = {
      triggerEvent: (_name: string, detail: unknown) => resolveContextRequest(provider, { detail }),
    };
    const form = new MiniappMachine(formMachine, {});
    form.start();
    const host = connectForm(form.service).formContext;
    const machine = new MiniappMachine(formFieldMachine, {
      name: "deep", form: "deep-form", component, required: true,
    });
    machine.start();
    expect(machine.computed("host")).toBeUndefined();
    provideFormHost(provider, host, "deep-form");
    await flush();
    expect(machine.computed("host")).toBe(host);
    expect(form.refs.get("fieldRules").get("deep")?.()).toHaveLength(1);
    machine.stop();
    provideFormHost(provider, host, "deep-form");
    await flush();
    expect(form.refs.get("fieldRules").get("deep")?.()).toEqual([]);
    form.stop();
  });
});
