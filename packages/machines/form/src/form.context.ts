import {
  createEventBusKey,
  inject,
  onProvide,
  provide,
  provideEventBus,
  resolveContextRequest,
  CONTEXT_REQUEST_EVENT,
} from "@code-ui/context";
export { resolveContextRequest, CONTEXT_REQUEST_EVENT };
import type { EventBusKey } from "@code-ui/context";
import type { EventBus, MiniAppComponent } from "@code-ui/utils";
import type {
  FormBusEvents,
  FormFieldRegistration,
  FormFieldValidationState,
  FormRule,
  FormValidateOn,
} from "./form.types";

/**
 * Injection key used by `<c-form>` to provide its `EventBus` and by form item
 * consumers (`PinInput`, `Input`, `Switch`, `Checkbox`, `Radio`, etc.) to
 * `inject` it via `@code-ui/context`.
 */
export const FormBusKey: EventBusKey<FormBusEvents> =
  createEventBusKey<FormBusEvents>("cui:form-bus");

const scopedFormBusKeys = new Map<string, EventBusKey<FormBusEvents>>();

/**
 * Returns a scoped `EventBusKey` for a specific `formId` (when multiple `<c-form>`
 * instances coexist on the same Page), or the default `FormBusKey` when omitted.
 */
export function getFormBusKey(formId?: string): EventBusKey<FormBusEvents> {
  const normalized = formId?.trim();
  if (!normalized) return FormBusKey;
  let key = scopedFormBusKeys.get(normalized);
  if (!key) {
    key = createEventBusKey<FormBusEvents>(`cui:form-bus:${normalized}`);
    scopedFormBusKeys.set(normalized, key);
  }
  return key;
}

/**
 * Creates and provides a `FormBus` on a parent Form component instance.
 * When `formId` (or `component.id`) is present, the bus is also provided under
 * a scoped key (`getFormBusKey(formId)`) so fields with `form="form-id"` can
 * target a specific `<c-form>` when multiple forms share a Page.
 */
export function provideFormBus(
  component: MiniAppComponent,
  existingBus?: EventBus<FormBusEvents>,
  formId?: string,
): EventBus<FormBusEvents> {
  let bus: EventBus<FormBusEvents>;
  if (existingBus) {
    provide(component, FormBusKey, existingBus);
    bus = existingBus;
  } else {
    bus = provideEventBus(component, FormBusKey);
  }

  const ids = new Set<string>();
  if (formId?.trim()) ids.add(formId.trim());
  const compId = (component as Record<string, any>)?.id;
  if (typeof compId === "string" && compId.trim()) {
    ids.add(compId.trim());
  }

  for (const id of ids) {
    provide(component, getFormBusKey(id), bus);
  }

  return bus;
}

/**
 * Injects the ancestor Form's `EventBus` using `inject` from `@code-ui/context`.
 * Returns `undefined` when the component is used standalone outside a `<c-form>`.
 */
export function injectFormBus(
  component: MiniAppComponent | undefined,
  formId?: string,
): EventBus<FormBusEvents> | undefined {
  if (!component) return undefined;
  return inject(component, getFormBusKey(formId));
}

export interface BindFormFieldOptions {
  /** The MiniApp component instance (used to call `inject(component, FormBusKey)`) */
  component?: MiniAppComponent | undefined;
  /** Optional explicit EventBus (falls back to `injectFormBus(component)`) */
  bus?: EventBus<FormBusEvents> | undefined;
  /** Unique component / element id */
  id: string;
  /** Optional getter returning the target `<c-form>` id (`form` prop) when multiple forms exist on the same Page */
  getFormId?: (() => string | undefined) | undefined;
  /** Getter returning the field's `name` prop */
  getName: () => string;
  /** Getter returning the field's current value */
  getValue: () => any;
  /** Setter to update the field's value programmatically from Form */
  setValue?: ((value: any) => void) | undefined;
  /** Handler to reset the field back to its initial/default value */
  resetValue?: (() => void) | undefined;
  /** Handler to focus the field when `focusOnError` triggers */
  focus?: (() => void) | undefined;
  /** Getter returning the field's `rules` prop */
  getRules?: (() => FormRule[]) | undefined;
  /** Getter returning the field's `validateOn` prop */
  getValidateOn?: (() => FormValidateOn | undefined) | undefined;
  /** Getter returning whether the field is disabled */
  isDisabled?: (() => boolean) | undefined;
  /** Callback invoked whenever the Form updates this field's validation state */
  onValidationChange?: ((state: FormFieldValidationState) => void) | undefined;
  /** Callback invoked when Form-level `disabled` or `readOnly` changes */
  onFormStateChange?:
    | ((state: { disabled: boolean; readOnly: boolean }) => void)
    | undefined;
}

