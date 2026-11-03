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

export interface ToastEntry {
  id: string;
  title?: string | undefined;
  description?: string | undefined;
  icon?: string | undefined;
  mode?: "default" | "native" | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  placement?: "top" | "center" | "bottom" | undefined;
  duration?: number | undefined;
  progress?: boolean | undefined;
  progressPosition?: "top" | "bottom" | undefined;
  open?: boolean | undefined;
  close?: boolean | undefined;
  closeIcon?: string | undefined;
  actions?: ToastAction[] | undefined;
  ui?: ToastUI | undefined;
  className?: string | undefined;
  stackIndex?: number | undefined;
  offset?: number | undefined;
  onAction?:
    | ((details: { action: ToastAction; index: number }) => void)
    | undefined;
  onDismiss?: (() => void) | undefined;
}

export interface ToastManagerOptions {
  max?: number | undefined;
  threshold?: number | undefined;
  onChange?: ((toasts: ToastEntry[]) => void) | undefined;
}

function estimateToastHeight(t: ToastEntry): number {
  const mode = t.mode ?? "default";
  const orientation = t.orientation ?? "horizontal";
  if (mode === "native") {
    return orientation === "horizontal" ? 44 : 100;
  }
  let height = 56;
  if (t.description) {
    const lines = t.description.length > 38 ? 2 : 1;
    height += lines * 18 + 4;
  }
  if (t.actions && t.actions.length > 0) {
    height += 38;
  }
  return height;
}

export function computeToastStackIndices(
  toasts: ToastEntry[],
  threshold = 12,
): ToastEntry[] {
  const accumulatedOffsets: Record<string, number> = {
    top: 0,
    center: 0,
    bottom: 0,
  };
  const counts: Record<string, number> = { top: 0, center: 0, bottom: 0 };

  return toasts.map((t) => {
    const placement =
      t.placement ||
      (t.mode === "native" && t.orientation !== "horizontal"
        ? "center"
        : "top");

    const stackIndex = counts[placement] ?? 0;
    const currentOffset = accumulatedOffsets[placement] ?? 0;

    counts[placement] = stackIndex + 1;

    if (placement !== "center") {
      const itemHeight = estimateToastHeight(t);
      accumulatedOffsets[placement] = currentOffset + itemHeight + threshold;
    }

    return {
      ...t,
      stackIndex,
      offset: currentOffset,
    };
  });
}

/**
 * ToastManager encapsulates queue management, stacking calculation,
 * per-placement replacement, and configurable max limits for a single host.
 */
export class ToastManager {
  private toasts: ToastEntry[] = [];
  private max: number;
  private threshold: number;
  private onChange?: ((toasts: ToastEntry[]) => void) | undefined;

  constructor(options: ToastManagerOptions = {}) {
    this.max = options.max !== undefined && options.max > 0 ? options.max : 2;
    this.threshold = options.threshold ?? 12;
    this.onChange = options.onChange;
  }

  setMax(max: number): void {
    this.max = max > 0 ? max : 2;
    this.enforceLimits();
  }

  getMax(): number {
    return this.max;
  }

  setOnChange(onChange?: ((toasts: ToastEntry[]) => void) | undefined): void {
    this.onChange = onChange;
  }

  getToasts(): ToastEntry[] {
    return [...this.toasts];
  }

  private normalizePlacement(t: ToastEntry): "top" | "center" | "bottom" {
    if (t.placement) return t.placement;
    if (t.mode === "native" && t.orientation !== "horizontal") return "center";
    return "top";
  }

  private enforceLimits(): void {
    let changed = false;
    while (this.toasts.length > this.max) {
      const evicted = this.toasts.shift();
      if (evicted) {
        evicted.onDismiss?.();
        changed = true;
      }
    }
    if (changed) {
      this.notify();
    }
  }

  add(entry: ToastEntry): string {
    const placement = this.normalizePlacement(entry);
    const item: ToastEntry = {
      ...entry,
      placement,
    };

    // 1. If an existing toast with the same id exists, update in-place
    const existingIdIndex = this.toasts.findIndex((t) => t.id === item.id);
    if (existingIdIndex !== -1) {
      this.toasts[existingIdIndex] = {
        ...this.toasts[existingIdIndex],
        ...item,
      };
      this.notify();
      return item.id;
    }

    // 2. Replaceable per placement:
    // If another toast already exists at this SAME placement, replace it
    const samePlacementIndex = this.toasts.findIndex(
      (t) => this.normalizePlacement(t) === placement,
    );
    if (samePlacementIndex !== -1) {
      const [replaced] = this.toasts.splice(samePlacementIndex, 1);
      replaced?.onDismiss?.();
    }

    // 3. Max capacity across different placements:
    // If toasts array already at max limit, evict the oldest toast (FIFO)
    while (this.toasts.length >= this.max) {
      const evicted = this.toasts.shift();
      evicted?.onDismiss?.();
    }

    // 4. Append the new toast
    this.toasts.push(item);
    this.notify();
    return item.id;
  }

