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
  locked: boolean;
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
  locked: AppSignal<boolean>;
  scale: AppSignal<AppScaleState>;
}

interface HostRecord {
  instance: any;
  pageId: string;
  adapter?: AppHostAdapter | undefined;
  signals: PageAppSignals;
  insets: Map<string, AppInsetEntry>;
  locks: Set<string>;
  scales: Map<string, AppScaleRequest>;
  visible: boolean;
  order: number;
}

type PendingOp = (host: HostRecord) => void;

const ACTIVE_KEY = "*";
const hosts: HostRecord[] = [];
const hostByInstance = new WeakMap<object, HostRecord>();
const pageSignals = new WeakMap<object, PageAppSignals>();
const pending = new Map<string, PendingOp[]>();
let orderCounter = 0;

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
    if (child.__cuiScrollLocked && child.__cuiScrollLockId) {
      if (!host.locks.has(child.__cuiScrollLockId)) {
        host.locks.add(child.__cuiScrollLockId);
        changed = true;
      }
    }
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
    if (child.__cuiScrollLockId && host.locks.delete(child.__cuiScrollLockId)) {
      if (host.locks.size === 0) changed = true;
    }
    if (child.__cuiScaleId && host.scales.delete(child.__cuiScaleId)) {
      if (host.scales.size === 0) changed = true;
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
      locked: signal<boolean>(false),
      scale: signal<AppScaleState>({ scaled: false, factor: 1 }),
    };
    pageSignals.set(instance, sigs);
  }
  return sigs;
}

function isMatchPageId(id1?: string, id2?: string): boolean {
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;
  return id1.endsWith(`:${id2}`) || id2.endsWith(`:${id1}`);
}

