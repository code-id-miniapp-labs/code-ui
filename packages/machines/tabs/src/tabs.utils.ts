import { createDOM } from "@code-ui/utils";
import type { MiniAppComponent } from "@code-ui/utils";
import type { BindableContext, ComputedFn, PropFn, Scope } from "@code-ui/core";
import type { TabsSchema, TabsSize } from "./tabs.types";

export interface TabsComponentInstance extends MiniAppComponent {
  data?: any;
  createSelectorQuery?: () => any;
  getRelationNodes?(relation: string): TabsComponentInstance[] | undefined;
  selectAllComponents?(selector: string): TabsComponentInstance[] | undefined;
  __codeUiTabsChildren?: TabsComponentInstance[] | undefined;
}

const TAB_WIDTH_BY_SIZE: Record<TabsSize, number> = {
  xs: 72,
  sm: 88,
  md: 104,
  lg: 120,
  xl: 136,
};

function clampIndex(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function applyScrollOffset(
  context: BindableContext<TabsSchema>,
  nextScroll: number,
  actualScrollLeft?: number,
): void {
  const rounded = Math.max(0, Math.round(nextScroll));
  const current = context.get("scrollLeft") || 0;
  if (
    rounded === current &&
    actualScrollLeft !== undefined &&
    Math.abs(actualScrollLeft - rounded) > 2
  ) {
    context.set("scrollLeft", rounded > 0 ? rounded - 1 : 1);
    return;
  }
  context.set("scrollLeft", rounded);
}

function getTriggerChildren(
  comp: TabsComponentInstance,
): TabsComponentInstance[] {
  const relationChildren =
    typeof comp.getRelationNodes === "function"
      ? comp.getRelationNodes("cuiTabsChild")
      : undefined;
  const templateChildren =
    typeof comp.selectAllComponents === "function"
      ? comp.selectAllComponents("c-tabs-item, .cui-tabs-item")
      : undefined;

  const childrenSet = new Set<TabsComponentInstance>();
  if (Array.isArray(relationChildren)) {
    for (const c of relationChildren) childrenSet.add(c);
  }
  if (Array.isArray(comp.__codeUiTabsChildren)) {
    for (const c of comp.__codeUiTabsChildren) childrenSet.add(c);
  }
  if (Array.isArray(templateChildren)) {
    for (const c of templateChildren) childrenSet.add(c);
  }

  const triggers = Array.from(childrenSet).filter(
    (c) =>
      c?.data?.mode === "trigger" || c?.data?.tabsItem?.mode === "trigger",
  );

  triggers.sort((a, b) => {
    const idxA = Number(a?.data?.index ?? a?.data?.tabsItem?.index ?? 0);
    const idxB = Number(b?.data?.index ?? b?.data?.tabsItem?.index ?? 0);
    return idxA - idxB;
  });

  return triggers;
}

export function performTabsScrollUpdate(
  context: BindableContext<TabsSchema>,
  computed: ComputedFn<TabsSchema>,
  prop: PropFn<TabsSchema>,
  scope?: Scope | undefined,
): void {
  const orientation = prop("orientation") ?? "horizontal";
  if (orientation === "vertical") return;

  const selectedIndex = computed("selectedIndex");
  const total = computed("totalCount");
  if (total <= 0 || selectedIndex < 0) return;

  const size = (prop("size") ?? "md") as TabsSize;
  const tabWidth = TAB_WIDTH_BY_SIZE[size] ?? 104;
  const fallbackScrollLeft =
    selectedIndex <= 0 ? 0 : Math.max(0, (selectedIndex - 1) * tabWidth);

  const comp = (scope?.component ?? prop("component")) as
    | TabsComponentInstance
    | undefined;
  if (!comp || typeof comp.createSelectorQuery !== "function") {
    context.set("scrollLeft", fallbackScrollLeft);
    return;
  }

  const triggers = getTriggerChildren(comp);
  if (triggers.length === 0) {
    context.set("scrollLeft", fallbackScrollLeft);
    return;
  }

  const curIdx = clampIndex(selectedIndex, 0, triggers.length - 1);
  const curChild = triggers[curIdx];
  if (!curChild || typeof curChild.createSelectorQuery !== "function") {
    context.set("scrollLeft", fallbackScrollLeft);
    return;
  }

  const dom = scope?.dom ?? createDOM(comp);
  const scrollPromise = dom.fields(".cui-tabs-scroll", {
    rect: true,
    size: true,
    scrollOffset: true,
  });

  const triggerPromises = triggers.map((t) =>
    createDOM(t).rect(".cui-tabs-trigger"),
  );

  Promise.all([scrollPromise, Promise.all(triggerPromises)])
    .then(([scrollRes, triggerRects]) => {
      if (!scrollRes || !scrollRes.width || !triggerRects[curIdx]) {
        context.set("scrollLeft", fallbackScrollLeft);
        return;
      }

      const listLeft = Number(scrollRes.left || 0);
      const listWidth = Number(scrollRes.width || 0);
      const actualScroll = Number(scrollRes.scrollLeft || 0);

      const items = (triggerRects as any[]).map((rect: any, idx: number) => {
        if (!rect) {
          const approxLeft = idx * tabWidth;
          return {
            left: approxLeft,
            right: approxLeft + tabWidth,
            width: tabWidth,
          };
        }
        const left = actualScroll + (Number(rect.left || 0) - listLeft);
        const right = actualScroll + (Number(rect.right || 0) - listLeft);
        const width = Number(rect.width || right - left || tabWidth);
        return { left, right, width };
      });

      const curItem = items[curIdx];
      if (!curItem) {
        context.set("scrollLeft", fallbackScrollLeft);
        return;
      }

      const totalContentWidth = items[items.length - 1]?.right ?? 0;
      const maxScroll = Math.max(0, totalContentWidth - listWidth);

      // If all content fits in listWidth, scroll is always 0 and no edge mask is needed
      if (totalContentWidth <= listWidth) {
        context.set("canScrollLeft", false);
        context.set("canScrollRight", false);
        applyScrollOffset(context, 0, actualScroll);
        return;
      }

      // Smooth Center active tab in horizontal scroll view:
      // targetScroll = curCenter - listWidth / 2
      const curCenter = (curItem.left + curItem.right) / 2;
      let targetScroll = Math.round(curCenter - listWidth / 2);

      // Clamp between 0 and maxScroll
      targetScroll = Math.min(Math.max(0, targetScroll), maxScroll);

      // Dynamic edge mask boundaries:
      // When at start (<= 4px), only fade right edge
      // When at end (>= maxScroll - 4px), only fade left edge
      // When in middle, fade both edges
      context.set("canScrollLeft", targetScroll > 4);
      context.set("canScrollRight", targetScroll < maxScroll - 4);

      applyScrollOffset(context, targetScroll, actualScroll);
    })
    .catch(() => {
      context.set("scrollLeft", fallbackScrollLeft);
    });
}
