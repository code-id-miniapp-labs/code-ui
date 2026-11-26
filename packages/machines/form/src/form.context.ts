import {
  createInjectionKey,
  inject,
  onProvide,
  provide,
  unprovide,
  resolveContextRequest,
  CONTEXT_REQUEST_EVENT,
} from "@code-id-labs/context";
import { effect, getActiveSub, setActiveSub, signal } from "alien-signals";
import type { InjectionKey } from "@code-id-labs/context";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type {
  FormHostContext,
  FormFieldValidationState,
  FormRule,
  FormValidateOn,
} from "./form.types";

export { resolveContextRequest, CONTEXT_REQUEST_EVENT };
export type { FormHostContext } from "./form.types";

export const FormHostKey = createInjectionKey<FormHostContext>("cui:form-host");
const scopedFormHostKeys = new Map<string, InjectionKey<FormHostContext>>();
const scopedFormHostCounts = new Map<string, number>();

export function getFormHostKey(formId?: string): InjectionKey<FormHostContext> {
  const normalized = formId?.trim();
  if (!normalized) return FormHostKey;
  let key = scopedFormHostKeys.get(normalized);
  if (!key) {
    key = createInjectionKey<FormHostContext>(`cui:form-host:${normalized}`);
    scopedFormHostKeys.set(normalized, key);
  }
  return key;
}

function collectScopedFormIds(
  component: MiniAppComponent,
  formId?: string,
): Set<string> {
  const ids = new Set<string>();
  if (formId?.trim()) ids.add(formId.trim());
  if (typeof component.id === "string" && component.id.trim()) {
    ids.add(component.id.trim());
  }
  return ids;
}

export function provideFormHost(
  component: MiniAppComponent,
  host: FormHostContext,
  formId?: string,
): FormHostContext {
  provide(component, FormHostKey, host);
  const ids = collectScopedFormIds(component, formId);
  for (const id of ids) {
    scopedFormHostCounts.set(id, (scopedFormHostCounts.get(id) ?? 0) + 1);
    provide(component, getFormHostKey(id), host);
  }
  return host;
}

export function unprovideFormHost(
  component: MiniAppComponent | undefined,
  host?: FormHostContext,
  formId?: string,
): void {
  if (!component) return;
  unprovide(component, FormHostKey, host !== undefined ? { value: host } : undefined);
  const ids = collectScopedFormIds(component, formId);
  for (const id of ids) {
    const key = scopedFormHostKeys.get(id);
    if (!key) continue;
    const nextCount = (scopedFormHostCounts.get(id) ?? 1) - 1;
    const pruneKey = nextCount <= 0;
    if (pruneKey) {
      scopedFormHostCounts.delete(id);
      scopedFormHostKeys.delete(id);
    } else {
      scopedFormHostCounts.set(id, nextCount);
    }
    unprovide(
      component,
      key,
      host !== undefined ? { value: host, pruneKey } : { pruneKey },
    );
  }
}

export function injectFormHost(
  component: MiniAppComponent | undefined,
  formId?: string,
): FormHostContext | undefined {
  return component ? inject(component, getFormHostKey(formId)) : undefined;
}

export interface BindFormFieldOptions {
  component?: MiniAppComponent | undefined;
  host?: FormHostContext | undefined;
  getHost?: (() => FormHostContext | null | undefined) | undefined;
  id: string;
  rootId?: string | undefined;
  getFormId?: (() => string | undefined) | undefined;
  getName: () => string;
  getValue: () => any;
  setValue?: ((value: any) => void) | undefined;
  resetValue?: (() => void) | undefined;
  focus?: (() => void) | undefined;
  getRules?: (() => FormRule[]) | undefined;
  getValidateOn?: (() => FormValidateOn | undefined) | undefined;
  isDisabled?: (() => boolean) | undefined;
  onValidationChange?: ((state: FormFieldValidationState) => void) | undefined;
}

export interface BoundFormField {
  readonly host: FormHostContext | undefined;
  emitInput(value: any): void;
  emitChange(value: any): void;
  emitBlur(value?: any): void;
  emitFocus(value?: any): void;
  dispose(): void;
}

function untracked<T>(callback: () => T): T {
  const previous = getActiveSub();
  setActiveSub(undefined);
  try {
    return callback();
  } finally {
    setActiveSub(previous);
  }
}

