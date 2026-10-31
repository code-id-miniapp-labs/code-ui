import { createMachine } from "@code-ui/core";
import {
  createEventBus,
  isEmpty,
  isEqual,
  isPromise,
} from "@code-ui/utils";
import { provideFormBus } from "./form.context";
import { defaultFormProps } from "./form.props";
import { evaluateRules, shouldValidateOnTrigger } from "./form.eval";
import type {
  FormBusEvents,
  FormContext,
  FormErrorBag,
  FormFieldError,
  FormFieldRegistration,
  FormFieldState,
  FormMachine,
  FormProps,
  FormRule,
  FormSchema,
  FormService,
  FormValidateOn,
  FormValidateTrigger,
  FormValidationResult,
} from "./form.types";

type ServiceLike = Pick<
  FormService,
  "state" | "context" | "prop" | "refs" | "scope" | "computed"
>;

function cloneFieldValue<T>(val: T): T {
  if (Array.isArray(val)) return [...val] as unknown as T;
  if (val !== null && typeof val === "object") {
    return { ...(val as Record<string, any>) } as unknown as T;
  }
  return val;
}

function normalizeTargetNames(
  target: string | string[] | undefined,
  allNames: Iterable<string>,
): string[] {
  if (target === undefined) return Array.from(new Set(allNames));
  return Array.isArray(target) ? target : [target];
}

function buildErrorsList(
  errorBag: FormErrorBag,
  fields: Map<string, FormFieldRegistration>,
): FormFieldError[] {
  return Object.entries(errorBag)
    .filter(([, msgs]) => msgs && msgs.length > 0)
    .map(([name, messages]) => ({
      name,
      id: fields.get(name)?.id,
      message: messages[0] ?? "Invalid value",
      messages: [...messages],
    }));
}

function toggleArrayItem(
  arr: string[] | undefined,
  item: string,
  include: boolean,
): string[] {
  const list = arr ?? [];
  const has = list.includes(item);
  if (include && !has) return [...list, item];
  if (!include && has) return list.filter((n) => n !== item);
  return list;
}

function makeFieldState(
  name: string,
  id: string,
  value: any,
  initialValue: any,
  errors: string[] = [],
  flags: {
    isDirty?: boolean;
    isTouched?: boolean;
    isFocused?: boolean;
    isValidating?: boolean;
  } = {},
): FormFieldState {
  const safeValue = value === undefined ? "" : value;
  const safeInitialValue =
    initialValue === undefined ? safeValue : initialValue;
  return {
    name,
    id: id || name,
    value: safeValue,
    initialValue: safeInitialValue,
    errors,
    errorMessage: errors[0] ?? "",
    isValid: errors.length === 0,
    isDirty: flags.isDirty ?? !isEqual(safeValue, safeInitialValue),
    isTouched: Boolean(flags.isTouched),
    isFocused: Boolean(flags.isFocused),
    isValidating: Boolean(flags.isValidating),
  };
}

function notifyFieldValidation(
  field: FormFieldRegistration | undefined,
  state: FormFieldState,
) {
  field?.onValidationChange?.(state);
}

export function collectFormValues(service: ServiceLike): Record<string, any> {
  const prevValues = service.context.get("values") ?? {};
  const current = { ...prevValues };
  const fields = service.refs.get("fields");
  for (const [name, reg] of fields.entries()) {
    try {
      const val = reg.getValue();
      if (val !== undefined) {
        current[name] = val;
      }
    } catch {
      // ignore
    }
  }
  return current;
}

function getEffectiveRules(service: ServiceLike, name: string): FormRule[] {
  if (service.context.get("disabled")) return [];
  const field = service.refs.get("fields").get(name);
  if (field?.isDisabled?.()) return [];

  const fieldRulesFn = service.refs.get("fieldRules")?.get(name);
  const fieldRules = fieldRulesFn ? fieldRulesFn() : [];
  const formRulesMap = service.prop("rules") ?? {};
  const formLevelRules = formRulesMap[name] ?? [];

  if (fieldRules.length === 0 && formLevelRules.length === 0) {
    return [];
  }
  return [...fieldRules, ...formLevelRules];
}

function getEffectiveValidateOn(
  service: ServiceLike,
  name: string,
): FormValidateOn {
  const field = service.refs.get("fields").get(name);
  const fieldValidateOn = field?.getValidateOn?.();
  return fieldValidateOn ?? service.context.get("validateOn");
}

