import { signal } from "alien-signals";
import type { MachinePlugin } from "../plugin";

export type AppSignal<T> = ReturnType<typeof signal<T>>;

export type AppInsetEdge = "top" | "bottom";

export interface AppInsetEntry {
  id: string;
  edge: AppInsetEdge;
  size: number;
}

export interface AppInsets {
  top: number;
  bottom: number;
}

export interface AppScaleRequest {
  id: string;
  factor?: number | undefined;
  background?: string | undefined;
}

export interface AppScaleState {
  scaled: boolean;
  factor: number;
  background?: string | undefined;
}

export interface AppHostState {
  insets: AppInsets;
  scale: AppScaleState;
}

export interface AppHostAdapter {
  onChange?: ((state: AppHostState) => void) | undefined;
}

export interface AppMetrics {
  windowWidth: number;
  windowHeight: number;
  statusBarHeight: number;
  safeTop: number;
  safeBottom: number;
  menuTop: number;
  menuHeight: number;
  menuInset: number;
  navBarHeight: number;
  navHeight: number;
}

export interface PageAppSignals {
  insets: AppSignal<AppInsets>;
  scale: AppSignal<AppScaleState>;
}

interface HostRecord {
  instance: any;
  pageId: string;
  adapter?: AppHostAdapter | undefined;
  signals: PageAppSignals;
  insets: Map<string, AppInsetEntry>;
  scales: Map<string, AppScaleRequest>;
  visible: boolean;
  order: number;
}

type PendingOp = (host: HostRecord) => void;

const ACTIVE_KEY = "*";

interface AppRegistry {
  hosts: HostRecord[];
  hostByInstance: WeakMap<object, HostRecord>;
  pageSignals: WeakMap<object, PageAppSignals>;
  pending: Map<string, PendingOp[]>;
  orderCounter: number;
}

const globalScope = (
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : {}
) as any;

if (!globalScope.__CODE_UI_APP_REGISTRY__) {
  globalScope.__CODE_UI_APP_REGISTRY__ = {
    hosts: [],
    hostByInstance: new WeakMap(),
    pageSignals: new WeakMap(),
    pending: new Map(),
    orderCounter: 0,
  };
}

const appRegistry: AppRegistry = globalScope.__CODE_UI_APP_REGISTRY__;
const hosts = appRegistry.hosts;
const hostByInstance = appRegistry.hostByInstance;
const pageSignals = appRegistry.pageSignals;
const pending = appRegistry.pending;

export function linkAppChildToParent(parent: any, child: any): void {
  if (!parent || !child) return;
  child.__cuiAppParent = parent;
  if (!parent.__cuiAppChildren) {
    parent.__cuiAppChildren = new Set<any>();
  }
  parent.__cuiAppChildren.add(child);

  const host = hostByInstance.get(parent);
  if (host) {
    let changed = false;
    if (child.__cuiScaled && child.__cuiScaleId) {
      if (!host.scales.has(child.__cuiScaleId)) {
        host.scales.set(child.__cuiScaleId, {
          id: child.__cuiScaleId,
          factor: child.__cuiScaleFactor,
          background: child.__cuiScaleBackground,
        });
        changed = true;
      }
    }
    if (child.__cuiRegisteredSize > 0 && child.__cuiInsetId) {
      host.insets.set(child.__cuiInsetId, {
        id: child.__cuiInsetId,
        edge: child.__cuiInsetEdge ?? "top",
        size: child.__cuiRegisteredSize,
      });
      changed = true;
    }
    flushPending(host);
    if (changed) notify(host);
  }
}

export function unlinkAppChildFromParent(parent: any, child: any): void {
  if (!child) return;
  if (child.__cuiAppParent === parent) {
    child.__cuiAppParent = undefined;
  }
  if (parent && parent.__cuiAppChildren) {
    parent.__cuiAppChildren.delete(child);
  }
  const host = parent ? hostByInstance.get(parent) : resolveHost(child);
  if (host) {
    let changed = false;
    if (child.__cuiScaleId && host.scales.delete(child.__cuiScaleId)) {
      changed = true;
    }
    if (child.__cuiInsetId && host.insets.delete(child.__cuiInsetId)) {
      changed = true;
    }
    if (changed) notify(host);
  }
}

export const cuiAppParentBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};

