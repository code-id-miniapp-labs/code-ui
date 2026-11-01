import { normalizeEvent, toMiniEventName } from "./normalize-event";
import { createEventBridge } from "./event-bridge";

export type UserPropsGetter = Record<string, any> | (() => Record<string, any>);

const ALIAS_GROUPS: readonly (readonly string[])[] = [
  ["onTap", "onClick"],
  ["onChange", "onValueChange", "onCheckedChange", "onStepChange"],
  ["onComplete", "onValueComplete"],
  ["onInvalid", "onValueInvalid"],
];

const EVENT_PROP_ALIASES = new Map<string, string[]>();
for (const group of ALIAS_GROUPS) {
  for (const key of group) {
    EVENT_PROP_ALIASES.set(
      key,
      group.filter((k) => k !== key),
    );
  }
}

function isEventProp(key: string): boolean {
  return (
    key.startsWith("on") && key.length > 2 && key[2] === key[2]?.toUpperCase()
  );
}

function getAliasHandlers(
  props: Record<string, any>,
  key: string,
  primaryFn?: Function,
): Function[] {
  const aliases = EVENT_PROP_ALIASES.get(key);
  if (!aliases) return [];

  const handlers: Function[] = [];
  for (const alias of aliases) {
    const fn = props[alias];
    if (typeof fn === "function" && fn !== primaryFn) {
      handlers.push(fn);
    }
  }
  return handlers;
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
      const aliasFns = getAliasHandlers(props, key, primaryFn);

      if (!hasTrigger && !primaryFn && aliasFns.length === 0) {
        return undefined as unknown as T;
      }

      if (!handlerCache.has(key)) {
        const eventName = toMiniEventName(key);
        const bridge = hasTrigger
          ? createEventBridge(instance, eventName)
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
          const aFns = getAliasHandlers(latestProps, key, pFn);

          if (pFn) {
            ret = pFn(rawPayload);
          }
          for (const afn of aFns) {
            const aRet = afn(rawPayload);
            if (ret === undefined) ret = aRet;
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
