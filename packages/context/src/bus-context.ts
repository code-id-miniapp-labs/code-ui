/// <reference types="miniprogram-api-typings" />

import type { EventBus, MiniAppComponent } from "@code-ui/utils";
import { createEventBus } from "@code-ui/utils";
import { createInjectionKey, inject, provide } from "./context";
import type { InjectionKey } from "./context";

/**
 * ## Typical patterns
 *
 * ### 1. Child → Parent  (bottom-up signals, e.g. form fields → form group)
 * ```ts
 * // keys.ts
 * export const FormBusKey = createEventBusKey<{
 *   change: { field: string; value: string };
 *   blur:   { field: string };
 * }>('form');
 *
 * // form-group component (parent)
 * attached() {
 *   const bus = provideEventBus(this, FormBusKey);
 *   bus.on('change', ({ field, value }) => this.validate(field, value));
 * }
 *
 * // input component (child, any depth)
 * attached() {
 *   const bus = injectEventBus(this, FormBusKey);
 *   bus?.emit('change', { field: 'email', value: this.data.value });
 * }
 * ```
 *
 * ### 2. Parent → Children  (top-down broadcast, e.g. tabs → tab-panel)
 * ```ts
 * export const TabsBusKey = createEventBusKey<{
 *   activate: { index: number };
 * }>('tabs');
 *
 * // tabs component (parent)
 * attached() {
 *   this._bus = provideEventBus(this, TabsBusKey);
 * }
 * methods: {
 *   selectTab(index: number) {
 *     this._bus.emit('activate', { index });
 *   }
 * }
 *
 * // tab-panel component (child)
 * attached() {
 *   injectEventBus(this, TabsBusKey)
 *     ?.on('activate', ({ index }) => this.setData({ active: index === this.data.index }));
 * }
 * ```
 */

/**
 * An InjectionKey that is typed to carry an `EventBus<Events>`.
 * Create one with `createEventBusKey<Events>()`.
 */
export type EventBusKey<Events extends Record<string, unknown>> = InjectionKey<
  EventBus<Events>
>;

/**
 * Extract the `EventBus` instance type associated with an `EventBusKey` or the result of `provideEventBus`.
 *
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
 * Extract the event map type associated with an `EventBusKey`.
 *
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
export function createEventBusKey<Events extends Record<string, unknown>>(
  label?: string,
): EventBusKey<Events> {
  return createInjectionKey<EventBus<Events>>(label);
}

/**
 * @example
 * attached() {
 *   this._bus = provideEventBus(this, FormBusKey);
 *   this._bus.on('submit', () => this.handleSubmit());
 * }
 */
export function provideEventBus<Events extends Record<string, unknown>>(
  component: MiniAppComponent,
  key: EventBusKey<Events>,
): EventBus<Events> {
  const bus = createEventBus<Events>();
  provide(component, key, bus);
  return bus;
}

/**
 * Inject the nearest `EventBus` for `key` from the component's ancestors.
 * Returns `undefined` if no ancestor has called `provideEventBus` with this key.
 *
 * Call this in the child's `attached` lifecycle.
 *
 * @example
 * attached() {
 *   const bus = injectEventBus(this, FormBusKey);
 *   bus?.emit('change', { field: 'email', value: this.data.value });
 * }
 */
export function injectEventBus<Events extends Record<string, unknown>>(
  component: MiniAppComponent,
  key: EventBusKey<Events>,
): EventBus<Events> | undefined {
  return inject(component, key);
}
