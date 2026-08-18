/// <reference types="miniprogram-api-typings" />

import { MiniappMachine } from "./machine";
import { connectToComponent } from "./connect";
import type { ConnectFn } from "./connect";
import type { Machine, MachineSchema } from "@code-ui/core";

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
   * Component property names to automatically observe and forward to `machine.updateProps`
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
}

/**
 * @example
 * ```ts
 * const dialogBehavior = createMachineBehavior({
 *   machine: dialogMachine,
 *   connect: connectDialog,
 *   key: "dialog",
 *   syncProps: ["open", "disabled"],
 *   exportApi: true,
 * });
 *
 * Component({
 *   behaviors: [dialogBehavior],
 *   properties: {
 *     open: Boolean,
 *     disabled: Boolean,
 *   },
 *   methods: {
 *     handleOpen() {
 *       // Send events via the auto-injected `this.send(...)`
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
  const {
    machine: machineDef,
    connect,
    key,
    syncProps = [],
    formField = false,
    exportApi = false,
  } = options;

  const behaviors: string[] = [];
  if (formField) behaviors.push("wx://form-field");
  if (exportApi) behaviors.push("wx://component-export");

  const observers: Record<string, (...args: any[]) => void> = {};

  if (syncProps.length > 0) {
    const observerKey = syncProps.join(", ");
    observers[observerKey] = function (this: any, ...values: any[]) {
      if (!this.__codeUiMachine) return;
      const updated: Record<string, any> = {};
      syncProps.forEach((propKey, index) => {
        updated[propKey as string] = values[index];
      });
      this.__codeUiMachine.updateProps(updated);
    };
  }

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

        machine.start();

        if (connect) {
          this.__codeUiDispose = connectToComponent(
            machine,
            this,
            connect,
            key,
          );
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
