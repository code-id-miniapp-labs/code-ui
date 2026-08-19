/// <reference types="miniprogram-api-typings" />

import type { EventBus, MiniAppComponent } from "@code-ui/utils";
import { createEventBus } from "@code-ui/utils";
import { createInjectionKey, inject, provide } from "./context";
import type { InjectionKey } from "./context";

export type EventBusKey<
  Events extends Record<string, any> = Record<string, any>,
> = InjectionKey<EventBus<Events>>;

/**
 * @example
 * const FormBusKey = createEventBusKey<{ change: { field: string } }>('form');
 * type FormBus = ProvideEventBusResult<typeof FormBusKey>; // EventBus<{ change: { field: string } }>
 */
export type ProvideEventBusResult<Key> =
  Key extends EventBusKey<infer Events> ? EventBus<Events> : never;

/**
 * Alias for `ProvideEventBusResult<Key>`.
 */
export type InferEventBus<Key> = ProvideEventBusResult<Key>;

/**
 * @example
 * const FormBusKey = createEventBusKey<{ change: { field: string } }>('form');
 * type FormEvents = InferEventBusEvents<typeof FormBusKey>; // { change: { field: string } }
 */
export type InferEventBusEvents<Key> =
  Key extends EventBusKey<infer Events> ? Events : never;

/**
 * Create a typed injection key for an EventBus.
 *
 * @param label - Optional debug label shown in devtools as `Symbol(label)`.
 *
 * @example
 * export const FormBusKey = createEventBusKey<{
 *   change: { field: string; value: string };
 *   submit: void;
 * }>('form');
 */
export function createEventBusKey<
  Events extends Record<string, any> = Record<string, any>,
>(label?: string): EventBusKey<Events> {
  return createInjectionKey<EventBus<Events>>(label);
}

/**
 * @example
 * attached() {
 *   this._bus = provideEventBus(this, FormBusKey);
 *   this._bus.on('submit', () => this.handleSubmit());
 * }
 */
export function provideEventBus<
  Events extends Record<string, any> = Record<string, any>,
>(component: MiniAppComponent, key: EventBusKey<Events>): EventBus<Events> {
  const bus = createEventBus<Events>();
  provide(component, key, bus);
  return bus;
}

/**
 * @example
 * attached() {
 *   const bus = injectEventBus(this, FormBusKey);
 *   bus?.emit('change', { field: 'email', value: this.data.value });
 * }
 */
export function injectEventBus<
  Events extends Record<string, any> = Record<string, any>,
>(
  component: MiniAppComponent,
  key: EventBusKey<Events>,
): EventBus<Events> | undefined {
  return inject(component, key);
}
