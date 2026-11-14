import type { Scope } from "@code-ui/core";
import * as dom from "./form-field.dom";
import type { FormFieldApi, FormFieldService } from "./form-field.types";

export function connectFormField(
  service: FormFieldService,
  scope: Scope = service.scope,
): FormFieldApi {
  const { computed, prop } = service;
  const displayError = computed("displayError");
  const displayHelp = computed("displayHelp");
  const isInvalid = computed("invalid");
  const size = prop("size");
  const disabled = computed("isDisabled");
  const required = prop("required");
  const effectiveRules = computed("effectiveRules");

  return {
    invalid: isInvalid,
    displayError,
    displayHelp,
    effectiveRules,
    disabled,

    rootProps: {
      id: dom.getRootId(scope),
      "data-disabled": String(disabled),
      "data-invalid": String(isInvalid),
      "data-required": String(required),
      "data-size": size,
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
