import { isNotNull } from "@code-ui/utils";
import type { CheckboxGroupContext } from "@code-ui/checkbox-group";
import type {
  CheckboxProps,
  CheckboxState,
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
  const group = prop("groupContext") as CheckboxGroupContext | undefined;
  const groupVal = group?.value();
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
