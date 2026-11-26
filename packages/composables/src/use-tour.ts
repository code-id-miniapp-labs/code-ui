import type {
  TourApi,
  TourOpenChangeDetails,
  TourSchema,
  TourStatus,
  TourStatusChangeDetails,
  TourStepChangeDetails,
  TourStepDetails,
} from "@code-id-labs/tour";
import {
  useComponentRef,
  type UseComponentRefInstance,
  type UseComponentRefReturn,
} from "./use-component-ref";

export type {
  TourApi,
  TourOpenChangeDetails,
  TourStatus,
  TourStatusChangeDetails,
  TourStepChangeDetails,
  TourStepDetails,
};

export interface UseTourTarget {
  data?: Record<string, any> | undefined;
  setData?: ((data: Record<string, unknown>) => void) | undefined;
  selectComponent?: ((selector: string) => any) | undefined;
  onReady?: ((...args: any[]) => any) | undefined;
  ready?: ((...args: any[]) => any) | undefined;
  onUnload?: ((...args: any[]) => any) | undefined;
  detached?: ((...args: any[]) => any) | undefined;
}

export interface TourEventLike<TDetail = Record<string, unknown>> {
  detail?: TDetail | undefined;
}

export interface UseTourSnapshot {
  open: boolean;
  visible: boolean;
  status: TourStatus;
  step: TourStepDetails | null;
  stepId: string | null;
  stepIndex: number;
  totalSteps: number;
  hasNextStep: boolean;
  hasPrevStep: boolean;
  firstStep: boolean;
  lastStep: boolean;
  progressPercent: number;
  progressText: string;
  completed: boolean;
}

export interface UseTourOptions {
  /** Page or Component instance (`this`) for `selectComponent` and/or `setData` syncing */
  target?: UseTourTarget | undefined;
  /**
   * CSS selector pointing to `<c-tour id="..." />` (e.g. `"#main-tour"`).
   * When provided, `useTour` binds directly to the component's live machine via `useComponentRef`.
   * When omitted, `useTour` manages controlled state and syncs it to `target.data[key]`.
   */
  selector?: string | undefined;
  /**
   * Optional data key under `target.data` (e.g. `key: "tour"`) to sync reactive tour state
   * (`open`, `visible`, `stepId`, `stepIndex`, `totalSteps`, `status`, `progressPercent`, `progressText`, `completed`, and `steps`).
   */
  key?: string | undefined;
  /** Ordered list of tour steps */
  steps?: TourStepDetails[] | undefined;
  /** Initial step id when starting without an explicit `stepId` */
  defaultStepId?: string | null | undefined;
  /**
   * Optional persistence key stored via `wx.getStorageSync` / `wx.setStorageSync`
   * (falls back to in-memory storage outside MiniApp) for `startOnce()` & `hasCompleted()`.
   */
  storageKey?: string | undefined;
  /**
   * Whether skipping the tour also marks `storageKey` as completed.
   * @default false
   */
  markCompletedOnSkip?: boolean | undefined;
  /** Optional custom formatter for `progressText` in controlled mode (default: `"1 / N"`) */
  getProgressText?:
    | ((details: { stepIndex: number; totalSteps: number }) => string)
    | undefined;
  /** Callback fired whenever any tour snapshot field changes */
  onChange?: ((snapshot: UseTourSnapshot) => void) | undefined;
  /** Callback fired when the tour starts */
  onStart?: (() => void) | undefined;
  /** Callback fired when active step changes */
  onStepChange?: ((details: TourStepChangeDetails) => void) | undefined;
  /** Callback fired when tour status transitions */
  onStatusChange?: ((details: TourStatusChangeDetails) => void) | undefined;
  /** Callback fired when open state toggles */
  onOpenChange?: ((details: TourOpenChangeDetails) => void) | undefined;
  /** Callback fired when the tour reaches completion */
  onComplete?: (() => void) | undefined;
  /** Callback fired when the tour is skipped */
  onSkip?: (() => void) | undefined;
  /** Callback fired when the tour is dismissed/closed */
  onDismiss?: (() => void) | undefined;
}

