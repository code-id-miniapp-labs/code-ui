/**
 * @code-ui/miniapp - Event normalization
 *
 * Normalizes MiniProgram and machine event payloads into a consistent
 * WeChat event structure, enabling framework-agnostic FSM machines.
 */

export interface NormalizedMiniEvent<T = any> {
  type: string;
  timeStamp: number;
  target: {
    id: string;
    dataset: Record<string, any>;
    offsetLeft?: number;
    offsetTop?: number;
  };
  currentTarget: {
    id: string;
    dataset: Record<string, any>;
    offsetLeft?: number;
    offsetTop?: number;
  };
  detail: T;
  stopPropagation?: () => void;
  preventDefault?: () => void;
  [key: string]: any;
}

/**
 * Converts camelCase machine callback names to Weixin event names:
 * "onTap" -> "tap"
 * "onValueChange" -> "valuechange" (or "value-change" depending on your WXML convention)
 */
export function toMiniEventName(propName: string, kebabCase = false): string {
  if (propName === "onUpdateModelValue" || propName === "onUpdate:modelValue") {
    return "update:modelValue";
  }
  const stripped = propName.slice(2); // remove "on"
  if (!kebabCase) return stripped.toLowerCase();
  return stripped.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Normalizes raw WeChat event objects or custom payload arguments
 * into a standard NormalizedMiniEvent shape.
 */
export function normalizeEvent<T = any>(
  rawPayload?: any,
  eventName = "",
): NormalizedMiniEvent<T> {
  if (
    rawPayload &&
    typeof rawPayload === "object" &&
    ("type" in rawPayload || "currentTarget" in rawPayload || "detail" in rawPayload)
  ) {
    const detail =
      rawPayload.detail !== undefined ? rawPayload.detail : rawPayload;

    if (
      typeof rawPayload.setPromise === "function" &&
      detail &&
      typeof detail === "object" &&
      !detail.setPromise
    ) {
      try {
        detail.setPromise = rawPayload.setPromise;
      } catch {
        // ignore if detail is frozen
      }
    }

    return {
      type: rawPayload.type || eventName,
      timeStamp: rawPayload.timeStamp || Date.now(),
      target: rawPayload.target || { id: "", dataset: {} },
      currentTarget:
        rawPayload.currentTarget || rawPayload.target || { id: "", dataset: {} },
      detail,
      stopPropagation:
        typeof rawPayload.stopPropagation === "function"
          ? rawPayload.stopPropagation.bind(rawPayload)
          : undefined,
      preventDefault:
        typeof rawPayload.preventDefault === "function"
          ? rawPayload.preventDefault.bind(rawPayload)
          : undefined,
      ...rawPayload,
    };
  }

  return {
    type: eventName,
    timeStamp: Date.now(),
    target: { id: "", dataset: {} },
    currentTarget: { id: "", dataset: {} },
    detail: rawPayload as T,
  };
}

