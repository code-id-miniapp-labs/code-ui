import type { MachineSchema } from "@code-ui/core";
import type { MiniappMachine } from "../machine";
import type { MachinePlugin } from "../plugin";
import {
  createBehaviorRef,
  createRelationOption,
  patchInheritedData,
  resolveInstanceId,
  resolveParentNode,
  resolveServiceProp,
  resolveServiceRef,
} from "./inherit";
import type {
  CodeUiComponentInstance,
  FormFieldInstance,
  FormFieldWrapperInstance,
  FormInheritedData,
  FormParentInstance,
  FormSnapshotLike,
  MiniappBehaviorRef,
} from "./types";

type FormHostRef = object;

function getHost(
  instance?: FormParentInstance | FormFieldWrapperInstance | FormFieldInstance | null,
): FormHostRef | undefined {
  return (
    (instance?.__codeUiFormHost as FormHostRef | undefined) ??
    resolveServiceRef<FormHostRef>(instance, "hostContext")
  );
}

function getFormParentIdentifier(parent: FormParentInstance): string | undefined {
  const resolvedId = resolveInstanceId(parent);
  if (resolvedId) return resolvedId;
  const dataName = parent.data?.name;
  if (typeof dataName === "string" && dataName.trim().length > 0) {
    return dataName;
  }
  const propName = resolveServiceProp<string>(parent, "name");
  if (typeof propName === "string" && propName.trim().length > 0) {
    return propName;
  }
  return undefined;
}

/**
 * Shared Behavior reference for `<c-form>` parent components.
 * Used as `relations.target` to link descendant form fields natively
 * without file paths or tree-shaking hazards.
 */
export const cuiFormParentBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});

/**
 * Shared Behavior reference for `<c-form-field>` wrapper components.
 * Used as `relations.target` to link descendant form controls.
 */
export const cuiFormFieldWrapperBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});

const cuiFormFieldWrapperObserverBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    observers: {
      size(this: FormFieldWrapperInstance) {
        const size = getFormFieldWrapperSize(this);
        const children = this.__codeUiFieldChildren ?? [];
        for (const child of children) {
          patchInheritedData<FormInheritedData>(child, { fieldSize: size });
        }
      },
    },
  });

export function shouldLinkField(
  parent: FormParentInstance,
  child: FormFieldInstance,
): boolean {
  const childFormProp =
    child.data?.form ?? resolveServiceProp<string>(child, "form");
  if (typeof childFormProp === "string" && childFormProp.trim().length > 0) {
    const parentId = getFormParentIdentifier(parent);
    return (
      parentId !== undefined && childFormProp.trim() === parentId.trim()
    );
  }
  if (typeof child.getRelationNodes === "function") {
    const ancestors = child.getRelationNodes<FormParentInstance>("cuiFormParent");
    if (ancestors && ancestors.length > 0) {
      return ancestors[0] === parent;
    }
  }
  return true;
}

export function linkFieldToParentHost(
  parent: FormParentInstance,
  child: FormFieldInstance,
  host: FormHostRef | undefined,
): void {
  if (!host || !shouldLinkField(parent, child)) return;
  child.__codeUiFormHost = host;
  child.__codeUiMachine?.updateProps({ formContext: host });
  if (Array.isArray(child.__codeUiFieldChildren)) {
    for (const nested of child.__codeUiFieldChildren) {
      updateChildFromFormFieldWrapper(child as FormFieldWrapperInstance, nested);
    }
  }
}

export function unlinkFieldFromParentHost(
  parent: FormParentInstance,
  child: FormFieldInstance,
): void {
  if (Array.isArray(parent.__codeUiPendingFields)) {
    parent.__codeUiPendingFields = parent.__codeUiPendingFields.filter(
      (field) => field !== child,
    );
  }
  const parentHost = getHost(parent);
  if (child.__codeUiFormHost && child.__codeUiFormHost === parentHost) {
    child.__codeUiFormHost = undefined;
    child.__codeUiMachine?.updateProps({ formContext: null });
  }
}

export function getFormFieldWrapperDisabled(
  wrapper: FormFieldWrapperInstance,
  snapshot?: FormSnapshotLike,
): boolean {
  if (typeof snapshot?.disabled === "boolean") return snapshot.disabled;
  const svc = wrapper.__codeUiMachine?.service;
  if (svc?.context) {
    const computedDisabled = svc.computed?.("isDisabled");
    if (typeof computedDisabled === "boolean") return computedDisabled;
    return Boolean(svc.context.get("disabled"));
  }
  const apiDisabled = wrapper.__codeUiApi?.disabled;
  return typeof apiDisabled === "boolean"
    ? apiDisabled
    : Boolean(wrapper.data?.disabled);
}