export const cuiAppChildBehavior: any =
  typeof Behavior !== "undefined"
    ? Behavior({
        relations: {
          cuiAppParent: {
            type: "ancestor",
            target: cuiAppParentBehavior,
            linked(this: any, target: any) {
              linkAppChildToParent(target, this);
            },
            unlinked(this: any, target: any) {
              unlinkAppChildFromParent(target, this);
            },
          },
        },
      })
    : {};

export function setupAppRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  role: "parent" | "child",
  handlers?: {
    linked?: (target: any) => void;
    unlinked?: (target: any) => void;
  },
) {
  if (role === "parent") {
    relations.cuiAppChild = {
      type: "descendant",
      target: cuiAppChildBehavior,
      linked(this: any, target: any) {
        linkAppChildToParent(this, target);
        handlers?.linked?.(target);
      },
      unlinked(this: any, target: any) {
        unlinkAppChildFromParent(this, target);
        handlers?.unlinked?.(target);
      },
    };
  } else {
    relations.cuiAppParent = {
      type: "ancestor",
      target: cuiAppParentBehavior,
      linked(this: any, target: any) {
        linkAppChildToParent(target, this);
        handlers?.linked?.(target);
      },
      unlinked(this: any, target: any) {
        unlinkAppChildFromParent(target, this);
        handlers?.unlinked?.(target);
      },
    };
  }
}

export function getPageAppSignals(instance: any): PageAppSignals {
  let sigs = pageSignals.get(instance);
  if (!sigs) {
    sigs = {
      insets: signal<AppInsets>({ top: 0, bottom: 0 }),
      scale: signal<AppScaleState>({ scaled: false, factor: 1 }),
    };
    pageSignals.set(instance, sigs);
  }
  return sigs;
}

function readDirectPageId(obj: any): string | undefined {
  if (!obj) return undefined;
  for (const target of [obj, obj.__page__, obj.$page]) {
    if (!target) continue;
    if (typeof target.getPageId === "function") {
      const id = target.getPageId();
      if (id !== undefined && id !== null && id !== "") return String(id);
    }
    const wv = target.__wxWebviewId__;
    if (wv !== undefined && wv !== null && wv !== "") return String(wv);
  }
  const pid = obj.pageId;
  return pid !== undefined && pid !== null && pid !== ""
    ? String(pid)
    : undefined;
}

function getPageIdOf(instance: any): string | undefined {
  if (!instance) return undefined;
  try {
    let cur = instance;
    for (let depth = 0; cur && depth <= 10; depth++) {
      const id = readDirectPageId(cur);
      if (id !== undefined) return id;
      cur =
        typeof cur.selectOwnerComponent === "function"
          ? cur.selectOwnerComponent()
          : null;
    }
  } catch {}
  return undefined;
}

function getTopPageId(): string | undefined {
  if (typeof getCurrentPages !== "function") return undefined;
  try {
    const pages = getCurrentPages();
    const top = pages[pages.length - 1];
    return getPageIdOf(top);
  } catch {
    return undefined;
  }
}

function findHostByPageId(pageId: string): HostRecord | undefined {
  for (let i = hosts.length - 1; i >= 0; i--) {
    const host = hosts[i];
    if (host && host.pageId === pageId) return host;
  }
  return undefined;
}

function findActiveHost(): HostRecord | undefined {
  const topPageId = getTopPageId();
  if (topPageId) {
    const host = findHostByPageId(topPageId);
    if (host) return host;
  }
  let best: HostRecord | undefined;
  for (const host of hosts) {
    if (!host.visible) continue;
    if (!best || host.order > best.order) best = host;
  }
  return best ?? hosts[hosts.length - 1];
}

function resolveHost(owner?: any): HostRecord | undefined {
  if (owner) {
    const own = hostByInstance.get(owner);
    if (own) return own;

    if (owner.__cuiAppParent) {
      const parentHost = hostByInstance.get(owner.__cuiAppParent);
      if (parentHost) return parentHost;
    }

    if (typeof owner.getRelationNodes === "function") {
      try {
        let parents = owner.getRelationNodes("cuiAppParent");
        if ((!parents || parents.length === 0) && cuiAppParentBehavior) {
          parents = owner.getRelationNodes(cuiAppParentBehavior);
        }
        if (parents && parents.length > 0) {
          const parentHost = hostByInstance.get(parents[0]);
          if (parentHost) return parentHost;
        }
      } catch {}
    }

    const pageId = getPageIdOf(owner);
    if (pageId) {
      const match = findHostByPageId(pageId);
      if (match) return match;
    }
  }
  return findActiveHost();
}

