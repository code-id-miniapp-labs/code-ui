import { describe, expect, it, vi } from "vitest";
import { effect, signal } from "alien-signals";
import { MiniappMachine } from "@code-ui/miniapp";
import type { MiniAppComponent } from "@code-ui/utils";
import {
  bindFormField,
  cleanupFormFieldSync,
  connectForm,
  formMachine,
  getFormHostKey,
  injectFormHost,
  provideFormHost,
  setupFormFieldSync,
} from "../src";
import type { FormHostContext, FormProps, FormRule, FormSchema } from "../src";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function createForm(props: FormProps = {}) {
  const machine = new MiniappMachine<FormSchema>(formMachine, props);
  machine.start();
  return {
    machine,
    api: () => connectForm(machine.service),
    host: machine.service.refs.get("hostContext"),
  };
}
function component(owner?: MiniAppComponent): MiniAppComponent {
  return { selectOwnerComponent: () => owner as any, triggerEvent: vi.fn() };
}

describe("reactive form host", () => {
  it("exposes one stable facade with reactive form state, errors, and wrapper overrides", async () => {
    const form = createForm();
    const snapshots: unknown[] = [];
    const stop = effect(() => {
      snapshots.push([
        form.host.disabled(),
        form.host.readOnly(),
        form.host.errors("email"),
        form.host.fieldState("email"),
      ]);
    });
    expect(form.api().formContext).toBe(form.host);
    expect(form.host.fieldState("email")).toBeUndefined();
    form.machine.updateProps({ disabled: true, readOnly: true });
    form.host.setFieldState("email", { disabled: false, size: "lg" });
    await flush();
    form.api().setErrors({ email: "Server error" });
    expect(snapshots.at(-1)).toEqual([
      true,
      true,
      ["Server error"],
      { disabled: false, size: "lg" },
    ]);
    form.host.setFieldState("email", { disabled: undefined, size: undefined });
    await flush();
    expect(form.host.fieldState("email")).toEqual({
      disabled: undefined,
      size: undefined,
    });
    form.api().clearErrors();
    expect(form.host.errors("email")).toEqual([]);
    expect(form.api().formContext).toBe(form.host);
    expect("bus" in form.api()).toBe(false);
    stop();
    form.machine.stop();
  });

  it("registers, validates interaction triggers, applies wrapper rules, and unregisters by identity", async () => {
    const form = createForm();
    let value = "";
    const onValidationChange = vi.fn();
    const cleanup = form.host.register({
      name: "email",
      id: "old",
      getValue: () => value,
      getRules: () => [{ required: true, message: "Required" }],
      onValidationChange,
    });
    await flush();
    form.host.notify("focus", { name: "email" });
    await flush();
    expect(form.api().fieldStates.email?.isFocused).toBe(true);
    form.host.notify("blur", { name: "email" });
    await flush();
    expect(form.host.errors("email")).toEqual(["Required"]);
    form.host.setFieldRules("email", () => [
      { minLength: 3, message: "Too short" },
    ]);
    value = "ab";
    form.host.notify("input", { name: "email", value });
    await flush();
    expect(form.host.errors("email")).toEqual(["Too short"]);
    value = "abc";
    form.host.notify("change", { name: "email", value });
    await flush();
    expect((await form.api().validate()).valid).toBe(true);
    expect(onValidationChange).toHaveBeenCalled();
    const replacement = form.host.register({
      name: "email",
      id: "new",
      getValue: () => value,
    });
    await flush();
    cleanup();
    await flush();
    expect(form.machine.service.refs.get("fields").get("email")?.id).toBe(
      "new",
    );
    replacement();
    await flush();
    expect(form.api().values).toEqual({});
    form.machine.stop();
  });

  it("reactively injects a late provider and disposes its listener", async () => {
    const parent = component();
    const child = component(parent);
    const bound = bindFormField({
      component: child,
      id: "email",
      getName: () => "email",
      getValue: () => "a",
    });
    const seen: unknown[] = [];
    const stop = effect(() => {
      seen.push(bound.host?.disabled());
    });
    const form = createForm();
    provideFormHost(parent, form.host);
    await flush();
    expect(bound.host).toBe(form.host);
    expect(form.api().values).toEqual({ email: "a" });
    form.machine.updateProps({ disabled: true });
    expect(seen).toEqual([undefined, false, true]);
    bound.dispose();
    await flush();
    expect(form.api().values).toEqual({});
    provideFormHost(parent, form.host);
    await flush();
    expect(bound.host).toBeUndefined();
    stop();
    form.machine.stop();
  });

  it("switches scoped hosts and field names without cross-talk, and supports explicit unlink", async () => {
    const parent = component();
    const child = component(parent);
    const a = createForm();
    const b = createForm();
    provideFormHost(parent, a.host, "a");
    await flush();
    provideFormHost(parent, b.host, "b");
    await flush();
    expect(getFormHostKey(" a ")).toBe(getFormHostKey("a"));
    expect(injectFormHost(child, "a")).toBe(a.host);
    const formId = signal("a");
    const name = signal("first");
    const host = signal<FormHostContext | null | undefined>(undefined);
    const bound = bindFormField({
      component: child,
      id: "field",
      getHost: host,
      getFormId: formId,
      getName: name,
      getValue: () => "value",
    });
    formId("b");
    name("second");
    await flush();
    expect(a.api().values).toEqual({});
    expect(b.api().values).toEqual({ second: "value" });
    host(a.host);
    await flush();
    expect(b.api().values).toEqual({});
    expect(a.api().values).toEqual({ second: "value" });
    name("renamed");
    await flush();
    expect(bound.host).toBe(a.host);
    expect(a.api().values).toEqual({ renamed: "value" });
    host(null);
    await flush();
    expect(a.api().values).toEqual({});
    expect(bound.host).toBeUndefined();
    bound.dispose();
    await flush();
    a.machine.stop();
    b.machine.stop();
  });

  it("keeps registration stable across value, errors, disabled, and named rule updates", async () => {
    const form = createForm();
    const register = vi.spyOn(form.host, "register");
    const value = signal("initial");
    const disabled = signal(false);
    const rules = signal<FormRule[]>([]);
    const bound = bindFormField({
      host: form.host,
      id: "field",
      getName: () => "field",
      getValue: value,
      isDisabled: disabled,
      getRules: rules,
    });
    await flush();
    value("changed");
    disabled(true);
    rules([{ required: true }]);
    form.api().setErrors({ field: "Server error" });
    form.machine.updateProps({ disabled: true });
    await flush();
    expect(register).toHaveBeenCalledTimes(1);
    expect(form.host.errors("field")).toEqual(["Server error"]);
    expect(form.api().values).toEqual({ field: "initial" });
    bound.dispose();
    bound.dispose();
    await flush();
    expect(form.api().values).toEqual({});
    form.machine.stop();
  });

  it("tracks unnamed rule/form eligibility without re-registering eligible fields", async () => {
    const form = createForm();
    const register = vi.spyOn(form.host, "register");
    const rules = signal<FormRule[]>([]);
    const formId = signal<string | undefined>(undefined);
    const name = signal("");
    const bound = bindFormField({
      host: form.host,
      id: "anonymous",
      getName: name,
      getFormId: formId,
      getRules: rules,
      getValue: () => "value",
    });
    expect(register).not.toHaveBeenCalled();
    rules([{ required: true }]);
    await flush();
    expect(form.api().values).toEqual({ anonymous: "value" });
    rules([{ minLength: 2 }]);
    expect(register).toHaveBeenCalledTimes(1);
    rules([]);
    await flush();
    expect(form.api().values).toEqual({});
    formId("explicit");
    await flush();
    expect(form.api().values).toEqual({ anonymous: "value" });
    name("named");
    await flush();
    expect(form.api().values).toEqual({ named: "value" });
    formId(undefined);
    expect(register).toHaveBeenCalledTimes(3);
    name("");
    await flush();
    expect(form.api().values).toEqual({});
    bound.dispose();
    rules([{ required: true }]);
    expect(register).toHaveBeenCalledTimes(3);
    form.machine.stop();
  });

  it("preserves discovery on name changes and resumes late injection after explicit disconnect", async () => {
    const parent = component();
    const child = component(parent);
    const discover = vi.spyOn(child, "selectOwnerComponent");
    const name = signal("first");
    const host = signal<FormHostContext | null | undefined>(undefined);
    const bound = bindFormField({
      component: child,
      getHost: host,
      id: "field",
      getName: name,
      getValue: () => "value",
    });
    const calls = discover.mock.calls.length;
    name("second");
    expect(discover).toHaveBeenCalledTimes(calls);
    host(null);
    const form = createForm();
    provideFormHost(parent, form.host);
    await flush();
    expect(bound.host).toBeUndefined();
    host(undefined);
    await flush();
    expect(form.api().values).toEqual({ second: "value" });
    bound.dispose();
    host(form.host);
    name("third");
    provideFormHost(parent, form.host);
    await flush();
    expect(bound.host).toBeUndefined();
    expect(form.api().values).toEqual({});
    form.machine.stop();
  });

  it("suppresses programmatic value/reset echoes while preserving user notifications", async () => {
    const onChange = vi.fn();
    const form = createForm({ onChange });
    const values = new Map<string, any>();
    const refs = {
      get: (key: string) => values.get(key),
      set: (key: string, value: any) => values.set(key, value),
    };
    let value = "initial";
    const bound = setupFormFieldSync(
      {
        host: form.host,
        id: "field",
        getName: () => "field",
        getValue: () => value,
        setValue: (next) => {
          value = next;
          refs.get("formField")?.emitChange(value);
        },
        resetValue: () => {
          value = "initial";
          refs.get("formField")?.emitInput(value);
          refs.get("formField")?.emitChange(value);
        },
      },
      refs,
    );
    await flush();
    form.api().setFieldValue("field", "programmatic");
    expect(value).toBe("programmatic");
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    value = "user";
    bound.emitChange(value);
    await flush();
    expect(onChange).toHaveBeenCalledTimes(2);
    form.api().reset();
    expect(value).toBe("initial");
    expect(form.api().values).toEqual({ field: "initial" });
    await flush();
    expect(onChange).toHaveBeenCalledTimes(2);
    cleanupFormFieldSync(refs);
    await flush();
    expect(bound.host).toBeUndefined();
    expect(form.api().values).toEqual({});
    form.machine.stop();
  });
});
