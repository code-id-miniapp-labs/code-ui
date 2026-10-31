import type { MachinePlugin } from "../plugin";

function getServiceBus(service: any) {
  return service?.refs?.get ? service.refs.get("bus") : undefined;
}

/**
 * Shared Behavior reference for `<c-form>` parent components.
 * Used as relations.target to link descendant form fields natively
 * without file paths or tree-shaking hazards.
 */
export const cuiFormParentBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};

/**
 * Shared Behavior reference for `<c-form-field>` wrapper components.
 * Used as relations.target to link descendant form controls.
 */
export const cuiFormFieldWrapperBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};

export function shouldLinkField(parent: any, child: any): boolean {
  const childFormProp =
    child.data?.form ?? child.__codeUiMachine?.service?.prop?.("form");
  if (typeof childFormProp === "string" && childFormProp.trim().length > 0) {
    const parentId =
      parent.id ||
      parent.data?.id ||
      parent.data?.name ||
      parent.__codeUiMachine?.service?.prop?.("name") ||
      parent.__codeUiMachine?.service?.prop?.("id");
    return childFormProp.trim() === String(parentId).trim();
  }
  if (typeof child.getRelationNodes === "function") {
    const ancestors = child.getRelationNodes("cuiFormParent");
    if (ancestors && ancestors.length > 0) {
      return ancestors[0] === parent;
    }
  }
  return true;
}

export function linkFieldToParentBus(parent: any, child: any, bus: any) {
  if (!shouldLinkField(parent, child)) return;
  child.__codeUiFormBus = bus;
  if (child.__codeUiMachine) {
    child.__codeUiMachine.updateProps({ formBus: bus });
  }
  if (typeof child.__codeUiBindFormBus === "function") {
    child.__codeUiBindFormBus(bus);
  }
  if (child.__codeUiFieldChildren && Array.isArray(child.__codeUiFieldChildren)) {
    for (const nested of child.__codeUiFieldChildren) {
      updateChildFromFormFieldWrapper(child, nested);
    }
  }
}

export function unlinkFieldFromParentBus(parent: any, child: any) {
  const parentBus =
    parent.__codeUiFormBus ?? getServiceBus(parent.__codeUiMachine?.service);
  if (child.__codeUiFormBus && child.__codeUiFormBus === parentBus) {
    child.__codeUiFormBus = undefined;
    if (child.__codeUiMachine) {
      child.__codeUiMachine.updateProps({ formBus: undefined });
    }
    if (typeof child.__codeUiUnlinkFormBus === "function") {
      child.__codeUiUnlinkFormBus();
    }
  }
}

export function getFormFieldWrapperDisabled(wrapper: any, snapshot?: any): boolean {
  if (snapshot && typeof snapshot.disabled === "boolean") {
    return snapshot.disabled;
  }
  if (wrapper.__codeUiMachine?.service?.context) {
    const ctx = wrapper.__codeUiMachine.service.context;
    return Boolean(ctx.get("disabled") || ctx.get("formDisabled"));
  }
  const api = (wrapper as any).__codeUiApi;
  if (api && typeof api.disabled === "boolean") {
    return api.disabled;
  }
  return Boolean(wrapper.data?.disabled);
}

export function getFormFieldWrapperSize(
  wrapper: any,
  snapshot?: any,
): string | undefined {
  if (snapshot && snapshot.size) {
    return snapshot.size;
  }
  if (wrapper.__codeUiMachine?.service?.context) {
    return wrapper.__codeUiMachine.service.context.get("size");
  }
  const api = (wrapper as any).__codeUiApi;
  if (api && api.size) {
    return api.size;
  }
  return wrapper.data?.size;
}

export function getFormFieldWrapperName(
  wrapper: any,
  snapshot?: any,
): string | undefined {
  if (snapshot && typeof snapshot.name === "string" && snapshot.name) {
    return snapshot.name;
  }
  if (wrapper.__codeUiMachine?.service?.context) {
    const name = wrapper.__codeUiMachine.service.context.get("name");
    if (name) return name;
  }
  const api = (wrapper as any).__codeUiApi;
  if (api && typeof api.name === "string" && api.name) {
    return api.name;
  }
  return wrapper.data?.name || undefined;
}

export function updateChildFromFormFieldWrapper(
  wrapper: any,
  child: any,
  snapshot?: any,
) {
  const disabled = getFormFieldWrapperDisabled(wrapper, snapshot);
  const size = getFormFieldWrapperSize(wrapper, snapshot);
  const wrapperName = getFormFieldWrapperName(wrapper, snapshot);
  const bus =
    wrapper.__codeUiFormBus ??
    getServiceBus(wrapper.__codeUiMachine?.service);
  if (child.__codeUiMachine) {
    const patch: Record<string, any> = {
      fieldDisabled: disabled,
      fieldSize: size,
    };
    if (wrapperName && !child.data?.name) {
      patch.name = wrapperName;
    }
    if (bus && !child.__codeUiFormBus) {
      child.__codeUiFormBus = bus;
      patch.formBus = bus;
    }
    child.__codeUiMachine.updateProps(patch);
    if (patch.name || patch.formBus) {
      child.__codeUiMachine.service?.refs
        ?.get?.("formField")
        ?.rebind?.(patch.formBus);
    }
  }
}

