import type { Machine, Params, Service } from "@code-id-labs/core";
import type { FormHostContext, FormRule } from "@code-id-labs/form";
import type { MiniAppComponent } from "@code-id-labs/utils";


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
  error?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  rules?: FormRule[] | undefined;
  formContext?: FormHostContext | null | undefined;
  form?: string | undefined;
  component?: MiniAppComponent | undefined;
}

export type FormFieldDefaultedKey =
  | "name"
  | "form"
  | "label"
  | "error"
  | "required"
  | "disabled"
  | "rules";

export type FormFieldResolvedProps = Omit<
  FormFieldProps,
  FormFieldDefaultedKey
> & {
  [K in FormFieldDefaultedKey]-?: Exclude<FormFieldProps[K], undefined>;
};

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
  invalid: boolean;
  effectiveRules: FormRule[];
}

export interface FormFieldSchema {
  state: FormFieldState;
  tag: "valid" | "invalid";
  props: FormFieldResolvedProps;
  context: FormFieldContext;
  refs: FormFieldRefs;
  computed: FormFieldComputed;
  event: FormFieldEvent;
  action:
    | "setInnerError"
    | "clearInnerError"
    | "setupHost"
    | "cleanupHost";
  effect: "trackHostForm" | "trackDisplayErrorState" | "trackFieldProps";
}

export type FormFieldService = Service<FormFieldSchema>;
export type FormFieldMachine = Machine<FormFieldSchema>;
export type FormFieldParams = Params<FormFieldSchema>;

export interface FormFieldApi {
  invalid: boolean;
  displayError: string;
  effectiveRules: FormRule[];
  disabled: boolean;

  rootProps: Record<string, any>;
  labelProps: Record<string, any>;
  errorProps: Record<string, any>;
}