export interface BoundFormField {
  /** The injected Form EventBus (or `undefined` if not inside a Form) */
  readonly bus: EventBus<FormBusEvents> | undefined;
  /** Emit an `input` event to the parent Form */
  emitInput: (value: any) => void;
  /** Emit a `change` event to the parent Form */
  emitChange: (value: any) => void;
  /** Emit a `blur` event to the parent Form */
  emitBlur: (value?: any) => void;
  /** Emit a `focus` event to the parent Form */
  emitFocus: (value?: any) => void;
  /** Re-register if the field's `name` or `form` prop changes dynamically, or if a new FormBus is linked */
  rebind: (newBus?: EventBus<FormBusEvents> | null) => void;
  /** Unregister the field from the parent Form (call on `detached` / `stop`) */
  dispose: () => void;
}

/**
 * Connects any form item component or machine (`PinInput`, `Input`, `Switch`,
 * `Checkbox`, `Radio`, etc.) to an ancestor `<c-form>` via `inject(component, FormBusKey)`.
 */
export function bindFormField(options: BindFormFieldOptions): BoundFormField {
  let activeKey = getFormBusKey(options.getFormId?.());
  let bus =
    options.bus ??
    (options.component ? inject(options.component, activeKey) : undefined);
  let registeredName = "";
  let stopWatchProvide: (() => void) | undefined;

  const getFieldKey = () => {
    const rawName = options.getName();
    if (rawName && rawName.trim().length > 0) return rawName;
    const hasRules = (options.getRules?.()?.length ?? 0) > 0;
    const hasExplicitForm = Boolean(options.getFormId?.()?.trim());
    let hasDirectOwner = false;
    try {
      hasDirectOwner = Boolean(options.component?.selectOwnerComponent?.());
    } catch {
      hasDirectOwner = false;
    }
    if (options.bus || hasRules || hasExplicitForm || hasDirectOwner) {
      return options.id;
    }
    return "";
  };

  const register = () => {
    if (!bus) return;
    const nextName = getFieldKey();
    if (!nextName) {
      if (registeredName) {
        bus.emit("unregister", { name: registeredName, id: options.id });
        registeredName = "";
      }
      return;
    }
    if (registeredName && registeredName !== nextName) {
      bus.emit("unregister", { name: registeredName, id: options.id });
    }
    registeredName = nextName;

    const registration: FormFieldRegistration = {
      name: registeredName,
      id: options.id,
      getValue: options.getValue,
      setValue: options.setValue,
      resetValue: options.resetValue,
      focus: options.focus,
      getRules: options.getRules,
      getValidateOn: options.getValidateOn,
      isDisabled: options.isDisabled,
      component: options.component,
      onValidationChange: options.onValidationChange,
      onFormStateChange: options.onFormStateChange,
    };

    bus.emit("register", registration);
    if (options.getRules) {
      bus.emit("field:rules", {
        name: registeredName,
        getRules: options.getRules,
      });
    }
  };

  const subscribeProvide = (key: EventBusKey<FormBusEvents>) => {
    stopWatchProvide?.();
    stopWatchProvide = undefined;
    if (options.component && !options.bus) {
      stopWatchProvide = onProvide(
        options.component,
        key,
        (providedBus) => {
          if (bus !== providedBus) {
            if (bus && registeredName) {
              bus.emit("unregister", { name: registeredName, id: options.id });
              registeredName = "";
            }
            bus = providedBus;
            register();
          }
        },
      );
    }
  };

  subscribeProvide(activeKey);
  register();

  return {
    get bus() {
      return bus;
    },
    emitInput(value: any) {
      if (!bus) return;
      const name = getFieldKey();
      if (!name) return;
      bus.emit("input", { name, value, id: options.id });
    },
    emitChange(value: any) {
      if (!bus) return;
      const name = getFieldKey();
      if (!name) return;
      bus.emit("change", { name, value, id: options.id });
    },
    emitBlur(value?: any) {
      if (!bus) return;
      const name = getFieldKey();
      if (!name) return;
      bus.emit("blur", {
        name,
        value: value !== undefined ? value : options.getValue(),
        id: options.id,
      });
    },
    emitFocus(value?: any) {
      if (!bus) return;
      const name = getFieldKey();
      if (!name) return;
      bus.emit("focus", {
        name,
        value: value !== undefined ? value : options.getValue(),
        id: options.id,
      });
    },
    rebind(newBus?: EventBus<FormBusEvents> | null) {
      if (newBus !== undefined) {
        const nextBus = newBus === null ? undefined : newBus;
        if (bus !== nextBus) {
          if (bus && registeredName) {
            bus.emit("unregister", { name: registeredName, id: options.id });
            registeredName = "";
          }
          bus = nextBus;
        }
        if (nextBus) {
          stopWatchProvide?.();
          stopWatchProvide = undefined;
        }
      }
      const nextKey = getFormBusKey(options.getFormId?.());
      if (nextKey !== activeKey) {
        if (bus && registeredName) {
          bus.emit("unregister", { name: registeredName, id: options.id });
          registeredName = "";
        }
        activeKey = nextKey;
        if (!bus) {
          bus = options.component
            ? inject(options.component, activeKey)
            : undefined;
          subscribeProvide(activeKey);
        }
      }
      register();
    },
    dispose() {
      stopWatchProvide?.();
      stopWatchProvide = undefined;
      if (!bus || !registeredName) return;
      if (options.getRules) {
        bus.emit("field:rules", {
          name: registeredName,
          getRules: () => [],
        });
      }
      bus.emit("unregister", { name: registeredName, id: options.id });
      registeredName = "";
    },
  };
}

