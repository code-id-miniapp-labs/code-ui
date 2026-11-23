export type PageLifecycleEvent = "show" | "hide";

export interface PageLifecycleSubscriber {
  onShow?: (() => void) | undefined;
  onHide?: (() => void) | undefined;
}

export interface PageLifecycleInstanceLike {
  getPageId?: (() => string) | undefined;
  __wxWebviewId__?: number | string | undefined;
  __page__?:
    | {
        getPageId?: (() => string) | undefined;
        __wxWebviewId__?: number | string | undefined;
      }
    | undefined;
  $page?:
    | {
        getPageId?: (() => string) | undefined;
        __wxWebviewId__?: number | string | undefined;
      }
    | undefined;
}

interface PageInstanceLike extends PageLifecycleInstanceLike {
  onShow?: ((...args: unknown[]) => unknown) | undefined;
  onHide?: ((...args: unknown[]) => unknown) | undefined;
}

interface PageLifecycleRegistry {
  subscribers: Map<string, Set<PageLifecycleSubscriber>>;
  hosts: Map<string, Set<object>>;
  patchedPages: WeakSet<object>;
}

interface PageLifecycleGlobalScope {
  __CODE_UI_PAGE_LIFECYCLE__?: PageLifecycleRegistry | undefined;
}

const DEFAULT_PAGE_ID = "__default__";

const globalScope = (
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : {}
) as PageLifecycleGlobalScope;

function getRegistry(): PageLifecycleRegistry {
  if (!globalScope.__CODE_UI_PAGE_LIFECYCLE__) {
    globalScope.__CODE_UI_PAGE_LIFECYCLE__ = {
      subscribers: new Map(),
      hosts: new Map(),
      patchedPages: new WeakSet(),
    };
  }
  return globalScope.__CODE_UI_PAGE_LIFECYCLE__;
}

function readPageIdFromObject(
  instance?: PageLifecycleInstanceLike | null,
): string | undefined {
  if (!instance) return undefined;
  try {
    if (typeof instance.getPageId === "function") {
      const pid = instance.getPageId();
      if (pid !== undefined && pid !== null && pid !== "") return String(pid);
    }
    if (
      instance.__wxWebviewId__ !== undefined &&
      instance.__wxWebviewId__ !== null &&
      String(instance.__wxWebviewId__) !== ""
    ) {
      return String(instance.__wxWebviewId__);
    }
    if (instance.__page__) {
      const pid = readPageIdFromObject(instance.__page__);
      if (pid) return pid;
    }
    if (instance.$page) {
      const pid = readPageIdFromObject(instance.$page);
      if (pid) return pid;
    }
  } catch {
    // Ignore errors when reading platform page IDs
  }
  return undefined;
}

function getPagesSafe(): PageInstanceLike[] {
  if (typeof getCurrentPages !== "function") return [];
  try {
    const pages = getCurrentPages() as unknown as PageInstanceLike[] | undefined;
    return Array.isArray(pages) ? pages : [];
  } catch {
    return [];
  }
}

export function resolveLifecyclePageId(
  instanceOrPageId?: string | PageLifecycleInstanceLike | null,
): string {
  if (typeof instanceOrPageId === "string" && instanceOrPageId !== "") {
    return instanceOrPageId;
  }
  if (instanceOrPageId && typeof instanceOrPageId === "object") {
    const direct = readPageIdFromObject(instanceOrPageId);
    if (direct) return direct;
  }
  const pages = getPagesSafe();
  const topPage = pages[pages.length - 1];
  const topId = readPageIdFromObject(topPage);
  if (topId) return topId;
  return DEFAULT_PAGE_ID;
}

function hasActiveHost(reg: PageLifecycleRegistry, pageId: string): boolean {
  const hostSet = reg.hosts.get(pageId);
  return Boolean(hostSet && hostSet.size > 0);
}

function findMatchingPage(pageId: string): PageInstanceLike | undefined {
  const pages = getPagesSafe();
  if (pages.length === 0) return undefined;
  if (pageId === DEFAULT_PAGE_ID) {
    return pages[pages.length - 1];
  }
  for (let i = pages.length - 1; i >= 0; i--) {
    const page = pages[i];
    if (page && readPageIdFromObject(page) === pageId) {
      return page;
    }
  }
  return undefined;
}