export function getFormFieldWrapperSize(
  wrapper?: FormFieldWrapperInstance | null,
): string {
  const raw = wrapper?.data?.size;
  return typeof raw === "string" ? raw : "";
}

export function getFormFieldWrapperName(
  wrapper: FormFieldWrapperInstance,
  snapshot?: FormSnapshotLike,
): string | undefined {
  const apiName = wrapper.__codeUiApi?.name;
  const raw =
    snapshot?.name ||
    wrapper.__codeUiMachine?.service?.context?.get<string>("name") ||
    (typeof apiName === "string" ? apiName : undefined) ||
    wrapper.data?.name;
  return typeof raw === "string" && raw ? raw : undefined;
}

export function updateChildFromFormFieldWrapper(
  wrapper: FormFieldWrapperInstance,
  child: FormFieldInstance,
  snapshot?: FormSnapshotLike,
): void {
  const disabled = getFormFieldWrapperDisabled(wrapper, snapshot);
  const size = getFormFieldWrapperSize(wrapper);
  const wrapperName = getFormFieldWrapperName(wrapper, snapshot);
  const host = getHost(wrapper);

  patchInheritedData<FormInheritedData>(child, { fieldSize: size });
  if (!child.__codeUiMachine) return;

  const patch: Record<string, unknown> = {
    fieldDisabled: disabled,
  };
  if (wrapperName && !child.data?.name) {
    patch.name = wrapperName;
  }
  if (host && !child.__codeUiFormHost) {
    child.__codeUiFormHost = host;
    patch.formContext = host;
  }
  child.__codeUiMachine.updateProps(patch);
}

export function linkFieldToWrapper(
  wrapper: FormFieldWrapperInstance,
  child: FormFieldInstance,
): void {
  if (
    child === (wrapper as unknown as FormFieldInstance) ||
    child.__codeUiIsFormFieldWrapper
  ) {
    return;
  }
  const children = (wrapper.__codeUiFieldChildren ||= []);
  if (!children.includes(child)) {
    children.push(child);
  }
  child.__codeUiFieldWrapper = wrapper;
  updateChildFromFormFieldWrapper(wrapper, child);
}

export function unlinkFieldFromWrapper(
  wrapper: FormFieldWrapperInstance,
  child: FormFieldInstance,
): void {
  if (wrapper.__codeUiFieldChildren) {
    const idx = wrapper.__codeUiFieldChildren.indexOf(child);
    if (idx !== -1) wrapper.__codeUiFieldChildren.splice(idx, 1);
  }
  if (child.__codeUiFieldWrapper === wrapper) {
    child.__codeUiFieldWrapper = undefined;
    patchInheritedData<FormInheritedData>(child, { fieldSize: "" });
    child.__codeUiMachine?.updateProps({ fieldDisabled: undefined });
  }
}

const cuiFormParentRel = createRelationOption<FormFieldInstance, FormParentInstance>({
  type: "ancestor",
  target: cuiFormParentBehavior,
  linked(this: FormFieldInstance, target: FormParentInstance) {
    const host = getHost(target);
    if (host) {
      linkFieldToParentHost(target, this, host);
    } else {
      (target.__codeUiPendingFields ||= []).push(this);
    }
  },
  unlinked(this: FormFieldInstance, target: FormParentInstance) {
    unlinkFieldFromParentHost(target, this);
  },
});

const cuiFormWrapperRel = createRelationOption<
  FormFieldInstance,
  FormFieldWrapperInstance
>({
  type: "ancestor",
  target: cuiFormFieldWrapperBehavior,
  linked(this: FormFieldInstance, target: FormFieldWrapperInstance) {
    linkFieldToWrapper(target, this);
  },
  unlinked(this: FormFieldInstance, target: FormFieldWrapperInstance) {
    unlinkFieldFromWrapper(target, this);
  },
});

/**
 * Shared Behavior reference for form control components.
 * Automatically wires `relations.target` to link to ancestor `<c-form>` and `<c-form-field>`.
 */
