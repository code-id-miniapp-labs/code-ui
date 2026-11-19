import * as dom from "./form-field.dom";
import type { FormFieldApi, FormFieldService } from "./form-field.types";

export function connectFormField(service: FormFieldService): FormFieldApi {
  const { computed, prop, scope } = service;
  const displayError = computed("displayError");
  const isInvalid = computed("invalid");
  const disabled = computed("isDisabled");
  const required = prop("required");
  const effectiveRules = computed("effectiveRules");

  return {
    invalid: isInvalid,
    displayError,
    effectiveRules,
    disabled,

    rootProps: {
      id: dom.getRootId(scope),
      "data-disabled": String(disabled),
      "data-invalid": String(isInvalid),
      "data-required": String(required),
    },

    labelProps: {
      id: dom.getLabelId(scope),
      "data-disabled": String(disabled),
      "data-required": String(required),
    },

    errorProps: {
      id: dom.getErrorId(scope),
      "aria-role": "alert",
      "aria-live": "polite",
    },
  };
}