function applyFieldErrors(
  service: ServiceLike,
  name: string,
  messages: string[],
  isValidating = false,
  valueOverride?: any,
) {
  const fields = service.refs.get("fields");
  const field = fields.get(name);
  const prevErrorBag = service.context.get("errorBag") ?? {};
  const nextErrorBag: FormErrorBag = { ...prevErrorBag };

  if (messages.length > 0) {
    nextErrorBag[name] = [...messages];
  } else {
    delete nextErrorBag[name];
  }

  const nextErrors = buildErrorsList(nextErrorBag, fields);
  const prevFieldStates = service.context.get("fieldStates") ?? {};
  const existingState = prevFieldStates[name];
  const currentValue =
    valueOverride !== undefined
      ? valueOverride
      : field
        ? field.getValue()
        : (service.context.get("values") ?? {})[name];
  const initialValue =
    existingState?.initialValue ??
    (service.context.get("initialValues") ?? {})[name] ??
    currentValue;

  const updatedFieldState = makeFieldState(
    name,
    field?.id ?? existingState?.id ?? name,
    currentValue,
    initialValue,
    messages,
    {
      isDirty: existingState?.isDirty ?? !isEqual(currentValue, initialValue),
      isTouched: Boolean(existingState?.isTouched),
      isFocused: Boolean(existingState?.isFocused),
      isValidating,
    },
  );

  service.context.set("errorBag", nextErrorBag);
  service.context.set("errors", nextErrors);
  service.context.set("fieldStates", {
    ...prevFieldStates,
    [name]: updatedFieldState,
  });

  notifyFieldValidation(field, updatedFieldState);
  service.refs.get("bus").emit("field:error", {
    name,
    errors: [...messages],
    isValid: messages.length === 0,
  });
}

export function validateSingleField(
  service: ServiceLike,
  name: string,
  valueOverride?: any,
): string[] | Promise<string[]> {
  const tokens = service.refs.get("validationTokens");
  const token = (tokens.get(name) ?? 0) + 1;
  tokens.set(name, token);

  const rules = getEffectiveRules(service, name);
  if (rules.length === 0) {
    applyFieldErrors(service, name, [], false, valueOverride);
    return [];
  }

  const fields = service.refs.get("fields");
  const field = fields.get(name);
  const allValues = collectFormValues(service);
  const value =
    valueOverride !== undefined
      ? valueOverride
      : field
        ? field.getValue()
        : allValues[name];
  if (valueOverride !== undefined) {
    allValues[name] = valueOverride;
  }

  const outcome = evaluateRules(value, rules, allValues);

  if (Array.isArray(outcome)) {
    service.context.set(
      "validatingFields",
      toggleArrayItem(service.context.get("validatingFields"), name, false),
    );
    applyFieldErrors(service, name, outcome, false, value);
    return outcome;
  }

  service.context.set(
    "validatingFields",
    toggleArrayItem(service.context.get("validatingFields"), name, true),
  );

  const prevStates = service.context.get("fieldStates");
  const existing = prevStates[name];
  if (existing) {
    const nextState: FormFieldState = { ...existing, isValidating: true };
    service.context.set("fieldStates", { ...prevStates, [name]: nextState });
    notifyFieldValidation(field, nextState);
  }

  if (service.state.get() === "idle") {
    service.state.set("validating");
  }

  return outcome.then((asyncMessages: string[]) => {
    if (tokens.get(name) !== token) {
      return service.context.get("errorBag")[name] ?? [];
    }

    const remainingValidating = toggleArrayItem(
      service.context.get("validatingFields"),
      name,
      false,
    );
    service.context.set("validatingFields", remainingValidating);

    applyFieldErrors(service, name, asyncMessages, false, value);

    if (
      remainingValidating.length === 0 &&
      service.state.get() === "validating"
    ) {
      const hasAnyError = service.context.get("errors").length > 0;
      service.state.set(hasAnyError ? "error" : "idle");
    }

    return asyncMessages;
  });
}

