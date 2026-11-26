import { MiniappMachine } from "./machine";
import { connectToComponent } from "./connect";
import type { ConnectFn } from "./connect";
import type { Machine, MachineSchema } from "@code-id-labs/core";
import { isObject, runIfFn } from "@code-id-labs/utils";
import type { MachinePlugin } from "./plugin";

const instanceIds = new WeakMap<object, string>();
let instanceCounter = 0;

export function getComponentId(instance: object, explicitId?: string): string {
  if (explicitId) return explicitId;
  let id = instanceIds.get(instance);
  if (!id) {
    id = `c${(++instanceCounter).toString(36)}`;
    instanceIds.set(instance, id);
  }
  return id;
}

export function cleanupComponentId(instance: object): void {
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
   * Whitelist of API / method keys exposed via `'wx://component-export'`.
   * When omitted while `exportApi: true`, all keys returned by `connect` (plus `send` and `service`) are exported.
   */
  exportApiKeys?: Array<keyof Data | (string & {})>;
  /**
   * Delay `machine.start()` and `connectToComponent()` until the first interaction
   * (`send()`, `getApi()`, exported method call) or until `shouldStart` returns `true`.
   * @default false
   */
  deferred?: boolean;
  /**
   * Predicate evaluated when `deferred: true` on `attached` and prop updates.
   * When omitted, any prop update wakes a deferred machine; when provided, only
   * wakes it once `shouldStart(props)` returns `true` (e.g. `open || defaultOpen`).
   */
  shouldStart?: ((props: Record<string, any>) => boolean) | undefined;
  /**
   * Top-level snapshot keys returned by `connect()` to omit from `setData`
   * payloads (they remain accessible on `__codeUiApi`).
   */
  omitDataKeys?: ReadonlyArray<string> | undefined;
  /**
   * Composable plugins that extend component relations and lifecycle coordination.
   */
  plugins?: Array<MachinePlugin<any, any>>;
}

/**
 * Creates a WeChat MiniProgram component properties schema from default props
 */
