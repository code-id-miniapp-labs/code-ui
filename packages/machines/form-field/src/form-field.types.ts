import type { Machine, Params, Service } from "@code-ui/core";
import type { FormBusEvents, FormRule } from "@code-ui/form";
import type { EventBus } from "@code-ui/utils";

export type FormEventBus = EventBus<FormBusEvents>;

export type FormFieldSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface FormFieldProps {
  id?: string | undefined;
  ids?:
    | Partial<
        Record<
          | "root"
          | "labelWrapper"
          | "label"
          | "required"
          | "hint"
          | "description"
          | "container"
          | "help"
          | "error",
          string
        >
      >
    | undefined;
  name?: string | undefined;
  label?: string | undefined;
  description?: string | undefined;
  help?: string | undefined;
  helperText?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  rules?: FormRule[] | undefined;
  size?: FormFieldSize | undefined;
  ui?: Record<string, any> | undefined;
  formBus?: FormEventBus | undefined;
  component?: unknown | undefined;
}

export type FormFieldMachineState = "valid" | "invalid";
export type FormFieldState = FormFieldMachineState;

export type FormFieldEvent =
  | { type: "ERROR.SET"; error: string }
  | { type: "ERROR.CLEAR" }
  | { type: "RESET" };

export interface FormFieldContext {
  name: string;
  label: string;
  description: string;
  help: string;
  helperText: string;
  hint: string;
  error: string;
  innerError: string;
  required: boolean;
  disabled: boolean;
  formDisabled: boolean;
  formReadOnly: boolean;
  rules: FormRule[];
  size: FormFieldSize;
  ui: Record<string, any>;
}

export interface FormFieldRefs {
  currentFormBus: FormEventBus | undefined;
  busDisposers: Array<() => void>;
}

export interface FormFieldComputed {
  displayError: string;
  displayHelp: string;
  invalid: boolean;
  effectiveRules: FormRule[];
}

export interface FormFieldSchema {
  state: FormFieldState;
  tag: "valid" | "invalid";
  props: FormFieldProps;
  context: FormFieldContext;
  refs: FormFieldRefs;
  computed: FormFieldComputed;
  event: FormFieldEvent;
  action:
    | "setInnerError"
    | "clearInnerError"
    | "setupBus"
    | "cleanupBus";
  effect: "trackFieldProps";
}

export type FormFieldService = Service<FormFieldSchema>;
export type FormFieldMachine = Machine<FormFieldSchema>;
export type FormFieldParams = Params<FormFieldSchema>;

export interface FormFieldApi {
  invalid: boolean;
  error: string;
  displayError: string;
  displayHelp: string;
  effectiveRules: FormRule[];
  size: FormFieldSize;
  disabled: boolean;
  required: boolean;
  label: string;
  description: string;
  hint: string;
  help: string;
  helperText: string;

  rootProps: Record<string, any>;
  labelWrapperProps: Record<string, any>;
  labelProps: Record<string, any>;
  requiredProps: Record<string, any>;
  hintProps: Record<string, any>;
  descriptionProps: Record<string, any>;
  containerProps: Record<string, any>;
  helpProps: Record<string, any>;
  errorProps: Record<string, any>;
}
