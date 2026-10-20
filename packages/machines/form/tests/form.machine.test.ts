import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import type { MiniAppComponent } from "@code-ui/utils";
import {
  pinInputMachine,
  connectPinInput,
  type PinInputProps,
  type PinInputSchema,
} from "@code-ui/pin-input";
import {
  formMachine,
  connectForm,
  injectFormBus,
  bindFormField,
  type FormProps,
  type FormSchema,
} from "../src";
import { formRules } from "../src/form.rules";

const flush = () => new Promise((resolve) => queueMicrotask(resolve));

function createMockComponent(
  owner?: MiniAppComponent | null,
): MiniAppComponent {
  return {
    triggerEvent: vi.fn(),
    selectOwnerComponent: () => (owner ?? null) as any,
  };
}

function createFormInstance(props: FormProps = {}) {
  const machine = new MiniappMachine<FormSchema>(formMachine, props);
  machine.start();
  return {
    machine,
    api: () => connectForm(machine.service),
    send: (ev: FormSchema["event"]) => machine.send(ev),
  };
}

function createPinInputInstance(props: PinInputProps = {}) {
  const machine = new MiniappMachine<PinInputSchema>(pinInputMachine, props);
  machine.start();
  return {
    machine,
    api: () => connectPinInput(machine.service),
    send: (ev: PinInputSchema["event"]) => machine.send(ev),
  };
}

function registerFieldRules(
  bus: any,
  name: string,
  rules: FormRule[],
  required = false,
) {
  bus?.emit("field:rules", {
    name,
    getRules: () => rules,
    required,
  });
}

