import type { MachineSchema } from "@code-id-labs/core";
import type { MiniappMachine } from "./machine";
import type {
  CodeUiComponentInstance,
  MiniappBehaviorRef,
} from "./behaviors/types";

export interface MachinePlugin<
  T extends MachineSchema = MachineSchema,
  TInstance extends CodeUiComponentInstance<any, any> = CodeUiComponentInstance<any, any>,
> {
  name: string;

  /** Extra WeChat native behaviors to include (e.g. 'wx://form-field') */
  behaviors?: MiniappBehaviorRef[];

  /** Setup WeChat component relations */
  setupRelations?(
    relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  ): void;

  /** Hook before machine is instantiated; can mutate initialProps (e.g. inject formContext) */
  onAttached?(instance: TInstance, initialProps: Record<string, unknown>): void;

  /** Hook immediately after machine is created and assigned to instance */
  onMachineStarted?(instance: TInstance, machine: MiniappMachine<T>): void;

  /** Hook on WeChat ready lifetime */
  onReady?(instance: TInstance): void;

  /** Hook when observed props change */
  onPropChanged?(instance: TInstance, propKey: string, val: unknown): void;

  /** Hook on WeChat detached lifetime */
  onDetached?(instance: TInstance): void;
}
