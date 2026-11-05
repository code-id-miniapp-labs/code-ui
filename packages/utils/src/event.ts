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