export interface UseTourReturn {
  readonly open: boolean;
  readonly visible: boolean;
  readonly status: TourStatus;
  readonly step: TourStepDetails | null;
  readonly stepId: string | null;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly hasNextStep: boolean;
  readonly hasPrevStep: boolean;
  readonly firstStep: boolean;
  readonly lastStep: boolean;
  readonly progressPercent: number;
  readonly progressText: string;
  readonly completed: boolean;

  /** Read the current tour snapshot */
  getState: () => UseTourSnapshot;
  /** Start the tour (optionally at a specific `stepId`) */
  start: (stepId?: string) => void;
  /**
   * Start the tour only if it has not been marked completed yet (via `storageKey`).
   * Returns `true` if started, `false` if already completed or no steps exist.
   */
  startOnce: (stepId?: string) => boolean;
  /** Imperatively set open state */
  setOpen: (open: boolean) => void;
  /** Advance to the next step (or complete on the last step) */
  next: () => void;
  /** Return to the previous step */
  prev: () => void;
  /** Jump directly to a step by id or 0-based index */
  goTo: (stepIdOrIndex: string | number) => void;
  /** Skip the tour */
  skip: () => void;
  /** Dismiss the tour */
  dismiss: () => void;
  /** Close the tour */
  close: () => void;
  /** Re-measure the active target and reposition spotlight/tooltip */
  reposition: () => void;
  /** Replace the tour steps dynamically */
  setSteps: (steps: TourStepDetails[]) => void;

  /** Check whether this tour has been completed (persisted via `storageKey` if set) */
  hasCompleted: () => boolean;
  /** Mark this tour as completed in storage */
  markCompleted: () => void;
  /** Clear completion flag so `startOnce()` can run again */
  resetCompleted: () => void;

  /** Optional WXML handler for `bind:stepChange` in controlled mode */
  handleStepChange: (event: TourEventLike<TourStepChangeDetails>) => void;
  /** Optional WXML handler for `bind:statusChange` in controlled mode */
  handleStatusChange: (event: TourEventLike<TourStatusChangeDetails>) => void;
  /** Optional WXML handler for `bind:openChange` in controlled mode */
  handleOpenChange: (event: TourEventLike<TourOpenChangeDetails>) => void;

  /** Dispose reactive subscriptions and clean up hooks */
  stop: () => void;
  /** Prevent accidental circular serialization if attached on a Page instance */
  toJSON?: () => undefined;
}

interface WxStorageApi {
  getStorageSync?: (key: string) => unknown;
  setStorageSync?: (key: string, data: unknown) => void;
  removeStorageSync?: (key: string) => void;
  nextTick?: (cb: () => void) => void;
}

const memoryCompletionStorage = new Map<string, boolean>();

function readCompletedFlag(storageKey?: string): boolean {
  if (!storageKey) return false;
  const wxApi = (globalThis as { wx?: WxStorageApi }).wx;
  if (wxApi && typeof wxApi.getStorageSync === "function") {
    try {
      return Boolean(wxApi.getStorageSync(storageKey));
    } catch {
      // Fall back to memory storage
    }
  }
  return Boolean(memoryCompletionStorage.get(storageKey));
}

function writeCompletedFlag(storageKey: string | undefined, value: boolean): void {
  if (!storageKey) return;
  const wxApi = (globalThis as { wx?: WxStorageApi }).wx;
  if (wxApi) {
    try {
      if (value && typeof wxApi.setStorageSync === "function") {
        wxApi.setStorageSync(storageKey, true);
        return;
      }
      if (!value && typeof wxApi.removeStorageSync === "function") {
        wxApi.removeStorageSync(storageKey);
        return;
      }
    } catch {
      // Fall back to memory storage
    }
  }
  if (value) {
    memoryCompletionStorage.set(storageKey, true);
  } else {
    memoryCompletionStorage.delete(storageKey);
  }
}

function resolveTourComponentApi(
  target: UseTourTarget | undefined,
  selector: string | undefined,
  ref: UseComponentRefReturn<TourSchema, TourApi> | null,
): TourApi | null {
  if (ref && typeof ref.api?.start === "function") {
    return ref.api as unknown as TourApi;
  }
  if (target && selector && typeof target.selectComponent === "function") {
    const comp = target.selectComponent(selector);
    if (!comp) return null;
    if (typeof comp.start === "function") return comp as TourApi;
    if (comp.tour && typeof comp.tour.start === "function") {
      return comp.tour as TourApi;
    }
  }
  return null;
}

