import type { MachineSchema } from "@code-ui/core";
import type { MiniappMachine } from "./machine";

export interface MachinePlugin<T extends MachineSchema = any> {
  name: string;

  /** Extra WeChat native behaviors to include (e.g. 'wx://form-field') */
  behaviors?: any[];

  /** Setup WeChat component relations */
  setupRelations?: (
    relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  ) => void;

  /** Hook before machine is instantiated; can mutate initialProps (e.g. inject formBus) */
  onAttached?: (instance: any, initialProps: Record<string, any>) => void;

  /** Hook immediately after machine is created and assigned to instance */
  onMachineStarted?: (instance: any, machine: MiniappMachine<T>) => void;

  /** Hook on WeChat ready lifetime */
  onReady?: (instance: any) => void;

  /** Hook when observed props change */
  onPropChanged?: (instance: any, propKey: string, val: any) => void;

  /** Hook on WeChat detached lifetime */
  onDetached?: (instance: any) => void;
}
