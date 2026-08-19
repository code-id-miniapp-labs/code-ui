/// <reference types="miniprogram-api-typings" />

/**

/** Rect information returned by boundingClientRect queries */
export type MiniAppRect = WechatMiniprogram.BoundingClientRectCallbackResult;

/** Scroll offset returned by scrollOffset queries */
export type MiniAppScrollOffset = WechatMiniprogram.ScrollOffsetCallbackResult;

/** Fields result — a loose object since the shape depends on requested fields */
export type MiniAppNodeFields = WechatMiniprogram.IAnyObject;

/**
 * A component or page instance — used to scope a SelectorQuery to a custom
 * component so cross-component selectors resolve correctly.
 * Aliased to the library's TrivialInstance to avoid verbose generics at call sites.
 */
export type MiniAppComponent = WechatMiniprogram.Component.TrivialInstance;

export interface DOMQueryHelpers {
  /** Create a raw SelectorQuery scoped to the component */
  query: () => WechatMiniprogram.SelectorQuery;
  /** Query single element bounding client rect */
  rect: (selector: string) => Promise<MiniAppRect | null>;
  /** Query all matching elements bounding client rects */
  allRects: (selector: string) => Promise<MiniAppRect[]>;
  /** Query scroll offset of a scroll-view or container */
  scrollOffset: (selector: string) => Promise<MiniAppScrollOffset | null>;
  /** Query viewport scroll offset */
  viewportScrollOffset: () => Promise<MiniAppScrollOffset | null>;
  /** Query custom fields for a selector */
  fields: (
    selector: string,
    fields: WechatMiniprogram.Fields,
  ) => Promise<MiniAppNodeFields | null>;
  /** Query computed CSS styles for a selector */
  computedStyle: (
    selector: string,
    properties: string[],
  ) => Promise<Record<string, string> | null>;
  /** Query animation/transition duration in milliseconds for a selector */
  animationDuration: (selector: string) => Promise<number>;
}

/**
 * @example
 * const query = createQuery(this);
 * query.select('#my-input').boundingClientRect(cb).exec();
 */
export function createQuery(
  component?: MiniAppComponent,
): WechatMiniprogram.SelectorQuery {
  const query = wx.createSelectorQuery();
  return component ? query.in(component) : query;
}

/**
 * Creates a scoped set of DOM query helpers bound to a component instance.
 *
 * @example
 * attached() {
 *   const dom = createDOM(this);
 *   const rect = await dom.rect('#my-button');
 *   const all = await dom.allRects('.item');
 * }
 */
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

/**
 * @example
 * const rect = await queryRect('#my-button', this);
 * // or curried:
 * const getRect = queryRect(this);
 * const rect = await getRect('#my-button');
 */
export function queryRect(
  component: MiniAppComponent,
): (selector: string) => Promise<MiniAppRect | null>;
export function queryRect(
  selector: string,
  component?: MiniAppComponent,
): Promise<MiniAppRect | null>;
export function queryRect(
  selectorOrComponent: string | MiniAppComponent,
  component?: MiniAppComponent,
):
  | ((selector: string) => Promise<MiniAppRect | null>)
  | Promise<MiniAppRect | null> {
  if (typeof selectorOrComponent !== "string") {
    return (selector: string) => queryRect(selector, selectorOrComponent);
  }

  return new Promise((resolve) => {
    createQuery(component)
      .select(selectorOrComponent)
      .boundingClientRect((res) => {
        resolve((res as MiniAppRect | null) ?? null);
      })
      .exec();
  });
}

/**

 * @example
 * const rects = await queryAllRects('.item', this);
 * // or curried:
 * const getAllRects = queryAllRects(this);
 * const rects = await getAllRects('.item');
 */
export function queryAllRects(
  component: MiniAppComponent,
): (selector: string) => Promise<MiniAppRect[]>;
export function queryAllRects(
  selector: string,
  component?: MiniAppComponent,
): Promise<MiniAppRect[]>;
export function queryAllRects(
  selectorOrComponent: string | MiniAppComponent,
  component?: MiniAppComponent,
): ((selector: string) => Promise<MiniAppRect[]>) | Promise<MiniAppRect[]> {
  if (typeof selectorOrComponent !== "string") {
    return (selector: string) => queryAllRects(selector, selectorOrComponent);
  }

  return new Promise((resolve) => {
    createQuery(component)
      .selectAll(selectorOrComponent)
      .boundingClientRect((res) => {
        // selectAll always returns an array; single-select returns a single object
        const result = res as unknown as MiniAppRect[] | null;
        resolve(result ?? []);
      })
      .exec();
  });
}

/**
 * @example
 * const offset = await queryScrollOffset('.scroll-view', this);
 * // or curried:
 * const getOffset = queryScrollOffset(this);
 * const offset = await getOffset('.scroll-view');
 */
export function queryScrollOffset(
  component: MiniAppComponent,
): (selector: string) => Promise<MiniAppScrollOffset | null>;
export function queryScrollOffset(
  selector: string,
  component?: MiniAppComponent,
): Promise<MiniAppScrollOffset | null>;
export function queryScrollOffset(
  selectorOrComponent: string | MiniAppComponent,
  component?: MiniAppComponent,
):
  | ((selector: string) => Promise<MiniAppScrollOffset | null>)
  | Promise<MiniAppScrollOffset | null> {
  if (typeof selectorOrComponent !== "string") {
    return (selector: string) =>
      queryScrollOffset(selector, selectorOrComponent);
  }

  return new Promise((resolve) => {
    createQuery(component)
      .select(selectorOrComponent)
      .scrollOffset((res) => {
        resolve((res as MiniAppScrollOffset | null) ?? null);
      })
      .exec();
  });
}

