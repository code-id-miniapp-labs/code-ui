import { MiniappMachine } from "./machine";
import { connectToComponent } from "./connect";
import type { ConnectFn } from "./connect";
import type { Machine, MachineSchema } from "@code-ui/core";
import { isObject, runIfFn } from "@code-ui/utils";

export interface CreateMachineBehaviorOptions<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> {
  /**
   * The state machine definition created with `createMachine(...)`
   */
  machine: Machine<T>;
  /**
   * Optional connect snapshot function that wires to `this.setData` via alien-signals `effect()`
   */
  connect?: ConnectFn<T, Data>;
  /**
   * Optional namespace key under `this.data` (e.g. key: "dialog" -> this.data.dialog)
   */
  key?: string;
  /**
   * Component property names to automatically observe and forward to `machine.updateProps`.
   * If omitted, all properties from the machine's default props are automatically observed.
   */
  syncProps?: Array<keyof T["props"]>;
  /**
   * Automatically include WeChat native form-field behavior (`'wx://form-field'`)
   * and link to ancestor Code UI form via `cuiFormParentBehavior`.
   * Required for custom form controls like Switch, Checkbox, Slider to work with `<form bindsubmit>`
   */
  formField?: boolean;
  /**
   * Whether to include WeChat native `'wx://form-field'` behavior.
   * Defaults to true when `formField` is true, but can be set to false for wrapper
   * components like `<c-form-field>` that only link to ancestor form via relations.
   * @default true
   */
  nativeFormField?: boolean;
  /**
   * Mark this component as a form field wrapper (`<c-form-field>`), automatically
   * linking slotted form controls and passing down disabled and size state.
   */
  formFieldWrapper?: boolean;
  /**
   * Mark this component as a Form parent (`<c-form>`), automatically linking
   * slotted form fields via `cuiFormFieldBehavior`.
   */
  formParent?: boolean;
  /**
   * Export the machine's public API for parent `this.selectComponent(...)` calls via `'wx://component-export'`
   */
  exportApi?: boolean;
  /**
   * Delay `machine.start()` until the first `send()` call.
   *
   * Use this for components that are rendered but rarely interacted with
   * (e.g. a disabled button in a long list). The machine is constructed immediately
   * so `updateProps` observers work, but the 3 alien-signals `effect()` watchers
   * (state + context + watch) are only activated on first user interaction.
   *
   * ⚠️  Do NOT set on components that drive visible reactive state on mount
   * (e.g. Drawer, which must sync `drawer.open` to the template immediately).
   *
   * @default false
   */
  deferred?: boolean;
}

/**
 * Creates a WeChat MiniProgram component properties schema from default props
 *
 * @example
 * ```ts
 * properties: createProperties(defaultDrawerProps, {
 *   customProp: { type: String, value: "" }
 * })
 * ```
 */
export function createProperties<T extends Record<string, any>>(
  defaultProps: T,
  extraProps?: WechatMiniprogram.Component.PropertyOption,
): WechatMiniprogram.Component.PropertyOption {
  const properties: Record<string, any> = {};
  for (const [propKey, val] of Object.entries(defaultProps)) {
    if (val === undefined) continue;
    const type =
      val === null
        ? null
        : typeof val === "boolean"
          ? Boolean
          : typeof val === "number"
            ? Number
            : typeof val === "string"
              ? String
              : Array.isArray(val)
                ? Array
                : Object;
    properties[propKey] = {
      type,
      value: val,
    };
  }
  return { ...properties, ...extraProps };
}

/**
 * Creates a reactive WeChat MiniProgram Behavior wired to a state machine
 *
 * @example
 * ```ts
 * const dialogBehavior = createMachineBehavior({
 *   machine: dialogMachine,
 *   connect: connectDialog,
 *   key: "dialog",
 *   exportApi: true,
 * });
 *
 * Component({
 *   behaviors: [dialogBehavior],
 *   properties: createProperties(defaultDialogProps),
 *   methods: {
 *     handleOpen() {
 *       this.send({ type: "OPEN" });
 *     },
 *   },
 * });
 * ```
 */
const instanceIds = new WeakMap<object, string>();
let instanceCounter = 0;

function getComponentId(instance: object, explicitId?: string): string {
  if (explicitId) return explicitId;
  let id = instanceIds.get(instance);
  if (!id) {
    id = `cui-${++instanceCounter}`;
    instanceIds.set(instance, id);
  }
  return id;
}

/**
 * Shared Behavior reference for `<c-form>` parent components.
 * Used as relations.target to link descendant form fields natively
 * without file paths or tree-shaking hazards.
 */
export const cuiFormParentBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};