function pendingKeyFor(owner?: any): string {
  return (owner && getPageIdOf(owner)) || ACTIVE_KEY;
}

function withHost(owner: any, op: PendingOp): void {
  const host = resolveHost(owner);
  if (host) {
    op(host);
    return;
  }
  const key = pendingKeyFor(owner);
  const queue = pending.get(key);
  if (queue) queue.push(op);
  else pending.set(key, [op]);
}

function flushPending(host: HostRecord): void {
  const keys = [host.pageId, ACTIVE_KEY];
  for (const key of keys) {
    const queue = pending.get(key);
    if (!queue) continue;
    pending.delete(key);
    for (const op of queue) op(host);
  }
}

function computeInsets(host: HostRecord): AppInsets {
  let top = 0;
  let bottom = 0;
  host.insets.forEach((entry) => {
    const size = Number.isFinite(entry.size) ? Math.max(0, entry.size) : 0;
    if (entry.edge === "bottom") bottom += size;
    else top += size;
  });
  return { top, bottom };
}

function computeScale(host: HostRecord): AppScaleState {
  if (host.scales.size === 0) {
    return { scaled: false, factor: 1 };
  }
  let lastReq: AppScaleRequest | undefined;
  host.scales.forEach((req) => {
    lastReq = req;
  });
  return {
    scaled: true,
    factor: lastReq?.factor ?? 0.94,
    background: lastReq?.background,
  };
}

function getState(host: HostRecord): AppHostState {
  return {
    insets: computeInsets(host),
    scale: computeScale(host),
  };
}

function notify(host: HostRecord): void {
  const state = getState(host);
  host.signals.insets(state.insets);
  host.signals.scale(state.scale);
  host.adapter?.onChange?.(state);
}

export function registerAppHost(instance: any, adapter?: AppHostAdapter): void {
  if (hostByInstance.has(instance)) return;
  const signals = getPageAppSignals(instance);
  const record: HostRecord = {
    instance,
    pageId: getPageIdOf(instance) ?? `cui-app-${appRegistry.orderCounter + 1}`,
    adapter,
    signals,
    insets: new Map(),
    scales: new Map(),
    visible: true,
    order: ++appRegistry.orderCounter,
  };
  hosts.push(record);
  hostByInstance.set(instance, record);

  if (instance.__cuiAppChildren) {
    for (const child of instance.__cuiAppChildren) {
      if (child.__cuiScaled && child.__cuiScaleId) {
        record.scales.set(child.__cuiScaleId, {
          id: child.__cuiScaleId,
          factor: child.__cuiScaleFactor,
          background: child.__cuiScaleBackground,
        });
      }
      if (child.__cuiRegisteredSize > 0 && child.__cuiInsetId) {
        record.insets.set(child.__cuiInsetId, {
          id: child.__cuiInsetId,
          edge: child.__cuiInsetEdge ?? "top",
          size: child.__cuiRegisteredSize,
        });
      }
    }
  }

  flushPending(record);
  notify(record);
}

export function unregisterAppHost(instance: any): void {
  const record = hostByInstance.get(instance);
  if (!record) return;
  hostByInstance.delete(instance);
  const index = hosts.indexOf(record);
  if (index !== -1) hosts.splice(index, 1);
  record.insets.clear();
  record.scales.clear();
  if (instance.__cuiAppChildren) {
    for (const child of instance.__cuiAppChildren) {
      if (child.__cuiAppParent === instance) {
        child.__cuiAppParent = undefined;
      }
    }
    instance.__cuiAppChildren.clear();
  }
}

export function setAppHostVisible(instance: any, visible: boolean): void {
  const record = hostByInstance.get(instance);
  if (!record) return;
  record.visible = visible;
  if (visible) record.order = ++appRegistry.orderCounter;
}

export function getAppHost(owner?: any): any {
  return resolveHost(owner)?.instance;
}

