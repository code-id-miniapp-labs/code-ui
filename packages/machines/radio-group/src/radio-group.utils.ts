import { isNotNull } from "@code-ui/utils";
import type {
  RadioGroupBusEvents,
  RadioGroupParams,
  RadioGroupSchema,
} from "./radio-group.types";
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

export function emitGroupChange(
  {
    refs,
    context,
    computed,
  }: Pick<RadioGroupParams, "refs" | "context" | "computed">,
  overrides?: Partial<RadioGroupBusEvents["group:change"]>,
) {
  const bus = refs.get("bus");
  if (!bus) return;
  bus.emit("group:change", {
    value: context.get("value"),
    disabled: computed("isDisabled"),
    invalid: Boolean(context.get("invalid")),
    size: context.get("size") || "md",
    color: context.get("color") || "primary",
    variant: context.get("variant") || "outline",
    ...overrides,
  });
}
