import { computed, effect, signal } from "alien-signals";

export interface ToastAction {
  label: string;
  onClick?: (() => void) | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  id?: string | undefined;
}

export type ToastSlotName =
  | "root"
  | "wrapper"
  | "title"
  | "description"
  | "icon"
  | "actions"
  | "action"
  | "closeTrigger"
  | "progress";

export type ToastUI = Partial<Record<ToastSlotName, string>>;

export type ToastPlacement = "top" | "center" | "bottom";

export interface ToastEntry {
  id: string;
  title?: string | undefined;
  description?: string | undefined;
  icon?: string | undefined;
  mode?: "default" | "native" | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  placement?: ToastPlacement | undefined;
  duration?: number | undefined;
  progress?: boolean | { color?: string } | undefined;
  progressPosition?: "top" | "bottom" | undefined;
  open?: boolean | undefined;
  close?: boolean | undefined;
  closeIcon?: string | undefined;
  actions?: ToastAction[] | undefined;
  ui?: ToastUI | undefined;
  className?: string | undefined;
  stackIndex?: number | undefined;
  offset?: number | undefined;

  updatedAt?: number | undefined;
  onAction?:
    | ((details: { action: ToastAction; index: number }) => void)
    | undefined;
  onDismiss?: (() => void) | undefined;
}

export interface ToastManagerOptions {
  max?: number | undefined;
  onChange?: ((toasts: ToastEntry[]) => void) | undefined;
}

export function resolveToastPlacement(
  t: Pick<ToastEntry, "placement" | "mode" | "orientation">,
): ToastPlacement {
  if (t.placement) return t.placement;
  if (t.mode === "native" && t.orientation !== "horizontal") return "center";
  return "top";
}

export function normalizeToastEntries(toasts: ToastEntry[]): ToastEntry[] {
  return toasts.map((t) => ({
    ...t,
    placement: resolveToastPlacement(t),
    stackIndex: 0,
    offset: 0,
  }));
}

export class ToastManager {
  readonly rawToasts = signal<ToastEntry[]>([]);
  readonly max = signal<number>(2);

  readonly toasts = computed<ToastEntry[]>(() =>
    normalizeToastEntries(this.rawToasts()),
  );

  onChange?: ((toasts: ToastEntry[]) => void) | undefined;
  private stopEffect?: (() => void) | undefined;
  private isInitialized = false;

  constructor(options: ToastManagerOptions = {}) {
    this.max(options.max !== undefined && options.max > 0 ? options.max : 2);
    this.onChange = options.onChange;

    this.stopEffect = effect(() => {
      const current = this.toasts();
      if (!this.isInitialized) {
        this.isInitialized = true;
        if (current.length === 0) return;
      }
      this.onChange?.(current);
    });
  }

  setMax(max: number): void {
    const nextMax = max > 0 ? max : 2;
    if (this.max() === nextMax) return;
    this.max(nextMax);
    this.enforceLimits();
  }

  private enforceLimits(): void {
    const current = this.rawToasts();
    const maxVal = this.max();
    if (current.length <= maxVal) return;

    const list = [...current];
    const evictedList: ToastEntry[] = [];

    while (list.length > maxVal) {
      const evicted = list.shift();
      if (evicted) evictedList.push(evicted);
    }

    this.rawToasts(list);
    for (const evicted of evictedList) {
      evicted.onDismiss?.();
    }
  }

  add(entry: ToastEntry): string {
    const placement = resolveToastPlacement(entry);
    const now = Date.now();
    const item: ToastEntry = {
      ...entry,
      placement,
      open: entry.open ?? true,
      updatedAt: now,
    };

    const current = this.rawToasts();
    const list = [...current];

    const existingIdIndex = list.findIndex((t) => t.id === item.id);
    const prevItem = list[existingIdIndex];
    if (existingIdIndex !== -1 && prevItem) {
      const updatedItem: ToastEntry = {
        ...prevItem,
        ...item,
        placement: resolveToastPlacement({ ...prevItem, ...item }),
        open: entry.open ?? true,
        updatedAt: now,
      };

      const evictedList: ToastEntry[] = [];
      const filtered = list.filter((t, idx) => {
        if (idx === existingIdIndex) return true;
        if (resolveToastPlacement(t) === updatedItem.placement) {
          evictedList.push(t);
          return false;
        }
        return true;
      });

      const targetIdx = filtered.findIndex((t) => t.id === item.id);
      filtered[targetIdx] = updatedItem;

      this.rawToasts(filtered);
      for (const evicted of evictedList) {
        evicted.onDismiss?.();
      }
      return item.id;
    }

    const evictedList: ToastEntry[] = [];

    const samePlacementIndex = list.findIndex(
      (t) => resolveToastPlacement(t) === placement,
    );
    if (samePlacementIndex !== -1) {
      const [replaced] = list.splice(samePlacementIndex, 1);
      if (replaced) evictedList.push(replaced);
    }

    const maxVal = this.max();
    while (list.length >= maxVal) {
      const evicted = list.shift();
      if (evicted) evictedList.push(evicted);
    }

    list.push(item);
    this.rawToasts(list);

    for (const evicted of evictedList) {
      evicted.onDismiss?.();
    }

    return item.id;
  }

