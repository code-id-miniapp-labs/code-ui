import { describe, expect, it, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { connectForm, formMachine } from "@code-ui/form";
import { provideFormHost } from "@code-ui/form/context";
import { inputMachine } from "../src/input.machine";
import type { InputProps } from "../src/input.types";
import { textareaMachine } from "../../textarea/src/textarea.machine";
import { switchMachine } from "../../switch/src/switch.machine";
import { sliderMachine } from "../../slider/src/slider.machine";
import { pinInputMachine } from "../../pin-input/src/pin-input.machine";
import { checkboxMachine } from "../../checkbox/src/checkbox.machine";
import { checkboxGroupMachine } from "../../checkbox-group/src/checkbox-group.machine";
import { radioGroupMachine } from "../../radio-group/src/radio-group.machine";

type FieldProps = Pick<
  InputProps,
  "name" | "form" | "formContext" | "rules" | "component"
>;

const consumers = [
  {
    name: "input",
    create: (props: FieldProps) => new MiniappMachine(inputMachine, props),
  },
  {
    name: "textarea",
    create: (props: FieldProps) => new MiniappMachine(textareaMachine, props),
  },
  {
    name: "switch",
    create: (props: FieldProps) => new MiniappMachine(switchMachine, props),
  },
  {
    name: "slider",
    create: (props: FieldProps) => new MiniappMachine(sliderMachine, props),
  },
  {
    name: "pin-input",
    create: (props: FieldProps) => new MiniappMachine(pinInputMachine, props),
  },
  {
    name: "checkbox",
    create: (props: FieldProps) => new MiniappMachine(checkboxMachine, props),
  },
  {
    name: "checkbox-group",
    create: (props: FieldProps) =>
      new MiniappMachine(checkboxGroupMachine, props),
  },
  {
    name: "radio-group",
    create: (props: FieldProps) => new MiniappMachine(radioGroupMachine, props),
  },
];

const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve));

async function flush(): Promise<void> {
  await tick();
  await tick();
  await tick();
  await tick();
}

describe.each(consumers)("$name form host migration", ({ create }) => {
  it("derives facade state and rebinds host/name/rules without form mirrors", async () => {
    const first = new MiniappMachine(formMachine, {});
    const second = new MiniappMachine(formMachine, {});
    first.start();
    second.start();
    const firstApi = connectForm(first.service);
    const secondApi = connectForm(second.service);
    const field = create({ name: "before", formContext: firstApi.formContext });
    field.start();
    await flush();

    first.updateProps({ disabled: true, readOnly: true });
    firstApi.setErrors({ before: ["Server error"] });
    firstApi.formContext.setFieldState("before", { size: "sm" });
    await flush();
    expect(field.computed("isDisabled")).toBe(true);
    expect(field.computed("isReadOnly")).toBe(true);
    expect(field.computed("isInvalid")).toBe(true);
    expect(field.computed("effectiveSize")).toBe("sm");

    field.updateProps({ name: "after", formContext: secondApi.formContext });
    await flush();
    expect(field.computed("isDisabled")).toBe(false);
    expect(field.computed("isReadOnly")).toBe(false);
    expect(field.computed("isInvalid")).toBe(false);
    expect(field.computed("effectiveSize")).toBe("md");
    expect(Object.keys(connectForm(first.service).fieldStates)).not.toContain(
      "before",
    );
    expect(Object.keys(connectForm(second.service).fieldStates)).toContain(
      "after",
    );

    field.updateProps({ name: "renamed", rules: [() => "Field rule"] });
    await flush();
    expect(Object.keys(connectForm(second.service).fieldStates)).not.toContain(
      "after",
    );
    expect((await secondApi.validate()).errorBag).toEqual({
      renamed: ["Field rule"],
    });
    expect(field.computed("isInvalid")).toBe(true);
    field.updateProps({ rules: [] });
    await flush();
    expect((await secondApi.validate()).valid).toBe(true);
    expect(field.computed("isInvalid")).toBe(false);

    field.updateProps({ formContext: undefined });
    await flush();
    expect(Object.keys(connectForm(second.service).fieldStates)).not.toContain(
      "renamed",
    );
    second.updateProps({ disabled: true, readOnly: true });
    await flush();
    expect(field.computed("isDisabled")).toBe(false);
    expect(field.computed("isReadOnly")).toBe(false);
    field.stop();
    first.stop();
    second.stop();
  });

  it("reads the bound injected host and rebinds scoped form identity", async () => {
    const first = new MiniappMachine(formMachine, {});
    const second = new MiniappMachine(formMachine, {});
    first.start();
    second.start();
    const owner = { setData: vi.fn(), triggerEvent: vi.fn() };
    const component = {
      setData: vi.fn(),
      triggerEvent: vi.fn(),
      selectOwnerComponent: () => owner,
    };
    const firstApi = connectForm(first.service);
    const secondApi = connectForm(second.service);
    provideFormHost(owner, firstApi.formContext, "first");
    provideFormHost(owner, secondApi.formContext, "second");
    const field = create({ component, name: "injected", form: "first" });
    field.start();
    await flush();
    first.updateProps({ disabled: true, readOnly: true });
    firstApi.setErrors({ injected: ["Injected error"] });
    firstApi.formContext.setFieldState("injected", { size: "lg" });
    await flush();
    expect(field.computed("isDisabled")).toBe(true);
    expect(field.computed("isReadOnly")).toBe(true);
    expect(field.computed("isInvalid")).toBe(true);
    expect(field.computed("effectiveSize")).toBe("lg");

    field.updateProps({ form: "second" });
    await flush();
    expect(field.computed("isDisabled")).toBe(false);
    expect(field.computed("isReadOnly")).toBe(false);
    expect(field.computed("isInvalid")).toBe(false);
    expect(Object.keys(connectForm(first.service).fieldStates)).not.toContain(
      "injected",
    );
    expect(Object.keys(connectForm(second.service).fieldStates)).toContain(
      "injected",
    );
    second.updateProps({ disabled: true, readOnly: true });
    secondApi.setErrors({ injected: ["Second host error"] });
    secondApi.formContext.setFieldState("injected", { size: "lg" });
    await flush();
    expect(field.computed("isDisabled")).toBe(true);
    expect(field.computed("isReadOnly")).toBe(true);
    expect(field.computed("isInvalid")).toBe(true);

    field.updateProps({ formContext: null });
    await flush();
    expect(Object.keys(connectForm(second.service).fieldStates)).not.toContain(
      "injected",
    );
    expect(field.computed("isDisabled")).toBe(false);
    expect(field.computed("isReadOnly")).toBe(false);
    expect(field.computed("isInvalid")).toBe(false);
    expect(field.computed("effectiveSize")).toBe("md");

    field.updateProps({ formContext: undefined });
    await flush();
    expect(Object.keys(connectForm(second.service).fieldStates)).toContain(
      "injected",
    );
    expect(field.computed("isDisabled")).toBe(true);
    expect(field.computed("isReadOnly")).toBe(true);

    field.stop();
    await flush();
    expect(Object.keys(connectForm(second.service).fieldStates)).not.toContain(
      "injected",
    );
    first.stop();
    second.stop();
  });
});
