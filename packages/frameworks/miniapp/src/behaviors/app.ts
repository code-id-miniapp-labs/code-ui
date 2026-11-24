import { signal } from "alien-signals";
import { isMiniApp, queryRect } from "@code-id-labs/utils";
import { nextTick } from "../machine";
import type { MachinePlugin } from "../plugin";
import type { TypedRelationOption } from "./inherit";
import { emitPageLifecycle, registerPageLifecycleHost } from "./page-lifecycle";
import type {
  AppOwnerData,
  AppOwnerInstance,
  MiniappBehaviorRef,
  RectLike,
} from "./types";

function createBehaviorRef(
  definition: Record<string, unknown>,
): MiniappBehaviorRef {
  return typeof Behavior !== "undefined"
    ? (
        Behavior as unknown as (
          options: Record<string, unknown>,
        ) => MiniappBehaviorRef
      )(definition)
    : ({} as unknown as MiniappBehaviorRef);
}

function createRelationOption<
  TThis extends AppOwnerInstance,
  TTarget extends AppOwnerInstance,
>(
  option: TypedRelationOption<TThis, TTarget>,
): WechatMiniprogram.Component.RelationOption {
  return option as unknown as WechatMiniprogram.Component.RelationOption;
}

function resolvePageId(instance?: AppOwnerInstance | null): string | undefined {
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
    if (typeof instance.__page__?.getPageId === "function") {
      const pid = instance.__page__.getPageId();
      if (pid !== undefined && pid !== null && pid !== "") return String(pid);
    }
    if (typeof instance.$page?.getPageId === "function") {
      const pid = instance.$page.getPageId();
      if (pid !== undefined && pid !== null && pid !== "") return String(pid);
    }
  } catch {
    // Ignore errors when reading platform page IDs
  }
  return undefined;
}

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
  instance: AppOwnerInstance;
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

interface AppGlobalScope {
  __CODE_UI_APP_REGISTRY__?: AppRegistry | undefined;
}

const globalScope = (
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : {}
) as AppGlobalScope;

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

export function linkAppChildToParent(
  parent: AppOwnerInstance | null | undefined,
  child: AppOwnerInstance | null | undefined,
): void {
  if (!parent || !child) return;
  child.__cuiAppParent = parent;
  if (!parent.__cuiAppChildren) {
    parent.__cuiAppChildren = new Set<AppOwnerInstance>();
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
    const registeredSize = child.__cuiRegisteredSize ?? 0;
    const registeredBannerSize = child.__cuiRegisteredBannerSize ?? 0;
    const insetSize =
      registeredSize > 0
        ? registeredSize
        : registeredBannerSize > 0
          ? registeredBannerSize
          : 0;
    const insetId = child.__cuiInsetId ?? child.__cuiBannerInsetId;
    const insetEdge =
      child.__cuiInsetEdge ?? child.__cuiRegisteredBannerEdge ?? "top";

    if (insetSize > 0 && insetId) {
      host.insets.set(insetId, {
        id: insetId,
        edge: insetEdge,
        size: insetSize,
      });
      changed = true;
    }
    flushPending(host);
    if (changed) notify(host);
  }
}

export function unlinkAppChildFromParent(
  parent: AppOwnerInstance | null | undefined,
  child: AppOwnerInstance | null | undefined,
): void {
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
    const insetId = child.__cuiInsetId ?? child.__cuiBannerInsetId;
    if (insetId && host.insets.delete(insetId)) {
      changed = true;
    }
    if (changed) notify(host);
  }
}

export const cuiAppParentBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});

export const cuiAppChildBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    relations: {
      cuiAppParent: {
        type: "ancestor",
        target: cuiAppParentBehavior,
        linked(this: AppOwnerInstance, target: AppOwnerInstance) {
          linkAppChildToParent(target, this);
        },
        unlinked(this: AppOwnerInstance, target: AppOwnerInstance) {
          unlinkAppChildFromParent(target, this);
        },
      },
    },
  });

