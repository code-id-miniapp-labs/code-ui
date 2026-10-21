import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { EventBus, MiniAppComponent } from "@code-ui/utils";
import type { radioAnatomy } from "./radio.anatomy";

export type RadioState = "checked" | "unchecked";

export type RadioColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info";

export type RadioSize = "xs" | "sm" | "md" | "lg" | "xl";

export type RadioVariant = "outline" | "card";

export interface RadioGroupChangePayload {
  value: string | null;
  disabled: boolean;
  invalid: boolean;
  size: RadioSize;
  color: RadioColor;
  variant: RadioVariant;
}

export interface RadioGroupBusEvents {
  "group:change": RadioGroupChangePayload;
  "radio:select": { value: string };
}

export type RadioAnatomyPart = AnatomyPartName<typeof radioAnatomy>;
export type RadioUI = ComponentUI<typeof radioAnatomy>;
export type RadioResolvedUI = ResolvedUI<typeof radioAnatomy>;

export interface RadioValueChangeDetails {
  value: string;
  checked: boolean;
}

export interface RadioProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  component?: MiniAppComponent | undefined;
  groupBus?: EventBus<RadioGroupBusEvents> | undefined;
  ui?: RadioUI | undefined;
  value?: string | undefined;
  label?: string | undefined;
  description?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  checked?: boolean | null | undefined;
  defaultChecked?: boolean | undefined;
  invalid?: boolean | null | undefined;
  color?: RadioColor | "" | undefined;
  size?: RadioSize | "" | undefined;
  variant?: RadioVariant | undefined;
  customIndicator?: boolean | undefined;
  groupValue?: string | null | undefined;
  groupDisabled?: boolean | undefined;
  groupInvalid?: boolean | undefined;
  groupColor?: RadioColor | "" | undefined;
  groupSize?: RadioSize | "" | undefined;
  groupVariant?: RadioVariant | "" | undefined;
  onChange?: ((details: RadioValueChangeDetails) => void) | undefined;
}

export interface RadioContext {
  value: string;
  label: string;
  description: string;
  disabled: boolean;
  readOnly: boolean;
  checked: boolean;
  invalid: boolean;
  color: RadioColor | "";
  size: RadioSize | "";
  variant: RadioVariant;
  groupValue: string | null | undefined;
  groupDisabled: boolean;
  groupInvalid: boolean;
  groupColor: RadioColor | "";
  groupSize: RadioSize | "";
  groupVariant: RadioVariant | "";
  ui: RadioUI;
}

export type RadioEvent =
  | { type: "SELECT" }
  | { type: "SET_CHECKED"; checked: boolean }
  | { type: "TOGGLE" };

export interface RadioComputed {
  isChecked: boolean;
  isDisabled: boolean;
  isInteractive: boolean;
  isInvalid: boolean;
  effectiveSize: RadioSize;
  effectiveColor: RadioColor;
  effectiveVariant: RadioVariant;
}

export interface RadioRefs {
  currentGroupBus?: EventBus<RadioGroupBusEvents> | undefined;
  busDisposers?: Array<() => void> | undefined;
}

export interface RadioSchema extends MachineSchema {
  state: RadioState;
  tag: "checked" | "unchecked";
  event: RadioEvent;
  props: RadioProps;
  context: RadioContext;
  computed: RadioComputed;
  refs: RadioRefs;
  action: string;
  effect: string;
  guard: string;
}

export type RadioService = Service<RadioSchema>;
export type RadioMachine = Machine<RadioSchema>;
export type RadioParams = Params<RadioSchema>;

export interface RadioApi {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  size: RadioSize;
  color: RadioColor;
  variant: RadioVariant;
  value: string;
  label: string;
  description: string;
  handleTap: (e?: any) => void;
  rootProps: Record<string, any>;
  baseProps: Record<string, any>;
  indicatorProps: Record<string, any>;
}