/**
 * @example
 * const offset = await queryViewportScrollOffset(this);
 * console.log(offset?.scrollTop);
 */
export function queryViewportScrollOffset(
  component?: MiniAppComponent,
): Promise<MiniAppScrollOffset | null> {
  return new Promise((resolve) => {
    createQuery(component)
      .selectViewport()
      .scrollOffset((res) => {
        resolve((res as MiniAppScrollOffset | null) ?? null);
      })
      .exec();
  });
}

/**
 * @example
 * const info = await queryFields('#btn', { dataset: true, id: true }, this);
 * // or curried:
 * const getFields = queryFields(this);
 * const info = await getFields('#btn', { dataset: true, id: true });
 */
export function queryFields(
  component: MiniAppComponent,
): (
  selector: string,
  fields: WechatMiniprogram.Fields,
) => Promise<MiniAppNodeFields | null>;
export function queryFields(
  selector: string,
  fields: WechatMiniprogram.Fields,
  component?: MiniAppComponent,
): Promise<MiniAppNodeFields | null>;
export function queryFields(
  selectorOrComponent: string | MiniAppComponent,
  fieldsOrComponent?: WechatMiniprogram.Fields | MiniAppComponent,
  component?: MiniAppComponent,
):
  | ((
      selector: string,
      fields: WechatMiniprogram.Fields,
    ) => Promise<MiniAppNodeFields | null>)
  | Promise<MiniAppNodeFields | null> {
  if (typeof selectorOrComponent !== "string") {
    const comp = selectorOrComponent as MiniAppComponent;
    return (selector: string, fields: WechatMiniprogram.Fields) =>
      queryFields(selector, fields, comp);
  }

  const fields = fieldsOrComponent as WechatMiniprogram.Fields;
  return new Promise((resolve) => {
    createQuery(component)
      .select(selectorOrComponent)
      .fields(fields, (res) => {
        resolve((res as MiniAppNodeFields | null) ?? null);
      })
      .exec();
  });
}

export function isMiniApp(): boolean {
  return (
    typeof wx !== "undefined" && typeof wx.createSelectorQuery === "function"
  );
}

/**
 * Parses CSS time string (e.g. "0.3s", "300ms", "0.5s, 0.2s") into milliseconds.
 */
export function parseTimeValue(value?: string): number {
  if (!value || value === "0s" || value === "auto" || value === "none")
    return 0;

  // Handle comma-separated lists (e.g. "transition-duration: 0.3s, 0.5s")
  const parts = value.split(",").map((s) => s.trim());
  const maxMs = parts.reduce((max, part) => {
    let ms = 0;
    if (part.endsWith("ms")) {
      ms = parseFloat(part);
    } else if (part.endsWith("s")) {
      ms = parseFloat(part) * 1000;
    } else {
      ms = parseFloat(part) || 0;
    }
    return Math.max(max, isNaN(ms) ? 0 : ms);
  }, 0);

  return maxMs;
}

/**
 * @example
 * const styles = await queryComputedStyle('#my-dialog', ['animationDuration', 'opacity'], this);
 * console.log(styles?.animationDuration);
 */
export function queryComputedStyle(
  component: MiniAppComponent,
): (
  selector: string,
  properties: string[],
) => Promise<Record<string, string> | null>;
export function queryComputedStyle(
  selector: string,
  properties: string[],
  component?: MiniAppComponent,
): Promise<Record<string, string> | null>;
export function queryComputedStyle(
  selectorOrComponent: string | MiniAppComponent,
  propertiesOrComponent?: string[] | MiniAppComponent,
  component?: MiniAppComponent,
):
  | ((
      selector: string,
      properties: string[],
    ) => Promise<Record<string, string> | null>)
  | Promise<Record<string, string> | null> {
  if (typeof selectorOrComponent !== "string") {
    const comp = selectorOrComponent as MiniAppComponent;
    return (selector: string, properties: string[]) =>
      queryComputedStyle(selector, properties, comp);
  }

  const properties = propertiesOrComponent as string[];
  return new Promise((resolve) => {
    createQuery(component)
      .select(selectorOrComponent)
      .fields({ computedStyle: properties } as any)
      .exec((res) => {
        const item = Array.isArray(res) ? res[0] : res;
        resolve((item as Record<string, string> | null) ?? null);
      });
  });
}

/**
 * @example
 * const duration = await queryAnimationDuration('.code-drawer-content', this);
 * console.log(duration); // 300
 */
export function queryAnimationDuration(
  component: MiniAppComponent,
): (selector: string) => Promise<number>;
export function queryAnimationDuration(
  selector: string,
  component?: MiniAppComponent,
): Promise<number>;
export function queryAnimationDuration(
  selectorOrComponent: string | MiniAppComponent,
  component?: MiniAppComponent,
): ((selector: string) => Promise<number>) | Promise<number> {
  if (typeof selectorOrComponent !== "string") {
    const comp = selectorOrComponent as MiniAppComponent;
    return (selector: string) => queryAnimationDuration(selector, comp);
  }

  return new Promise((resolve) => {
    queryComputedStyle(
      selectorOrComponent,
      [
        "animationDuration",
        "transitionDuration",
        "animationDelay",
        "transitionDelay",
      ],
      component,
    ).then((styles) => {
      if (!styles) {
        resolve(0);
        return;
      }

      const animDuration = parseTimeValue(styles.animationDuration);
      const animDelay = parseTimeValue(styles.animationDelay);
      const transDuration = parseTimeValue(styles.transitionDuration);
      const transDelay = parseTimeValue(styles.transitionDelay);

      const totalAnim = animDuration + animDelay;
      const totalTrans = transDuration + transDelay;

      resolve(Math.max(totalAnim, totalTrans));
    });
  });
}