export async function validateFormFields(
  service: ServiceLike,
  target?: string | string[],
): Promise<FormValidationResult> {
  const fields = service.refs.get("fields");
  const formRulesMap = service.prop("rules") ?? {};
  const allKnownNames = new Set<string>([
    ...fields.keys(),
    ...Object.keys(formRulesMap),
  ]);
  const namesToValidate = normalizeTargetNames(target, allKnownNames);

  const pending: Array<Promise<string[]>> = [];
  for (let i = 0; i < namesToValidate.length; i++) {
    const name = namesToValidate[i];
    if (!name) continue;
    const res = validateSingleField(service, name);
    if (!Array.isArray(res)) {
      pending.push(res);
    }
  }

  if (pending.length > 0) {
    await Promise.all(pending);
  }

  const errorBag = service.context.get("errorBag");
  const errors = service.context.get("errors");
  const values = collectFormValues(service);
  const valid = errors.length === 0;

  if (service.state.get() !== "submitting") {
    service.state.set(valid ? "idle" : "error");
  }

  const result: FormValidationResult = {
    valid,
    errors,
    errorBag,
    values,
  };

  service.refs.get("bus").emit("validate", {
    name: typeof target === "string" ? target : undefined,
    result,
  });
  service.prop("onValidate")?.({ ...result });

  return result;
}

export function registerFormField(
  service: ServiceLike,
  registration: FormFieldRegistration,
) {
  const { name, id } = registration;
  if (!name) return;

  const fields = service.refs.get("fields");
  fields.set(name, registration);

  const controlledValues = service.prop("value");
  const defaultValues = service.prop("defaultValue");
  const existingValues = service.context.get("values") ?? {};
  const existingInitials = service.context.get("initialValues") ?? {};

  let fieldValue = registration.getValue();
  const presetVal =
    controlledValues?.[name] ?? existingValues[name] ?? defaultValues?.[name];

  if (presetVal !== undefined && isEmpty(fieldValue)) {
    registration.setValue?.(presetVal);
    fieldValue = registration.getValue() ?? presetVal;
  }
  if (fieldValue === undefined) {
    fieldValue = "";
  }

  const initialVal =
    existingInitials[name] !== undefined
      ? existingInitials[name]
      : cloneFieldValue(fieldValue);

  service.context.set("values", {
    ...existingValues,
    [name]: fieldValue,
  });
  service.context.set("initialValues", {
    ...existingInitials,
    [name]: initialVal,
  });

  const existingErrors = (service.context.get("errorBag") ?? {})[name] ?? [];
  const fieldState = makeFieldState(
    name,
    id || name,
    fieldValue,
    initialVal,
    existingErrors,
    {
      isDirty: !isEqual(fieldValue, initialVal),
      isTouched: service.context.get("touchedFields")?.includes(name),
      isFocused: service.context.get("focusedField") === name,
      isValidating: service.context.get("validatingFields")?.includes(name),
    },
  );

  const prevFieldStates = service.context.get("fieldStates") ?? {};
  service.context.set("fieldStates", {
    ...prevFieldStates,
    [name]: fieldState,
  });

  registration.onFormStateChange?.({
    disabled: service.context.get("disabled"),
    readOnly: service.context.get("readOnly"),
  });
  notifyFieldValidation(registration, fieldState);
}

export function unregisterFormField(
  service: ServiceLike,
  name: string,
  id?: string,
) {
  const fields = service.refs.get("fields");
  const existing = fields.get(name);
  if (existing && id && existing.id !== id) return;

  fields.delete(name);
  service.refs.get("validationTokens").delete(name);

  const controlledValues = service.prop("value");
  if (controlledValues?.[name] === undefined) {
    const prevValues = service.context.get("values") ?? {};
    if (name in prevValues) {
      const nextValues = { ...prevValues };
      delete nextValues[name];
      service.context.set("values", nextValues);
    }
    const prevInitials = service.context.get("initialValues") ?? {};
    if (name in prevInitials) {
      const nextInitials = { ...prevInitials };
      delete nextInitials[name];
      service.context.set("initialValues", nextInitials);
    }
  }

  const nextErrorBag = { ...service.context.get("errorBag") };
  delete nextErrorBag[name];
  const nextErrors = buildErrorsList(nextErrorBag, fields);
  service.context.set("errorBag", nextErrorBag);
  service.context.set("errors", nextErrors);

  const nextFieldStates = { ...service.context.get("fieldStates") };
  delete nextFieldStates[name];
  service.context.set("fieldStates", nextFieldStates);

  const rem = (k: any) =>
    service.context.set(
      k,
      toggleArrayItem(service.context.get(k), name, false),
    );
  rem("dirtyFields");
  rem("touchedFields");
  rem("validatingFields");

  if (service.context.get("focusedField") === name) {
    service.context.set("focusedField", null);
  }

  const currentState = service.state.get();
  if (
    nextErrors.length === 0 &&
    (service.context.get("validatingFields") ?? []).length === 0 &&
    (currentState === "error" || currentState === "validating")
  ) {
    service.state.set("idle");
  }
}

