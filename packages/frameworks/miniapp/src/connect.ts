/// <reference types="miniprogram-api-typings" />

import { effect, effectScope } from "alien-signals";
import type { MachineSchema, Service } from "@code-ui/core";
import type { MiniappMachine } from "./machine";

export type MiniAppInstance = WechatMiniprogram.Component.TrivialInstance;

export type ConnectFn<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> = (service: Service<T>) => Data;

export function connectToPage<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  machine: MiniappMachine<T>,
  instance: MiniAppInstance,
  connect: ConnectFn<T, Data>,
  key?: string,
): () => void {
  let disposeEffect: (() => void) | null = null;

  const stopScope = effectScope(() => {
    disposeEffect = effect(() => {
      const snapshot = connect(machine.service);

      const data: WechatMiniprogram.IAnyObject = key
        ? { [key]: snapshot }
        : snapshot;

      instance.setData(data);
    });
  });

  return () => {
    disposeEffect?.();
    stopScope();
  };
}

export const connectToComponent = connectToPage;
