/**
 * @code-ui/miniapp - createMachinePropGetter
 *
 * Wraps the MiniApp component instance and user props so the FSM can call
 * `prop('onTap')(payload)` or `prop('onChange')(payload)` without knowing
 * about Weixin's `triggerEvent`.
 */

import { normalizeEvent, toMiniEventName } from "./normalize-event";
import { createEventBridge } from "./event-bridge";

export type UserPropsGetter =
  | Record<string, any>
  | (() => Record<string, any>);

function isEventProp(key: string): boolean {
  return (
    key.startsWith("on") &&
    key.length > 2 &&
    key[2] === key[2]?.toUpperCase()
  );
}

/**
 * Wraps the component instance so the FSM can call `prop('onTap')(payload)`
 * or `prop('onChange')(payload)` without knowing about Weixin's `triggerEvent`.
 */
export function createMachinePropGetter(
  instance: WechatMiniprogram.Component.TrivialInstance | any,
  userProps: UserPropsGetter,
) {
  const handlerCache = new Map<string, Function>();
  const getProps =
    typeof userProps === "function" ? userProps : () => userProps;

  return function prop<T = any>(key: string): T {
    const props = getProps();

    if (isEventProp(key)) {
      const hasTrigger =
        instance && typeof instance.triggerEvent === "function";
      const primaryFn =
        typeof props[key] === "function" ? props[key] : undefined;

      if (!hasTrigger && !primaryFn) {
        return undefined as unknown as T;
      }

      if (!handlerCache.has(key)) {
        const eventName = toMiniEventName(key);
        const stripped = key.slice(2);
        const camelName = stripped.charAt(0).toLowerCase() + stripped.slice(1);
        const bridge = hasTrigger
          ? createEventBridge(instance, eventName)
          : undefined;
        const camelBridge =
          hasTrigger && camelName !== eventName
            ? createEventBridge(instance, camelName)
            : undefined;

        const triggerAdapter = (
          rawPayload?: any,
          options?: WechatMiniprogram.Component.TriggerEventOption,
        ) => {
          const normalized = normalizeEvent(rawPayload, eventName);
          let ret: any;

          const latestProps = getProps();
          const pFn =
            typeof latestProps[key] === "function"
              ? latestProps[key]
              : undefined;

          if (pFn) {
            ret = pFn(rawPayload);
          }

          if (bridge) {
            const detail =
              normalized.detail &&
              typeof normalized.detail === "object" &&
              "checked" in normalized.detail &&
              normalized.detail.value === undefined
                ? { value: normalized.detail.checked, ...normalized.detail }
                : normalized.detail;

            const bRet = bridge(detail, options);
            if (ret === undefined) ret = bRet;
            if (camelBridge) {
              camelBridge(detail, options);
            }
          }

          return ret;
        };

        handlerCache.set(key, triggerAdapter);
      }

      return handlerCache.get(key) as unknown as T;
    }

    return props[key];
  };
}