export function handleFieldInteraction(
  service: ServiceLike,
  trigger: FormValidateTrigger,
  payload: { name: string; value?: any; id?: string | undefined },
) {
  const { name } = payload;
  if (!name) return;

  const fields = service.refs.get("fields");
  const field = fields.get(name);
  const prevValues = service.context.get("values") ?? {};
  const initialValues = service.context.get("initialValues") ?? {};
  const prevStates = service.context.get("fieldStates") ?? {};
  const prevState = prevStates[name];

  const rawNextValue =
    payload.value !== undefined
      ? payload.value
      : field
        ? field.getValue()
        : prevValues[name];
  const nextValue = rawNextValue === undefined ? "" : rawNextValue;

  const rawInitialValue =
    initialValues[name] !== undefined
      ? initialValues[name]
      : prevState?.initialValue;
  const initialValue =
    rawInitialValue === undefined ? nextValue : rawInitialValue;

  let isDirty = prevState?.isDirty ?? false;
  let isTouched = prevState?.isTouched ?? false;
  let isFocused = prevState?.isFocused ?? false;

  if (trigger === "input" || trigger === "change") {
    const nextValues = { ...prevValues, [name]: nextValue };
    service.context.set("values", nextValues);

    isDirty = !isEqual(nextValue, initialValue);
    service.context.set(
      "dirtyFields",
      toggleArrayItem(service.context.get("dirtyFields"), name, isDirty),
    );

    if (trigger === "change") {
      service.prop("onValueChange")?.({ ...nextValues });
    }
  } else if (trigger === "focus") {
    isFocused = true;
    service.context.set("focusedField", name);
  } else if (trigger === "blur") {
    isFocused = false;
    isTouched = true;
    if (service.context.get("focusedField") === name) {
      service.context.set("focusedField", null);
    }
    const touchedFields = service.context.get("touchedFields") ?? [];
    if (!touchedFields.includes(name)) {
      service.context.set("touchedFields", [...touchedFields, name]);
    }
    if (payload.value !== undefined) {
      service.context.set("values", { ...prevValues, [name]: nextValue });
    }
  }

  const existingErrors = (service.context.get("errorBag") ?? {})[name] ?? [];
  const updatedState = makeFieldState(
    name,
    field?.id ?? prevState?.id ?? name,
    nextValue,
    initialValue,
    existingErrors,
    {
      isDirty,
      isTouched,
      isFocused,
      isValidating: Boolean(prevState?.isValidating),
    },
  );

  service.context.set("fieldStates", {
    ...prevStates,
    [name]: updatedState,
  });

  const validateOn = getEffectiveValidateOn(service, name);
  const shouldRun = shouldValidateOnTrigger(trigger, validateOn, {
    validateLazy: service.context.get("validateLazy"),
    isTouched,
    hasErrors: existingErrors.length > 0,
    submitCount: service.context.get("submitCount"),
  });

  if (shouldRun) {
    validateSingleField(service, name, nextValue);
  } else {
    notifyFieldValidation(field, updatedState);
  }
}

export function focusFirstInvalidField(service: ServiceLike): boolean {
  const errorBag = service.context.get("errorBag");
  const fields = service.refs.get("fields");

  for (const [name, reg] of fields.entries()) {
    if (errorBag[name]?.length && typeof reg.focus === "function") {
      reg.focus();
      return true;
    }
  }
  return false;
}