function shouldLinkField(parent: any, child: any): boolean {
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

function getServiceBus(service: any): any {
  return service?.refs?.get ? service.refs.get("bus") : undefined;
}

function linkFieldToParentBus(parent: any, child: any, bus: any) {
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

function unlinkFieldFromParentBus(parent: any, child: any) {
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

function getFormFieldWrapperDisabled(wrapper: any, snapshot?: any): boolean {
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

function getFormFieldWrapperSize(
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

function updateChildFromFormFieldWrapper(
  wrapper: any,
  child: any,
  snapshot?: any,
) {
  const disabled = getFormFieldWrapperDisabled(wrapper, snapshot);
  const size = getFormFieldWrapperSize(wrapper, snapshot);
  const bus =
    wrapper.__codeUiFormBus ??
    getServiceBus(wrapper.__codeUiMachine?.service);
  if (child.__codeUiMachine) {
    const patch: Record<string, any> = {
      fieldDisabled: disabled,
      fieldSize: size,
    };
    if (bus && !child.__codeUiFormBus) {
      child.__codeUiFormBus = bus;
      patch.formBus = bus;
    }
    child.__codeUiMachine.updateProps(patch);
  }
}

function linkFieldToWrapper(wrapper: any, child: any) {
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

function unlinkFieldFromWrapper(wrapper: any, child: any) {
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
 * Shared Behavior reference for `<c-form-field>` wrapper components.
 * Used as relations.target to link descendant form controls.
 */
export const cuiFormFieldWrapperBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};

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

export function createMachineBehavior<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(options: CreateMachineBehaviorOptions<T, Data>) {
  if (typeof Behavior === "undefined") {
    return {} as any;
  }
  const {
    machine: machineDef,
    connect,
    key,
    syncProps: explicitSyncProps,
    formField = false,
    formFieldWrapper = false,
    nativeFormField = true,
    formParent = false,
    exportApi = false,
    deferred = false,
  } = options;

  let discoveredProps: string[] = [];

  try {
    const defaultProps = runIfFn(machineDef.props, {
      props: {},
      scope: {} as any,
    });

    if (defaultProps && isObject(defaultProps)) {
      discoveredProps = Object.keys(defaultProps);
    }
  } catch {}

  const syncProps = Array.from(
    new Set([...discoveredProps, ...(explicitSyncProps ?? [])]),
  ) as Array<keyof T["props"]>;

  const behaviors: any[] = [];
  if (formField) {
    if (nativeFormField) {
      behaviors.push("wx://form-field");
    }
    behaviors.push(cuiFormFieldBehavior);
  }
  if (formFieldWrapper) {
    behaviors.push(cuiFormFieldWrapperBehavior);
  }
  if (formParent) {
    behaviors.push(cuiFormParentBehavior);
  }
  if (exportApi) behaviors.push("wx://component-export");

  const observers: Record<string, (...args: any[]) => void> = {};

  syncProps.forEach((propKey) => {
    observers[propKey as string] = function (this: any, val: any) {
      if (!this.__codeUiMachine) return;
      this.__codeUiMachine.updateProps({ [propKey as string]: val });
      if (formFieldWrapper && (propKey === "disabled" || propKey === "size")) {
        const children = this.__codeUiFieldChildren || [];
        for (const child of children) {
          updateChildFromFormFieldWrapper(this, child);
        }
      }
    };
  });

  const relations: Record<string, WechatMiniprogram.Component.RelationOption> =
    {};

  if (formParent) {
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

  if (formFieldWrapper) {
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

  if (formField) {
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

  const behaviorConfig: Record<string, any> = {
    behaviors,
    observers,

    lifetimes: {
      attached(this: any) {
        const id = getComponentId(this, this.id || this.data?.id);
        const initialProps: Record<string, any> = {
          component: this,
          id,
          ids: this.data?.ids,
        };

        if (formField && typeof this.getRelationNodes === "function") {
          const parents = this.getRelationNodes("cuiFormParent");
          if (parents && parents.length > 0) {
            const parent = parents[0];
            const bus =
              parent.__codeUiFormBus ??
              getServiceBus(parent.__codeUiMachine?.service);
            if (bus && shouldLinkField(parent, this)) {
              initialProps.formBus = bus;
              this.__codeUiFormBus = bus;
            }
          }
        }

        if (formField) {
          const wrapper =
            this.__codeUiFieldWrapper ??
            (typeof this.getRelationNodes === "function"
              ? this.getRelationNodes("cuiFormFieldWrapper")?.[0]
              : undefined);
          if (wrapper) {
            initialProps.fieldDisabled = getFormFieldWrapperDisabled(wrapper);
            const size = getFormFieldWrapperSize(wrapper);
            if (size !== undefined) {
              initialProps.fieldSize = size;
            }
            const wrapperBus =
              wrapper.__codeUiFormBus ??
              getServiceBus(wrapper.__codeUiMachine?.service);
            if (wrapperBus && !initialProps.formBus) {
              initialProps.formBus = wrapperBus;
              this.__codeUiFormBus = wrapperBus;
            }
          }
        }

        if (this.data) {
          syncProps.forEach((propKey) => {
            const keyStr = propKey as string;
            if (this.data[keyStr] !== undefined) {
              initialProps[keyStr] = this.data[keyStr];
            }
          });
        }

        const machine = new MiniappMachine(machineDef, initialProps);

        this.__codeUiMachine = machine;
        this.__codeUiDeferred = deferred;

        if (formFieldWrapper) {
          this.__codeUiIsFormFieldWrapper = true;
          this.__codeUiOnSnapshot = (snapshot: any) => {
            if (this.__codeUiFieldChildren) {
              for (const child of this.__codeUiFieldChildren) {
                updateChildFromFormFieldWrapper(this, child, snapshot);
              }
            }
          };
          if (typeof this.getRelationNodes === "function") {
            const children = this.getRelationNodes("cuiFormFieldChild") ?? [];
            for (let i = 0; i < children.length; i++) {
              linkFieldToWrapper(this, children[i]);
            }
          }
        }

        if (formParent) {
          const bus = getServiceBus(machine.service);
          if (bus) {
            this.__codeUiFormBus = bus;
          }

          const pending = this.__codeUiPendingFields;
          if (pending && Array.isArray(pending)) {
            for (let i = 0; i < pending.length; i++) {
              linkFieldToParentBus(this, pending[i], bus);
            }
            this.__codeUiPendingFields = [];
          }

          if (typeof this.getRelationNodes === "function") {
            const fields = this.getRelationNodes("cuiFormField") ?? [];
            for (let i = 0; i < fields.length; i++) {
              linkFieldToParentBus(this, fields[i], bus);
            }
          }
        }

        if (!deferred) {
          machine.start();

          if (connect) {
            this.__codeUiDispose = connectToComponent(
              machine,
              this,
              connect,
              key,
            );
          }
        }
      },

      detached(this: any) {
        if (formParent) {
          this.__codeUiFormBus = undefined;
          this.__codeUiPendingFields = [];
        }
        if (formField) {
          this.__codeUiFormBus = undefined;
        }
        if (formFieldWrapper) {
          this.__codeUiFieldChildren = [];
          this.__codeUiOnSnapshot = undefined;
        }
        instanceIds.delete(this);
        this.__codeUiDispose?.();
        this.__codeUiMachine?.stop();
        this.__codeUiMachine = null;
        this.__codeUiDispose = null;
      },
    },

    methods: {
      send(this: any, event: T["event"]) {
        // Lazy startup: boot the machine on first send() if deferred
        if (this.__codeUiDeferred && this.__codeUiMachine) {
          this.__codeUiDeferred = false;
          this.__codeUiMachine.start();
          if (connect) {
            this.__codeUiDispose = connectToComponent(
              this.__codeUiMachine,
              this,
              connect,
              key,
            );
          }
        }
        this.__codeUiMachine?.send(event);
      },
      getMachine(this: any): MiniappMachine<T> | null {
        return this.__codeUiMachine ?? null;
      },
      /** Get the current machine service */
      getService(this: any) {
        return this.__codeUiMachine?.service ?? null;
      },
    },

    export(this: any): WechatMiniprogram.IAnyObject {
      if (!exportApi) return {};
      const getApi = () =>
        this.__codeUiApi ??
        (connect && this.__codeUiMachine
          ? connect(this.__codeUiMachine.service)
          : undefined);

      const initialApi = getApi() ?? {};
      const exported: Record<string, any> = {
        ...initialApi,
        __codeUiInstance: this,
        send: (event: T["event"]) => this.__codeUiMachine?.send(event),
        service: this.__codeUiMachine?.service,
        getSnapshot: () => getApi(),
      };

      if (typeof Proxy !== "undefined") {
        return new Proxy(exported, {
          get: (target, prop, receiver) => {
            if (prop === "__codeUiInstance") return this;
            if (prop === "send") return target.send;
            if (prop === "service") return this.__codeUiMachine?.service;
            if (prop === "getSnapshot") return target.getSnapshot;

            if (typeof this[prop] === "function") {
              return this[prop].bind(this);
            }
            const liveApi = getApi();
            if (liveApi && prop in liveApi) {
              const val = (liveApi as any)[prop];
              return typeof val === "function" ? val.bind(liveApi) : val;
            }
            return Reflect.get(target, prop, receiver);
          },
        });
      }

      return exported;
    },
  };

  if (Object.keys(relations).length > 0) {
    behaviorConfig.relations = relations;
  }

  return Behavior(behaviorConfig);
}