export function createProperties<T extends Record<string, any>>(
  defaultProps: T,
  extraProps?: WechatMiniprogram.Component.PropertyOption,
): WechatMiniprogram.Component.PropertyOption {
  const properties: Record<string, any> = {};
  for (const [propKey, value] of Object.entries(defaultProps)) {
    if (value === undefined) continue;
    const t = typeof value;
    properties[propKey] = {
      type:
        t === "boolean"
          ? Boolean
          : t === "number"
            ? Number
            : t === "string"
              ? String
              : Array.isArray(value)
                ? Array
                : isObject(value)
                  ? Object
                  : null,
      value,
    };
  }
  return extraProps ? Object.assign(properties, extraProps) : properties;
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
    exportApiKeys,
    deferred = false,
    shouldStart,
    omitDataKeys,
    plugins = [],
  } = options;
  const connectOptions =
    omitDataKeys && omitDataKeys.length > 0
      ? { omitKeys: omitDataKeys }
      : undefined;

  const ensureStarted = (instance: any) => {
    if (!instance?.__codeUiDeferred || !instance.__codeUiMachine) return;
    instance.__codeUiDeferred = false;
    instance.__codeUiMachine.start();
    if (connect) {
      instance.__codeUiDispose = connectToComponent(
        instance.__codeUiMachine,
        instance,
        connect,
        key,
        connectOptions,
      );
    }
  };

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
      if (this.__codeUiDeferred) {
        if (
          !shouldStart ||
          shouldStart({ ...this.data, [propKey as string]: val })
        ) {
          ensureStarted(this);
        }
      }
      this.__codeUiMachine.updateProps({ [propKey as string]: val });
      for (const plugin of plugins) {
        plugin.onPropChanged?.(this, propKey as string, val);
      }
    };
  });

  const relations: Record<string, WechatMiniprogram.Component.RelationOption> =
    {};
  for (const plugin of plugins) {
    plugin.setupRelations?.(relations);
  }

  const behaviorConfig: Record<string, any> = {
    behaviors,
    observers,
    relations,

    lifetimes: {
      attached(this: any) {
        const id = getComponentId(this, this.id);
        this.__codeUiId = id;
        const initialProps: Record<string, any> = {
          component: this,
          id: id ?? this.__codeUiId,
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

        for (const plugin of plugins) {
          plugin.onAttached?.(this, initialProps);
        }

        const machine = new MiniappMachine(machineDef, initialProps);
        this.__codeUiMachine = machine;
        const startDeferred =
          deferred && !(shouldStart?.(initialProps) ?? false);
        this.__codeUiDeferred = startDeferred;
        this.__codeUiEnsureStarted = () => ensureStarted(this);

        for (const plugin of plugins) {
          plugin.onMachineStarted?.(this, machine);
        }

        if (!startDeferred) {
          machine.start();
          if (connect) {
            this.__codeUiDispose = connectToComponent(
              machine,
              this,
              connect,
              key,
              connectOptions,
            );
          }
        }
      },

      ready(this: any) {
        for (const plugin of plugins) {
          plugin.onReady?.(this);
        }
        if (!this.__codeUiDeferred) {
          this.__codeUiMachine?.send({ type: "READY" });
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
        this.__codeUiApi = null;
        this.__codeUiOnSnapshot = undefined;
        this.__codeUiOrigOnSnapshot = undefined;
        this.__codeUiSnapshotListeners = undefined;
        this.__codeUiEnsureStarted = undefined;
      },
    },

    methods: {
      send(this: any, event: T["event"]) {
        ensureStarted(this);
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
      const wrapApiMethod =
        (propName: string) =>
        (...args: any[]) => {
          ensureStarted(this);
          const live = getApi();
          const fn = live && (live as any)[propName];
          return typeof fn === "function" ? fn.apply(live, args) : undefined;
        };

      const initialApi = getApi() ?? {};
      const hasWhitelist = Array.isArray(exportApiKeys);
      const allowedKeys = hasWhitelist
        ? new Set(exportApiKeys.map(String))
        : null;

      const exported: Record<string, any> = {};
      if (allowedKeys) {
        for (const allowedKey of allowedKeys) {
          if (typeof this[allowedKey] === "function") {
            exported[allowedKey] = this[allowedKey].bind(this);
          } else if (allowedKey === "send") {
            exported.send = (event: T["event"]) => {
              ensureStarted(this);
              this.__codeUiMachine?.send(event);
            };
          } else if (allowedKey === "service") {
            exported.service = this.__codeUiMachine?.service;
          } else if (allowedKey in initialApi) {
            const val = initialApi[allowedKey];
            exported[allowedKey] =
              typeof val === "function" ? wrapApiMethod(allowedKey) : val;
          }
        }
      } else {
        for (const k of Object.keys(initialApi)) {
          const val = initialApi[k];
          exported[k] = typeof val === "function" ? wrapApiMethod(k) : val;
        }
        exported.send = (event: T["event"]) => {
          ensureStarted(this);
          this.__codeUiMachine?.send(event);
        };
        exported.service = this.__codeUiMachine?.service;
      }

      // Preserve internal instance lookup for useComponentRef and Context without
      // exposing __codeUiInstance in Object.keys() of the exported ref.
      Object.defineProperty(exported, "__codeUiInstance", {
        value: this,
        enumerable: false,
        configurable: true,
      });

      if (typeof Proxy !== "undefined") {
        const resolveAllowedMember = (prop: string) => {
          if (typeof this[prop] === "function") {
            return this[prop].bind(this);
          }
          if (prop === "send") {
            return (
              exported.send ??
              ((event: T["event"]) => {
                ensureStarted(this);
                this.__codeUiMachine?.send(event);
              })
            );
          }
          if (prop === "service") {
            return this.__codeUiMachine?.service;
          }
          const liveApi = getApi();
          if (liveApi && prop in liveApi) {
            const val = (liveApi as any)[prop];
            return typeof val === "function" ? wrapApiMethod(prop) : val;
          }
          return undefined;
        };

        return new Proxy(exported, {
          get: (target, prop, receiver) => {
            if (prop === "__codeUiInstance") return this;
            if (allowedKeys) {
              if (typeof prop !== "string" || !allowedKeys.has(prop)) {
                return undefined;
              }
              return resolveAllowedMember(prop);
            }

            if (prop === "send") return target.send;
            if (prop === "service") return this.__codeUiMachine?.service;

            if (typeof this[prop] === "function") {
              return this[prop].bind(this);
            }
            const liveApi = getApi();
            if (liveApi && prop in liveApi) {
              const val = (liveApi as any)[prop];
              return typeof val === "function" && typeof prop === "string"
                ? wrapApiMethod(prop)
                : val;
            }
            return Reflect.get(target, prop, receiver);
          },
          has: (target, prop) => {
            if (!allowedKeys) {
              return prop in target;
            }
            if (typeof prop !== "string" || !allowedKeys.has(prop)) {
              return false;
            }
            const liveApi = getApi();
            return (
              typeof this[prop] === "function" ||
              prop === "send" ||
              prop === "service" ||
              Boolean(liveApi && prop in liveApi)
            );
          },
          ownKeys: (target) => {
            if (!allowedKeys) {
              return Reflect.ownKeys(target);
            }
            const liveApi = getApi();
            const keys: string[] = [];
            for (const keyName of allowedKeys) {
              if (
                typeof this[keyName] === "function" ||
                keyName === "send" ||
                keyName === "service" ||
                Boolean(liveApi && keyName in liveApi)
              ) {
                keys.push(keyName);
              }
            }
            return keys;
          },
          getOwnPropertyDescriptor: (target, prop) => {
            if (!allowedKeys) {
              return Reflect.getOwnPropertyDescriptor(target, prop);
            }
            if (typeof prop === "string" && allowedKeys.has(prop)) {
              const liveApi = getApi();
              if (
                typeof this[prop] === "function" ||
                prop === "send" ||
                prop === "service" ||
                Boolean(liveApi && prop in liveApi)
              ) {
                return {
                  configurable: true,
                  enumerable: true,
                  writable: true,
                  value: resolveAllowedMember(prop),
                };
              }
            }
            return undefined;
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
