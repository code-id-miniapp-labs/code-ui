/// <reference types="miniprogram-api-typings" />

import type { MiniAppComponent } from "./dom";

/** Base MiniProgram event — carries target, currentTarget, timeStamp, type */
export type MiniAppBaseEvent<
  Mark extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
  CurrentTargetDataset extends WechatMiniprogram.IAnyObject =
    WechatMiniprogram.IAnyObject,
  TargetDataset extends WechatMiniprogram.IAnyObject = CurrentTargetDataset,
> = WechatMiniprogram.BaseEvent<Mark, CurrentTargetDataset, TargetDataset>;

/** MiniProgram custom event — extends BaseEvent with a typed `detail` payload */
export type MiniAppCustomEvent<
  Detail extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
  Mark extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
  CurrentTargetDataset extends WechatMiniprogram.IAnyObject =
    WechatMiniprogram.IAnyObject,
  TargetDataset extends WechatMiniprogram.IAnyObject = CurrentTargetDataset,
> = WechatMiniprogram.CustomEvent<
  Detail,
  Mark,
  CurrentTargetDataset,
  TargetDataset
>;

/** MiniProgram touch event — extends CustomEvent with touches arrays */
export type MiniAppTouchEvent<
  Detail extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> = WechatMiniprogram.TouchEvent<Detail>;

/** Options for triggerEvent — controls bubbling, composition, capture */
export type TriggerEventOptions =
  WechatMiniprogram.Component.TriggerEventOption;

/** A component instance that supports triggerEvent */
export type { MiniAppComponent };

/** Bound trigger function created for a component instance */
export type EventTrigger = <
  Detail extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  name: string,
  detail?: Detail,
  options?: TriggerEventOptions,
) => void;

/**
 * @example
 * attached() {
 *   const emit = createEventTrigger(this);
 *   emit('change', { value: 42 });
 *   emit('close');
 * }
 */
export function createEventTrigger(component: MiniAppComponent): EventTrigger {
  return (name, detail, options = { bubbles: false, composed: false }) => {
    component.triggerEvent(name, detail, options);
  };
}

export function triggerEvent(component: MiniAppComponent): EventTrigger;
export function triggerEvent<
  Detail extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  component: MiniAppComponent,
  name: string,
  detail?: Detail,
  options?: TriggerEventOptions,
): void;
export function triggerEvent<
  Detail extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  component: MiniAppComponent,
  name?: string,
  detail?: Detail,
  options: TriggerEventOptions = { bubbles: false, composed: false },
): EventTrigger | void {
  if (name === undefined) {
    return createEventTrigger(component);
  }

  component.triggerEvent(name, detail, options);
}

export type EventHandler<T = unknown> = (payload: T) => void;

/**
 * @example
 * const bus = createEventBus<{ change: number; close: void }>();
 *
 * const off = bus.on('change', (value) => console.log(value));
 * bus.emit('change', 42);
 * off(); // removes listener
 */
export interface EventBus<Events extends Record<string, any> = Record<string, any>> {
  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof Events & string>(
    event: K,
    handler: EventHandler<Events[K]>,
  ): () => void;

  /** Publish an event to all subscribers. */
  emit<K extends keyof Events & string>(
    event: K,
    ...args: Events[K] extends void | undefined ? [] : [payload: Events[K]]
  ): void;

  /** Remove all subscribers for a specific event, or all events. */
  off<K extends keyof Events & string>(event?: K): void;
}

/**
 * @example
 * type DialogEvents = { open: void; close: void; confirm: { value: string } };
 * const bus = createEventBus<DialogEvents>();
 */
export function createEventBus<
  Events extends Record<string, any> = Record<string, any>,
>(): EventBus<Events> {
  type Handlers = Map<string, Set<EventHandler<unknown>>>;
  const registry: Handlers = new Map();

  function getHandlers(event: string): Set<EventHandler<unknown>> {
    if (!registry.has(event)) {
      registry.set(event, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return registry.get(event)!;
  }

  return {
    on<K extends keyof Events & string>(
      event: K,
      handler: EventHandler<Events[K]>,
    ): () => void {
      const handlers = getHandlers(event as string);
      handlers.add(handler as EventHandler<unknown>);
      return () => handlers.delete(handler as EventHandler<unknown>);
    },

    emit<K extends keyof Events & string>(
      event: K,
      ...args: Events[K] extends void | undefined ? [] : [payload: Events[K]]
    ): void {
      const handlers = registry.get(event as string);
      if (handlers) {
        const payload = args[0];
        handlers.forEach((h) => h(payload as unknown));
      }
    },

    off<K extends keyof Events & string>(event?: K): void {
      if (event !== undefined) {
        registry.delete(event as string);
      } else {
        registry.clear();
      }
    },
  };
}

