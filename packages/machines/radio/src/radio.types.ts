import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { RadioGroupContext } from "@code-ui/radio-group";
import type { MiniAppComponent } from "@code-ui/utils";
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
  groupContext?: RadioGroupContext | undefined;
  value?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  checked?: boolean | null | undefined;
  defaultChecked?: boolean | undefined;
  invalid?: boolean | null | undefined;
  onChange?: ((details: RadioValueChangeDetails) => void) | undefined;
}

export interface RadioResolvedProps extends RadioProps {
  value: string;
  disabled: boolean;
  readOnly: boolean;
  checked: boolean | null;
  defaultChecked: boolean;
  invalid: boolean | null;
}

export interface RadioContext {
  invalid: boolean;
}

export type RadioEvent =
  | { type: "SELECT" }
  | { type: "SET_CHECKED"; checked: boolean }
  | { type: "TOGGLE" };

export interface RadioComputed {
  isChecked: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInteractive: boolean;
  isInvalid: boolean;
}

export interface RadioSchema extends MachineSchema {
  state: RadioState;
  tag: "checked" | "unchecked";
  event: RadioEvent;
  props: RadioResolvedProps;
  context: RadioContext;
  computed: RadioComputed;
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
  handleTap: () => void;
  rootProps: Record<string, any>;
  baseProps: Record<string, any>;
  indicatorProps: Record<string, any>;
}