function getPageIdOf(instance: any): string | undefined {
  if (!instance) return undefined;
  try {
    if (typeof instance.getPageId === "function") {
      const id = instance.getPageId();
      if (id !== undefined && id !== null && id !== "") return String(id);
    }
    if (
      instance.__wxWebviewId__ !== undefined &&
      instance.__wxWebviewId__ !== null &&
      instance.__wxWebviewId__ !== ""
    ) {
      return String(instance.__wxWebviewId__);
    }
    if (
      instance.__page__ &&
      typeof instance.__page__.getPageId === "function"
    ) {
      const id = instance.__page__.getPageId();
      if (id !== undefined && id !== null && id !== "") return String(id);
    }
    if (
      instance.__page__ &&
      instance.__page__.__wxWebviewId__ !== undefined &&
      instance.__page__.__wxWebviewId__ !== null &&
      instance.__page__.__wxWebviewId__ !== ""
    ) {
      return String(instance.__page__.__wxWebviewId__);
    }
    if (
      instance.pageId !== undefined &&
      instance.pageId !== null &&
      instance.pageId !== ""
    ) {
      return String(instance.pageId);
    }
    if (instance.$page && typeof instance.$page.getPageId === "function") {
      const id = instance.$page.getPageId();
      if (id !== undefined && id !== null && id !== "") return String(id);
    }
    if (
      instance.$page &&
      instance.$page.__wxWebviewId__ !== undefined &&
      instance.$page.__wxWebviewId__ !== null &&
      instance.$page.__wxWebviewId__ !== ""
    ) {
      return String(instance.$page.__wxWebviewId__);
    }
    if (typeof instance.selectOwnerComponent === "function") {
      let cur = instance.selectOwnerComponent();
      let depth = 0;
      while (cur && depth < 10) {
        if (typeof cur.getPageId === "function") {
          const id = cur.getPageId();
          if (id !== undefined && id !== null && id !== "") return String(id);
        }
        if (
          cur.__wxWebviewId__ !== undefined &&
          cur.__wxWebviewId__ !== null &&
          cur.__wxWebviewId__ !== ""
        ) {
          return String(cur.__wxWebviewId__);
        }
        if (cur.__page__ && typeof cur.__page__.getPageId === "function") {
          const id = cur.__page__.getPageId();
          if (id !== undefined && id !== null && id !== "") return String(id);
        }
        if (
          cur.__page__ &&
          cur.__page__.__wxWebviewId__ !== undefined &&
          cur.__page__.__wxWebviewId__ !== null &&
          cur.__page__.__wxWebviewId__ !== ""
        ) {
          return String(cur.__page__.__wxWebviewId__);
        }
        if (
          cur.pageId !== undefined &&
          cur.pageId !== null &&
          cur.pageId !== ""
        ) {
          return String(cur.pageId);
        }
        cur =
          typeof cur.selectOwnerComponent === "function"
            ? cur.selectOwnerComponent()
            : null;
        depth++;
      }
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
    locked: host.locks.size > 0,
    scale: computeScale(host),
  };
}

function notify(host: HostRecord): void {
  const state = getState(host);
  host.signals.insets(state.insets);
  host.signals.locked(state.locked);
  host.signals.scale(state.scale);
  host.adapter?.onChange?.(state);
}

export function registerAppHost(instance: any, adapter?: AppHostAdapter): void {
  if (hostByInstance.has(instance)) return;
  const signals = getPageAppSignals(instance);
  const record: HostRecord = {
    instance,
    pageId: getPageIdOf(instance) ?? `cui-app-${orderCounter + 1}`,
    adapter,
    signals,
    insets: new Map(),
    locks: new Set(),
    scales: new Map(),
    visible: true,
    order: ++orderCounter,
  };
  hosts.push(record);
  hostByInstance.set(instance, record);

  if (instance.__cuiAppChildren) {
    for (const child of instance.__cuiAppChildren) {
      if (child.__cuiScrollLocked && child.__cuiScrollLockId) {
        record.locks.add(child.__cuiScrollLockId);
      }
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
  record.locks.clear();
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
  if (visible) record.order = ++orderCounter;
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
        locked: false,
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

export function lockScroll(owner: any, id: string): void {
  withHost(owner, (host) => {
    const wasLocked = host.locks.size > 0;
    host.locks.add(id);
    if (!wasLocked) notify(host);
  });
}

export function unlockScroll(owner: any, id: string): void {
  const host = resolveHost(owner);
  if (!host) {
    const key = pendingKeyFor(owner);
    const queue = pending.get(key);
    if (queue) {
      queue.push((h) => {
        if (h.locks.delete(id) && h.locks.size === 0) notify(h);
      });
    }
    return;
  }
  if (host.locks.delete(id) && host.locks.size === 0) notify(host);
}

export function isScrollLocked(owner?: any): boolean {
  const host = resolveHost(owner);
  return host ? host.locks.size > 0 : false;
}

export function hasActiveHost(owner?: any): boolean {
  return Boolean(resolveHost(owner));
}

export function setPageScrollLocked(instance: any, locked: boolean): void {
  try {
    let targetPage: any = null;
    if (typeof instance?.selectOwnerComponent === "function") {
      let cur = instance.selectOwnerComponent();
      let depth = 0;
      while (cur && depth < 5) {
        if (typeof cur.setData === "function" && (cur.route || cur.__route__)) {
          targetPage = cur;
          break;
        }
        cur =
          typeof cur.selectOwnerComponent === "function"
            ? cur.selectOwnerComponent()
            : null;
        depth++;
      }
    }
    if (!targetPage && typeof getCurrentPages === "function") {
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const instanceId = getPageIdOf(instance);
        if (instanceId !== undefined) {
          for (let i = pages.length - 1; i >= 0; i--) {
            const p = pages[i];
            const pId = getPageIdOf(p);
            if (isMatchPageId(instanceId, pId)) {
              targetPage = p;
              break;
            }
          }
        }
        if (!targetPage) {
          targetPage = pages[pages.length - 1];
        }
      }
    }
    if (
      targetPage &&
      typeof targetPage.setData === "function" &&
      typeof targetPage.data?.cuiPageStyle === "string"
    ) {
      const pageStyle = locked ? "overflow: hidden;" : "";
      const apply = () => {
        if (targetPage.data.cuiPageStyle !== pageStyle) {
          targetPage.setData({
            cuiPageStyle: pageStyle,
          });
        }
      };
      apply();
      if (typeof wx !== "undefined" && typeof wx.nextTick === "function") {
        wx.nextTick(apply);
      }
    }
  } catch {}
}

export interface WithScrollLockOptions {
  idPrefix?: string;
  isOpen?: (service: any, props: any) => boolean;
}

export function withScrollLock(
  options: WithScrollLockOptions = {},
): MachinePlugin {
  let lockCounter = 0;
  return {
    name: "scroll-lock",
    behaviors: [cuiAppChildBehavior],
    setupRelations(relations) {
      setupAppRelations(relations, "child");
    },
    onAttached(instance) {
      instance.__cuiScrollLockId = `${options.idPrefix ?? "lock"}:${++lockCounter}`;
      instance.__cuiScrollLocked = false;
    },
    onMachineStarted(instance, machine) {
      const check = () => {
        const service = machine.service;
        const props = instance.data;
        const shouldLock = options.isOpen
          ? options.isOpen(service, props)
          : Boolean(props?.lockScroll ?? true) &&
            Boolean(
              service?.state?.hasTag?.("open") ||
              service?.state?.matches?.("open") ||
              (typeof service?.state?.get === "function" &&
                service.state.get() !== "closed"),
            );

        if (shouldLock !== Boolean(instance.__cuiScrollLocked)) {
          instance.__cuiScrollLocked = shouldLock;
          const lockId = instance.__cuiScrollLockId;
          if (shouldLock) {
            lockScroll(instance, lockId);
          } else {
            unlockScroll(instance, lockId);
          }
          if (!hasActiveHost(instance)) {
            setPageScrollLocked(instance, shouldLock);
          }
        }
      };

      const unsub = machine.subscribe(check);
      instance.__cuiScrollLockUnsub = unsub;
      check();
    },
    onPropChanged(instance, propKey) {
      if (propKey === "lockScroll" || propKey === "open") {
        const machine = instance.__codeUiMachine;
        if (machine) {
          const service = machine.service;
          const props = instance.data;
          const isExplicitOpen =
            propKey === "open" && Boolean(instance.data?.open);
          const shouldLock = options.isOpen
            ? options.isOpen(service, props)
            : Boolean(props?.lockScroll ?? true) &&
              Boolean(
                isExplicitOpen ||
                service?.state?.hasTag?.("open") ||
                service?.state?.matches?.("open") ||
                (typeof service?.state?.get === "function" &&
                  service.state.get() !== "closed"),
              );

          if (shouldLock !== Boolean(instance.__cuiScrollLocked)) {
            instance.__cuiScrollLocked = shouldLock;
            const lockId = instance.__cuiScrollLockId;
            if (shouldLock) lockScroll(instance, lockId);
            else unlockScroll(instance, lockId);
            if (!hasActiveHost(instance)) {
              setPageScrollLocked(instance, shouldLock);
            }
          }
        }
      }
    },
    onDetached(instance) {
      instance.__cuiScrollLockUnsub?.();
      if (instance.__cuiScrollLocked) {
        unlockScroll(instance, instance.__cuiScrollLockId);
        instance.__cuiScrollLocked = false;
        if (!hasActiveHost(instance)) {
          setPageScrollLocked(instance, false);
        }
      }
    },
  };
}

export interface WithAppScaleOptions {
  idPrefix?: string;
}

export function withAppScale(
  options: WithAppScaleOptions = {},
): MachinePlugin {
  let scaleCounter = 0;
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
      const check = () => {
        const props = instance.data;
        const isClosedOrClosing =
          machine.service?.state?.matches?.("closed") ||
          machine.service?.state?.matches?.("closing") ||
          machine.service?.state?.hasTag?.("closing");
        const shouldScale =
          Boolean(props?.shouldScaleBackground) &&
          !isClosedOrClosing &&
          Boolean(
            machine.service?.state?.hasTag?.("open") ||
              machine.service?.state?.matches?.("open") ||
              machine.service?.state?.matches?.("dragging"),
          );

        if (shouldScale !== Boolean(instance.__cuiScaled)) {
          instance.__cuiScaled = shouldScale;
          const scaleId = instance.__cuiScaleId;
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
        }
      };

      const unsub = machine.subscribe(check);
      instance.__cuiScaleUnsub = unsub;
      check();
    },
    onPropChanged(instance, propKey) {
      if (
        propKey === "shouldScaleBackground" ||
        propKey === "scaleFactor" ||
        propKey === "scaleBackground" ||
        propKey === "open"
      ) {
        const machine = instance.__codeUiMachine;
        if (machine) {
          const props = instance.data;
          const isExplicitOpen =
            propKey === "open" && Boolean(instance.data?.open);
          const isClosedOrClosing =
            (!isExplicitOpen &&
              (machine.service?.state?.matches?.("closed") ||
                machine.service?.state?.matches?.("closing") ||
                machine.service?.state?.hasTag?.("closing"))) ||
            (propKey === "open" && !instance.data?.open);

          const shouldScale =
            Boolean(props?.shouldScaleBackground) &&
            !isClosedOrClosing &&
            Boolean(
              isExplicitOpen ||
                machine.service?.state?.hasTag?.("open") ||
                machine.service?.state?.matches?.("open") ||
                machine.service?.state?.matches?.("dragging"),
            );

          if (shouldScale !== Boolean(instance.__cuiScaled)) {
            instance.__cuiScaled = shouldScale;
            instance.__cuiScaleFactor = props?.scaleFactor;
            instance.__cuiScaleBackground = props?.scaleBackground;
            const scaleId = instance.__cuiScaleId;
            if (shouldScale) {
              requestAppScale(instance, {
                id: scaleId,
                factor: props?.scaleFactor,
                background: props?.scaleBackground,
              });
            } else {
              releaseAppScale(instance, scaleId);
            }
          } else if (shouldScale) {
            instance.__cuiScaleFactor = props?.scaleFactor;
            instance.__cuiScaleBackground = props?.scaleBackground;
            requestAppScale(instance, {
              id: instance.__cuiScaleId,
              factor: props?.scaleFactor,
              background: props?.scaleBackground,
            });
          }
        }
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

const DEFAULT_MENU_HEIGHT = 32;
const DEFAULT_MENU_GAP = 4;

let cachedMetrics: AppMetrics | null = null;
export const appMetricsSignal = signal<AppMetrics>(calculateMetrics());

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
  orderCounter = 0;
  cachedMetrics = null;
  refreshAppMetrics();
}
