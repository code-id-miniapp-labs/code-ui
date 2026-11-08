import type { Machine, Params, Service } from "@code-ui/core";
import type { FormHostContext, FormRule } from "@code-ui/form";
import type { MiniAppComponent } from "@code-ui/utils";


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
  formContext?: FormHostContext | null | undefined;
  form?: string | undefined;
  component?: MiniAppComponent | undefined;
}

export type FormFieldMachineState = "valid" | "invalid";
export type FormFieldState = FormFieldMachineState;

export type FormFieldEvent =
  | { type: "ERROR.SET"; error: string }
  | { type: "ERROR.CLEAR" }
  | { type: "RESET" };

export interface FormFieldContext {
  innerError: string;
}

export interface FormFieldRefs {
  injectedHost: { (): FormHostContext | undefined; (value: FormHostContext | undefined): void };
  stopInjection: (() => void) | undefined;
  injectionForm: string | undefined;
  publishedHost: FormHostContext | undefined;
  publishedName: string;
}

export interface FormFieldComputed {
  host: FormHostContext | null | undefined;
  isDisabled: boolean;
  isReadOnly: boolean;
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
    | "setupHost"
    | "cleanupHost";
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