export async function scrollToFirstInvalidField(
  service: ServiceLike,
): Promise<boolean> {
  const errorBag = service.context.get("errorBag");
  const fields = service.refs.get("fields");
  const scrollOffset = service.context.get("scrollOffset") ?? 24;

  let targetReg: FormFieldRegistration | undefined;
  for (const [name, reg] of fields.entries()) {
    const errs = errorBag[name];
    if (errs && errs.length > 0) {
      targetReg = reg;
      break;
    }
  }

  if (!targetReg) return false;

  try {
    const wxGlobal = (globalThis as Record<string, any>).wx;
    if (wxGlobal && typeof wxGlobal.pageScrollTo === "function") {
      wxGlobal.pageScrollTo({
        selector: `#${targetReg.id}`,
        offsetTop: -scrollOffset,
        duration: 250,
      });
      return true;
    }
  } catch {
    // Ignore in non-MiniApp test environments
  }

  return false;
}

export function resetFormValidation(
  service: ServiceLike,
  target?: string | string[],
) {
  const fields = service.refs.get("fields");
  const prevErrorBag = service.context.get("errorBag");
  const prevFieldStates = service.context.get("fieldStates");
  const allNames = new Set<string>([
    ...fields.keys(),
    ...Object.keys(prevErrorBag),
    ...Object.keys(prevFieldStates),
  ]);
  const targetNames = normalizeTargetNames(target, allNames);
  const tokens = service.refs.get("validationTokens");

  const nextErrorBag: FormErrorBag = { ...prevErrorBag };
  const nextFieldStates: Record<string, FormFieldState> = {
    ...prevFieldStates,
  };
  let nextValidating = [...service.context.get("validatingFields")];

  for (let i = 0; i < targetNames.length; i++) {
    const name = targetNames[i];
    if (!name) continue;
    tokens.set(name, (tokens.get(name) ?? 0) + 1);
    delete nextErrorBag[name];
    nextValidating = nextValidating.filter((n) => n !== name);

    const existing = nextFieldStates[name];
    if (existing) {
      const cleared: FormFieldState = {
        ...existing,
        errors: [],
        errorMessage: "",
        isValid: true,
        isValidating: false,
      };
      nextFieldStates[name] = cleared;
      notifyFieldValidation(fields.get(name), cleared);
    }
  }

  const nextErrors = buildErrorsList(nextErrorBag, fields);
  service.context.set("errorBag", nextErrorBag);
  service.context.set("errors", nextErrors);
  service.context.set("fieldStates", nextFieldStates);
  service.context.set("validatingFields", nextValidating);

  if (nextErrors.length === 0 && service.state.get() === "error") {
    service.state.set("idle");
  }

  service.refs.get("bus").emit("clear-errors", { name: target });
}

export function resetFormFields(
  service: ServiceLike,
  target?: string | string[],
) {
  const fields = service.refs.get("fields");
  const initialValues = service.context.get("initialValues") ?? {};
  const prevValues = service.context.get("values") ?? {};
  const prevErrorBag = service.context.get("errorBag") ?? {};
  const prevFieldStates = service.context.get("fieldStates") ?? {};

  const allNames = new Set<string>([
    ...fields.keys(),
    ...Object.keys(initialValues),
    ...Object.keys(prevValues),
  ]);
  const targetNames = normalizeTargetNames(target, allNames);
  const tokens = service.refs.get("validationTokens");

  const nextValues = { ...prevValues };
  const nextErrorBag = { ...prevErrorBag };
  const nextFieldStates = { ...prevFieldStates };
  let nextDirty = [...(service.context.get("dirtyFields") ?? [])];
  let nextTouched = [...(service.context.get("touchedFields") ?? [])];
  let nextValidating = [...(service.context.get("validatingFields") ?? [])];

  for (let i = 0; i < targetNames.length; i++) {
    const name = targetNames[i];
    if (!name) continue;
    tokens.set(name, (tokens.get(name) ?? 0) + 1);

    const reg = fields.get(name);
    reg?.resetValue?.();

    const restoredVal =
      initialValues[name] !== undefined
        ? cloneFieldValue(initialValues[name])
        : reg?.getValue();

    if (restoredVal !== undefined) {
      nextValues[name] = restoredVal;
    } else {
      delete nextValues[name];
    }
    delete nextErrorBag[name];
    nextDirty = nextDirty.filter((n) => n !== name);
    nextTouched = nextTouched.filter((n) => n !== name);
    nextValidating = nextValidating.filter((n) => n !== name);

    if (reg || restoredVal !== undefined) {
      const safeRestored = restoredVal === undefined ? "" : restoredVal;
      const resetState = makeFieldState(
        name,
        reg?.id ?? prevFieldStates[name]?.id ?? name,
        safeRestored,
        cloneFieldValue(safeRestored),
      );
      nextFieldStates[name] = resetState;
      notifyFieldValidation(reg, resetState);
    } else {
      delete nextFieldStates[name];
    }
  }

  const nextErrors = buildErrorsList(nextErrorBag, fields);
  service.context.set("values", nextValues);
  service.context.set("errorBag", nextErrorBag);
  service.context.set("errors", nextErrors);
  service.context.set("fieldStates", nextFieldStates);
  service.context.set("dirtyFields", nextDirty);
  service.context.set("touchedFields", nextTouched);
  service.context.set("validatingFields", nextValidating);

  if (target === undefined) {
    service.context.set("submitCount", 0);
    service.context.set("focusedField", null);
    service.state.set("idle");
    service.refs.get("bus").emit("reset", { name: undefined });
    service.prop("onReset")?.();
  } else {
    if (nextErrors.length === 0 && service.state.get() === "error") {
      service.state.set("idle");
    }
    service.refs.get("bus").emit("reset", { name: target });
  }
}

