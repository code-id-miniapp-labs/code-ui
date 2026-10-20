import type { MachineSchema, Service } from "@code-ui/core";
import type { ConnectFn, MiniappMachine } from "@code-ui/miniapp";
import { diffSnapshot, warn } from "@code-ui/utils";

/**
 * Universal MiniProgram instance type supporting both Page and Component contexts.
 */
export type UseChildInstance =
  | WechatMiniprogram.Page.TrivialInstance
  | WechatMiniprogram.Component.TrivialInstance
  | WechatMiniprogram.Page.Instance<any, any>
  | {
      setData: (...args: any[]) => any;
      selectComponent?: (...args: any[]) => any;
      [key: string]: any;
    };

/**
 * Target selector string or component instance reference.
 */
export type UseChildTarget =
  | string
  | WechatMiniprogram.Component.TrivialInstance
  | Record<string, any>;

export interface UseChildBaseOptions<
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> {
  /**
   * The data key under parent's `this.data` where the child snapshot is synced.
   * e.g., key: 'email' -> access via `{{ email.value }}` in WXML.
   */
  key?: string | undefined;

  /**
   * Reactive callback triggered whenever the child machine transitions.
   */
  onChange?: ((snapshot: Data) => void) | undefined;
}

export interface UseChildConnectOptions<
  T extends MachineSchema = any,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> extends UseChildBaseOptions<Data> {
  /**
   * Custom connect function to format or project the snapshot.
   */
  connect: ConnectFn<T, Data>;
}

export interface UseChildOptions<
  T extends MachineSchema = any,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> extends UseChildBaseOptions<Data> {
  /**
   * Optional custom connect function to format or project the snapshot.
   */
  connect?: ConnectFn<T, Data> | undefined;
}

export type UseChildApi<Data> = Data & {
  clear?: () => void;
  reset?: () => void;
  [key: string]: any;
};

export interface UseChildReturn<
  T extends MachineSchema = any,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
> {
  /** Synchronous getter for the latest state snapshot in JS */
  getSnapshot: () => Data | undefined;
  /** Getter property for immediate read: `child.snapshot` */
  readonly snapshot: Data | undefined;
  /** Callable public API methods of the child machine / component */
  api: UseChildApi<Data>;
  /** Send events directly to the child machine */
  send: (event: T["event"]) => void;
  /** The underlying child service */
  readonly service: Service<T> | undefined;
  /** Stop the subscription and dispose reactive bindings */
  stop: () => void;
}

const LISTENER_SET_KEY = "__codeUiSnapshotListeners";

function resolveChild(instance: UseChildInstance, target: UseChildTarget): any {
  if (typeof target === "string") {
    if (instance && typeof instance.selectComponent === "function") {
      return instance.selectComponent(target);
    }
    return null;
  }
  return target;
}

function getChildInstance(child: any): any {
  return child?.__codeUiInstance ?? child;
}

function getChildMachine<T extends MachineSchema>(
  child: any,
): MiniappMachine<T> | undefined {
  const comp = getChildInstance(child);
  if (comp?.__codeUiMachine) {
    return comp.__codeUiMachine;
  }
  if (typeof comp?.getMachine === "function") {
    return comp.getMachine();
  }
  return undefined;
}

function getChildService<T extends MachineSchema>(
  child: any,
): Service<T> | undefined {
  if (child?.service) {
    return child.service;
  }
  const comp = getChildInstance(child);
  if (typeof comp?.getService === "function") {
    return comp.getService();
  }
  return comp?.__codeUiMachine?.service;
}

//  With `connect` function — infers `Data` directly from `connect` return type
export function useChild<
  T extends MachineSchema = any,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  instance: UseChildInstance,
  target: UseChildTarget,
  options: UseChildConnectOptions<T, Data>,
): UseChildReturn<T, Data>;

// Single generic for Data / API type (e.g. useChild<PinInputApi>(this, '#otp', options))
export function useChild<
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  instance: UseChildInstance,
  target: UseChildTarget,
  options?: UseChildBaseOptions<Data>,
): UseChildReturn<any, Data>;

// With explicit MachineSchema T and Data (e.g. useChild<PinInputSchema, PinInputApi>(...))
export function useChild<
  T extends MachineSchema,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  instance: UseChildInstance,
  target: UseChildTarget,
  options?: UseChildBaseOptions<Data>,
): UseChildReturn<T, Data>;