function ensureFallbackPageHook(
  reg: PageLifecycleRegistry,
  pageId: string,
): void {
  const page = findMatchingPage(pageId);
  if (!page || reg.patchedPages.has(page)) return;
  reg.patchedPages.add(page);

  const origOnShow = page.onShow;
  page.onShow = function (this: PageInstanceLike, ...args: unknown[]) {
    const result =
      typeof origOnShow === "function" ? origOnShow.apply(this, args) : undefined;
    const currentReg = getRegistry();
    if (!hasActiveHost(currentReg, pageId)) {
      emitPageLifecycle(pageId, "show");
    }
    return result;
  };

  const origOnHide = page.onHide;
  page.onHide = function (this: PageInstanceLike, ...args: unknown[]) {
    const result =
      typeof origOnHide === "function" ? origOnHide.apply(this, args) : undefined;
    const currentReg = getRegistry();
    if (!hasActiveHost(currentReg, pageId)) {
      emitPageLifecycle(pageId, "hide");
    }
    return result;
  };
}

/**
 * Registers a single page lifecycle host (e.g. `<c-app>`) for the current page.
 * While at least one host is active on a page, fallback page `onShow`/`onHide`
 * patching is suppressed so notifications are emitted once from the host.
 */
export function registerPageLifecycleHost(
  instance: object & PageLifecycleInstanceLike,
): () => void {
  const reg = getRegistry();
  const pageId = resolveLifecyclePageId(instance);
  let hosts = reg.hosts.get(pageId);
  if (!hosts) {
    hosts = new Set();
    reg.hosts.set(pageId, hosts);
  }
  hosts.add(instance);

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const currentHosts = reg.hosts.get(pageId);
    if (currentHosts) {
      currentHosts.delete(instance);
      if (currentHosts.size === 0) {
        reg.hosts.delete(pageId);
        const remainingSubs = reg.subscribers.get(pageId);
        if (remainingSubs && remainingSubs.size > 0) {
          ensureFallbackPageHook(reg, pageId);
        }
      }
    }
  };
}

/**
 * Subscribes a component instance to per-page `show`/`hide` lifecycle events
 * without declaring per-component `pageLifetimes`.
 */
export function subscribePageLifecycle(
  instance: PageLifecycleInstanceLike | null | undefined,
  subscriber: PageLifecycleSubscriber,
): () => void {
  const reg = getRegistry();
  const pageId = resolveLifecyclePageId(instance);
  let subs = reg.subscribers.get(pageId);
  if (!subs) {
    subs = new Set();
    reg.subscribers.set(pageId, subs);
  }
  subs.add(subscriber);

  if (!hasActiveHost(reg, pageId)) {
    ensureFallbackPageHook(reg, pageId);
  }

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const currentSubs = reg.subscribers.get(pageId);
    if (currentSubs) {
      currentSubs.delete(subscriber);
      if (currentSubs.size === 0) {
        reg.subscribers.delete(pageId);
      }
    }
  };
}

/**
 * Fans out a page `show` or `hide` event to all components subscribed on that page.
 */
export function emitPageLifecycle(
  instanceOrPageId: string | PageLifecycleInstanceLike | null | undefined,
  event: PageLifecycleEvent,
): void {
  const reg = getRegistry();
  const pageId = resolveLifecyclePageId(instanceOrPageId);
  const subs = reg.subscribers.get(pageId);
  if (!subs || subs.size === 0) return;

  for (const sub of Array.from(subs)) {
    try {
      if (event === "show") {
        sub.onShow?.();
      } else {
        sub.onHide?.();
      }
    } catch {
      // Isolate individual subscriber errors so other components still update
    }
  }
}

export function getPageLifecycleSubscriberCount(
  instanceOrPageId?: string | PageLifecycleInstanceLike | null,
): number {
  const reg = getRegistry();
  const pageId = resolveLifecyclePageId(instanceOrPageId);
  return reg.subscribers.get(pageId)?.size ?? 0;
}

export function __resetPageLifecycleHub(): void {
  const reg = getRegistry();
  reg.subscribers.clear();
  reg.hosts.clear();
  reg.patchedPages = new WeakSet();
}