export function setFormErrors(
  service: ServiceLike,
  input: FormErrorBag | Record<string, string | string[]> | FormFieldError[],
) {
  const fields = service.refs.get("fields");
  const normalizedBag: FormErrorBag = {};

  if (Array.isArray(input)) {
    for (const item of input) {
      if (!item?.name) continue;
      const msgs = item.messages?.length
        ? item.messages
        : item.message
          ? [item.message]
          : [];
      if (msgs.length) normalizedBag[item.name] = [...msgs];
    }
  } else if (input && typeof input === "object") {
    for (const [name, raw] of Object.entries(input)) {
      const msgs = Array.isArray(raw)
        ? raw.filter(Boolean)
        : typeof raw === "string" && raw.trim()
          ? [raw]
          : [];
      if (msgs.length) normalizedBag[name] = msgs;
    }
  }

  const allAffected = new Set([
    ...Object.keys(service.context.get("errorBag")),
    ...Object.keys(normalizedBag),
  ]);
  for (const name of allAffected) {
    applyFieldErrors(service, name, normalizedBag[name] ?? [], false);
  }

  const hasAny = Object.keys(normalizedBag).length > 0;
  service.state.set(hasAny ? "error" : "idle");
  service.context.set("errors", buildErrorsList(normalizedBag, fields));
}

export function setFormValues(
  service: ServiceLike,
  values: Record<string, any>,
  shouldValidate = false,
) {
  if (!values || typeof values !== "object") return;
  const fields = service.refs.get("fields");
  const prevValues = { ...service.context.get("values") };
  const initialValues = service.context.get("initialValues");
  let nextDirty = [...service.context.get("dirtyFields")];

  for (const [name, val] of Object.entries(values)) {
    if (val === undefined) {
      delete prevValues[name];
    } else {
      prevValues[name] = val;
    }
    const reg = fields.get(name);
    if (val !== undefined) {
      reg?.setValue?.(val);
    }

    const isDirty = !isEqual(val, initialValues[name]);
    nextDirty = toggleArrayItem(nextDirty, name, isDirty);
  }

  service.context.set("values", prevValues);
  service.context.set("dirtyFields", nextDirty);
  service.prop("onValueChange")?.({ ...prevValues });

  if (shouldValidate) {
    void validateFormFields(service, Object.keys(values));
  }
}

export async function submitForm(
  service: ServiceLike,
): Promise<FormValidationResult> {
  if (service.context.get("disabled")) {
    return {
      valid: service.context.get("errors").length === 0,
      errors: service.context.get("errors"),
      errorBag: service.context.get("errorBag"),
      values: collectFormValues(service),
    };
  }

  const nextSubmitCount = service.context.get("submitCount") + 1;
  service.context.set("submitCount", nextSubmitCount);

  // Mark all registered fields as touched
  const fields = service.refs.get("fields");
  const allFieldNames = Array.from(fields.keys());
  service.context.set("touchedFields", allFieldNames);

  const result = await validateFormFields(service);

  if (!result.valid) {
    service.state.set("error");

    if (service.context.get("focusOnError")) {
      focusFirstInvalidField(service);
    }
    if (service.context.get("scrollToError")) {
      void scrollToFirstInvalidField(service);
    }

    const errorDetails = {
      errors: result.errors,
      errorBag: result.errorBag,
      values: result.values,
    };
    service.refs.get("bus").emit("error", errorDetails);
    service.prop("onError")?.(errorDetails);
    return result;
  }

  service.state.set("submitting");
  const submitDetails = {
    values: result.values,
    valid: true,
    errors: [],
    errorBag: {},
  };

  service.refs.get("bus").emit("submit", submitDetails);
  const submitRet = service.prop("onSubmit")?.(submitDetails);

  if (isPromise(submitRet)) {
    try {
      await submitRet;
      service.state.set("submitted");
    } catch (err) {
      const msg =
        err instanceof Error && err.message ? err.message : "Submit failed";
      setFormErrors(service, { _form: [msg] });
      service.state.set("error");
    }
  } else {
    service.state.set("submitted");
  }

  return result;
}