export function getAppState(owner?: any): AppHostState {
  const host = resolveHost(owner);
  return host
    ? getState(host)
    : {
        insets: { top: 0, bottom: 0 },
        scale: { scaled: false, factor: 1 },
      };
}

export function requestAppScale(owner: any, request: AppScaleRequest): void {
  withHost(owner, (host) => {
    host.scales.set(request.id, { ...request });
    notify(host);
  });
}

export function releaseAppScale(owner: any, id: string): void {
  const host = resolveHost(owner);
  if (!host) {
    const key = pendingKeyFor(owner);
    const queue = pending.get(key);
    if (queue) {
      queue.push((h) => {
        if (h.scales.delete(id)) notify(h);
      });
    }
    return;
  }
  if (host.scales.delete(id)) notify(host);
}

export function isAppScaled(owner?: any): boolean {
  const host = resolveHost(owner);
  return host ? host.scales.size > 0 : false;
}

export function notifyScaleGestureStart(owner: any): void {
  const host = resolveHost(owner);
  if (!host) return;
  if (typeof host.instance?.startScaleGesture === "function") {
    host.instance.startScaleGesture();
  }
}

export function notifyScaleGestureProgress(owner: any, progress: number): void {
  const host = resolveHost(owner);
  if (!host) return;
  if (typeof host.instance?.applyScaleProgress === "function") {
    host.instance.applyScaleProgress(progress);
  }
}

export function notifyScaleGestureEnd(owner: any, passed: boolean): void {
  const host = resolveHost(owner);
  if (!host) return;
  if (typeof host.instance?.endScaleGesture === "function") {
    host.instance.endScaleGesture(passed);
  }
}

export function registerInset(owner: any, entry: AppInsetEntry): void {
  withHost(owner, (host) => {
    const prev = host.insets.get(entry.id);
    if (prev && prev.edge === entry.edge && prev.size === entry.size) return;
    host.insets.set(entry.id, { ...entry });
    notify(host);
  });
}

export function unregisterInset(owner: any, id: string): void {
  withHost(owner, (host) => {
    if (!host.insets.delete(id)) return;
    notify(host);
  });
}

export interface WithAppScaleOptions {
  idPrefix?: string;
}

export function withAppScale(
  options: WithAppScaleOptions = {},
): MachinePlugin {
  let scaleCounter = 0;
  const syncInstanceScale = (
    instance: any,
    machine: any,
    propKey?: string,
  ) => {
    const props = instance.data;
    const state = machine.service?.state;
    const isExplicitOpen = propKey === "open" && Boolean(props?.open);
    const isClosedOrClosing =
      (!isExplicitOpen &&
        (state?.matches?.("closed") ||
          state?.matches?.("closing") ||
          state?.hasTag?.("closing"))) ||
      (propKey === "open" && !props?.open);
    const shouldScale =
      Boolean(props?.shouldScaleBackground) &&
      !isClosedOrClosing &&
      Boolean(
        isExplicitOpen ||
          state?.hasTag?.("open") ||
          state?.matches?.("open") ||
          state?.matches?.("dragging"),
      );
    const scaleId = instance.__cuiScaleId;
    if (shouldScale !== Boolean(instance.__cuiScaled)) {
      instance.__cuiScaled = shouldScale;
      instance.__cuiScaleFactor = props?.scaleFactor;
      instance.__cuiScaleBackground = props?.scaleBackground;
      if (shouldScale) {
        requestAppScale(instance, {
          id: scaleId,
          factor: props?.scaleFactor,
          background: props?.scaleBackground,
        });
      } else {
        releaseAppScale(instance, scaleId);
      }
    } else if (shouldScale && propKey) {
      instance.__cuiScaleFactor = props?.scaleFactor;
      instance.__cuiScaleBackground = props?.scaleBackground;
      requestAppScale(instance, {
        id: scaleId,
        factor: props?.scaleFactor,
        background: props?.scaleBackground,
      });
    }
  };
  return {
    name: "scale-background",
    behaviors: [cuiAppChildBehavior],
    setupRelations(relations) {
      setupAppRelations(relations, "child");
    },
    onAttached(instance) {
      instance.__cuiScaleId = `${options.idPrefix ?? "scale"}:${++scaleCounter}`;
      instance.__cuiScaled = false;
    },
    onMachineStarted(instance, machine) {
      const check = () => syncInstanceScale(instance, machine);
      instance.__cuiScaleUnsub = machine.subscribe(check);
      check();
    },
    onPropChanged(instance, propKey) {
      if (
        (propKey === "shouldScaleBackground" ||
          propKey === "scaleFactor" ||
          propKey === "scaleBackground" ||
          propKey === "open") &&
        instance.__codeUiMachine
      ) {
        syncInstanceScale(instance, instance.__codeUiMachine, propKey);
      }
    },
    onDetached(instance) {
      instance.__cuiScaleUnsub?.();
      if (instance.__cuiScaled) {
        releaseAppScale(instance, instance.__cuiScaleId);
        instance.__cuiScaled = false;
      }
    },
  };
}