export function linkFieldToWrapper(wrapper: any, child: any) {
  if (child === wrapper) return;
  if (child.__codeUiIsFormFieldWrapper) return;
  if (!wrapper.__codeUiFieldChildren) {
    wrapper.__codeUiFieldChildren = [];
  }
  if (!wrapper.__codeUiFieldChildren.includes(child)) {
    wrapper.__codeUiFieldChildren.push(child);
  }
  child.__codeUiFieldWrapper = wrapper;
  updateChildFromFormFieldWrapper(wrapper, child);
}

export function unlinkFieldFromWrapper(wrapper: any, child: any) {
  if (wrapper.__codeUiFieldChildren) {
    const idx = wrapper.__codeUiFieldChildren.indexOf(child);
    if (idx !== -1) wrapper.__codeUiFieldChildren.splice(idx, 1);
  }
  if (child.__codeUiFieldWrapper === wrapper) {
    child.__codeUiFieldWrapper = undefined;
    if (child.__codeUiMachine) {
      child.__codeUiMachine.updateProps({
        fieldDisabled: undefined,
        fieldSize: undefined,
      });
    }
  }
}

/**
 * Shared Behavior reference for form control components.
 * Automatically wires relations.target to link to ancestor <c-form> and <c-form-field>.
 */
export const cuiFormFieldBehavior: any =
  typeof Behavior !== "undefined"
    ? Behavior({
        relations: {
          cuiFormParent: {
            type: "ancestor",
            target: cuiFormParentBehavior,
            linked(this: any, target: any) {
              const bus =
                target.__codeUiFormBus ??
                getServiceBus(target.__codeUiMachine?.service);
              if (bus) {
                linkFieldToParentBus(target, this, bus);
              } else {
                target.__codeUiPendingFields =
                  target.__codeUiPendingFields || [];
                target.__codeUiPendingFields.push(this);
              }
            },
            unlinked(this: any, target: any) {
              unlinkFieldFromParentBus(target, this);
            },
          },
        },
      })
    : {};

export function setupFormRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: {
    formParent?: boolean;
    formField?: boolean;
    formFieldWrapper?: boolean;
  },
) {
  if (options.formParent) {
    relations.cuiFormField = {
      type: "descendant",
      target: cuiFormFieldBehavior,
      linked(this: any, target: any) {
        const bus =
          this.__codeUiFormBus ?? getServiceBus(this.__codeUiMachine?.service);
        if (!bus) {
          this.__codeUiPendingFields = this.__codeUiPendingFields || [];
          this.__codeUiPendingFields.push(target);
          return;
        }
        linkFieldToParentBus(this, target, bus);
      },
      unlinked(this: any, target: any) {
        unlinkFieldFromParentBus(this, target);
      },
    };
  }

  if (options.formFieldWrapper) {
    relations.cuiFormFieldChild = {
      type: "descendant",
      target: cuiFormFieldBehavior,
      linked(this: any, target: any) {
        linkFieldToWrapper(this, target);
      },
      unlinked(this: any, target: any) {
        unlinkFieldFromWrapper(this, target);
      },
    };
  }

  if (options.formField) {
    relations.cuiFormParent = {
      type: "ancestor",
      target: cuiFormParentBehavior,
      linked(this: any, target: any) {
        const bus =
          target.__codeUiFormBus ??
          getServiceBus(target.__codeUiMachine?.service);
        if (bus) {
          linkFieldToParentBus(target, this, bus);
        } else {
          target.__codeUiPendingFields = target.__codeUiPendingFields || [];
          target.__codeUiPendingFields.push(this);
        }
      },
      unlinked(this: any, target: any) {
        unlinkFieldFromParentBus(target, this);
      },
    };

    relations.cuiFormFieldWrapper = {
      type: "ancestor",
      target: cuiFormFieldWrapperBehavior,
      linked(this: any, target: any) {
        linkFieldToWrapper(target, this);
      },
      unlinked(this: any, target: any) {
        unlinkFieldFromWrapper(target, this);
      },
    };
  }
}

export function handleFormAttached(
  instance: any,
  initialProps: Record<string, any>,
  options: {
    formParent?: boolean;
    formField?: boolean;
    formFieldWrapper?: boolean;
  },
) {
  if (options.formField && typeof instance.getRelationNodes === "function") {
    const parents = instance.getRelationNodes("cuiFormParent");
    if (parents && parents.length > 0) {
      const parent = parents[0];
      const bus =
        parent.__codeUiFormBus ??
        getServiceBus(parent.__codeUiMachine?.service);
      if (bus && shouldLinkField(parent, instance)) {
        initialProps.formBus = bus;
        instance.__codeUiFormBus = bus;
      }
    }
  }

  if (options.formField) {
    const wrapper =
      instance.__codeUiFieldWrapper ??
      (typeof instance.getRelationNodes === "function"
        ? instance.getRelationNodes("cuiFormFieldWrapper")?.[0]
        : undefined);
    if (wrapper) {
      initialProps.fieldDisabled = getFormFieldWrapperDisabled(wrapper);
      const size = getFormFieldWrapperSize(wrapper);
      if (size !== undefined) {
        initialProps.fieldSize = size;
      }
      const wrapperName = getFormFieldWrapperName(wrapper);
      if (wrapperName && !initialProps.name) {
        initialProps.name = wrapperName;
      }
      const wrapperBus =
        wrapper.__codeUiFormBus ??
        getServiceBus(wrapper.__codeUiMachine?.service);
      if (wrapperBus && !initialProps.formBus) {
        initialProps.formBus = wrapperBus;
        instance.__codeUiFormBus = wrapperBus;
      }
    }
  }
}

