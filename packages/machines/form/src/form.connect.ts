import * as dom from "./form.dom";
import {
  collectFormValues,
  focusFirstInvalidField,
  resetFormFields,
  resetFormValidation,
  scrollToFirstInvalidField,
  setFormErrors,
  setFormValues,
  submitForm,
  validateFormFields,
} from "./form.machine";
import type {
  FormApi,
  FormErrorBag,
  FormErrorItemProps,
  FormFieldError,
  FormService,
} from "./form.types";

export function connectForm(service: FormService): FormApi {
  const { state, context, computed, prop, refs, scope } = service;

  const currentState = state.get();
  const values = context.get("values") ?? {};
  const errorBag = context.get("errorBag") ?? {};
  const errors = context.get("errors") ?? [];
  const fieldStates = context.get("fieldStates") ?? {};
  const submitCount = context.get("submitCount") ?? 0;
  const disabled = Boolean(prop("disabled"));
  const readOnly = Boolean(prop("readOnly"));

  const isValid = computed("isValid");
  const hasErrors = computed("hasErrors");
  const errorCount = computed("errorCount");
  const isDirty = computed("isDirty");
  const isTouched = computed("isTouched");
  const isValidating = computed("isValidating");
  const isSubmitting = computed("isSubmitting");

  const formContext = refs.get("hostContext");

  function getErrorProps(name: string): Record<string, any> {
    return {
      id: dom.getErrorId(scope, name),
    };
  }

  const errorItems: FormErrorItemProps[] = errors.map((err) => ({
    name: err.name,
    message: err.message,
    messages: err.messages,
    errorProps: getErrorProps(err.name),
  }));

  const errorsId = dom.getErrorsId(scope);

  return {
    state: currentState,
    values,
    errorBag,
    errors,
    fieldStates,
    errorItems,
    isValid,
    hasErrors,
    errorCount,
    isDirty,
    isTouched,
    isValidating,
    isSubmitting,
    submitCount,
    disabled,
    readOnly,
    formContext,

    validate(name?: string | string[]) {
      return validateFormFields(service, name);
    },

    submit() {
      return submitForm(service);
    },

    reset(name?: string | string[]) {
      resetFormFields(service, name);
    },

    resetValidation(name?: string | string[]) {
      resetFormValidation(service, name);
    },

    clearErrors(name?: string | string[]) {
      resetFormValidation(service, name);
    },

    setErrors(
      nextErrors:
        | FormErrorBag
        | Record<string, string | string[]>
        | FormFieldError[],
    ) {
      setFormErrors(service, nextErrors);
    },

    getErrors(name?: string): FormFieldError[] {
      const currentErrors = context.get("errors") ?? [];
      if (name === undefined) return currentErrors;
      return currentErrors.filter((item) => item.name === name);
    },

    getValues(): Record<string, any> {
      return collectFormValues(service);
    },

    getFieldValue(name: string): any {
      return collectFormValues(service)[name];
    },

    setValues(
      nextValues: Record<string, any>,
      options?: { validate?: boolean },
    ) {
      setFormValues(service, nextValues, Boolean(options?.validate));
    },

    setFieldValue(
      name: string,
      value: any,
      options?: { validate?: boolean },
    ) {
      setFormValues(
        service,
        { [name]: value },
        Boolean(options?.validate),
      );
    },

    focusFirstError() {
      return focusFirstInvalidField(service);
    },

    scrollToFirstError() {
      return scrollToFirstInvalidField(service);
    },

    handleSubmit(e?: any) {
      const nativeValues = e?.detail?.value;
      if (nativeValues && typeof nativeValues === "object") {
        const current = context.get("values") ?? {};
        const fields = refs.get("fields");
        const merged = { ...current };
        for (const [k, v] of Object.entries(nativeValues)) {
          if (!fields.has(k)) merged[k] = v;
        }
        context.set("values", merged);
      }
      return submitForm(service);
    },

    handleReset() {
      resetFormFields(service);
    },

    rootProps: {
      id: dom.getRootId(scope),
    },

    errorsProps: errorsId ? { id: errorsId } : {},

    getErrorProps,
  };
}