  dismiss(id: string): void {
    const current = this.rawToasts();
    const idx = current.findIndex((t) => t.id === id);
    const target = current[idx];
    if (idx === -1 || !target || target.open === false) return;

    const list = [...current];
    list[idx] = {
      ...target,
      open: false,
    };
    this.rawToasts(list);
  }

  remove(id: string): void {
    const current = this.rawToasts();
    const idx = current.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const list = [...current];
    const [removed] = list.splice(idx, 1);
    this.rawToasts(list);
    removed?.onDismiss?.();
  }

  clear(): void {
    const current = this.rawToasts();
    if (current.length === 0) return;

    this.rawToasts([]);
    for (const t of current) {
      t.onDismiss?.();
    }
  }

  update(id: string, patch: Partial<Omit<ToastEntry, "id">>): void {
    const current = this.rawToasts();
    const idx = current.findIndex((t) => t.id === id);
    const prev = current[idx];
    if (idx === -1 || !prev) return;

    const updated: ToastEntry = {
      ...prev,
      ...patch,
      id: prev.id,
      updatedAt: Date.now(),
    };
    updated.placement = resolveToastPlacement(updated);

    const evictedList: ToastEntry[] = [];
    const nextList = current.filter((t, i) => {
      if (i === idx) return true;
      if (resolveToastPlacement(t) === updated.placement) {
        evictedList.push(t);
        return false;
      }
      return true;
    });

    const targetIdx = nextList.findIndex((t) => t.id === id);
    if (targetIdx !== -1) {
      nextList[targetIdx] = updated;
    }

    this.rawToasts(nextList);
    for (const evicted of evictedList) {
      evicted.onDismiss?.();
    }
  }

  destroy(): void {
    this.clear();
    this.stopEffect?.();
    this.stopEffect = undefined;
    this.onChange = undefined;
  }
}

export interface ToastHostRecord {
  instance: any;
  pageId: string;
  manager: ToastManager;
  order: number;
}

type PendingToastOp = (host: ToastHostRecord) => void;

export interface ToastRegistry {
  hosts: ToastHostRecord[];
  hostByInstance: WeakMap<object, ToastHostRecord>;
  pending: Map<string, PendingToastOp[]>;
  orderCounter: number;
  toastIdCounter: number;
}

const ACTIVE_KEY = "*";
const MAX_PENDING_PER_KEY = 20;

const globalScope = (
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : {}
) as any;

if (!globalScope.__CODE_UI_TOAST_REGISTRY__) {
  globalScope.__CODE_UI_TOAST_REGISTRY__ = {
    hosts: [],
    hostByInstance: new WeakMap(),
    pending: new Map(),
    orderCounter: 0,
    toastIdCounter: 0,
  };
}

const registry: ToastRegistry = globalScope.__CODE_UI_TOAST_REGISTRY__;

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
    if (instance.$page && typeof instance.$page.getPageId === "function") {
      const id = instance.$page.getPageId();
      if (id !== undefined && id !== null && id !== "") return String(id);
    }
  } catch {}
  return undefined;
}

function findHostByPageId(pageId: string): ToastHostRecord | undefined {
  for (let i = registry.hosts.length - 1; i >= 0; i--) {
    const host = registry.hosts[i];
    if (host && host.pageId === pageId) return host;
  }
  return undefined;
}

export function findActiveToastHost(owner?: any): ToastHostRecord | undefined {
  if (owner) {
    const own = registry.hostByInstance.get(owner);
    if (own) return own;

    if (owner.__cuiApp) {
      const appHost = registry.hostByInstance.get(owner.__cuiApp);
      if (appHost) return appHost;
    }

    if (owner.__cuiAppParent) {
      const parentHost = registry.hostByInstance.get(owner.__cuiAppParent);
      if (parentHost) return parentHost;
    }

    // 4. Page ID match
    const pageId = getPageIdOf(owner);
    if (pageId) {
      const match = findHostByPageId(pageId);
      if (match) return match;
    }
  }

  if (typeof getCurrentPages === "function") {
    try {
      const pages = getCurrentPages();
      const topPage = pages && pages[pages.length - 1];
      if (topPage) {
        if (topPage.__cuiApp) {
          const appHost = registry.hostByInstance.get(topPage.__cuiApp);
          if (appHost) return appHost;
        }
        const topPageId = getPageIdOf(topPage);
        if (topPageId) {
          const host = findHostByPageId(topPageId);
          if (host) return host;
        }
      }
    } catch {}
  }

  let best: ToastHostRecord | undefined;
  for (const host of registry.hosts) {
    if (!best || host.order > best.order) best = host;
  }
  return best ?? registry.hosts[registry.hosts.length - 1];
}

