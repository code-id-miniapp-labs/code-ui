import { MiniappMachine } from "./machine";
import { connectToComponent } from "./connect";
import type { ConnectFn } from "./connect";
import type { Machine, MachineSchema } from "@code-ui/core";
import { isObject, runIfFn } from "@code-ui/utils";
import type { MachinePlugin } from "./plugin";

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

function cleanupComponentId(instance: object): void {
  instanceIds.delete(instance);
}

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
  syncProps?: Array<keyof T["props"] | (string & {})>;
  /**
   * Export the machine's public API for parent `this.selectComponent(...)` calls via `'wx://component-export'`
   */
  exportApi?: boolean;
  /**
   * Delay `machine.start()` until the first `send()` call.
   * @default false
   */
  deferred?: boolean;
  /**
   * Composable plugins that extend component relations and lifecycle coordination.
   */
  plugins?: MachinePlugin<T>[];
}

/**
 * Creates a WeChat MiniProgram component properties schema from default props
 */
export function createProperties<T extends Record<string, any>>(
  defaultProps: T,
  extraProps?: WechatMiniprogram.Component.PropertyOption,
): WechatMiniprogram.Component.PropertyOption {
  const properties: Record<string, any> = {};
  for (const [propKey, val] of Object.entries(defaultProps)) {
    if (val === undefined) continue;

    if (typeof val === "boolean") {
      properties[propKey] = {
        type: Boolean,
        value: val,
      };
    } else if (typeof val === "number") {
      properties[propKey] = {
        type: Number,
        value: val,
      };
    } else if (typeof val === "string") {
      properties[propKey] = {
        type: String,
        value: val,
      };
    } else if (Array.isArray(val)) {
      properties[propKey] = {
        type: Array,
        value: val,
      };
    } else if (isObject(val)) {
      properties[propKey] = {
        type: Object,
        value: val,
      };
    } else {
      properties[propKey] = {
        type: null,
        value: val,
      };
    }
  }

  if (extraProps) {
    Object.assign(properties, extraProps);
  }

  return properties;
}

/**
 * Creates a domain-agnostic WeChat MiniProgram Behavior wrapping an FSM.
 * Extend functionality (e.g. form fields, radio groups, steppers) via `options.plugins`.
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
    exportApi = false,
    deferred = false,
    plugins = [],
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
    new Set([...discoveredProps, ...(options.syncProps ?? [])]),
  ) as Array<keyof T["props"]>;

  const behaviors: any[] = [];
  for (const plugin of plugins) {
    if (plugin.behaviors && Array.isArray(plugin.behaviors)) {
      behaviors.push(...plugin.behaviors);
    }
  }
  if (exportApi) behaviors.push("wx://component-export");

  const observers: Record<string, (...args: any[]) => void> = {};

  syncProps.forEach((propKey) => {
    observers[propKey as string] = function (this: any, val: any) {
      if (!this.__codeUiMachine) return;
      this.__codeUiMachine.updateProps({ [propKey as string]: val });
      for (const plugin of plugins) {
        plugin.onPropChanged?.(this, propKey as string, val);
      }
    };
  });

  const relations: Record<string, WechatMiniprogram.Component.RelationOption> = {};
  for (const plugin of plugins) {
    plugin.setupRelations?.(relations);
  }

  const behaviorConfig: Record<string, any> = {
    behaviors,
    observers,
    relations,

    lifetimes: {
      attached(this: any) {
        const id = getComponentId(this, this.id || this.data?.id);
        this.__codeUiId = id;
        const initialProps: Record<string, any> = {
          component: this,
          id,
          ids: this.data?.ids,
        };

        for (const plugin of plugins) {
          plugin.onAttached?.(this, initialProps);
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

        for (const plugin of plugins) {
          plugin.onMachineStarted?.(this, machine);
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

      ready(this: any) {
        for (const plugin of plugins) {
          plugin.onReady?.(this);
        }
      },

      detached(this: any) {
        for (const plugin of plugins) {
          plugin.onDetached?.(this);
        }
        cleanupComponentId(this);
        this.__codeUiDispose?.();
        this.__codeUiMachine?.stop();
        this.__codeUiMachine = null;
        this.__codeUiDispose = null;
      },
    },

    methods: {
      send(this: any, event: T["event"]) {
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
