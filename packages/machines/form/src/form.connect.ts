import * as dom from "./form.dom";
import {
  collectFormValues,
  focusFirstInvalidField,
  getFormErrors,
  resetFormFields,
  resetFormValidation,
  scrollToFirstInvalidField,
  setFormErrors,
  setFormValues,
  submitForm,
  validateFormFields,
} from "./form.machine";
import type { MiniAppEventLike } from "@code-ui/utils";
import type {
  FormApi,
  FormErrorBag,
  FormFieldError,
  FormService,
} from "./form.types";

export function connectForm(service: FormService): FormApi {
  const { state, context, computed, prop, refs, scope } = service;

  return {
    state: state.get(),
    values: context.get("values"),
    errorBag: context.get("errorBag"),
    errors: context.get("errors"),
    fieldStates: context.get("fieldStates"),
    errorItems: computed("errorItems"),
    isValid: computed("isValid"),
    hasErrors: computed("hasErrors"),
    errorCount: computed("errorCount"),
    isDirty: computed("isDirty"),
    isTouched: computed("isTouched"),
    isValidating: computed("isValidating"),
    isSubmitting: computed("isSubmitting"),
    submitCount: context.get("submitCount"),
    disabled: prop("disabled"),
    readOnly: prop("readOnly"),
    formContext: refs.get("hostContext"),

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
      return getFormErrors(service, name);
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

    handleSubmit(e?: MiniAppEventLike<{ value?: Record<string, any> }>) {
      return submitForm(service, e?.detail?.value);
    },

    handleReset(_e?: MiniAppEventLike<Record<string, any>>) {
      resetFormFields(service);
    },

    rootProps: {
      id: dom.getRootId(scope),
    },
  };
}
