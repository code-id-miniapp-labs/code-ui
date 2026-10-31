import { isEqual, isNotNull } from "@code-ui/utils";
import type {
  CheckboxParams,
  CheckboxProps,
  CheckboxState,
  GroupStateSnapshot,
} from "./checkbox.types";

export function parseBooleanProp(val: unknown): boolean {
  if (val === true || val === "true" || val === "") return true;
  if (val === false || val === "false") return false;
  return Boolean(val);
}

export function resolveInitialBooleans(
  prop: (key: keyof CheckboxProps) => any,
): {
  initialChecked: boolean;
  initialIndeterminate: boolean;
  initialState: CheckboxState;
} {
  const groupVal = prop("groupValue");
  const rawIndet = prop("indeterminate");
  const rawDefaultIndet = prop("defaultIndeterminate");
  const initialIndeterminate = isNotNull(rawIndet)
    ? parseBooleanProp(rawIndet)
    : parseBooleanProp(rawDefaultIndet);

  const rawChecked = prop("checked");
  const rawDefaultChecked = prop("defaultChecked");
  const initialChecked = isNotNull(rawChecked)
    ? parseBooleanProp(rawChecked)
    : parseBooleanProp(rawDefaultChecked);

  let initialState: CheckboxState;
  if (Array.isArray(groupVal)) {
    initialState = groupVal.includes(prop("value") ?? "")
      ? "checked"
      : "unchecked";
  } else if (initialIndeterminate) {
    initialState = "indeterminate";
  } else {
    initialState = initialChecked ? "checked" : "unchecked";
  }

  return { initialChecked, initialIndeterminate, initialState };
}

export function applyGroupState(
  { context, state }: Pick<CheckboxParams, "context" | "state">,
  g: GroupStateSnapshot,
) {
  if (Array.isArray(g.value)) {
    if (!isEqual(g.value, context.get("groupValue"))) {
      context.set("groupValue", g.value);
    }
    const targetState = g.value.includes(context.get("value"))
      ? "checked"
      : "unchecked";
    if (!state.matches(targetState)) {
      state.set(targetState);
    }
  }
  if (g.disabled !== undefined) {
    context.set("groupDisabled", Boolean(g.disabled));
  }
  if (g.invalid !== undefined) {
    context.set("groupInvalid", Boolean(g.invalid));
  }
  if (g.color !== undefined) {
    context.set("groupColor", g.color);
  }
  if (g.size !== undefined) {
    context.set("groupSize", g.size);
  }
  if (g.variant !== undefined) {
    context.set("groupVariant", g.variant);
  }
}
