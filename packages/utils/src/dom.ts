/// <reference types="miniprogram-api-typings" />

export type MiniAppRect = WechatMiniprogram.BoundingClientRectCallbackResult;
export type MiniAppScrollOffset = WechatMiniprogram.ScrollOffsetCallbackResult;
export type MiniAppNodeFields = WechatMiniprogram.IAnyObject;
export type MiniAppComponent = WechatMiniprogram.Component.TrivialInstance;

export interface DOMQueryHelpers {
  query: () => WechatMiniprogram.SelectorQuery;
  rect: (selector: string) => Promise<MiniAppRect | null>;
  allRects: (selector: string) => Promise<MiniAppRect[]>;
  scrollOffset: (selector: string) => Promise<MiniAppScrollOffset | null>;
  viewportScrollOffset: () => Promise<MiniAppScrollOffset | null>;
  fields: (
    selector: string,
    fields: WechatMiniprogram.Fields,
  ) => Promise<MiniAppNodeFields | null>;
  computedStyle: (
    selector: string,
    properties: string[],
  ) => Promise<Record<string, string> | null>;
  animationDuration: (selector: string) => Promise<number>;
}

export function createQuery(
  component?: MiniAppComponent,
): WechatMiniprogram.SelectorQuery {
  const q = wx.createSelectorQuery();
  return component ? q.in(component) : q;
}

export function createDOM(component?: MiniAppComponent): DOMQueryHelpers {
  return {
    query: () => createQuery(component),
    rect: (selector: string) => queryRect(selector, component),
    allRects: (selector: string) => queryAllRects(selector, component),
    scrollOffset: (selector: string) => queryScrollOffset(selector, component),
    viewportScrollOffset: () => queryViewportScrollOffset(component),
    fields: (selector: string, fields: WechatMiniprogram.Fields) =>
      queryFields(selector, fields, component),
    computedStyle: (selector: string, properties: string[]) =>
      queryComputedStyle(selector, properties, component),
    animationDuration: (selector: string) =>
      queryAnimationDuration(selector, component),
  };
}

export const createDOMQuery = createDOM;

export function queryRect(
  selector: string,
  component?: MiniAppComponent,
): Promise<MiniAppRect | null> {
  return new Promise((resolve) => {
    createQuery(component)
      .select(selector)
      .boundingClientRect((res) => resolve((res as MiniAppRect | null) ?? null))
      .exec();
  });
}

export function queryAllRects(
  selector: string,
  component?: MiniAppComponent,
): Promise<MiniAppRect[]> {
  return new Promise((resolve) => {
    createQuery(component)
      .selectAll(selector)
      .boundingClientRect((res) => resolve((res as unknown as MiniAppRect[]) ?? []))
      .exec();
  });
}

export function queryScrollOffset(
  selector: string,
  component?: MiniAppComponent,
): Promise<MiniAppScrollOffset | null> {
  return new Promise((resolve) => {
    createQuery(component)
      .select(selector)
      .scrollOffset((res) =>
        resolve((res as MiniAppScrollOffset | null) ?? null),
      )
      .exec();
  });
}

export function queryViewportScrollOffset(
  component?: MiniAppComponent,
): Promise<MiniAppScrollOffset | null> {
  return new Promise((resolve) => {
    createQuery(component)
      .selectViewport()
      .scrollOffset((res) =>
        resolve((res as MiniAppScrollOffset | null) ?? null),
      )
      .exec();
  });
}

export function queryFields(
  selector: string,
  fields: WechatMiniprogram.Fields,
  component?: MiniAppComponent,
): Promise<MiniAppNodeFields | null> {
  return new Promise((resolve) => {
    createQuery(component)
      .select(selector)
      .fields(fields, (res) =>
        resolve((res as MiniAppNodeFields | null) ?? null),
      )
      .exec();
  });
}

export function isMiniApp(): boolean {
  return (
    typeof wx !== "undefined" && typeof wx.createSelectorQuery === "function"
  );
}

export function parseTimeValue(value?: string): number {
  if (!value || value === "0s" || value === "auto" || value === "none") return 0;
  return value
    .split(",")
    .map((s) => s.trim())
    .reduce((max, part) => {
      const ms = part.endsWith("ms")
        ? parseFloat(part)
        : part.endsWith("s")
          ? parseFloat(part) * 1000
          : parseFloat(part) || 0;
      return Math.max(max, isNaN(ms) ? 0 : ms);
    }, 0);
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
  ).then((styles) => {
    if (!styles) return 0;
    const totalAnim =
      parseTimeValue(styles.animationDuration) +
      parseTimeValue(styles.animationDelay);
    const totalTrans =
      parseTimeValue(styles.transitionDuration) +
      parseTimeValue(styles.transitionDelay);
    return Math.max(totalAnim, totalTrans);
  });
}
