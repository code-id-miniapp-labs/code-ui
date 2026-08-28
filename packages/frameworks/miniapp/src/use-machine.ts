import { MiniappMachine } from "./machine";
import { connectToPage } from "./connect";
import type { ConnectFn, MiniAppInstance } from "./connect";
import type { Machine, MachineSchema, Service } from "@code-ui/core";

export interface UseMachineOptions<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> {
  /**
   * The connect function returning a view-layer data snapshot.
   * If provided, changes will be automatically batched and pushed to setData via alien-signals effect().
   */
  connect?: ConnectFn<T, Data>;
  /**
   * Optional namespace key under `this.data` (e.g. key: "dialog" -> this.data.dialog).
   * If omitted, snapshot keys are merged directly into `this.data`.
   */
  key?: string;
  /**
   * Machine props/context configuration.
   */
  props?: Partial<T["props"]> | (() => Partial<T["props"]>);
}

export interface UseMachineReturn<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> {
  /** The underlying MiniappMachine instance */
  machine: MiniappMachine<T>;
  /** Get the current service snapshot */
  service: Service<T>;
  /** Send an event to the machine */
  send: (event: T["event"]) => void;
  /** Update user props dynamically (e.g., when component properties observer triggers) */
  updateProps: (
    newProps: Partial<T["props"]> | (() => Partial<T["props"]>),
  ) => void;
  /** Get the latest computed API / snapshot on demand */
  getSnapshot: () => Data | undefined;
  /** Stop the machine and dispose all effect/setData subscriptions */
  stop: () => void;
}

/**
 * Convenient lifecycle helper to create, start, and wire a MiniappMachine to a Page or Component.
 *
 * @param instance - The MiniApp Page or Component instance (`this`)
 * @param machineDef - The state machine configuration created with `createMachine`
 * @param options - Connect function, data namespace key, and initial props
 */
export function useMachine<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  instance: MiniAppInstance,
  machineDef: Machine<T>,
  options: UseMachineOptions<T, Data> = {},
): UseMachineReturn<T, Data> {
  const { connect, key, props = {} } = options;

  const initialPropsGetter = () => {
    const resolved = typeof props === "function" ? props() : props;
    return {
      component: instance,
      ...resolved,
    };
  };

  const machine = new MiniappMachine(machineDef, initialPropsGetter);
  machine.start();

  let disposeConnect: (() => void) | null = null;
  if (connect) {
    disposeConnect = connectToPage(machine, instance, connect, key);
  }

  return {
    machine,
    get service() {
      return machine.service;
    },
    send: machine.send,
    updateProps: (newProps) => machine.updateProps(newProps),
    getSnapshot: () => (connect ? connect(machine.service) : undefined),
    stop: () => {
      disposeConnect?.();
      machine.stop();
    },
  };
}