export function bindFormField(options: BindFormFieldOptions): BoundFormField {
  const hostSignal = signal<FormHostContext | undefined>(undefined);
  let activeHost: FormHostContext | undefined;
  let registeredName = "";
  let unregister: (() => void) | undefined;
  let stopWatchProvide: (() => void) | undefined;
  let stopRegistration: (() => void) | undefined;
  let disposed = false;

  const getFieldKey = () => {
    const name = options.getName();
    if (name?.trim()) return name;
    return (options.getRules?.()?.length ?? 0) > 0 ||
      options.getFormId?.()?.trim()
      ? options.id
      : "";
  };
  const detach = () => {
    const cleanup = unregister;
    unregister = undefined;
    registeredName = "";
    untracked(() => cleanup?.());
  };
  const ensureRegistration = (host: FormHostContext | undefined) => {
    if (!host) {
      if (stopRegistration) {
        stopRegistration();
        stopRegistration = undefined;
      }
      activeHost = undefined;
      detach();
      return;
    }
    if (!stopRegistration) {
      stopRegistration = effect(() => {
        const currentHost = hostSignal();
        const name = getFieldKey();
        untracked(() => {
          if (activeHost === currentHost && registeredName === name) return;
          detach();
          activeHost = currentHost;
          if (!currentHost || !name) return;
          registeredName = name;
          unregister = currentHost.register({
            name,
            id: options.id,
            rootId: options.rootId,
            getValue: options.getValue,
            setValue: options.setValue,
            resetValue: options.resetValue,
            focus: options.focus,
            getRules: options.getRules,
            getValidateOn: options.getValidateOn,
            isDisabled: options.isDisabled,
            component: options.component,
            onValidationChange: options.onValidationChange,
          });
        });
      });
    }
  };
  const setHost = (next: FormHostContext | undefined) => {
    hostSignal(next);
    ensureRegistration(next);
  };
  const stopDiscovery = effect(() => {
    const host = options.getHost ? options.getHost() : options.host;
    const key = getFormHostKey(options.getFormId?.());
    untracked(() => {
      stopWatchProvide?.();
      stopWatchProvide = undefined;
      if (host !== undefined) {
        setHost(host ?? undefined);
      } else if (options.component) {
        setHost(inject(options.component, key));
        stopWatchProvide = onProvide(options.component, key, (next) => {
          if (!disposed) untracked(() => setHost(next));
        });
      } else {
        setHost(undefined);
      }
    });
  });

  const notify = (
    trigger: "input" | "change" | "blur" | "focus",
    value: any,
  ) => {
    if (disposed) return;
    const name = getFieldKey();
    if (name) activeHost?.notify(trigger, { name, value, id: options.id });
  };
  return {
    get host() {
      return hostSignal();
    },
    emitInput: (value) => notify("input", value),
    emitChange: (value) => notify("change", value),
    emitBlur: (value) =>
      notify("blur", value === undefined ? options.getValue() : value),
    emitFocus: (value) =>
      notify("focus", value === undefined ? options.getValue() : value),
    dispose() {
      if (disposed) return;
      disposed = true;
      stopDiscovery();
      stopRegistration?.();
      stopRegistration = undefined;
      untracked(() => stopWatchProvide?.());
      stopWatchProvide = undefined;
      detach();
      activeHost = undefined;
      hostSignal(undefined);
    },
  };
}

export interface FormFieldSyncOptions {
  component?: MiniAppComponent | undefined;
  host?: FormHostContext | undefined;
  getHost?: (() => FormHostContext | null | undefined) | undefined;
  id?: string | undefined;
  rootId?: string | undefined;
  getFormId?: (() => string | undefined) | undefined;
  getName: () => string;
  getValue: () => any;
  setValue: (value: any) => void;
  resetValue: () => void;
  focus?: (() => void) | undefined;
  getRules?: (() => FormRule[]) | undefined;
  getValidateOn?: (() => FormValidateOn | undefined) | undefined;
  isDisabled?: (() => boolean) | undefined;
  onValidationChange?: ((isValid: boolean) => void) | undefined;
}

export function setupFormFieldSync(
  options: FormFieldSyncOptions,
  refs: any,
): BoundFormField {
  refs.get("formField")?.dispose();
  let suppressEmit = false;
  const suppress = (fn: () => void) => {
    const previous = suppressEmit;
    suppressEmit = true;
    try {
      fn();
    } finally {
      suppressEmit = previous;
    }
  };
  const bound = bindFormField({
    ...options,
    id: options.id ?? "field",
    setValue: (value) => suppress(() => options.setValue(value)),
    resetValue: () => suppress(options.resetValue),
    onValidationChange: (state) => options.onValidationChange?.(state.isValid),
  });
  const emitInput = bound.emitInput;
  const emitChange = bound.emitChange;
  bound.emitInput = (value) => {
    if (!suppressEmit) emitInput(value);
  };
  bound.emitChange = (value) => {
    if (!suppressEmit) emitChange(value);
  };
  refs.set("formField", bound);
  return bound;
}

export function cleanupFormFieldSync(refs: any): void {
  refs.get("formField")?.dispose();
  refs.set("formField", undefined);
}

function resolveFormHost(prop: any, refs: any): FormHostContext | undefined {
  return prop("formContext") ?? refs.get("formField")?.host;
}

export function hasFormFieldErrors(
  prop: any,
  refs: any,
  scope: { id?: string | undefined },
  fallbackId: string,
): boolean {
  return Boolean(
    resolveFormHost(prop, refs)?.errors(prop("name") || scope.id || fallbackId)
      .length,
  );
}

export function createFormFieldComputed(fallbackId: string) {
  const key = (prop: any, scope: { id?: string | undefined }) =>
    prop("name") || scope.id || fallbackId;
  return {
    formDisabled: ({ prop, refs }: any): boolean =>
      resolveFormHost(prop, refs)?.disabled() ?? false,
    formReadOnly: ({ prop, refs }: any): boolean =>
      resolveFormHost(prop, refs)?.readOnly() ?? false,
    fieldDisabled: ({ prop, refs, scope }: any): boolean =>
      Boolean(
        prop("fieldDisabled") ||
          resolveFormHost(prop, refs)?.fieldState(key(prop, scope))?.disabled,
      ),
  };
}
