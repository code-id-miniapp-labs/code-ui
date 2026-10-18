import type { Scope } from "@code-ui/core";
import * as dom from "./form-field.dom";
import type { FormFieldApi, FormFieldService } from "./form-field.types";

export function connectFormField(
  service: FormFieldService,
  scope: Scope = service.scope,
): FormFieldApi {
  const displayError = service.computed("displayError");
  const displayHelp = service.computed("displayHelp");
  const isInvalid = service.computed("invalid");
  const size = service.context.get("size") || "md";
  const disabled = Boolean(
    service.context.get("disabled") || service.context.get("formDisabled"),
  );
  const required = Boolean(service.context.get("required"));
  const effectiveRules = service.computed("effectiveRules");

  return {
    invalid: isInvalid,
    error: displayError,
    displayError,
    displayHelp,
    effectiveRules,
    size,
    disabled,
    required,
    label: service.context.get("label"),
    description: service.context.get("description"),
    hint: service.context.get("hint"),
    help: service.context.get("help"),
    helperText: service.context.get("helperText"),

    rootProps: {
      id: dom.getRootId(scope),
      "data-scope": "form-field",
      "data-part": "root",
      "data-invalid": String(isInvalid),
      "data-disabled": String(disabled),
      "data-required": String(required),
      "data-size": size,
    },

    labelWrapperProps: {
      id: dom.getLabelWrapperId(scope),
      "data-scope": "form-field",
      "data-part": "label-wrapper",
    },

    labelProps: {
      id: dom.getLabelId(scope),
      "data-scope": "form-field",
      "data-part": "label",
      "data-disabled": String(disabled),
      "data-required": String(required),
    },

    requiredProps: {
      id: dom.getRequiredId(scope),
      "data-scope": "form-field",
      "data-part": "required",
      "aria-hidden": "true",
    },

    hintProps: {
      id: dom.getHintId(scope),
      "data-scope": "form-field",
      "data-part": "hint",
    },

    descriptionProps: {
      id: dom.getDescriptionId(scope),
      "data-scope": "form-field",
      "data-part": "description",
    },

    containerProps: {
      id: dom.getContainerId(scope),
      "data-scope": "form-field",
      "data-part": "container",
      "data-invalid": String(isInvalid),
    },

    helpProps: {
      id: dom.getHelpId(scope),
      "data-scope": "form-field",
      "data-part": "help",
    },

    errorProps: {
      id: dom.getErrorId(scope),
      "data-scope": "form-field",
      "data-part": "error",
      role: "alert",
      "aria-live": "polite",
    },
  };
}
