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
  const size = prop("size") || "md";
  const disabled = computed("isDisabled");
  const required = Boolean(prop("required"));
  const effectiveRules = computed("effectiveRules");

  const labelWrapperId = dom.getLabelWrapperId(scope);
  const requiredId = dom.getRequiredId(scope);
  const hintId = dom.getHintId(scope);
  const descId = dom.getDescriptionId(scope);
  const containerId = dom.getContainerId(scope);
  const helpId = dom.getHelpId(scope);

  return {
    invalid: isInvalid,
    error: displayError,
    displayError,
    displayHelp,
    effectiveRules,
    size,
    disabled,
    required,
    label: prop("label") ?? "",
    description: prop("description") ?? "",
    hint: prop("hint") ?? "",
    help: prop("help") ?? "",
    helperText: prop("helperText") ?? "",

    rootProps: {
      id: dom.getRootId(scope),
      "data-disabled": String(disabled),
      "data-invalid": String(isInvalid),
      "data-required": String(required),
      "data-size": size,
    },

    labelWrapperProps: labelWrapperId ? { id: labelWrapperId } : {},

    labelProps: {
      id: dom.getLabelId(scope),
      "data-disabled": String(disabled),
      "data-required": String(required),
    },

    requiredProps: {
      ...(requiredId ? { id: requiredId } : {}),
      "aria-hidden": "true",
    },

    hintProps: hintId ? { id: hintId } : {},

    descriptionProps: descId ? { id: descId } : {},

    containerProps: {
      ...(containerId ? { id: containerId } : {}),
      "data-invalid": String(isInvalid),
    },

    helpProps: helpId ? { id: helpId } : {},

    errorProps: {
      id: dom.getErrorId(scope),
      "aria-role": "alert",
      "aria-live": "polite",
    },
  };
}
