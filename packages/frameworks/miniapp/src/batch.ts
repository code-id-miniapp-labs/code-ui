import { startBatch, endBatch } from "alien-signals";

/**
 * Batches multiple reactive signal mutations and defers effect execution
 * until the batch function completes.
 *
 * @example
 * ```ts
 * batch(() => {
 *   buttonService.send({ type: "TAP" });
 *   context.set("loading", true);
 * });
 * ```
 */
export function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}