describe("formMachine & PinInput integration", () => {
  it("provides FormBus on parent component and injects it into child PinInput via @code-ui/context", () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });
    const injectedBus = injectFormBus(pinComp);

    expect(injectedBus).toBeDefined();
    expect(injectedBus).toBe(form.api().bus);

    const pin = createPinInputInstance({
      component: pinComp,
      name: "otp",
      length: 4,
      defaultValue: ["1", "2", "", ""],
    });

    expect(form.api().getValues()).toEqual({ otp: "12" });
    expect(pin.api().valueAsString).toBe("12");
  });

  it("supports WeChat <slot /> hierarchy where Form and PinInput share the same Page owner", async () => {
    const pageOwner = createMockComponent();
    const formComp = createMockComponent(pageOwner);
    const pinComp = createMockComponent(pageOwner);

    const form = createFormInstance({ component: formComp });
    const pin = createPinInputInstance({
      component: pinComp,
      name: "passcode",
      length: 4,
    });
    registerFieldRules(form.api().bus, "passcode", [
      formRules.required("Passcode is required"),
    ]);

    expect(injectFormBus(pinComp)).toBe(form.api().bus);
    expect(form.api().getValues()).toEqual({ passcode: "" });

    pin.api().handleBlur();
    await flush();
    expect(form.api().errorBag).toEqual({
      passcode: ["Passcode is required"],
    });
    expect(pin.api().invalid).toBe(true);
  });

  it("validates Vuetify-style rules on PinInput when EventBus emits input, change, and blur", async () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });
    const pin = createPinInputInstance({
      component: pinComp,
      name: "pin",
      length: 4,
    });
    registerFieldRules(form.api().bus, "pin", [
      formRules.required("PIN is required"),
      (val: string) => val.length === 4 || "PIN must be 4 digits",
    ]);

    expect(form.api().isValid).toBe(true);
    expect(form.api().errorBag).toEqual({});

    // User types 1st digit -> triggers input & change on FormBus
    pin.send({ type: "INPUT.CHANGE", index: 0, value: "1" });
    await flush();

    expect(form.api().values.pin).toBe("1");
    expect(form.api().isDirty).toBe(true);
    expect(form.api().isValid).toBe(false);
    expect(form.api().errorBag).toEqual({
      pin: ["PIN must be 4 digits"],
    });
    expect(pin.api().invalid).toBe(true);
    expect(pin.api().rootProps["data-invalid"]).toBe("true");

    // User completes all 4 digits -> error clears automatically
    pin.send({ type: "INPUT.CHANGE", index: 1, value: "234" });
    await flush();

    expect(form.api().values.pin).toBe("1234");
    expect(form.api().isValid).toBe(true);
    expect(form.api().errorBag).toEqual({});
    expect(pin.api().invalid).toBe(false);
  });

  it("supports lazy validation mode (only validates on blur/submit first, then eagerly clears errors)", async () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({
      component: formComp,
      validateLazy: true,
    });
    const pin = createPinInputInstance({
      component: pinComp,
      name: "pin",
      length: 4,
    });
    registerFieldRules(form.api().bus, "pin", [
      formRules.exactLength(4, "Enter 4 digits"),
    ]);

    // Typing before blur does not show error in lazy mode
    pin.send({ type: "INPUT.CHANGE", index: 0, value: "1" });
    await flush();
    expect(form.api().errorBag).toEqual({});
    expect(pin.api().invalid).toBe(false);

    // Blurring triggers validation and populates errorBag
    pin.send({ type: "INPUT.BLUR", index: 1 });
    await flush();
    expect(form.api().isTouched).toBe(true);
    expect(form.api().errorBag).toEqual({ pin: ["Enter 4 digits"] });
    expect(pin.api().invalid).toBe(true);

    // Once touched/errored, typing remaining digits clears the error immediately
    pin.send({ type: "INPUT.CHANGE", index: 1, value: "234" });
    await flush();
    expect(form.api().errorBag).toEqual({});
    expect(pin.api().invalid).toBe(false);
  });

  it("supports async rules returning Promise<boolean | string> and tracks isValidating", async () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    let resolveRule: ((res: boolean | string) => void) | undefined;
    const asyncRule = vi.fn(
      (val: string) =>
        new Promise<boolean | string>((resolve) => {
          resolveRule = () =>
            resolve(val === "9999" ? true : "Invalid server OTP");
        }),
    );

    const form = createFormInstance({
      component: formComp,
      validateOn: "submit",
    });
    const pin = createPinInputInstance({
      component: pinComp,
      name: "otp",
      length: 4,
      defaultValue: ["1", "2", "3", "4"],
    });
    registerFieldRules(form.api().bus, "otp", [asyncRule]);

    const validatePromise = form.api().validate();
    expect(form.api().isValidating).toBe(true);
    expect(form.api().state).toBe("validating");

    resolveRule?.(false);
    const result = await validatePromise;

    expect(form.api().isValidating).toBe(false);
    expect(result.valid).toBe(false);
    expect(form.api().errorBag).toEqual({ otp: ["Invalid server OTP"] });
    expect(pin.api().invalid).toBe(true);
  });

  it("focuses the first invalid field on failed submit when focusOnError is true", async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const formComp = createMockComponent();
    const pin1Comp = createMockComponent(formComp);
    const pin2Comp = createMockComponent(formComp);

    const form = createFormInstance({
      component: formComp,
      focusOnError: true,
      onSubmit,
      onError,
    });

    const pin1 = createPinInputInstance({
      component: pin1Comp,
      name: "pin1",
      length: 4,
      defaultValue: ["1", "2", "3", "4"],
    });
    registerFieldRules(form.api().bus, "pin1", [formRules.exactLength(4)]);

    const pin2 = createPinInputInstance({
      component: pin2Comp,
      name: "pin2",
      length: 4,
    });
    registerFieldRules(form.api().bus, "pin2", [
      formRules.required("Second PIN is required"),
      formRules.exactLength(4),
    ]);

    expect(pin1.api().state).toBe("idle");
    expect(pin2.api().state).toBe("idle");

    const submitRes = await form.api().submit();

    expect(submitRes.valid).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(form.api().state).toBe("error");
    expect(form.api().errorBag).toEqual({
      pin2: ["Second PIN is required"],
    });

    // pin1 is valid so it stays idle; pin2 is the first invalid field so it is focused!
    expect(pin1.api().state).toBe("idle");
    expect(pin2.api().state).toBe("focused");
    expect(pin2.api().focusedIndex).toBe(0);
  });

  it("resets all field values to initial values and clears errorBag on reset()", async () => {
    const onReset = vi.fn();
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({
      component: formComp,
      onReset,
    });

    const pin = createPinInputInstance({
      component: pinComp,
      name: "pin",
      length: 4,
      defaultValue: ["0", "0", "0", "0"],
    });
    registerFieldRules(form.api().bus, "pin", [
      (val: string) => val === "1234" || "Must be 1234",
    ]);

    pin.send({ type: "SET_VALUE", value: "9999" });
    await flush();

    expect(pin.api().valueAsString).toBe("9999");
    expect(form.api().isDirty).toBe(true);
    expect(form.api().errorBag).toEqual({ pin: ["Must be 1234"] });
    expect(pin.api().invalid).toBe(true);

    form.api().reset();

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(pin.api().valueAsString).toBe("0000");
    expect(pin.api().state).toBe("idle");
    expect(pin.api().focusedIndex).toBe(-1);
    expect(pin.api().invalid).toBe(false);
    expect(form.api().errorBag).toEqual({});
    expect(form.api().isDirty).toBe(false);
    expect(form.api().isTouched).toBe(false);
    expect(form.api().state).toBe("idle");
  });

  it("clears errors without resetting values when resetValidation() is called", async () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });
    const pin = createPinInputInstance({
      component: pinComp,
      name: "pin",
      length: 4,
    });
    registerFieldRules(form.api().bus, "pin", [formRules.required("Required")]);

    await form.api().validate();
    expect(form.api().hasErrors).toBe(true);
    expect(pin.api().invalid).toBe(true);

    pin.send({ type: "SET_VALUE", value: ["1", "2", "", ""] });
    await flush();

    form.api().resetValidation();
    expect(form.api().hasErrors).toBe(false);
    expect(form.api().errorBag).toEqual({});
    expect(pin.api().invalid).toBe(false);
    expect(pin.api().valueAsString).toBe("12");
  });

  it("supports manual server error injection via setErrors() and propagates to child fields", () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });
    const pin = createPinInputInstance({
      component: pinComp,
      name: "otp",
      length: 4,
      defaultValue: ["1", "2", "3", "4"],
    });

    form.api().setErrors({
      otp: "OTP has expired, please request a new one",
    });

    expect(form.api().state).toBe("error");
    expect(form.api().errorBag).toEqual({
      otp: ["OTP has expired, please request a new one"],
    });
    expect(pin.api().invalid).toBe(true);
  });

  it("propagates Form-level disabled and readOnly props to registered child controls", () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({
      component: formComp,
      disabled: true,
    });
    const pin = createPinInputInstance({
      component: pinComp,
      name: "otp",
      length: 4,
    });

    expect(pin.api().disabled).toBe(true);
    expect(pin.api().rootProps["data-disabled"]).toBe("true");

    form.machine.updateProps({ disabled: false, readOnly: true });
    expect(pin.api().disabled).toBe(false);
    expect(pin.api().readOnly).toBe(true);
    expect(pin.api().rootProps["data-disabled"]).toBe("false");
    expect(pin.api().rootProps["data-readonly"]).toBe("true");
  });

  it("supports custom fields (Input, Switch, Checkbox, Radio) via bindFormField and cross-field rules", async () => {
    const formComp = createMockComponent();
    const emailComp = createMockComponent(formComp);
    const confirmComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });

    let emailVal = "invalid-email";
    const emailField = bindFormField({
      component: emailComp,
      id: "email-input",
      getName: () => "email",
      getValue: () => emailVal,
      setValue: (v) => {
        emailVal = v;
      },
      resetValue: () => {
        emailVal = "";
      },
      getRules: () => [formRules.required(), formRules.email()],
    });

    let confirmVal = "other@example.com";
    const confirmField = bindFormField({
      component: confirmComp,
      id: "confirm-input",
      getName: () => "confirmEmail",
      getValue: () => confirmVal,
      setValue: (v) => {
        confirmVal = v;
      },
      resetValue: () => {
        confirmVal = "";
      },
      getRules: () => [
        formRules.required(),
        formRules.sameAs("email", "Emails must match"),
      ],
    });

    const res1 = await form.api().validate();
    expect(res1.valid).toBe(false);
    expect(form.api().errorBag).toEqual({
      email: ["Invalid email address"],
      confirmEmail: ["Emails must match"],
    });

    emailVal = "user@example.com";
    emailField.emitChange(emailVal);
    confirmVal = "user@example.com";
    confirmField.emitChange(confirmVal);

    const res2 = await form.api().submit();
    expect(res2.valid).toBe(true);
    expect(res2.values).toEqual({
      email: "user@example.com",
      confirmEmail: "user@example.com",
    });

    emailField.dispose();
    confirmField.dispose();
  });

  it("supports declarative FormRuleObject descriptors and JSON-cloned formRules for WXML data bindings", async () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });
    const serializedRules = JSON.parse(
      JSON.stringify([
        formRules.required("PIN is required"),
        formRules.exactLength(4, "Must be 4 digits"),
        formRules.numeric("Digits only"),
      ]),
    );

    const pin = createPinInputInstance({
      component: pinComp,
      name: "pin",
      length: 4,
    });
    registerFieldRules(form.api().bus, "pin", serializedRules);

    const res1 = await form.api().validate();
    expect(res1.valid).toBe(false);
    expect(form.api().errorBag).toEqual({
      pin: ["PIN is required"],
    });

    pin.send({ type: "SET_VALUE", value: ["1", "2", "a", "4"] });
    await flush();
    expect(form.api().errorBag).toEqual({
      pin: ["Digits only"],
    });

    pin.send({ type: "SET_VALUE", value: ["1", "2", "3", "4"] });
    await flush();
    expect(form.api().isValid).toBe(true);
    expect(form.api().errorBag).toEqual({});
  });

  it("supports Page-level components where selectOwnerComponent() returns null and child attaches before Form", async () => {
    // In WeChat MiniProgram, components declared directly in a Page WXML have selectOwnerComponent() === null
    // and <slot /> children can fire attached() BEFORE the parent <c-form> fires attached().
    const pinComp = {
      selectOwnerComponent: () => null,
      getPageId: () => "page:index",
    } as unknown as MiniAppComponent;

    const standalonePinComp = {
      selectOwnerComponent: () => null,
      getPageId: () => "page:index",
    } as unknown as MiniAppComponent;

    const formComp = {
      selectOwnerComponent: () => null,
      getPageId: () => "page:index",
    } as unknown as MiniAppComponent;

    // 1. Standalone PinInput (no name, no rules) attaches first on the same Page
    const standalonePin = createPinInputInstance({
      component: standalonePinComp,
      length: 4,
    });

    // 2. Form PinInput (has name="pin") attaches BEFORE <c-form>!
    const pin = createPinInputInstance({
      component: pinComp,
      name: "pin",
      length: 4,
    });

    // 3. <c-form> attaches AFTER its <slot /> children
    const form = createFormInstance({ component: formComp });
    registerFieldRules(form.api().bus, "pin", [
      { required: true, message: "PIN required" },
      { exactLength: 4, message: "Must be 4 digits" },
    ]);

    // Standalone PinInput should NOT be registered in the form
    expect(Object.keys(form.api().fieldStates)).toEqual(["pin"]);

    // Typing 3 digits into `pin` should validate immediately on input/change
    pin.send({ type: "SET_VALUE", value: ["1", "2", "3", ""] });
    await flush();
    expect(form.api().errorBag).toEqual({
      pin: ["Must be 4 digits"],
    });
    expect(pin.api().invalid).toBe(true);

    // Standalone PinInput remains untouched by form reset
    standalonePin.send({ type: "SET_VALUE", value: ["9", "9", "9", "9"] });
    await flush();
    form.api().reset();
    expect(pin.api().valueAsString).toBe("");
    expect(standalonePin.api().valueAsString).toBe("9999");
  });

  it("handles dynamic conditional fields (wx:if mount/unmount): skips unmounted rules, clears stale errors/values, and recovers form state to idle", async () => {
    const onSubmit = vi.fn();
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({
      component: formComp,
      onSubmit,
    });

    // 1. Dynamically mount PinInput (wx:if="{{ true }}")
    const pin = createPinInputInstance({
      component: pinComp,
      name: "dynamicPin",
      length: 4,
    });
    registerFieldRules(form.api().bus, "dynamicPin", [
      formRules.required("PIN is required"),
      formRules.exactLength(4, "Must be 4 digits"),
    ]);

    // User types partial value -> triggers validation error and puts form in "error" state
    pin.send({ type: "INPUT.CHANGE", index: 0, value: "12" });
    await flush();

    const failedSubmit = await form.api().submit();
    expect(failedSubmit.valid).toBe(false);
    expect(form.api().state).toBe("error");
    expect(form.api().hasErrors).toBe(true);
    expect(form.api().values).toEqual({ dynamicPin: "12" });

    // 2. Dynamically unmount PinInput (wx:if="{{ false }}" -> detached -> machine.stop())
    pin.machine.stop();

    // Error state, errorBag, and stale value should all be cleaned up automatically
    expect(form.api().state).toBe("idle");
    expect(form.api().hasErrors).toBe(false);
    expect(form.api().isValid).toBe(true);
    expect(form.api().errorBag).toEqual({});
    expect(form.api().values).toEqual({});
    expect(form.api().isDirty).toBe(false);
    expect(form.api().isTouched).toBe(false);

    // 3. Submitting while PinInput is unmounted skips its rules and succeeds with clean values
    const okSubmit = await form.api().submit();
    expect(okSubmit.valid).toBe(true);
    expect(okSubmit.values).toEqual({});
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      valid: true,
      values: {},
      errors: [],
      errorBag: {},
    });
  });

  it("scopes multiple forms on the same Page using form='form-id' without cross-talk", async () => {
    // Simulate WeChat MiniProgram Page fallback where selectOwnerComponent() returns the Page for all components
    const sharedPage = createMockComponent();
    const loginFormComp = createMockComponent(sharedPage);
    const transferFormComp = createMockComponent(sharedPage);
    const loginPinComp = createMockComponent(sharedPage);
    const transferPinComp = createMockComponent(sharedPage);

    const onLoginSubmit = vi.fn();
    const onTransferSubmit = vi.fn();

    const loginForm = createFormInstance({
      id: "login-form",
      component: loginFormComp,
      onSubmit: onLoginSubmit,
    });
    const transferForm = createFormInstance({
      id: "transfer-form",
      component: transferFormComp,
      onSubmit: onTransferSubmit,
    });

    const loginPin = createPinInputInstance({
      id: "login-pin",
      form: "login-form",
      name: "pin",
      length: 4,
      component: loginPinComp,
    });
    registerFieldRules(loginForm.api().bus, "pin", [
      { required: true, exactLength: 4, message: "Login PIN required" },
    ]);

    const transferPin = createPinInputInstance({
      id: "transfer-pin",
      form: "transfer-form",
      name: "pin",
      length: 6,
      component: transferPinComp,
    });
    registerFieldRules(transferForm.api().bus, "pin", [
      { required: true, exactLength: 6, message: "Transfer PIN required" },
    ]);

    // Fill only loginPin (4 digits), leaving transferPin empty
    loginPin.api().setValue("1234");
    await flush();

    // Submitting loginForm should succeed and NOT validate transferPin
    const loginResult = await loginForm.api().submit();
    expect(loginResult.valid).toBe(true);
    expect(loginResult.values).toEqual({ pin: "1234" });
    expect(onLoginSubmit).toHaveBeenCalledTimes(1);
    expect(transferPin.api().invalid).toBe(false);

    // Submitting transferForm should fail on transferPin and NOT affect loginPin
    const transferResult = await transferForm.api().submit();
    expect(transferResult.valid).toBe(false);
    expect(transferPin.api().invalid).toBe(true);
    expect(loginPin.api().invalid).toBe(false);
    expect(onTransferSubmit).not.toHaveBeenCalled();

    // Fill transferPin (6 digits) and submit transferForm
    transferPin.api().setValue("654321");
    await flush();

    const transferOk = await transferForm.api().submit();
    expect(transferOk.valid).toBe(true);
    expect(transferOk.values).toEqual({ pin: "654321" });
    expect(onTransferSubmit).toHaveBeenCalledTimes(1);
  });

  it("isolates two forms on the same Page via direct formBus linking without form props on child inputs", async () => {
    const sharedPage = createMockComponent();
    const form1Comp = createMockComponent(sharedPage);
    const form2Comp = createMockComponent(sharedPage);
    const pin1Comp = createMockComponent(sharedPage);
    const pin2Comp = createMockComponent(sharedPage);

    const onForm1Submit = vi.fn();
    const onForm2Submit = vi.fn();

    const form1 = createFormInstance({
      id: "form-1",
      component: form1Comp,
      onSubmit: onForm1Submit,
    });
    const form2 = createFormInstance({
      id: "form-2",
      component: form2Comp,
      onSubmit: onForm2Submit,
    });

    // Both inputs have identical name="pin" and NO form prop specified
    // They are linked to their respective forms via formBus (simulating relations linking)
    const pin1 = createPinInputInstance({
      id: "pin-1",
      name: "pin",
      length: 4,
      component: pin1Comp,
    });
    const pin2 = createPinInputInstance({
      id: "pin-2",
      name: "pin",
      length: 6,
      component: pin2Comp,
    });

    // Simulate relations linking formBus dynamically
    pin1.machine.updateProps({ formBus: form1.api().bus });
    pin2.machine.updateProps({ formBus: form2.api().bus });
    registerFieldRules(form1.api().bus, "pin", [
      { required: true, exactLength: 4, message: "PIN 1 required" },
    ]);
    registerFieldRules(form2.api().bus, "pin", [
      { required: true, exactLength: 6, message: "PIN 2 required" },
    ]);
    await flush();

    // Fill only pin1 (4 digits)
    pin1.api().setValue("1234");
    await flush();

    // Form 1 submit succeeds
    const form1Res = await form1.api().submit();
    expect(form1Res.valid).toBe(true);
    expect(form1Res.values).toEqual({ pin: "1234" });
    expect(onForm1Submit).toHaveBeenCalledTimes(1);
    expect(pin2.api().invalid).toBe(false);

    // Form 2 submit fails because pin2 is empty, without affecting pin1
    const form2Res = await form2.api().submit();
    expect(form2Res.valid).toBe(false);
    expect(pin2.api().invalid).toBe(true);
    expect(pin1.api().invalid).toBe(false);
    expect(onForm2Submit).not.toHaveBeenCalled();

    // Fill pin2 (6 digits) and submit Form 2
    pin2.api().setValue("654321");
    await flush();

    const form2Ok = await form2.api().submit();
    expect(form2Ok.valid).toBe(true);
    expect(form2Ok.values).toEqual({ pin: "654321" });
    expect(onForm2Submit).toHaveBeenCalledTimes(1);
  });

  it("supports rules declared on field wrapper via field:rules event and emits field:error on validation", async () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({
      component: formComp,
      validateOn: "blur",
    });

    // PinInput is headless and has NO rules of its own
    const pin = createPinInputInstance({
      component: pinComp,
      name: "securityPin",
      length: 4,
    });

    const bus = form.api().bus;
    expect(bus).toBeDefined();

    // Mock form-field behavior listening to bus
    let receivedError: string[] = [];
    let receivedValid = true;
    bus.on("field:error", (payload: any) => {
      if (payload.name === "securityPin") {
        receivedError = payload.errors;
        receivedValid = payload.isValid;
      }
    });

    let resetCalled = false;
    bus.on("reset", () => {
      resetCalled = true;
    });

    let clearErrorsCalled = false;
    bus.on("clear-errors", () => {
      clearErrorsCalled = true;
    });

    // Form-field emits its rules to the bus
    bus.emit("field:rules", {
      name: "securityPin",
      getRules: () => [
        formRules.required("Security PIN is required"),
        formRules.exactLength(4, "Must be exactly 4 digits"),
      ],
      required: true,
    });
    await flush();

    // Trigger blur on empty pin input -> fails validation
    pin.api().handleBlur();
    await flush();

    expect(receivedValid).toBe(false);
    expect(receivedError).toEqual(["Security PIN is required"]);
    expect(form.api().errorBag.securityPin).toEqual(["Security PIN is required"]);
    expect(pin.api().invalid).toBe(true);

    // Enter partial input (2 digits) -> fails exactLength(4)
    pin.api().setValue("12");
    pin.api().handleBlur();
    await flush();

    expect(receivedValid).toBe(false);
    expect(receivedError).toEqual(["Must be exactly 4 digits"]);
    expect(form.api().errorBag.securityPin).toEqual(["Must be exactly 4 digits"]);

    // Enter complete valid input (4 digits) -> passes validation
    pin.api().setValue("1234");
    pin.api().handleBlur();
    await flush();

    expect(receivedValid).toBe(true);
    expect(receivedError).toEqual([]);
    expect(form.api().errorBag.securityPin).toBeUndefined();
    expect(pin.api().invalid).toBe(false);

    // Test clearErrors
    form.api().resetValidation();
    await flush();
    expect(clearErrorsCalled).toBe(true);

    // Test form reset
    form.api().reset();
    await flush();
    expect(resetCalled).toBe(true);
    expect(pin.api().valueAsString).toBe("");
  });

  it("dynamically prepends required rule when field wrapper sets required: true without explicit required rule", async () => {
    const formComp = createMockComponent();
    const pinComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });
    const pin = createPinInputInstance({
      component: pinComp,
      name: "code",
      length: 4,
    });

    const bus = form.api().bus;
    let fieldErrors: string[] = [];
    bus.on("field:error", (payload: any) => {
      if (payload.name === "code") {
        fieldErrors = payload.errors;
      }
    });

    // Field wrapper has only numeric rule, but required: true with label
    const label = "Verification Code";
    bus.emit("field:rules", {
      name: "code",
      getRules: () => [
        formRules.required(`${label} is required`),
        formRules.numeric("Must be numeric"),
      ],
      required: true,
    });
    await flush();

    const submitRes = await form.api().submit();
    expect(submitRes.valid).toBe(false);
    expect(fieldErrors).toEqual(["Verification Code is required"]);

    form.machine.stop();
    pin.machine.stop();
  });

  it("safely handles JSON-serialized RegExp objects across MiniProgram bridge and validates email", async () => {
    const formComp = createMockComponent();
    const inputComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });

    // Simulate WeChat MiniProgram Page data serialization where RegExp is serialized with JSON.stringify
    const originalRules = [
      { required: true, message: "Email address is required" },
      {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Invalid email address format",
      },
    ];
    const serializedRules = JSON.parse(JSON.stringify(originalRules));

    let emailVal = "";
    const emailField = bindFormField({
      component: inputComp,
      id: "email-input",
      getName: () => "email",
      getValue: () => emailVal,
      setValue: (v) => {
        emailVal = v;
      },
      getRules: () => serializedRules,
    });

    // 1. Invalid email 'iji' (contained characters from [object Object] which caused bug)
    emailVal = "iji";
    emailField.emitInput("iji");
    await flush();

    expect(form.api().isValid).toBe(false);
    expect(form.api().errorBag).toEqual({
      email: ["Invalid email address format"],
    });

    // 2. Another invalid email 'hello'
    emailVal = "hello";
    emailField.emitInput("hello");
    await flush();

    expect(form.api().isValid).toBe(false);
    expect(form.api().errorBag).toEqual({
      email: ["Invalid email address format"],
    });

    // 3. Valid email
    emailVal = "alice@example.com";
    emailField.emitInput("alice@example.com");
    await flush();

    expect(form.api().isValid).toBe(true);
    expect(form.api().errorBag).toEqual({});

    emailField.dispose();
    form.machine.stop();
  });

  it("supports email: true and type: 'email' rules", async () => {
    const formComp = createMockComponent();
    const inputComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });

    let emailVal = "";
    const emailField = bindFormField({
      component: inputComp,
      id: "email-input",
      getName: () => "email",
      getValue: () => emailVal,
      getRules: () => [
        { required: true, message: "Email required" },
        { email: true, message: "Invalid email" },
      ],
    });

    emailVal = "iji";
    emailField.emitInput("iji");
    await flush();
    expect(form.api().errorBag).toEqual({ email: ["Invalid email"] });

    emailVal = "test@domain.com";
    emailField.emitInput("test@domain.com");
    await flush();
    expect(form.api().errorBag).toEqual({});

    emailField.dispose();
    form.machine.stop();
  });

  it("supports string patterns and regex with /.../ syntax", async () => {
    const formComp = createMockComponent();
    const inputComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });

    let val = "";
    const field = bindFormField({
      component: inputComp,
      id: "code-input",
      getName: () => "code",
      getValue: () => val,
      getRules: () => [
        { pattern: "^[0-9]{4}$", message: "Must be 4 digits" },
      ],
    });

    val = "abc";
    field.emitInput("abc");
    await flush();
    expect(form.api().errorBag).toEqual({ code: ["Must be 4 digits"] });

    val = "1234";
    field.emitInput("1234");
    await flush();
    expect(form.api().errorBag).toEqual({});

    field.dispose();
    form.machine.stop();
  });

  it("does not fail intermittently on repeated validations when regex has 'g' flag", async () => {
    const formComp = createMockComponent();
    const inputComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });

    let val = "1234";
    const field = bindFormField({
      component: inputComp,
      id: "code-input",
      getName: () => "code",
      getValue: () => val,
      getRules: () => [
        { pattern: /^[0-9]+$/g, message: "Digits only" },
      ],
    });

    // Run 5 sequential validations with the exact same value
    for (let i = 0; i < 5; i++) {
      field.emitInput("1234");
      await flush();
      expect(form.api().errorBag).toEqual({});
      expect(form.api().isValid).toBe(true);
    }

    field.dispose();
    form.machine.stop();
  });

  it("safely ignores empty object { pattern: {} } without creating /[object Object]/", async () => {
    const formComp = createMockComponent();
    const inputComp = createMockComponent(formComp);

    const form = createFormInstance({ component: formComp });

    let val = "iji";
    const field = bindFormField({
      component: inputComp,
      id: "test-input",
      getName: () => "test",
      getValue: () => val,
      getRules: () => [
        // Corrupt pattern object with no source/pattern
        { pattern: {} as any, message: "Invalid format" },
      ],
    });

    // Since pattern: {} is empty and has no source, it must not create /[object Object]/
    field.emitInput("iji");
    await flush();
    expect(form.api().errorBag).toEqual({});

    field.dispose();
    form.machine.stop();
  });
});
