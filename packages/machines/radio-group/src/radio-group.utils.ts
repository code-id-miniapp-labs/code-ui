import { isNotNull } from "@code-ui/utils";
import type { RadioGroupSchema } from "./radio-group.types";
import type { BindableRefs, PropFn } from "@code-ui/core";

export function resolveInitialValue(
  prop: PropFn<RadioGroupSchema>,
): string | null {
  const rawVal = prop("value");
  if (isNotNull(rawVal)) {
    return String(rawVal);
  }
  const rawDefault = prop("defaultValue");
  return isNotNull(rawDefault) ? String(rawDefault) : null;
}

export function dispatchChangeEvent(
  prop: PropFn<RadioGroupSchema>,
  refs: BindableRefs<RadioGroupSchema>,
  val: string | null,
) {
  const valStr = val ?? "";
  prop("onChange")?.({ value: valStr });

  const formField = refs.get("formField");
  if (formField) {
    formField.emitInput(val);
    formField.emitChange(val);
  }
}