export const cuiFormFieldBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    data: {
      fieldSize: "",
    },
    relations: { cuiFormParent: cuiFormParentRel },
  });

function attachFormField(
  instance: FormFieldInstance,
  initialProps: Record<string, unknown>,
): void {
  if (typeof instance.getRelationNodes === "function") {
    const parent =
      instance.getRelationNodes<FormParentInstance>("cuiFormParent")?.[0];
    if (parent) {
      const host = getHost(parent);
      if (host && shouldLinkField(parent, instance)) {
        initialProps.formContext = host;
        instance.__codeUiFormHost = host;
      }
    }
  }

  const wrapper = resolveParentNode<FormFieldWrapperInstance>(
    instance,
    instance.__codeUiFieldWrapper,
    "cuiFormFieldWrapper",
  );
  if (!wrapper) return;

  initialProps.fieldDisabled = getFormFieldWrapperDisabled(wrapper);
  patchInheritedData<FormInheritedData>(instance, {
    fieldSize: getFormFieldWrapperSize(wrapper),
  });
  const wrapperName = getFormFieldWrapperName(wrapper);
  if (wrapperName && !initialProps.name) {
    initialProps.name = wrapperName;
  }
  const wrapperHost = getHost(wrapper);
  if (wrapperHost && !initialProps.formContext) {
    initialProps.formContext = wrapperHost;
    instance.__codeUiFormHost = wrapperHost;
  }
}

export function setupFormRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: {
    formParent?: boolean;
    formField?: boolean;
    formFieldWrapper?: boolean;
  },
): void {
  if (options.formParent) {
    relations.cuiFormField = createRelationOption<
      FormParentInstance,
      FormFieldInstance
    >({
      type: "descendant",
      target: cuiFormFieldBehavior,
      linked(this: FormParentInstance, target: FormFieldInstance) {
        const host = getHost(this);
        if (!host) {
          (this.__codeUiPendingFields ||= []).push(target);
          return;
        }
        linkFieldToParentHost(this, target, host);
      },
      unlinked(this: FormParentInstance, target: FormFieldInstance) {
        unlinkFieldFromParentHost(this, target);
      },
    });
  }

  if (options.formFieldWrapper) {
    relations.cuiFormFieldChild = createRelationOption<
      FormFieldWrapperInstance,
      FormFieldInstance
    >({
      type: "descendant",
      target: cuiFormFieldBehavior,
      linked(this: FormFieldWrapperInstance, target: FormFieldInstance) {
        linkFieldToWrapper(this, target);
      },
      unlinked(this: FormFieldWrapperInstance, target: FormFieldInstance) {
        unlinkFieldFromWrapper(this, target);
      },
    });
  }

  if (options.formField) {
    relations.cuiFormParent = cuiFormParentRel;
    relations.cuiFormFieldWrapper = cuiFormWrapperRel;
  }
}

export function handleFormAttached(
  instance: FormFieldInstance,
  initialProps: Record<string, unknown>,
  options: {
    formParent?: boolean;
    formField?: boolean;
    formFieldWrapper?: boolean;
  },
): void {
  if (options.formField) {
    attachFormField(instance, initialProps);
  }
}

export function handleFormMachineStarted(
  instance: FormParentInstance | FormFieldWrapperInstance,
  machine: Pick<MiniappMachine<MachineSchema>, "service"> | CodeUiComponentInstance["__codeUiMachine"],
  options: {
    formParent?: boolean;
    formFieldWrapper?: boolean;
  },
): void {
  if (options.formFieldWrapper) {
    const wrapper = instance as FormFieldWrapperInstance;
    wrapper.__codeUiIsFormFieldWrapper = true;
    wrapper.__codeUiOnSnapshot = (snapshot: FormSnapshotLike) => {
      if (!wrapper.__codeUiFieldChildren) return;
      for (const child of wrapper.__codeUiFieldChildren) {
        updateChildFromFormFieldWrapper(wrapper, child, snapshot);
      }
    };
    const children =
      wrapper.getRelationNodes?.<FormFieldInstance>("cuiFormFieldChild") ?? [];
    for (const child of children) {
      linkFieldToWrapper(wrapper, child);
    }
  }

  if (options.formParent) {
    const parent = instance as FormParentInstance;
    const refs = machine?.service?.refs as
      | { get?: (key: string) => unknown }
      | undefined;
    const host = refs?.get?.("hostContext") as FormHostRef | undefined;
    if (host) {
      parent.__codeUiFormHost = host;
    }

    const pending = parent.__codeUiPendingFields;
    if (Array.isArray(pending)) {
      for (const field of pending) {
        linkFieldToParentHost(parent, field, host);
      }
      parent.__codeUiPendingFields = [];
    }

    const fields =
      parent.getRelationNodes?.<FormFieldInstance>("cuiFormField") ?? [];
    for (const field of fields) {
      linkFieldToParentHost(parent, field, host);
    }
  }
}