export const formMachine: FormMachine = createMachine<FormSchema>({
  props: ({ props }) => ({
    ...defaultFormProps,
    ...props,
  }),

  initialState: () => "idle",

  refs: ({ prop }) => {
    const existingBus = prop("bus");
    const bus = existingBus ?? createEventBus<FormBusEvents>();

    return {
      bus,
      fields: new Map<string, FormFieldRegistration>(),
      fieldRules: new Map<string, () => FormRule[]>(),
      validationTokens: new Map<string, number>(),
      busDisposers: [],
    };
  },

  context: ({ prop, bindable }) => {
    const propBindable = <K extends keyof FormContext & keyof FormProps>(
      key: K,
      defaultValue: FormContext[K],
    ) =>
      bindable<FormContext[K]>(() => ({
        value: prop(key) as FormContext[K] | undefined,
        defaultValue,
      }));
    const stateBindable = <K extends keyof FormContext>(
      _key: K,
      defaultValue: FormContext[K],
    ) =>
      bindable<FormContext[K]>(() => ({
        defaultValue,
      }));
    const initialVals = cloneFieldValue(
      prop("value") ?? prop("defaultValue") ?? {},
    );
    return {
      values: bindable<Record<string, any>>(() => ({
        value: prop("value"),
        defaultValue: initialVals,
      })),
      initialValues: stateBindable("initialValues", cloneFieldValue(initialVals)),
      errorBag: stateBindable("errorBag", {}),
      errors: stateBindable("errors", []),
      fieldStates: stateBindable("fieldStates", {}),
      dirtyFields: stateBindable("dirtyFields", []),
      touchedFields: stateBindable("touchedFields", []),
      validatingFields: stateBindable("validatingFields", []),
      focusedField: stateBindable("focusedField", null),
      submitCount: stateBindable("submitCount", 0),
      disabled: propBindable("disabled", false),
      readOnly: propBindable("readOnly", false),
      focusOnError: propBindable("focusOnError", true),
      scrollToError: propBindable("scrollToError", false),
      scrollOffset: propBindable("scrollOffset", 24),
      validateOn: propBindable("validateOn", ["input", "change", "blur"]),
      validateLazy: propBindable("validateLazy", false),
      showErrors: propBindable("showErrors", false),
      ui: propBindable("ui", {}),
    };
  },

  computed: {
    hasErrors: ({ context }) => context.get("errors").length > 0,
    errorCount: ({ context }) => context.get("errors").length,
    isValid: ({ context }) => context.get("errors").length === 0,
    isDirty: ({ context }) => context.get("dirtyFields").length > 0,
    isTouched: ({ context }) => context.get("touchedFields").length > 0,
    isValidating: ({ context }) => context.get("validatingFields").length > 0,
    isSubmitting: ({ state }) => state.get() === "submitting",
  },

  effects: ["trackFormState"],
  entry: ["setupEventBus"],
  exit: ["cleanupEventBus"],

  on: {
    "FIELD.REGISTER": {
      actions: ["handleFieldRegister"],
    },
    "FIELD.UNREGISTER": {
      actions: ["handleFieldUnregister"],
    },
    "FIELD.INPUT": {
      actions: ["handleFieldInput"],
    },
    "FIELD.CHANGE": {
      actions: ["handleFieldChange"],
    },
    "FIELD.BLUR": {
      actions: ["handleFieldBlur"],
    },
    "FIELD.FOCUS": {
      actions: ["handleFieldFocus"],
    },
    VALIDATE: {
      actions: ["handleValidate"],
    },
    SUBMIT: {
      actions: ["handleSubmit"],
    },
    RESET: {
      actions: ["handleReset"],
    },
    RESET_VALIDATION: {
      actions: ["handleResetValidation"],
    },
    SET_ERRORS: {
      actions: ["handleSetErrors"],
    },
    SET_VALUES: {
      actions: ["handleSetValues"],
    },
    SET_FIELD_VALUE: {
      actions: ["handleSetFieldValue"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
    },
    validating: {
      tags: ["validating"],
    },
    submitting: {
      tags: ["submitting"],
    },
    submitted: {
      tags: ["submitted"],
    },
    error: {
      tags: ["error"],
    },
  },

  implementations: {
    actions: {
      setupEventBus: (params) => {
        const bus = params.refs.get("bus");
        const existingDisposers = params.refs.get("busDisposers");
        for (let i = 0; i < existingDisposers.length; i++) {
          existingDisposers[i]?.();
        }

        const disposers = [
          bus.on("register", (reg) => registerFormField(params, reg)),
          bus.on("unregister", ({ name, id }) =>
            unregisterFormField(params, name, id),
          ),
          bus.on("input", (payload) =>
            handleFieldInteraction(params, "input", payload),
          ),
          bus.on("change", (payload) =>
            handleFieldInteraction(params, "change", payload),
          ),
          bus.on("blur", (payload) =>
            handleFieldInteraction(params, "blur", payload),
          ),
          bus.on("focus", (payload) =>
            handleFieldInteraction(params, "focus", payload),
          ),
          bus.on("field:rules", ({ name, getRules }) => {
            params.refs.get("fieldRules").set(name, getRules);
          }),
        ];

        params.refs.set("busDisposers", disposers);

        const component = params.prop("component");
        if (component) {
          const formId =
            params.prop("name") ||
            (component as Record<string, any>)?.id ||
            params.prop("id") ||
            params.scope.id;
          provideFormBus(component, bus, formId);
        }
      },

      cleanupEventBus: (params) => {
        const disposers = params.refs.get("busDisposers");
        for (let i = 0; i < disposers.length; i++) {
          disposers[i]?.();
        }
        params.refs.set("busDisposers", []);
      },

      handleFieldRegister: (p) => {
        const ev = p.event as any;
        if (ev.field) registerFormField(p, ev.field);
      },
      handleFieldUnregister: (p) => {
        const ev = p.event as any;
        unregisterFormField(p, ev.name, ev.id);
      },
      handleFieldInput: (p) => handleFieldInteraction(p, "input", p.event as any),
      handleFieldChange: (p) => handleFieldInteraction(p, "change", p.event as any),
      handleFieldBlur: (p) => handleFieldInteraction(p, "blur", p.event as any),
      handleFieldFocus: (p) => handleFieldInteraction(p, "focus", p.event as any),
      handleValidate: (p) => {
        const ev = p.event as any;
        void validateFormFields(p, ev.name).then((res) => ev.resolve?.(res));
      },
      handleSubmit: (p) => {
        const ev = p.event as any;
        void submitForm(p).then((res) => ev.resolve?.(res));
      },
      handleReset: (p) => resetFormFields(p, (p.event as any).name),
      handleResetValidation: (p) => resetFormValidation(p, (p.event as any).name),
      handleSetErrors: (p) => setFormErrors(p, (p.event as any).errors),
      handleSetValues: (p) => {
        const ev = p.event as any;
        setFormValues(p, ev.values, Boolean(ev.validate));
      },
      handleSetFieldValue: (p) => {
        const ev = p.event as any;
        setFormValues(p, { [ev.name]: ev.value }, Boolean(ev.validate));
      },
    },

    effects: {
      trackFormState: ({ prop, refs, track }) => {
        let initial = true;
        track(
          [() => prop("disabled"), () => prop("readOnly")],
          () => {
            if (initial) {
              initial = false;
              return;
            }
            const disabled = Boolean(prop("disabled"));
            const readOnly = Boolean(prop("readOnly"));
            for (const reg of refs.get("fields").values()) {
              reg.onFormStateChange?.({ disabled, readOnly });
            }
            refs.get("bus")?.emit("form:state", { disabled, readOnly });
          },
        );
      },
    },
  },
});