export function setupAppRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  role: "parent" | "child",
  handlers?: {
    linked?: (target: AppOwnerInstance) => void;
    unlinked?: (target: AppOwnerInstance) => void;
  },
): void {
  if (role === "parent") {
    relations.cuiAppChild = createRelationOption<
      AppOwnerInstance,
      AppOwnerInstance
    >({
      type: "descendant",
      target: cuiAppChildBehavior,
      linked(this: AppOwnerInstance, target: AppOwnerInstance) {
        linkAppChildToParent(this, target);
        handlers?.linked?.(target);
      },
      unlinked(this: AppOwnerInstance, target: AppOwnerInstance) {
        unlinkAppChildFromParent(this, target);
        handlers?.unlinked?.(target);
      },
    });
  } else {
    relations.cuiAppParent = createRelationOption<
      AppOwnerInstance,
      AppOwnerInstance
    >({
      type: "ancestor",
      target: cuiAppParentBehavior,
      linked(this: AppOwnerInstance, target: AppOwnerInstance) {
        linkAppChildToParent(target, this);
        handlers?.linked?.(target);
      },
      unlinked(this: AppOwnerInstance, target: AppOwnerInstance) {
        unlinkAppChildFromParent(target, this);
        handlers?.unlinked?.(target);
      },
    });
  }
}