export function handleFormReady(
  instance: FormParentInstance,
  options: {
    formParent?: boolean;
  },
): void {
  if (!options.formParent || typeof instance.getRelationNodes !== "function") {
    return;
  }
  const host = getHost(instance);
  if (!host) return;
  const fields = instance.getRelationNodes<FormFieldInstance>("cuiFormField") ?? [];
  for (const field of fields) {
    linkFieldToParentHost(instance, field, host);
  }
}

export function handleFormDetached(
  instance: FormParentInstance | FormFieldInstance | FormFieldWrapperInstance,
  options: {
    formParent?: boolean;
    formField?: boolean;
    formFieldWrapper?: boolean;
  },
): void {
  if (options.formParent) {
    const parent = instance as FormParentInstance;
    const fields =
      parent.getRelationNodes?.<FormFieldInstance>("cuiFormField") ?? [];
    for (const field of fields) {
      unlinkFieldFromParentHost(parent, field);
    }
    parent.__codeUiFormHost = undefined;
    parent.__codeUiPendingFields = [];
  }
  if (options.formField) {
    (instance as FormFieldInstance).__codeUiFormHost = undefined;
  }
  if (options.formFieldWrapper) {
    const wrapper = instance as FormFieldWrapperInstance;
    for (const child of (wrapper.__codeUiFieldChildren ?? []).slice()) {
      unlinkFieldFromWrapper(wrapper, child);
    }
    wrapper.__codeUiFieldChildren = [];
    wrapper.__codeUiOnSnapshot = undefined;
  }
}

export function withFormParent(): MachinePlugin {
  return {
    name: "form-parent",
    behaviors: [cuiFormParentBehavior],
    setupRelations(relations) {
      setupFormRelations(relations, { formParent: true });
    },
    onMachineStarted(instance, machine) {
      handleFormMachineStarted(instance as FormParentInstance, machine, {
        formParent: true,
      });
    },
    onReady(instance) {
      handleFormReady(instance as FormParentInstance, { formParent: true });
    },
    onDetached(instance) {
      handleFormDetached(instance as FormParentInstance, { formParent: true });
    },
  };
}

export interface WithFormFieldOptions {
  native?: boolean;
}

export function withFormField(options?: WithFormFieldOptions): MachinePlugin {
  const behaviors: MiniappBehaviorRef[] = [cuiFormFieldBehavior];
  if (options?.native !== false) behaviors.push("wx://form-field");

  return {
    name: "form-field",
    behaviors,
    setupRelations(relations) {
      relations.cuiFormParent = cuiFormParentRel;
      relations.cuiFormFieldWrapper = cuiFormWrapperRel;
    },
    onAttached(instance, initialProps) {
      attachFormField(instance as FormFieldInstance, initialProps);
    },
    onDetached(instance) {
      (instance as FormFieldInstance).__codeUiFormHost = undefined;
    },
  };
}

export function withFormFieldWrapper(): MachinePlugin {
  return {
    name: "form-field-wrapper",
    behaviors: [cuiFormFieldWrapperBehavior, cuiFormFieldWrapperObserverBehavior],
    setupRelations(relations) {
      setupFormRelations(relations, { formFieldWrapper: true });
    },
    onMachineStarted(instance, machine) {
      handleFormMachineStarted(instance as FormFieldWrapperInstance, machine, {
        formFieldWrapper: true,
      });
    },
    onPropChanged(instance, propKey) {
      if (propKey !== "disabled" && propKey !== "name") return;
      const wrapper = instance as FormFieldWrapperInstance;
      const children = wrapper.__codeUiFieldChildren ?? [];
      for (const child of children) {
        updateChildFromFormFieldWrapper(wrapper, child);
      }
    },
    onDetached(instance) {
      handleFormDetached(instance as FormFieldWrapperInstance, {
        formFieldWrapper: true,
      });
    },
  };
}