function withToastHost(owner: any, op: PendingToastOp): void {
  const host = findActiveToastHost(owner);
  if (host) {
    op(host);
    return;
  }
  const key = (owner && getPageIdOf(owner)) || ACTIVE_KEY;
  const queue = registry.pending.get(key) ?? [];
  if (queue.length >= MAX_PENDING_PER_KEY) {
    queue.shift();
  }
  queue.push(op);
  registry.pending.set(key, queue);
}

function flushPending(host: ToastHostRecord): void {
  const keys = [host.pageId, ACTIVE_KEY];
  for (const key of keys) {
    const queue = registry.pending.get(key);
    if (!queue) continue;
    registry.pending.delete(key);
    for (const op of queue) {
      op(host);
    }
  }
}

export function registerToastHost(
  instance: any,
  onChange?: (toasts: ToastEntry[]) => void,
  options?: { max?: number | undefined },
): void {
  if (!instance) return;
  const existing = registry.hostByInstance.get(instance);
  if (existing) {
    if (onChange) existing.manager.onChange = onChange;
    if (options?.max !== undefined) existing.manager.setMax(options.max);
    existing.order = ++registry.orderCounter;
    flushPending(existing);
    return;
  }

  const pageId =
    getPageIdOf(instance) ?? `toast-host-${++registry.orderCounter}`;
  const manager = new ToastManager({
    max: options?.max ?? 2,
    onChange,
  });

  const record: ToastHostRecord = {
    instance,
    pageId,
    manager,
    order: ++registry.orderCounter,
  };

  registry.hosts.push(record);
  registry.hostByInstance.set(instance, record);
  flushPending(record);
}

export function unregisterToastHost(instance: any): void {
  if (!instance) return;
  const record = registry.hostByInstance.get(instance);
  if (record) {
    record.manager.destroy();
    registry.pending.delete(record.pageId);
    registry.hostByInstance.delete(instance);
  }
  const idx = registry.hosts.findIndex((h) => h.instance === instance);
  if (idx !== -1) {
    registry.hosts.splice(idx, 1);
  }
}

export function updateToastHostConfig(
  owner: any,
  options: { max?: number | undefined },
): void {
  withToastHost(owner, (host) => {
    if (options.max !== undefined) {
      host.manager.setMax(options.max);
    }
  });
}

export function addToast(
  entry: Omit<ToastEntry, "id"> & { id?: string | undefined },
  owner?: any,
): string {
  const id = entry.id || `toast-${++registry.toastIdCounter}`;
  const mode = entry.mode ?? "default";
  const rawColor = entry.color || "neutral";
  const color = rawColor === "error" ? "danger" : rawColor;

  const toastItem: ToastEntry = {
    ...entry,
    id,
    mode,
    color,
    open: entry.open ?? true,
    duration: entry.duration ?? (mode === "native" ? 1500 : 4000),
    progress: entry.progress ?? mode !== "native",
    progressPosition: entry.progressPosition ?? "bottom",
    variant: entry.variant ?? "outline",
  };

  withToastHost(owner, (host) => {
    host.manager.add(toastItem);
  });

  return id;
}

export function dismissToast(id: string, owner?: any): void {
  withToastHost(owner, (host) => {
    host.manager.dismiss(id);
  });
}

export function removeToast(id: string, owner?: any): void {
  withToastHost(owner, (host) => {
    host.manager.remove(id);
  });
}

export function clearToasts(owner?: any): void {
  withToastHost(owner, (host) => {
    host.manager.clear();
  });
}

export function updateToast(
  id: string,
  patch: Partial<Omit<ToastEntry, "id">>,
  owner?: any,
): void {
  withToastHost(owner, (host) => {
    host.manager.update(id, patch);
  });
}

export function getToastManager(owner?: any): ToastManager | undefined {
  const host = findActiveToastHost(owner);
  return host?.manager;
}

export function __resetToastRegistry(): void {
  for (const host of registry.hosts) {
    host.manager.destroy();
  }
  registry.hosts.length = 0;
  registry.pending.clear();
  registry.toastIdCounter = 0;
  registry.orderCounter = 0;
}
