import {
  createInjectionKey,
  provide,
  inject,
  type InjectionKey,
} from "@code-ui/context";
import type { MiniAppComponent } from "@code-ui/utils";
import type { FormFieldSize } from "./form-field.types";

export interface FormFieldContextValue {
  disabled?: boolean | undefined;
  size?: FormFieldSize | undefined;
  name?: string | undefined;
}

export const FormFieldKey: InjectionKey<FormFieldContextValue> =
  createInjectionKey<FormFieldContextValue>("cui:form-field");

export function provideFormField(
  component: MiniAppComponent,
  value: FormFieldContextValue,
): void {
  provide(component, FormFieldKey, value);
}

export function injectFormField(
  component: MiniAppComponent | undefined,
): FormFieldContextValue | undefined {
  if (!component) return undefined;
  return inject(component, FormFieldKey);
}