  dismiss(id: string): void {
    const target = this.toasts.find((t) => t.id === id);
    if (target) {
      target.open = false;
      this.notify();
    }
  }

  remove(id: string): void {
    const idx = this.toasts.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const [removed] = this.toasts.splice(idx, 1);
      removed?.onDismiss?.();
      this.notify();
    }
  }

  clear(): void {
    for (const t of this.toasts) {
      t.onDismiss?.();
    }
    this.toasts = [];
    this.notify();
  }

  update(id: string, patch: Partial<Omit<ToastEntry, "id">>): void {
    const target = this.toasts.find((t) => t.id === id);
    if (target) {
      Object.assign(target, patch);
      if (patch.placement || patch.mode || patch.orientation) {
        target.placement = this.normalizePlacement(target);
      }
      this.notify();
    }
  }

  notify(): void {
    const computed = computeToastStackIndices(this.toasts, this.threshold);
    this.onChange?.(computed);
  }
}

export interface ToastHostRecord {
  instance: any;
  pageId: string;
  manager: ToastManager;
  visible: boolean;
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
    if (
      instance.$page &&
      typeof instance.$page.getPageId === "function"
    ) {
      const id = instance.$page.getPageId();
      if (id !== undefined && id !== null && id !== "") return String(id);
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

function findHostByPageId(pageId: string): ToastHostRecord | undefined {
  for (let i = registry.hosts.length - 1; i >= 0; i--) {
    const host = registry.hosts[i];
    if (host && host.pageId === pageId) return host;
  }
  return undefined;
}

export function findActiveToastHost(owner?: any): ToastHostRecord | undefined {
  if (owner) {
    // 1. Direct host instance
    const own = registry.hostByInstance.get(owner);
    if (own) return own;

    // 2. Owner has __cuiApp attached (page or component)
    if (owner.__cuiApp) {
      const appHost = registry.hostByInstance.get(owner.__cuiApp);
      if (appHost) return appHost;
    }

    // 3. Owner has __cuiAppParent attached (relation)
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

  // 5. Active page check
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

  const topPageId = getTopPageId();
  if (topPageId) {
    const host = findHostByPageId(topPageId);
    if (host) return host;
  }

  // 6. Best visible host
  let best: ToastHostRecord | undefined;
  for (const host of registry.hosts) {
    if (!host.visible) continue;
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
  const queue = registry.pending.get(key);
  if (queue) queue.push(op);
  else registry.pending.set(key, [op]);
}

function flushPending(host: ToastHostRecord): void {
  const keys = [host.pageId, ACTIVE_KEY];
  for (const key of keys) {
    const queue = registry.pending.get(key);
    if (!queue) continue;
    registry.pending.delete(key);
    for (const op of queue) op(host);
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
    if (onChange) existing.manager.setOnChange(onChange);
    if (options?.max !== undefined) existing.manager.setMax(options.max);
    return;
  }

  const pageId = getPageIdOf(instance) ?? `toast-host-${registry.hosts.length + 1}`;
  const manager = new ToastManager({
    max: options?.max ?? 2,
    onChange,
  });

  const record: ToastHostRecord = {
    instance,
    pageId,
    manager,
    visible: true,
    order: ++registry.orderCounter,
  };

  registry.hosts.push(record);
  registry.hostByInstance.set(instance, record);
  flushPending(record);
}

export function unregisterToastHost(instance: any): void {
  if (!instance) return;
  const idx = registry.hosts.findIndex((h) => h.instance === instance);
  if (idx !== -1) registry.hosts.splice(idx, 1);
  registry.hostByInstance.delete(instance);
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
  const rawColor = entry.color || "neutral";
  const color = rawColor === "error" ? "danger" : rawColor;
  const toastItem: ToastEntry = {
    open: true,
    mode: "default",
    duration: entry.duration !== undefined ? entry.duration : 4000,
    progress: entry.progress !== undefined ? entry.progress : true,
    progressPosition: entry.progressPosition || "bottom",
    variant: entry.variant || "outline",
    ...entry,
    color,
    id,
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

export function getToasts(owner?: any): ToastEntry[] {
  const host = findActiveToastHost(owner);
  return host ? host.manager.getToasts() : [];
}

export function __resetToastRegistry(): void {
  registry.hosts.length = 0;
  registry.pending.clear();
  registry.toastIdCounter = 0;
  registry.orderCounter = 0;
}
