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
   * Required for custom form controls like Switch, Checkbox, Slider to work with `<form bindsubmit>`
   */
  formField?: boolean;
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
    const type =
      typeof val === "boolean"
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

  const syncProps =
    explicitSyncProps && explicitSyncProps.length > 0
      ? explicitSyncProps
      : (discoveredProps as Array<keyof T["props"]>);

  const behaviors: any[] = [];
  if (formField) behaviors.push("wx://form-field");
  if (exportApi) behaviors.push("wx://component-export");

  const observers: Record<string, (...args: any[]) => void> = {};

  syncProps.forEach((propKey) => {
    observers[propKey as string] = function (this: any, val: any) {
      if (!this.__codeUiMachine) return;
      this.__codeUiMachine.updateProps({ [propKey as string]: val });
    };
  });

  return Behavior({
    behaviors,
    observers,

    lifetimes: {
      attached(this: any) {
        const initialProps: Record<string, any> = {
          component: this,
          id: this.id || this.data?.id,
          ids: this.data?.ids,
        };

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
      return {
        send: (event: T["event"]) => this.__codeUiMachine?.send(event),
        service: this.__codeUiMachine?.service,
        getSnapshot: () =>
          connect && this.__codeUiMachine
            ? connect(this.__codeUiMachine.service)
            : undefined,
      };
    },
  });
}