export interface WithAppInsetOptions {
  edge?: AppInsetEdge;
  idPrefix?: string;
  isStack?: (props: any) => boolean;
}

export function withAppInset(options: WithAppInsetOptions = {}): any {
  if (typeof Behavior === "undefined") return {};
  let insetCounter = 0;
  const edge = options.edge ?? "top";
  const relations: Record<string, any> = {};
  setupAppRelations(relations, "child");
  return Behavior({
    behaviors: [cuiAppChildBehavior],
    relations,
    lifetimes: {
      attached(this: any) {
        this.__cuiInsetId = `${options.idPrefix ?? "inset"}:${++insetCounter}`;
        this.__cuiInsetEdge = edge;
        this.__cuiRegisteredSize = 0;
      },
      detached(this: any) {
        if (this.__cuiRegisteredSize > 0) {
          unregisterInset(this, this.__cuiInsetId);
          this.__cuiRegisteredSize = 0;
        }
      },
    },
    methods: {
      setAppInset(this: any, size: number) {
        const props = this.data;
        const isStack = options.isStack
          ? options.isStack(props)
          : props?.mode !== "overlay";
        if (!isStack || size <= 0) {
          if (this.__cuiRegisteredSize > 0) {
            unregisterInset(this, this.__cuiInsetId);
            this.__cuiRegisteredSize = 0;
          }
          return;
        }
        this.__cuiRegisteredSize = size;
        registerInset(this, {
          id: this.__cuiInsetId,
          edge,
          size,
        });
      },
    },
  });
}

export interface WithAppBannerInsetOptions {
  idPrefix?: string;
}

export function withAppBannerInset(
  options: WithAppBannerInsetOptions = {},
): MachinePlugin {
  let bannerCounter = 0;
  const syncBanner = (instance: any, machine: any) => {
    const props = instance.data;
    const state = machine.service?.state;
    const isClosedOrClosing =
      state?.matches?.("closed") ||
      state?.matches?.("closing") ||
      state?.matches?.("dismissing") ||
      state?.hasTag?.("closed") ||
      state?.hasTag?.("dismissing") ||
      props?.open === false;

    const isOpen =
      !isClosedOrClosing &&
      (Boolean(props?.open) ||
        state?.hasTag?.("open") ||
        state?.matches?.("open"));

    const autoInset = props?.autoInset !== false;
    const mode =
      props?.mode || (props?.placement === "inline" ? "inline" : "fixed");
    const edge: AppInsetEdge =
      props?.placement === "bottom" ? "bottom" : "top";
    const height: number = Number(
      machine.service?.context?.get("height") || 0,
    );

    const bannerId = instance.__cuiBannerInsetId;

    if (!isOpen || !autoInset || mode === "inline" || height <= 0) {
      if (instance.__cuiRegisteredBannerSize > 0) {
        unregisterInset(instance, bannerId);
        instance.__cuiRegisteredBannerSize = 0;
        instance.__cuiRegisteredBannerEdge = undefined;
      }
      return;
    }

    if (
      instance.__cuiRegisteredBannerEdge !== edge &&
      instance.__cuiRegisteredBannerSize > 0
    ) {
      unregisterInset(instance, bannerId);
    }

    instance.__cuiRegisteredBannerEdge = edge;
    instance.__cuiRegisteredBannerSize = height;
    registerInset(instance, {
      id: bannerId,
      edge,
      size: height,
    });
  };

  return {
    name: "banner-layout-inset",
    behaviors: [cuiAppChildBehavior],
    setupRelations(relations) {
      setupAppRelations(relations, "child");
    },
    onAttached(instance) {
      instance.__cuiBannerInsetId = `${options.idPrefix ?? "banner"}:${++bannerCounter}`;
      instance.__cuiRegisteredBannerSize = 0;
      instance.__cuiRegisteredBannerEdge = undefined;
    },
    onMachineStarted(instance, machine) {
      const check = () => syncBanner(instance, machine);
      instance.__cuiBannerUnsub = machine.subscribe(check);
      check();
    },
    onReady(instance) {
      if (instance.__codeUiMachine) {
        instance.__codeUiMachine.service?.send?.({ type: "MEASURE" });
      }
    },
    onPropChanged(instance, propKey) {
      if (
        (propKey === "open" ||
          propKey === "placement" ||
          propKey === "mode" ||
          propKey === "autoInset") &&
        instance.__codeUiMachine
      ) {
        syncBanner(instance, instance.__codeUiMachine);
      }
    },
    onDetached(instance) {
      instance.__cuiBannerUnsub?.();
      if (instance.__cuiRegisteredBannerSize > 0) {
        unregisterInset(instance, instance.__cuiBannerInsetId);
        instance.__cuiRegisteredBannerSize = 0;
        instance.__cuiRegisteredBannerEdge = undefined;
      }
    },
  };
}