export interface FormFieldSyncOptions {
  component?: any;
  bus?: EventBus<FormBusEvents> | undefined;
  id?: string | undefined;
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
  onStateChange?:
    | ((state: {
        fieldDisabled?: boolean | undefined;
        fieldSize?: any;
        formDisabled?: boolean | undefined;
        formReadOnly?: boolean | undefined;
      }) => void)
    | undefined;
}

export function setupFormFieldSync(
  options: FormFieldSyncOptions,
  refs: any,
): BoundFormField {
  refs.get("formField")?.dispose();
  refs.set("currentFormBus", options.bus);

  let suppressEmit = false;

  const bound = bindFormField({
    component: options.component,
    bus: options.bus,
    id: options.id ?? "field",
    getFormId: options.getFormId,
    getName: options.getName,
    getValue: options.getValue,
    setValue: (rawVal: any) => {
      suppressEmit = true;
      try {
        options.setValue(rawVal);
      } finally {
        suppressEmit = false;
      }
    },
    resetValue: () => {
      suppressEmit = true;
      try {
        options.resetValue();
      } finally {
        suppressEmit = false;
      }
    },
    focus: options.focus,
    getRules: options.getRules,
    getValidateOn: options.getValidateOn,
    isDisabled: options.isDisabled,
    onValidationChange: (valState) => {
      options.onValidationChange?.(valState.isValid);
    },
    onFormStateChange: ({ disabled, readOnly }) => {
      options.onStateChange?.({
        formDisabled: disabled,
        formReadOnly: readOnly,
      });
    },
  });

  const bus = bound.bus;
  const disposers: Array<() => void> = [];
  if (bus) {
    disposers.push(
      bus.on("field:state", (payload: any) => {
        const currentName = options.getName();
        if (!payload?.name || payload.name === currentName) {
          options.onStateChange?.({
            fieldDisabled: payload.disabled,
            fieldSize: payload.size,
          });
        }
      }),
    );
    disposers.push(
      bus.on("form:state", (payload: any) => {
        options.onStateChange?.({
          formDisabled: payload?.disabled,
          formReadOnly: payload?.readOnly,
        });
      }),
    );
  }
  refs.set("busDisposers", disposers);

  const origEmitInput = bound.emitInput.bind(bound);
  const origEmitChange = bound.emitChange.bind(bound);
  bound.emitInput = (val: any) => {
    if (!suppressEmit) origEmitInput(val);
  };
  bound.emitChange = (val: any) => {
    if (!suppressEmit) origEmitChange(val);
  };

  refs.set("formField", bound);
  return bound;
}

export function cleanupFormFieldSync(refs: any) {
  refs.get("formField")?.dispose();
  refs.set("formField", undefined);
  refs.set("currentFormBus", undefined);
  const disposers = refs.get("busDisposers") ?? [];
  for (let i = 0; i < disposers.length; i++) {
    disposers[i]?.();
  }
  refs.set("busDisposers", []);
}