export function handleFormMachineStarted(
  instance: any,
  machine: any,
  options: {
    formParent?: boolean;
    formFieldWrapper?: boolean;
  },
) {
  if (options.formFieldWrapper) {
    instance.__codeUiIsFormFieldWrapper = true;
    instance.__codeUiOnSnapshot = (snapshot: any) => {
      if (instance.__codeUiFieldChildren) {
        for (const child of instance.__codeUiFieldChildren) {
          updateChildFromFormFieldWrapper(instance, child, snapshot);
        }
      }
    };
    if (typeof instance.getRelationNodes === "function") {
      const children = instance.getRelationNodes("cuiFormFieldChild") ?? [];
      for (let i = 0; i < children.length; i++) {
        linkFieldToWrapper(instance, children[i]);
      }
    }
  }

  if (options.formParent) {
    const bus = getServiceBus(machine.service);
    if (bus) {
      instance.__codeUiFormBus = bus;
    }

    const pending = instance.__codeUiPendingFields;
    if (pending && Array.isArray(pending)) {
      for (let i = 0; i < pending.length; i++) {
        linkFieldToParentBus(instance, pending[i], bus);
      }
      instance.__codeUiPendingFields = [];
    }

    if (typeof instance.getRelationNodes === "function") {
      const fields = instance.getRelationNodes("cuiFormField") ?? [];
      for (let i = 0; i < fields.length; i++) {
        linkFieldToParentBus(instance, fields[i], bus);
      }
    }
  }
}

export function handleFormReady(
  instance: any,
  options: {
    formParent?: boolean;
  },
) {
  if (options.formParent && typeof instance.getRelationNodes === "function") {
    const bus =
      instance.__codeUiFormBus ??
      getServiceBus(instance.__codeUiMachine?.service);
    if (bus) {
      const fields = instance.getRelationNodes("cuiFormField") ?? [];
      for (let i = 0; i < fields.length; i++) {
        linkFieldToParentBus(instance, fields[i], bus);
      }
    }
  }
}

export function handleFormDetached(
  instance: any,
  options: {
    formParent?: boolean;
    formField?: boolean;
    formFieldWrapper?: boolean;
  },
) {
  if (options.formParent) {
    instance.__codeUiFormBus = undefined;
    instance.__codeUiPendingFields = [];
  }
  if (options.formField) {
    instance.__codeUiFormBus = undefined;
  }
  if (options.formFieldWrapper) {
    instance.__codeUiFieldChildren = [];
    instance.__codeUiOnSnapshot = undefined;
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
      handleFormMachineStarted(instance, machine, { formParent: true });
    },
    onReady(instance) {
      handleFormReady(instance, { formParent: true });
    },
    onDetached(instance) {
      handleFormDetached(instance, { formParent: true });
    },
  };
}

export interface WithFormFieldOptions {
  native?: boolean;
}

export function withFormField(options?: WithFormFieldOptions): MachinePlugin {
  const includeNative = options?.native !== false;
  const behaviors: any[] = [cuiFormFieldBehavior];
  if (includeNative) {
    behaviors.push("wx://form-field");
  }

  return {
    name: "form-field",
    behaviors,
    setupRelations(relations) {
      setupFormRelations(relations, { formField: true });
    },
    onAttached(instance, initialProps) {
      handleFormAttached(instance, initialProps, { formField: true });
    },
    onDetached(instance) {
      handleFormDetached(instance, { formField: true });
    },
  };
}

export function withFormFieldWrapper(): MachinePlugin {
  return {
    name: "form-field-wrapper",
    behaviors: [cuiFormFieldWrapperBehavior],
    setupRelations(relations) {
      setupFormRelations(relations, { formFieldWrapper: true });
    },
    onMachineStarted(instance, machine) {
      handleFormMachineStarted(instance, machine, { formFieldWrapper: true });
    },
    onPropChanged(instance, propKey) {
      if (
        propKey === "disabled" ||
        propKey === "size" ||
        propKey === "name"
      ) {
        const children = instance.__codeUiFieldChildren || [];
        for (const child of children) {
          updateChildFromFormFieldWrapper(instance, child);
        }
      }
    },
    onDetached(instance) {
      handleFormDetached(instance, { formFieldWrapper: true });
    },
  };
}