const DEFAULT_MENU_HEIGHT = 32;
const DEFAULT_MENU_GAP = 4;

let cachedMetrics: AppMetrics | null = null;
export const appMetricsSignal = /* @__PURE__ */ (() =>
  signal<AppMetrics>(calculateMetrics()))();

function calculateMetrics(): AppMetrics {
  const empty: AppMetrics = {
    windowWidth: 0,
    windowHeight: 0,
    statusBarHeight: 0,
    safeTop: 0,
    safeBottom: 0,
    menuTop: 0,
    menuHeight: 0,
    menuInset: 0,
    navBarHeight: 0,
    navHeight: 0,
  };
  if (typeof wx === "undefined") return empty;

  let info: any;
  try {
    info =
      typeof wx.getWindowInfo === "function"
        ? wx.getWindowInfo()
        : wx.getSystemInfoSync();
  } catch {
    return empty;
  }
  if (!info) return empty;

  const windowWidth: number = info.windowWidth ?? 0;
  const windowHeight: number = info.windowHeight ?? 0;
  const screenHeight: number = info.screenHeight ?? windowHeight;
  const statusBarHeight: number = info.statusBarHeight ?? 0;
  const safeArea = info.safeArea;
  const safeTop: number = safeArea?.top ?? statusBarHeight;
  const safeBottom = safeArea
    ? Math.max(0, screenHeight - (safeArea.bottom ?? screenHeight))
    : 0;

  let menu: { top: number; height: number; left: number } | undefined;
  try {
    const rect =
      typeof wx.getMenuButtonBoundingClientRect === "function"
        ? wx.getMenuButtonBoundingClientRect()
        : undefined;
    if (rect && rect.height > 0) menu = rect;
  } catch {}

  const menuHeight = menu?.height ?? DEFAULT_MENU_HEIGHT;
  const menuTop = menu?.top ?? statusBarHeight + DEFAULT_MENU_GAP;
  const menuInset = menu ? Math.max(0, windowWidth - menu.left) : 0;
  const gap = Math.max(0, menuTop - statusBarHeight);
  const navBarHeight = gap * 2 + menuHeight;

  return {
    windowWidth,
    windowHeight,
    statusBarHeight,
    safeTop,
    safeBottom,
    menuTop,
    menuHeight,
    menuInset,
    navBarHeight,
    navHeight: statusBarHeight + navBarHeight,
  };
}

export function getAppMetrics(forceRefresh = false): AppMetrics {
  if (cachedMetrics && !forceRefresh) return cachedMetrics;
  cachedMetrics = calculateMetrics();
  appMetricsSignal(cachedMetrics);
  return cachedMetrics;
}

export function refreshAppMetrics(): AppMetrics {
  return getAppMetrics(true);
}

export function __resetAppRegistry(): void {
  hosts.length = 0;
  pending.clear();
  appRegistry.orderCounter = 0;
  cachedMetrics = null;
  refreshAppMetrics();
}
