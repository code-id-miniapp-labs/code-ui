import { createQuery, isMiniApp, type MiniAppComponent } from "./dom";

export function parseTimeValue(value?: string): number {
  if (!value || value === "0s" || value === "auto" || value === "none") return 0;
  let max = 0;
  for (const raw of value.split(",")) {
    const part = raw.trim();
    const ms = part.endsWith("ms")
      ? parseFloat(part)
      : part.endsWith("s")
        ? parseFloat(part) * 1000
        : parseFloat(part) || 0;
    if (ms > max) max = ms;
  }
  return max;
}

export function queryComputedStyle(
  selector: string,
  properties: string[],
  component?: MiniAppComponent,
): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    createQuery(component)
      .select(selector)
      .fields({ computedStyle: properties } as any)
      .exec((res) => {
        const item = Array.isArray(res) ? res[0] : res;
        resolve((item as Record<string, string> | null) ?? null);
      });
  });
}

export interface ScheduleAnimationEndOptions {
  /** Explicit duration in ms. When finite and >= 0, skips CSS style querying. */
  duration?: number | null | undefined;
  /** CSS selector queried via `queryAnimationDuration` when `duration` is omitted or < 0. */
  selector?: string | undefined;
  /** MiniApp component instance for scoped selector query. */
  component?: MiniAppComponent | undefined;
  /** Fallback duration in ms when CSS query yields 0 or fails. Defaults to 300. */
  fallbackDuration?: number | undefined;
  /** Callback invoked when the animation window completes. */
  onEnd: () => void;
}

/**
 * Schedules a cancelable animation-end callback using an explicit duration or
 * computed CSS animation/transition duration queried from the target element.
 */
export function scheduleAnimationEnd(
  options: ScheduleAnimationEndOptions,
): () => void {
  const {
    duration,
    selector,
    component,
    fallbackDuration = 300,
    onEnd,
  } = options;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  const cleanup = () => {
    cancelled = true;
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const schedule = (ms: number) => {
    if (cancelled) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (!cancelled) onEnd();
    }, ms);
  };

  if (
    typeof duration === "number" &&
    Number.isFinite(duration) &&
    duration >= 0
  ) {
    schedule(duration);
    return cleanup;
  }

  if (!selector || (!component && !isMiniApp())) {
    schedule(fallbackDuration);
    return cleanup;
  }

  queryAnimationDuration(selector, component)
    .then((queried) => {
      if (cancelled) return;
      schedule(queried > 0 ? queried : fallbackDuration);
    })
    .catch(() => {
      if (cancelled) return;
      schedule(fallbackDuration);
    });

  return cleanup;
}

export function queryAnimationDuration(
  selector: string,
  component?: MiniAppComponent,
): Promise<number> {
  return queryComputedStyle(
    selector,
    [
      "animationDuration",
      "transitionDuration",
      "animationDelay",
      "transitionDelay",
    ],
    component,
  ).then((s) =>
    s
      ? Math.max(
          parseTimeValue(s.animationDuration) + parseTimeValue(s.animationDelay),
          parseTimeValue(s.transitionDuration) +
            parseTimeValue(s.transitionDelay),
        )
      : 0,
  );
}