function findStepIndex(
  steps: TourStepDetails[],
  stepId: string | null,
): number {
  if (!Array.isArray(steps) || steps.length === 0) return -1;
  if (stepId) {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx !== -1) return idx;
  }
  return 0;
}

/**
 * Composable helper for controlling `<c-tour>` with ergonomic imperative methods,
 * reactive state syncing, lifecycle callbacks, and optional one-time onboarding persistence.
 */
export function useTour(options: UseTourOptions = {}): UseTourReturn {
  const {
    target,
    selector,
    key,
    defaultStepId = null,
    storageKey,
    markCompletedOnSkip = false,
    getProgressText,
    onChange,
    onStart,
    onStepChange,
    onStatusChange,
    onOpenChange,
    onComplete,
    onSkip,
    onDismiss,
  } = options;

  let steps: TourStepDetails[] = Array.isArray(options.steps)
    ? [...options.steps]
    : [];
  let completed = readCompletedFlag(storageKey);
  let isDisposed = false;

  // Internal controlled state (used when no selector is provided, or before child mounts)
  let localOpen = false;
  let localVisible = false;
  let localStatus: TourStatus = "idle";
  let localStepId: string | null =
    defaultStepId && steps.some((s) => s.id === defaultStepId)
      ? defaultStepId
      : (steps[0]?.id ?? null);

  // Track last emitted values to avoid duplicate lifecycle callbacks
  let prevOpen = false;
  let prevStepId: string | null = localStepId;
  let prevStatus: TourStatus = "idle";
  let prevSyncedFields: Record<string, unknown> | null = null;

  // Pending imperative start queued if start() is called before <c-tour> finishes mounting
  let pendingStart: { active: boolean; stepId?: string | undefined } | null =
    null;

  let compRef: UseComponentRefReturn<TourSchema, TourApi> | null = null;

  const buildSnapshot = (liveApi?: TourApi | null): UseTourSnapshot => {
    if (liveApi) {
      return {
        open: Boolean(liveApi.open),
        visible: Boolean(liveApi.visible),
        status: liveApi.status ?? "idle",
        step: liveApi.step ?? null,
        stepId: liveApi.stepId ?? null,
        stepIndex: typeof liveApi.stepIndex === "number" ? liveApi.stepIndex : -1,
        totalSteps:
          typeof liveApi.totalSteps === "number"
            ? liveApi.totalSteps
            : steps.length,
        hasNextStep: Boolean(liveApi.hasNextStep),
        hasPrevStep: Boolean(liveApi.hasPrevStep),
        firstStep: Boolean(liveApi.firstStep),
        lastStep: Boolean(liveApi.lastStep),
        progressPercent:
          typeof liveApi.progressPercent === "number"
            ? liveApi.progressPercent
            : 0,
        progressText: liveApi.progressText ?? "",
        completed,
      };
    }

    const totalSteps = steps.length;
    const stepIndex = findStepIndex(steps, localStepId);
    const step = stepIndex >= 0 ? (steps[stepIndex] ?? null) : null;
    const resolvedStepId = step?.id ?? null;
    const progressPercent =
      totalSteps > 0 && stepIndex >= 0
        ? Math.round(((stepIndex + 1) / totalSteps) * 100)
        : 0;
    const progressText =
      totalSteps > 0 && stepIndex >= 0
        ? typeof getProgressText === "function"
          ? getProgressText({ stepIndex, totalSteps })
          : `${stepIndex + 1} / ${totalSteps}`
        : "";

    return {
      open: localOpen,
      visible: localVisible,
      status: localStatus,
      step,
      stepId: resolvedStepId,
      stepIndex,
      totalSteps,
      hasNextStep: totalSteps > 0 && stepIndex >= 0 && stepIndex < totalSteps - 1,
      hasPrevStep: stepIndex > 0,
      firstStep: stepIndex <= 0,
      lastStep: totalSteps <= 0 || stepIndex >= totalSteps - 1,
      progressPercent,
      progressText,
      completed,
    };
  };

  let currentSnapshot: UseTourSnapshot = buildSnapshot(null);

  const syncToTarget = (
    snap: UseTourSnapshot,
    includeSteps = false,
  ): void => {
    if (isDisposed || !target || typeof target.setData !== "function") return;
    if (!key) return;

    const fields: Record<string, unknown> = {
      open: snap.open,
      visible: snap.visible,
      status: snap.status,
      stepId: snap.stepId,
      stepIndex: snap.stepIndex,
      totalSteps: snap.totalSteps,
      hasNextStep: snap.hasNextStep,
      hasPrevStep: snap.hasPrevStep,
      firstStep: snap.firstStep,
      lastStep: snap.lastStep,
      progressPercent: snap.progressPercent,
      progressText: snap.progressText,
      completed: snap.completed,
    };

    if (prevSyncedFields === null) {
      prevSyncedFields = { ...fields };
      const initialObj: Record<string, unknown> = includeSteps
        ? { ...fields, steps }
        : fields;
      target.setData({ [key]: initialObj });
      return;
    }

    const patch: Record<string, unknown> = {};
    for (const [fieldKey, val] of Object.entries(fields)) {
      if (!Object.is(prevSyncedFields[fieldKey], val)) {
        patch[`${key}.${fieldKey}`] = val;
        prevSyncedFields[fieldKey] = val;
      }
    }
    if (includeSteps) {
      patch[`${key}.steps`] = steps;
    }

    if (Object.keys(patch).length > 0) {
      target.setData(patch);
    }
  };

  const emitTransitions = (snap: UseTourSnapshot): void => {
    if (snap.status !== prevStatus) {
      prevStatus = snap.status;
      if (
        snap.status === "completed" ||
        (markCompletedOnSkip && snap.status === "skipped")
      ) {
        if (!completed) {
          completed = true;
          writeCompletedFlag(storageKey, true);
          snap.completed = true;
        }
      }

      onStatusChange?.({
        status: snap.status,
        stepId: snap.stepId,
        stepIndex: snap.stepIndex,
      });

      if (snap.status === "started") {
        onStart?.();
      } else if (snap.status === "completed") {
        onComplete?.();
      } else if (snap.status === "skipped") {
        onSkip?.();
      } else if (snap.status === "dismissed") {
        onDismiss?.();
      }
    }

    if (snap.stepId !== prevStepId) {
      prevStepId = snap.stepId;
      onStepChange?.({
        stepId: snap.stepId,
        stepIndex: snap.stepIndex,
        totalSteps: snap.totalSteps,
        step: snap.step,
      });
    }

    if (snap.open !== prevOpen) {
      prevOpen = snap.open;
      onOpenChange?.({ open: snap.open });
    }
  };

  const commitSnapshot = (
    snap: UseTourSnapshot,
    includeSteps = false,
  ): void => {
    currentSnapshot = snap;
    emitTransitions(snap);
    syncToTarget(snap, includeSteps);
    onChange?.(snap);
  };

  const flushPendingStart = (): void => {
    if (!pendingStart?.active || isDisposed) return;
    const api = resolveTourComponentApi(target, selector, compRef);
    if (!api) return;
    const req = pendingStart;
    pendingStart = null;
    if (req.stepId !== undefined) {
      api.start(req.stepId);
    } else {
      api.start();
    }
  };

  // Initial sync to target.data[key] (includes steps if provided)
  syncToTarget(currentSnapshot, options.steps !== undefined);

  // Bind to `<c-tour id="..." />` via useComponentRef when `selector` is provided
  if (target && selector) {
    compRef = useComponentRef<TourSchema, TourApi>(
      target as UseComponentRefInstance,
      selector,
      {
        onChange: (apiSnap) => {
          if (isDisposed) return;
          const snap = buildSnapshot(apiSnap);
          commitSnapshot(snap);
          flushPendingStart();
        },
      },
    );

    const scheduleFlush = () => {
      const wxApi = (globalThis as { wx?: WxStorageApi }).wx;
      if (wxApi && typeof wxApi.nextTick === "function") {
        wxApi.nextTick(flushPendingStart);
      } else {
        Promise.resolve().then(flushPendingStart);
      }
    };

    for (const hook of ["onReady", "ready"] as const) {
      if (typeof target[hook] === "function") {
        const origHook = target[hook];
        target[hook] = function (this: unknown, ...args: unknown[]) {
          const result = origHook.apply(this, args);
          flushPendingStart();
          return result;
        };
      }
    }

    scheduleFlush();
  }

  const getActiveApi = (): TourApi | null =>
    resolveTourComponentApi(target, selector, compRef);

  const start = (stepId?: string): void => {
    if (isDisposed) return;
    const api = getActiveApi();
    if (api) {
      pendingStart = null;
      if (stepId !== undefined) {
        api.start(stepId);
      } else {
        api.start();
      }
      return;
    }

    if (selector) {
      pendingStart = { active: true, stepId };
      const wxApi = (globalThis as { wx?: WxStorageApi }).wx;
      if (wxApi && typeof wxApi.nextTick === "function") {
        wxApi.nextTick(flushPendingStart);
      } else {
        Promise.resolve().then(flushPendingStart);
      }
      return;
    }

    if (steps.length === 0) return;
    const resolvedId =
      stepId && steps.some((s) => s.id === stepId)
        ? stepId
        : defaultStepId && steps.some((s) => s.id === defaultStepId)
          ? defaultStepId
          : (steps[0]?.id ?? null);
    localStepId = resolvedId;
    localOpen = true;
    localVisible = true;
    localStatus = "started";
    commitSnapshot(buildSnapshot(null));
  };

  const hasCompleted = (): boolean => {
    if (storageKey) {
      completed = readCompletedFlag(storageKey);
    }
    return completed;
  };

  const markCompleted = (): void => {
    completed = true;
    writeCompletedFlag(storageKey, true);
    const snap = buildSnapshot(compRef?.snapshot ?? null);
    snap.completed = true;
    currentSnapshot = snap;
    syncToTarget(snap);
    onChange?.(snap);
  };

  const resetCompleted = (): void => {
    completed = false;
    writeCompletedFlag(storageKey, false);
    const snap = buildSnapshot(compRef?.snapshot ?? null);
    snap.completed = false;
    currentSnapshot = snap;
    syncToTarget(snap);
    onChange?.(snap);
  };

  const startOnce = (stepId?: string): boolean => {
    if (isDisposed || hasCompleted()) return false;
    if (!selector && steps.length === 0) return false;
    start(stepId);
    return true;
  };

  const setOpen = (nextOpen: boolean): void => {
    if (isDisposed) return;
    const api = getActiveApi();
    if (api) {
      api.setOpen(nextOpen);
      return;
    }
    if (nextOpen) {
      start();
    } else {
      close();
    }
  };

  const next = (): void => {
    if (isDisposed) return;
    const api = getActiveApi();
    if (api) {
      api.next();
      return;
    }
    if (!localOpen || steps.length === 0) return;
    const idx = findStepIndex(steps, localStepId);
    const nextStep = steps[idx + 1];
    if (nextStep) {
      localStepId = nextStep.id;
      commitSnapshot(buildSnapshot(null));
    } else {
      localOpen = false;
      localVisible = false;
      localStatus = "completed";
      commitSnapshot(buildSnapshot(null));
    }
  };

  const prev = (): void => {
    if (isDisposed) return;
    const api = getActiveApi();
    if (api) {
      api.prev();
      return;
    }
    if (!localOpen || steps.length === 0) return;
    const idx = findStepIndex(steps, localStepId);
    const prevStep = steps[idx - 1];
    if (prevStep) {
      localStepId = prevStep.id;
      commitSnapshot(buildSnapshot(null));
    }
  };

  const goTo = (stepIdOrIndex: string | number): void => {
    if (isDisposed) return;
    const api = getActiveApi();
    if (api) {
      api.goTo(stepIdOrIndex);
      return;
    }
    if (steps.length === 0) return;
    const targetStep =
      typeof stepIdOrIndex === "number"
        ? steps[stepIdOrIndex]
        : steps.find((s) => s.id === stepIdOrIndex);
    if (!targetStep) return;
    localStepId = targetStep.id;
    if (!localOpen) {
      localOpen = true;
      localVisible = true;
      localStatus = "started";
    }
    commitSnapshot(buildSnapshot(null));
  };

  const skip = (): void => {
    if (isDisposed) return;
    pendingStart = null;
    const api = getActiveApi();
    if (api) {
      api.skip();
      return;
    }
    if (!localOpen) return;
    localOpen = false;
    localVisible = false;
    localStatus = "skipped";
    commitSnapshot(buildSnapshot(null));
  };

  const dismiss = (): void => {
    if (isDisposed) return;
    pendingStart = null;
    const api = getActiveApi();
    if (api) {
      api.dismiss();
      return;
    }
    if (!localOpen) return;
    localOpen = false;
    localVisible = false;
    localStatus = "dismissed";
    commitSnapshot(buildSnapshot(null));
  };

  const close = (): void => {
    if (isDisposed) return;
    pendingStart = null;
    const api = getActiveApi();
    if (api) {
      api.close();
      return;
    }
    dismiss();
  };

  const reposition = (): void => {
    if (isDisposed) return;
    getActiveApi()?.reposition();
  };

  const setSteps = (nextSteps: TourStepDetails[]): void => {
    if (isDisposed) return;
    steps = Array.isArray(nextSteps) ? [...nextSteps] : [];
    if (steps.length === 0) {
      localStepId = null;
    } else if (!localStepId || !steps.some((s) => s.id === localStepId)) {
      localStepId = steps[0]?.id ?? null;
    }
    const snap = buildSnapshot(compRef?.snapshot ?? null);
    currentSnapshot = snap;
    syncToTarget(snap, true);
    onChange?.(snap);
  };

  const handleStepChange = (
    event: TourEventLike<TourStepChangeDetails>,
  ): void => {
    if (isDisposed || compRef) return;
    const detail = event?.detail;
    if (!detail) return;
    localStepId = detail.stepId ?? null;
    commitSnapshot(buildSnapshot(null));
  };

  const handleStatusChange = (
    event: TourEventLike<TourStatusChangeDetails>,
  ): void => {
    if (isDisposed || compRef) return;
    const detail = event?.detail;
    if (!detail?.status) return;
    localStatus = detail.status;
    if (
      detail.status === "completed" ||
      detail.status === "skipped" ||
      detail.status === "dismissed"
    ) {
      localOpen = false;
      localVisible = false;
    } else if (detail.status === "started") {
      localOpen = true;
      localVisible = true;
    }
    commitSnapshot(buildSnapshot(null));
  };

  const handleOpenChange = (
    event: TourEventLike<TourOpenChangeDetails>,
  ): void => {
    if (isDisposed || compRef) return;
    const detail = event?.detail;
    if (typeof detail?.open !== "boolean") return;
    localOpen = detail.open;
    localVisible = detail.open;
    commitSnapshot(buildSnapshot(null));
  };

  const stop = (): void => {
    if (isDisposed) return;
    isDisposed = true;
    pendingStart = null;
    compRef?.stop();
    compRef = null;
  };

  const returnObj: UseTourReturn = {
    get open() {
      return currentSnapshot.open;
    },
    get visible() {
      return currentSnapshot.visible;
    },
    get status() {
      return currentSnapshot.status;
    },
    get step() {
      return currentSnapshot.step;
    },
    get stepId() {
      return currentSnapshot.stepId;
    },
    get stepIndex() {
      return currentSnapshot.stepIndex;
    },
    get totalSteps() {
      return currentSnapshot.totalSteps;
    },
    get hasNextStep() {
      return currentSnapshot.hasNextStep;
    },
    get hasPrevStep() {
      return currentSnapshot.hasPrevStep;
    },
    get firstStep() {
      return currentSnapshot.firstStep;
    },
    get lastStep() {
      return currentSnapshot.lastStep;
    },
    get progressPercent() {
      return currentSnapshot.progressPercent;
    },
    get progressText() {
      return currentSnapshot.progressText;
    },
    get completed() {
      return currentSnapshot.completed;
    },

    getState: () => ({ ...currentSnapshot }),
    start,
    startOnce,
    setOpen,
    next,
    prev,
    goTo,
    skip,
    dismiss,
    close,
    reposition,
    setSteps,
    hasCompleted,
    markCompleted,
    resetCompleted,
    handleStepChange,
    handleStatusChange,
    handleOpenChange,
    stop,
  };

  Object.defineProperty(returnObj, "toJSON", {
    value: () => undefined,
    enumerable: false,
    configurable: true,
  });

  return returnObj;
}
