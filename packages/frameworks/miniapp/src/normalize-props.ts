/**
 * @code-ui/miniapp - normalizeProps
 *
 */

import {
  createNormalizer,
  type NormalizeProps,
  type PropTypes,
} from "@code-ui/core";
import { normalizeEvent } from "./normalize-event";

export { createNormalizer, type NormalizeProps, type PropTypes };
export type Normalizer<T = Record<string, any>> = (
  props: Record<string, any>,
) => T;
export type NormalizerFn<T extends PropTypes = PropTypes> = NormalizeProps<T>;

export const normalizeProps: NormalizeProps = createNormalizer(
  (props: Record<string, any>) => {
    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(props)) {
      // When `connect()` defines an event handler like `onClick(e) { ... }` or `onTap(e) { ... }`
      if (key.startsWith("on") && typeof value === "function") {
        // Wrap the machine's handler so it ALWAYS receives a NormalizedMiniEvent
        normalized[key] = (rawWxEvent: any) => {
          return value(normalizeEvent(rawWxEvent));
        };
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  },
);
