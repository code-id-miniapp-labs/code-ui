import { createQuery, type MiniAppComponent } from "./dom";

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