export function getPageAppSignals(instance: object): PageAppSignals {
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

function readDirectPageId(
  obj: AppOwnerInstance | null | undefined,
): string | undefined {
  if (!obj) return undefined;
  const resolved = resolvePageId(obj);
  if (resolved !== undefined) return resolved;
  const pid = obj.pageId;
  return pid !== undefined && pid !== null && pid !== ""
    ? String(pid)
    : undefined;
}

function getPageIdOf(
  instance: AppOwnerInstance | null | undefined,
): string | undefined {
  if (!instance) return undefined;
  try {
    let cur: AppOwnerInstance | null | undefined = instance;
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
    const pages = getCurrentPages() as unknown as AppOwnerInstance[];
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

function resolveHost(owner?: AppOwnerInstance | null): HostRecord | undefined {
  if (owner) {
    const own = hostByInstance.get(owner);
    if (own) return own;

    if (owner.__cuiAppParent) {
      const parentHost = hostByInstance.get(owner.__cuiAppParent);
      if (parentHost) return parentHost;
    }

    if (typeof owner.getRelationNodes === "function") {
      try {
        let parents = owner.getRelationNodes<AppOwnerInstance>("cuiAppParent");
        if ((!parents || parents.length === 0) && cuiAppParentBehavior) {
          parents =
            owner.getRelationNodes<AppOwnerInstance>(cuiAppParentBehavior);
        }
        if (parents && parents.length > 0 && parents[0]) {
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

function pendingKeyFor(owner?: AppOwnerInstance | null): string {
  return (owner && getPageIdOf(owner)) || ACTIVE_KEY;
}

function withHost(
  owner: AppOwnerInstance | null | undefined,
  op: PendingOp,
): void {
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

export function registerAppHost(
  instance: AppOwnerInstance,
  adapter?: AppHostAdapter,
): void {
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
      const registeredSize = child.__cuiRegisteredSize ?? 0;
      const registeredBannerSize = child.__cuiRegisteredBannerSize ?? 0;
      const insetSize =
        registeredSize > 0
          ? registeredSize
          : registeredBannerSize > 0
            ? registeredBannerSize
            : 0;
      const insetId = child.__cuiInsetId ?? child.__cuiBannerInsetId;
      const insetEdge =
        child.__cuiInsetEdge ?? child.__cuiRegisteredBannerEdge ?? "top";

      if (insetSize > 0 && insetId) {
        record.insets.set(insetId, {
          id: insetId,
          edge: insetEdge,
          size: insetSize,
        });
      }
    }
  }

  flushPending(record);
  notify(record);
}

export function unregisterAppHost(instance: AppOwnerInstance): void {
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

export function setAppHostVisible(
  instance: AppOwnerInstance,
  visible: boolean,
): void {
  const record = hostByInstance.get(instance);
  if (!record) return;
  record.visible = visible;
  if (visible) record.order = ++appRegistry.orderCounter;
}

export function getAppHost(
  owner?: AppOwnerInstance | null,
): AppOwnerInstance | undefined {
  return resolveHost(owner)?.instance;
}

export function getAppState(owner?: AppOwnerInstance | null): AppHostState {
  const host = resolveHost(owner);
  return host
    ? getState(host)
    : {
        insets: { top: 0, bottom: 0 },
        scale: { scaled: false, factor: 1 },
      };
}

export function requestAppScale(
  owner: AppOwnerInstance | null | undefined,
  request: AppScaleRequest,
): void {
  withHost(owner, (host) => {
    host.scales.set(request.id, { ...request });
    notify(host);
  });
}

export function releaseAppScale(
  owner: AppOwnerInstance | null | undefined,
  id: string,
): void {
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

export function isAppScaled(owner?: AppOwnerInstance | null): boolean {
  const host = resolveHost(owner);
  return host ? host.scales.size > 0 : false;
}

export function notifyScaleGestureStart(owner?: AppOwnerInstance | null): void {
  const host = resolveHost(owner);
  if (!host) return;
  host.instance?.startScaleGesture?.();
}

export function notifyScaleGestureProgress(
  owner: AppOwnerInstance | null | undefined,
  progress: number,
): void {
  const host = resolveHost(owner);
  if (!host) return;
  host.instance?.applyScaleProgress?.(progress);
}

export function notifyScaleGestureEnd(
  owner: AppOwnerInstance | null | undefined,
  passed: boolean,
): void {
  const host = resolveHost(owner);
  if (!host) return;
  host.instance?.endScaleGesture?.(passed);
}

export type ScaleGestureOwner =
  | AppOwnerInstance
  | (WechatMiniprogram.Component.InstanceProperties & {
      data?: Record<string, any> | undefined;
    });

export function notifyScaleGestureDragStart(owner: ScaleGestureOwner): void {
  const target = owner as AppOwnerInstance;
  target.__cuiScaleDragging = true;
  if (target.data?.shouldScaleBackground) {
    notifyScaleGestureStart(target);
  }
}

export function notifyScaleGestureDragMove(
  owner: ScaleGestureOwner,
  offset: number,
): void {
  const target = owner as AppOwnerInstance;
  if (!target.data?.shouldScaleBackground || !target.__cuiScaleDragging) return;
  target.__cuiScaleDragOffset = offset;

  if (!target.__cuiScaleDragRafPending) {
    target.__cuiScaleDragRafPending = true;
    const schedule =
      typeof wx !== "undefined" && typeof wx.nextTick === "function"
        ? wx.nextTick
        : (fn: () => void) => fn();

    schedule(() => {
      target.__cuiScaleDragRafPending = false;
      if (target.__cuiScaleDragging) {
        const threshold = target.data?.threshold || 80;
        const maxDistance = Math.max(threshold * 1.5, 120);
        const progress = Math.min(
          1,
          Math.max(0, (target.__cuiScaleDragOffset ?? 0) / maxDistance),
        );
        notifyScaleGestureProgress(target, progress);
      }
    });
  }
}

export function notifyScaleGestureDragEnd(
  owner: ScaleGestureOwner,
  passed: boolean,
): void {
  const target = owner as AppOwnerInstance;
  target.__cuiScaleDragging = false;
  target.__cuiScaleDragRafPending = false;
  if (target.data?.shouldScaleBackground) {
    notifyScaleGestureEnd(target, passed);
  }
}

export function registerInset(
  owner: AppOwnerInstance | null | undefined,
  entry: AppInsetEntry,
): void {
  withHost(owner, (host) => {
    const prev = host.insets.get(entry.id);
    if (prev && prev.edge === entry.edge && prev.size === entry.size) return;
    host.insets.set(entry.id, { ...entry });
    notify(host);
  });
}

export function unregisterInset(
  owner: AppOwnerInstance | null | undefined,
  id: string,
): void {
  withHost(owner, (host) => {
    if (!host.insets.delete(id)) return;
    notify(host);
  });
}

export interface WithAppScaleOptions {
  idPrefix?: string;
}

interface MachineStateLike {
  matches?: (value: string) => boolean;
  hasTag?: (tag: string) => boolean;
}

interface MachineWithSubscribeLike {
  service?: { state?: MachineStateLike | undefined } | undefined;
  subscribe?: (fn: () => void) => () => void;
}

export function withAppScale(options: WithAppScaleOptions = {}): MachinePlugin {
  let scaleCounter = 0;
  const syncInstanceScale = (
    instance: AppOwnerInstance,
    machine: MachineWithSubscribeLike,
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
    const scaleId = instance.__cuiScaleId ?? "";
    if (!scaleId) return;
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
  const observerBehavior = createBehaviorRef({
    observers: {
      "shouldScaleBackground, scaleFactor, scaleBackground"(
        this: AppOwnerInstance,
      ) {
        if (this.__codeUiMachine) {
          syncInstanceScale(
            this,
            this.__codeUiMachine as MachineWithSubscribeLike,
            "scale",
          );
        }
      },
    },
  });
  return {
    name: "scale-background",
    behaviors: [cuiAppChildBehavior, observerBehavior],
    setupRelations(relations) {
      setupAppRelations(relations, "child");
    },
    onAttached(instance) {
      const owner = instance as AppOwnerInstance;
      owner.__cuiScaleId = `${options.idPrefix ?? "scale"}:${++scaleCounter}`;
      owner.__cuiScaled = false;
    },
    onMachineStarted(instance, machine) {
      const owner = instance as AppOwnerInstance;
      const check = () =>
        syncInstanceScale(
          owner,
          machine as unknown as MachineWithSubscribeLike,
        );
      owner.__cuiScaleUnsub = machine.subscribe(check);
      check();
    },
    onPropChanged(instance, propKey) {
      const owner = instance as AppOwnerInstance;
      if (
        (propKey === "shouldScaleBackground" ||
          propKey === "scaleFactor" ||
          propKey === "scaleBackground" ||
          propKey === "open") &&
        owner.__codeUiMachine
      ) {
        syncInstanceScale(
          owner,
          owner.__codeUiMachine as MachineWithSubscribeLike,
          propKey,
        );
      }
    },
    onDetached(instance) {
      const owner = instance as AppOwnerInstance;
      if (owner.__cuiScaleDragging) {
        owner.__cuiScaleDragging = false;
        owner.__cuiScaleDragRafPending = false;
        if (owner.data?.shouldScaleBackground) {
          notifyScaleGestureEnd(owner, false);
        }
      }
      owner.__cuiScaleUnsub?.();
      if (owner.__cuiScaled && owner.__cuiScaleId) {
        releaseAppScale(owner, owner.__cuiScaleId);
        owner.__cuiScaled = false;
      }
    },
  };
}

export interface WithAppInsetOptions {
  edge?: AppInsetEdge;
  idPrefix?: string;
  isStack?: (props: AppOwnerData | undefined) => boolean;
}

export function withAppInset(
  options: WithAppInsetOptions = {},
): MiniappBehaviorRef {
  let insetCounter = 0;
  const edge = options.edge ?? "top";
  const relations: Record<string, WechatMiniprogram.Component.RelationOption> =
    {};
  setupAppRelations(relations, "child");
  return createBehaviorRef({
    behaviors: [cuiAppChildBehavior],
    relations,
    lifetimes: {
      attached(this: AppOwnerInstance) {
        this.__cuiInsetId = `${options.idPrefix ?? "inset"}:${++insetCounter}`;
        this.__cuiInsetEdge = edge;
        this.__cuiRegisteredSize = 0;
      },
      detached(this: AppOwnerInstance) {
        if ((this.__cuiRegisteredSize ?? 0) > 0 && this.__cuiInsetId) {
          unregisterInset(this, this.__cuiInsetId);
          this.__cuiRegisteredSize = 0;
        }
      },
    },
    methods: {
      setAppInset(this: AppOwnerInstance, size: number) {
        const props = this.data;
        const isStack = options.isStack
          ? options.isStack(props)
          : props?.mode !== "overlay";
        const insetId = this.__cuiInsetId;
        if (!insetId) return;
        if (!isStack || size <= 0) {
          if ((this.__cuiRegisteredSize ?? 0) > 0) {
            unregisterInset(this, insetId);
            this.__cuiRegisteredSize = 0;
          }
          return;
        }
        this.__cuiRegisteredSize = size;
        registerInset(this, {
          id: insetId,
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

  const syncBanner = (
    instance: AppOwnerInstance,
    machine: MachineWithSubscribeLike,
  ) => {
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
    const edge: AppInsetEdge = props?.placement === "bottom" ? "bottom" : "top";
    const bannerId = instance.__cuiBannerInsetId ?? "";

    if (!isOpen || !autoInset || mode === "inline") {
      instance.__cuiBannerHeight = 0;
      if (instance.__cuiMeasureRetryTimer) {
        clearTimeout(instance.__cuiMeasureRetryTimer);
        instance.__cuiMeasureRetryTimer = null;
      }
      if ((instance.__cuiRegisteredBannerSize ?? 0) > 0 && bannerId) {
        unregisterInset(instance, bannerId);
        instance.__cuiRegisteredBannerSize = 0;
        instance.__cuiRegisteredBannerEdge = undefined;
        instance.__cuiRegisteredSize = 0;
        instance.__cuiInsetEdge = undefined;
      }
      return;
    }

    // Resolve effective height: use current measurement or restore last known height
    let height = Number(instance.__cuiBannerHeight || 0);
    if (height <= 0 && Number(instance.__cuiLastKnownHeight || 0) > 0) {
      height = Number(instance.__cuiLastKnownHeight);
      instance.__cuiBannerHeight = height;
    }

    if (height <= 0) {
      if ((instance.__cuiRegisteredBannerSize ?? 0) > 0 && bannerId) {
        unregisterInset(instance, bannerId);
        instance.__cuiRegisteredBannerSize = 0;
        instance.__cuiRegisteredBannerEdge = undefined;
        instance.__cuiRegisteredSize = 0;
        instance.__cuiInsetEdge = undefined;
      }
      return;
    }

    if (
      (instance.__cuiRegisteredBannerEdge !== edge ||
        instance.__cuiRegisteredBannerSize !== height) &&
      (instance.__cuiRegisteredBannerSize ?? 0) > 0 &&
      bannerId
    ) {
      unregisterInset(instance, bannerId);
    }

    instance.__cuiRegisteredBannerEdge = edge;
    instance.__cuiRegisteredBannerSize = height;
    instance.__cuiInsetId = bannerId;
    instance.__cuiInsetEdge = edge;
    instance.__cuiRegisteredSize = height;

    if (bannerId) {
      registerInset(instance, {
        id: bannerId,
        edge,
        size: height,
      });
    }
  };

  const measureBanner = (instance: AppOwnerInstance, retry = 0) => {
    const canQuery =
      typeof instance?.createSelectorQuery === "function" || isMiniApp();
    if (!canQuery) return;

    queryRect(
      ".cui-banner-root",
      instance as unknown as WechatMiniprogram.Component.TrivialInstance,
    )
      .then((res) => {
        const props = instance.data;
        const state = (
          instance.__codeUiMachine as MachineWithSubscribeLike | undefined
        )?.service?.state;
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

        if (!res || typeof res.height !== "number" || res.height <= 0) {
          if (isOpen && retry < 5) {
            if (instance.__cuiMeasureRetryTimer) {
              clearTimeout(instance.__cuiMeasureRetryTimer);
            }
            instance.__cuiMeasureRetryTimer = setTimeout(
              () => {
                instance.__cuiMeasureRetryTimer = null;
                measureBanner(instance, retry + 1);
              },
              30 * (retry + 1),
            );
          }
          return;
        }

        const height = Math.round(res.height);
        instance.__cuiLastKnownHeight = height;

        if (
          height !== instance.__cuiBannerHeight ||
          instance.__cuiRegisteredBannerSize !== height
        ) {
          instance.__cuiBannerHeight = height;
          if (instance.__codeUiMachine) {
            syncBanner(
              instance,
              instance.__codeUiMachine as MachineWithSubscribeLike,
            );
          }
        }
      })
      .catch(() => {
        if (retry < 3) {
          if (instance.__cuiMeasureRetryTimer) {
            clearTimeout(instance.__cuiMeasureRetryTimer);
          }
          instance.__cuiMeasureRetryTimer = setTimeout(() => {
            instance.__cuiMeasureRetryTimer = null;
            measureBanner(instance, retry + 1);
          }, 40);
        }
      });
  };

  const scheduleMeasure = (instance: AppOwnerInstance) => {
    if (instance.__cuiMeasureRetryTimer) {
      clearTimeout(instance.__cuiMeasureRetryTimer);
      instance.__cuiMeasureRetryTimer = null;
    }
    if (instance.__cuiBannerMeasureQueued) {
      instance.__cuiBannerMeasureNeedsRerun = true;
      return;
    }
    instance.__cuiBannerMeasureQueued = true;
    nextTick(() => {
      instance.__cuiBannerMeasureQueued = false;
      measureBanner(instance, 0);
      if (instance.__cuiBannerMeasureNeedsRerun) {
        instance.__cuiBannerMeasureNeedsRerun = false;
        scheduleMeasure(instance);
      }
    });
  };

  const observerBehavior = createBehaviorRef({
    observers: {
      "placement, mode, autoInset, size, title, description, caption, badge, actions, image, more, close"(
        this: AppOwnerInstance,
      ) {
        if (!this.__cuiBannerInsetId) return;
        scheduleMeasure(this);
        if (this.__codeUiMachine) {
          syncBanner(this, this.__codeUiMachine as MachineWithSubscribeLike);
        }
      },
    },
  });

  return {
    name: "banner-layout-inset",
    behaviors: [cuiAppChildBehavior, observerBehavior],
    setupRelations(relations) {
      setupAppRelations(relations, "child");
    },
    onAttached(instance) {
      const owner = instance as AppOwnerInstance;
      owner.__cuiBannerInsetId = `${options.idPrefix ?? "banner"}:${++bannerCounter}`;
      owner.__cuiRegisteredBannerSize = 0;
      owner.__cuiRegisteredBannerEdge = undefined;
      owner.__cuiBannerHeight = 0;
      owner.__cuiLastKnownHeight = 0;
      owner.__cuiBannerMeasureQueued = false;
      owner.__cuiBannerMeasureNeedsRerun = false;
      owner.__cuiMeasureRetryTimer = null;
    },
    onMachineStarted(instance, machine) {
      const owner = instance as AppOwnerInstance;
      owner.__cuiBannerUnsub = machine.subscribe(() => {
        const state = machine.service?.state as MachineStateLike | undefined;
        const isOpen = state?.hasTag?.("open") || state?.matches?.("open");
        if (isOpen) {
          if (
            Number(owner.__cuiBannerHeight || 0) <= 0 &&
            Number(owner.__cuiLastKnownHeight || 0) > 0
          ) {
            owner.__cuiBannerHeight = Number(owner.__cuiLastKnownHeight);
          }
          scheduleMeasure(owner);
        }
        syncBanner(owner, machine as unknown as MachineWithSubscribeLike);
      });
      syncBanner(owner, machine as unknown as MachineWithSubscribeLike);
    },
    onReady(instance) {
      scheduleMeasure(instance as AppOwnerInstance);
    },
    onPropChanged(instance, propKey, val) {
      const owner = instance as AppOwnerInstance;
      if (propKey === "open") {
        if (val) {
          if (Number(owner.__cuiLastKnownHeight || 0) > 0) {
            owner.__cuiBannerHeight = Number(owner.__cuiLastKnownHeight);
            if (owner.__codeUiMachine) {
              syncBanner(
                owner,
                owner.__codeUiMachine as MachineWithSubscribeLike,
              );
            }
          }
        } else if (owner.__codeUiMachine) {
          syncBanner(owner, owner.__codeUiMachine as MachineWithSubscribeLike);
        }
      }
      scheduleMeasure(owner);
      if (owner.__codeUiMachine) {
        syncBanner(owner, owner.__codeUiMachine as MachineWithSubscribeLike);
      }
    },
    onDetached(instance) {
      const owner = instance as AppOwnerInstance;
      owner.__cuiBannerUnsub?.();
      owner.__cuiBannerUnsub = undefined;
      owner.__cuiBannerMeasureQueued = false;
      owner.__cuiBannerMeasureNeedsRerun = false;
      if (owner.__cuiMeasureRetryTimer) {
        clearTimeout(owner.__cuiMeasureRetryTimer);
        owner.__cuiMeasureRetryTimer = null;
      }
      if (
        (owner.__cuiRegisteredBannerSize ?? 0) > 0 &&
        owner.__cuiBannerInsetId
      ) {
        unregisterInset(owner, owner.__cuiBannerInsetId);
        owner.__cuiRegisteredBannerSize = 0;
        owner.__cuiRegisteredBannerEdge = undefined;
        owner.__cuiRegisteredSize = 0;
        owner.__cuiInsetEdge = undefined;
      }
      owner.__cuiBannerHeight = 0;
    },
  };
}

const DEFAULT_MENU_HEIGHT = 32;
const DEFAULT_MENU_GAP = 4;

const EMPTY_METRICS: AppMetrics = {
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

let cachedMetrics: AppMetrics | null = null;
export const appMetricsSignal = /* @__PURE__ */ (() =>
  signal<AppMetrics>(EMPTY_METRICS))();

function calculateMetrics(): AppMetrics {
  const empty: AppMetrics = { ...EMPTY_METRICS };
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
        ? wx?.getMenuButtonBoundingClientRect() || {}
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

export interface AppHostBehaviorOptions {
  detectBars: (
    appInstance: AppOwnerInstance,
    cb: (result: {
      topRect?: RectLike | null | undefined;
      bottomRect?: RectLike | null | undefined;
    }) => void,
  ) => void;
  extractTopBarHeight: (rect?: RectLike | null) => number;
  extractBottomBarHeight: (rect?: RectLike | null) => number;
}

function attachPageAppRef(instance: AppOwnerInstance): void {
  if (typeof getCurrentPages !== "function") return;
  try {
    const pages = getCurrentPages() as unknown as Array<
      AppOwnerInstance | undefined
    >;
    const topPage = pages && pages[pages.length - 1];
    if (topPage) {
      topPage.__cuiApp = instance;
    }
  } catch {
    /* ignore page lookup errors outside runtime */
  }
}

export function createAppHostBehavior(options: AppHostBehaviorOptions) {
  const { detectBars, extractTopBarHeight, extractBottomBarHeight } = options;

  return Behavior({
    lifetimes: {
      attached(this: AppOwnerInstance) {
        this.__cuiAppAttached = true;
        getAppMetrics();
        this.__cuiUnsubPageLifecycleHost?.();
        this.__cuiUnsubPageLifecycleHost = registerPageLifecycleHost(this);
        registerAppHost(this, {
          onChange: (state: AppHostState) => this.applyHostState?.(state),
        });
        attachPageAppRef(this);
      },

      detached(this: AppOwnerInstance) {
        this.__cuiAppAttached = false;
        this.__cuiUnsubPageLifecycleHost?.();
        this.__cuiUnsubPageLifecycleHost = undefined;
        unregisterAppHost(this);
      },

      ready(this: AppOwnerInstance) {
        this.detectCustomBars?.();
        if (typeof wx !== "undefined" && typeof wx.nextTick === "function") {
          wx.nextTick(() => {
            if (this.__cuiAppAttached) {
              this.detectCustomBars?.();
            }
          });
        }
      },
    },

    pageLifetimes: {
      show(this: AppOwnerInstance) {
        attachPageAppRef(this);
        setAppHostVisible(this, true);
        emitPageLifecycle(this, "show");
        this.detectCustomBars?.();
      },
      hide(this: AppOwnerInstance) {
        setAppHostVisible(this, false);
        emitPageLifecycle(this, "hide");
      },
      resize(this: AppOwnerInstance) {
        refreshAppMetrics();
        this.detectCustomBars?.();
      },
    },

    methods: {
      noop() {},

      detectCustomBars(this: AppOwnerInstance) {
        if (!this.data?.autoDetectBars) return;
        if (
          typeof wx === "undefined" ||
          typeof wx.createSelectorQuery !== "function"
        ) {
          return;
        }
        try {
          const applyRects = (
            topRect?: RectLike | null,
            bottomRect?: RectLike | null,
          ) => {
            if (!this.__cuiAppAttached) return;
            const patch: Record<string, unknown> = {};

            if (topRect && typeof topRect.height === "number") {
              const topHeight = extractTopBarHeight(topRect);
              if (topHeight !== this.data?.detectedTopBarHeight) {
                patch.detectedTopBarHeight = topHeight;
              }
            }

            if (bottomRect && typeof bottomRect.height === "number") {
              const bottomHeight = extractBottomBarHeight(bottomRect);
              if (bottomHeight !== this.data?.detectedBottomBarHeight) {
                patch.detectedBottomBarHeight = bottomHeight;
              }
            }

            if (Object.keys(patch).length > 0) {
              this.setData?.(patch);
            }
          };

          detectBars(this, ({ topRect, bottomRect }) => {
            applyRects(topRect, bottomRect);
          });
        } catch {
          /* ignore selector query errors */
        }
      },

      startScaleGesture(this: AppOwnerInstance) {
        this._lastScaleProgress = undefined;
      },

      applyScaleProgress(this: AppOwnerInstance, progress: number) {
        if (progress <= 0 && !this.data?.gestureScaleStyle) {
          return;
        }
        const lastP = this._lastScaleProgress ?? -1;
        if (
          Math.abs(progress - lastP) < 0.015 &&
          progress > 0 &&
          progress < 1
        ) {
          return;
        }
        this._lastScaleProgress = progress;

        const factor =
          this.data?.hostScaleFactor || this.data?.scaleFactor || 0.94;
        const currentScale =
          Math.round((factor + (1 - factor) * progress) * 1000) / 1000;
        const currentTopFactor =
          Math.round(Math.max(0, 1 - progress) * 1000) / 1000;
        const winWidth = appMetricsSignal().windowWidth || 375;
        const topGap =
          Math.round(Math.max(0, ((1 - currentScale) / 2) * winWidth) * 100) /
          100;
        const transformValue = `translate3d(0, calc(var(--cui-top-offset) * ${currentTopFactor} + ${topGap}px), 0) scale3d(${currentScale}, ${currentScale}, 1)`;

        this.setData?.({
          gestureScaleStyle:
            `-webkit-transform: ${transformValue}; ` +
            `transform: ${transformValue}; ` +
            `transition: none !important;`,
        });
      },

      endScaleGesture(this: AppOwnerInstance, passed: boolean) {
        this._lastScaleProgress = undefined;
        const patch: Record<string, unknown> = { gestureScaleStyle: "" };
        if (passed) {
          patch.scaled = false;
        }
        this.setData?.(patch);
      },

      applyHostState(this: AppOwnerInstance, state: AppHostState) {
        const patch: Record<string, unknown> = {};
        if (state.scale) {
          const wantScaled = Boolean(state.scale.scaled);
          if (wantScaled !== Boolean(this.data?.scaled)) {
            patch.scaled = wantScaled;
          }
          if (wantScaled) {
            if (state.scale.factor !== this.data?.hostScaleFactor) {
              patch.hostScaleFactor = state.scale.factor;
            }
            const nextBg = state.scale.background ?? "";
            if (nextBg !== (this.data?.hostScaleBackground ?? "")) {
              patch.hostScaleBackground = nextBg;
            }
          }
        }
        if (
          state.insets.top !== (this.data?.topInset ?? 0) ||
          state.insets.bottom !== (this.data?.bottomInset ?? 0)
        ) {
          patch.topInset = state.insets.top;
          patch.bottomInset = state.insets.bottom;
        }
        if (Object.keys(patch).length > 0) {
          if (
            typeof (this as any).__cuiBufferMountData === "function" &&
            (this as any).__cuiBufferMountData(patch)
          ) {
            // Buffered into initial computedBehavior mount flush
          } else {
            this.setData?.(patch);
          }
        }
        if (
          this.data?.autoDetectBars &&
          this.data?.detectedTopBarHeight === 0
        ) {
          this.detectCustomBars?.();
        }
      },
    },
  });
}

export function __resetAppRegistry(): void {
  hosts.length = 0;
  pending.clear();
  appRegistry.orderCounter = 0;
  cachedMetrics = null;
  refreshAppMetrics();
}