// Fallback when passing unified UseChildOptions<T, Data>
export function useChild<
  T extends MachineSchema = any,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  instance: UseChildInstance,
  target: UseChildTarget,
  options?: UseChildOptions<T, Data>,
): UseChildReturn<T, Data>;

export function useChild<
  T extends MachineSchema = any,
  Data extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject,
>(
  instance: UseChildInstance,
  target: UseChildTarget,
  options: UseChildOptions<T, Data> = {},
): UseChildReturn<T, Data> {
  const { key, connect, onChange } = options;

  let activeChild: any = resolveChild(instance, target);
  let unsubscribeMachine: (() => void) | undefined;
  let isDisposed = false;
  let latestSnapshot: Data | undefined;
  let prevSyncedSnapshot: Record<string, any> | undefined;
  let pendingDelta: Record<string, any> = {};
  let isBatchScheduled = false;
  let isApiDirty = true;

  const ensureChild = (): any => {
    // Re-resolve if not yet found or if the component was detached via wx:if
    if (
      !activeChild ||
      (typeof target === "string" &&
        activeChild.__wxExparserNodeId__ === undefined &&
        instance &&
        typeof instance.selectComponent === "function")
    ) {
      const resolved = resolveChild(instance, target);
      if (resolved && resolved !== activeChild) {
        activeChild = resolved;
        isApiDirty = true;
      }
    }
    return activeChild;
  };

  const flushSetData = () => {
    isBatchScheduled = false;
    if (isDisposed) {
      pendingDelta = {};
      return;
    }
    if (
      Object.keys(pendingDelta).length > 0 &&
      instance &&
      typeof instance.setData === "function"
    ) {
      const payload = pendingDelta;
      pendingDelta = {};
      instance.setData(payload);
    }
  };

  const computeSnapshot = (): Data | undefined => {
    const child = ensureChild();
    if (!child) return undefined;

    const service = getChildService<T>(child);
    if (connect && service) {
      return connect(service);
    }

    if (typeof child.getSnapshot === "function") {
      return child.getSnapshot();
    }

    const comp = getChildInstance(child);
    if (comp?.__codeUiApi !== undefined) {
      return comp.__codeUiApi;
    }

    if (
      service?.context &&
      typeof (service.context as any).getSnapshot === "function"
    ) {
      return (service.context as any).getSnapshot();
    }

    return undefined;
  };

  const apiTarget: Record<string, any> = {};

  const syncApiTarget = (snap?: Data | undefined) => {
    if (!isApiDirty) return;
    const child = ensureChild();
    if (!child) return;

    const currentSnap = snap ?? latestSnapshot ?? computeSnapshot();
    if (currentSnap && typeof currentSnap === "object") {
      for (const [k, v] of Object.entries(currentSnap)) {
        if (typeof v === "function") {
          apiTarget[k] = v.bind(currentSnap);
        }
      }
      // Common convenience aliases
      if (typeof (currentSnap as any).clearValue === "function") {
        apiTarget.clear = (currentSnap as any).clearValue.bind(currentSnap);
      }
      if (typeof (currentSnap as any).resetValue === "function") {
        apiTarget.reset = (currentSnap as any).resetValue.bind(currentSnap);
      }
    }

    for (const k of Object.keys(child)) {
      const v = child[k];
      if (typeof v === "function" && !(k in apiTarget)) {
        apiTarget[k] = v.bind(child);
      }
    }

    const comp = getChildInstance(child);
    if (comp) {
      if (typeof comp.send === "function" && !("send" in apiTarget)) {
        apiTarget.send = comp.send.bind(comp);
      }
      if (
        typeof comp.getSnapshot === "function" &&
        !("getSnapshot" in apiTarget)
      ) {
        apiTarget.getSnapshot = comp.getSnapshot.bind(comp);
      }
    }

    isApiDirty = false;
  };

  const apiProxy = new Proxy(apiTarget, {
    get(targetObj, prop, receiver) {
      if (isApiDirty) syncApiTarget();
      if (typeof prop === "string" && prop in targetObj) {
        return targetObj[prop];
      }
      return Reflect.get(targetObj, prop, receiver);
    },
    has(targetObj, prop) {
      if (isApiDirty) syncApiTarget();
      return prop in targetObj;
    },
    ownKeys(targetObj) {
      if (isApiDirty) syncApiTarget();
      return Reflect.ownKeys(targetObj);
    },
    getOwnPropertyDescriptor(targetObj, prop) {
      if (isApiDirty) syncApiTarget();
      return Reflect.getOwnPropertyDescriptor(targetObj, prop);
    },
  });

  const update = () => {
    if (isDisposed) return;
    const snapshot = computeSnapshot();
    if (snapshot === undefined) return;

    latestSnapshot = snapshot;
    isApiDirty = true;

    if (onChange) {
      onChange(snapshot);
    }

    if (key && snapshot && typeof snapshot === "object") {
      const delta = diffSnapshot(
        prevSyncedSnapshot,
        snapshot as Record<string, any>,
        key,
      );
      // Shallow copy prevents in-place mutation bugs on next diff
      prevSyncedSnapshot = { ...(snapshot as Record<string, any>) };

      if (!delta) return;

      Object.assign(pendingDelta, delta);
      if (!isBatchScheduled) {
        isBatchScheduled = true;
        queueMicrotask(flushSetData);
      }
    }
  };

  const bindChild = () => {
    if (isDisposed || unsubscribeMachine) return;
    const child = ensureChild();
    if (!child) return;

    const machine = getChildMachine<T>(child);
    if (machine && typeof machine.subscribe === "function") {
      unsubscribeMachine = machine.subscribe(update);
    }

    const comp = getChildInstance(child);
    if (comp && !unsubscribeMachine) {
      if (!comp[LISTENER_SET_KEY]) {
        const listeners = new Set<() => void>();
        comp[LISTENER_SET_KEY] = listeners;
        const origOnSnapshot = comp.__codeUiOnSnapshot;
        comp.__codeUiOnSnapshot = (snap: any) => {
          origOnSnapshot?.(snap);
          listeners.forEach((fn) => fn());
        };
      }
      comp[LISTENER_SET_KEY].add(update);
      unsubscribeMachine = () => {
        comp[LISTENER_SET_KEY]?.delete(update);
      };
    }

    // Initial snapshot sync
    update();
  };

  // Attempt initial binding immediately
  bindChild();

  // If child was not found yet (e.g. called in onLoad or attached before child mounted),
  // schedule nextTick and hook into Page.onReady / Component.ready
  if (!activeChild && typeof target === "string" && instance) {
    const pageOrComp = instance as any;

    if (typeof wx !== "undefined" && typeof wx.nextTick === "function") {
      wx.nextTick(bindChild);
    } else {
      Promise.resolve().then(bindChild);
    }

    for (const hook of ["onReady", "ready"] as const) {
      if (typeof pageOrComp[hook] === "function") {
        const origHook = pageOrComp[hook];
        pageOrComp[hook] = function (this: any, ...args: any[]) {
          bindChild();
          return origHook.apply(this, args);
        };
      }
    }
  }

  const stop = () => {
    if (isDisposed) return;
    isDisposed = true;
    if (unsubscribeMachine) {
      unsubscribeMachine();
      unsubscribeMachine = undefined;
    }
    pendingDelta = {};
    isBatchScheduled = false;
  };

  // Auto-cleanup on parent unmount (Page.onUnload & Component.detached)
  if (instance) {
    const pageOrComp = instance as any;
    for (const hook of ["onUnload", "detached"] as const) {
      if (typeof pageOrComp[hook] === "function") {
        const origHook = pageOrComp[hook];
        pageOrComp[hook] = function (this: any, ...args: any[]) {
          stop();
          return origHook.apply(this, args);
        };
      }
    }
  }

  const send = (event: T["event"]) => {
    if (!unsubscribeMachine) {
      bindChild();
    }
    const child = ensureChild();
    if (typeof child?.send === "function") {
      child.send(event);
      return;
    }
    const machine = getChildMachine<T>(child);
    if (machine && typeof machine.send === "function") {
      machine.send(event);
      return;
    }
    warn(
      true,
      `[useChild] Unable to send event; child component for target "${String(target)}" was not found.`,
    );
  };

  return {
    getSnapshot: () => latestSnapshot ?? computeSnapshot(),
    get snapshot() {
      return latestSnapshot ?? computeSnapshot();
    },
    api: apiProxy as unknown as UseChildApi<Data>,
    send,
    get service() {
      return getChildService<T>(ensureChild());
    },
    stop,
  };
}
