export type PresenceLifecycleState = "unmounted" | "open" | "exiting";

export interface PresenceSnapshot {
  /** Whether the target overlay is logically present (`state === "open"`) */
  present: boolean;
  /** Alias for `present` — binds directly to `<c-drawer open="{{...}}">` */
  open: boolean;
  /** Whether the target wrapper should be mounted — binds to `wx:if="{{...}}"` */
  mounted: boolean;
  /** Current presence lifecycle state */
  state: PresenceLifecycleState;
}

export interface PresenceControllerOptions {
  /** Initial present/open state. @default false */
  initialPresent?: boolean | undefined;
  /** Defer mounting until opened for the first time. @default true */
  lazyMount?: boolean | undefined;
  /** Unmount (`mounted: false`) after exit completes. @default true */
  unmountOnExit?: boolean | undefined;
  /**
   * Optional exit duration in ms.
   * - `0`: unmounts immediately on `hide()` and fires `onExitComplete`.
   * - `> 0`: starts a safety/auto-exit timer on `hide()` that settles if `onExitComplete()` is not called sooner.
   * - `null` / `undefined`: waits for an explicit `onExitComplete()` call (e.g. from `bind:exitcomplete`).
   */
  duration?: number | null | undefined;
  /** Callback fired whenever snapshot state changes */
  onChange?: ((snapshot: PresenceSnapshot) => void) | undefined;
  /** Callback fired when exit animation settles into `unmounted` */
  onExitComplete?: (() => void) | undefined;
}

export interface PresenceController {
  getState: () => PresenceSnapshot;
  show: () => void;
  hide: () => void;
  setPresent: (next: boolean) => void;
  toggle: () => void;
  /** Invoke from `bind:exitcomplete` on `<c-drawer>`, `<c-modal>`, `<c-action-sheet>`, or `<c-presence>` */
  onExitComplete: () => void;
  /** Cancel any pending exit timer */
  stop: () => void;
}

export function createPresenceController(
  options: PresenceControllerOptions = {},
): PresenceController {
  const lazyMount = options.lazyMount ?? true;
  const unmountOnExit = options.unmountOnExit ?? true;
  const duration = options.duration ?? null;

  let state: PresenceLifecycleState = options.initialPresent
    ? "open"
    : "unmounted";
  let hasMountedOnce = Boolean(options.initialPresent);
  let exitTimer: ReturnType<typeof setTimeout> | undefined;

  const clearExitTimer = () => {
    if (exitTimer !== undefined) {
      clearTimeout(exitTimer);
      exitTimer = undefined;
    }
  };

  const computeMounted = (): boolean =>
    state !== "unmounted" ||
    (!unmountOnExit && (!lazyMount || hasMountedOnce));

  const getState = (): PresenceSnapshot => ({
    present: state === "open",
    open: state === "open",
    mounted: computeMounted(),
    state,
  });

  const emitChange = () => {
    options.onChange?.(getState());
  };

  const finishExit = () => {
    if (state !== "exiting") return;
    clearExitTimer();
    state = "unmounted";
    emitChange();
    options.onExitComplete?.();
  };

  const show = () => {
    clearExitTimer();
    if (state === "open") return;
    hasMountedOnce = true;
    state = "open";
    emitChange();
  };

  const hide = () => {
    if (state !== "open") return;
    clearExitTimer();

    if (duration === 0) {
      state = "unmounted";
      emitChange();
      options.onExitComplete?.();
      return;
    }

    state = "exiting";
    emitChange();

    if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
      exitTimer = setTimeout(() => {
        exitTimer = undefined;
        finishExit();
      }, duration);
    }
  };

  const setPresent = (next: boolean) => {
    if (next) show();
    else hide();
  };

  const toggle = () => {
    if (state === "open") hide();
    else show();
  };

  const stop = () => {
    clearExitTimer();
  };

  return {
    getState,
    show,
    hide,
    setPresent,
    toggle,
    onExitComplete: finishExit,
    stop,
  };
}

export interface CreatePresenceBehaviorOptions {
  /** Data key under `this.data` (e.g. `"drawer"` -> `this.data.drawer = { open, mounted, present, state }`). @default "presence" */
  key?: string | undefined;
  /** Initial open/present state. @default false */
  defaultOpen?: boolean | undefined;
  /** Defer mounting until opened for the first time. @default true */
  lazyMount?: boolean | undefined;
  /** Unmount (`mounted: false`) after exit completes. @default true */
  unmountOnExit?: boolean | undefined;
  /** Optional fallback exit duration in ms if `exitcomplete` is not wired */
  duration?: number | null | undefined;
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Parent-level Behavior helper for truly unmounting heavy overlay components
 * (`<c-drawer>`, `<c-modal>`, `<c-action-sheet>`) via `wx:if="{{<key>.mounted}}"`
 * once `bind:exitcomplete` fires.
 *
 * Does NOT declare `pageLifetimes`.
 */
export function createPresenceBehavior(
  options: CreatePresenceBehaviorOptions = {},
) {
  if (typeof Behavior === "undefined") {
    return {} as any;
  }

  const key = options.key || "presence";
  const cap = capitalize(key);
  const ctrlKey = `__cuiPresenceCtrl_${key}`;

  const initialController = createPresenceController({
    initialPresent: options.defaultOpen,
    lazyMount: options.lazyMount,
    unmountOnExit: options.unmountOnExit,
    duration: options.duration,
  });
  const initialSnapshot = initialController.getState();

  function ensureController(instance: Record<string, any>): PresenceController {
    let ctrl = instance[ctrlKey] as PresenceController | undefined;
    if (!ctrl) {
      ctrl = createPresenceController({
        initialPresent: Boolean(instance.data?.[key]?.open ?? options.defaultOpen),
        lazyMount: options.lazyMount,
        unmountOnExit: options.unmountOnExit,
        duration: options.duration,
        onChange: (snapshot) => {
          instance.setData?.({ [key]: snapshot });
        },
      });
      instance[ctrlKey] = ctrl;
    }
    return ctrl;
  }

  const methods: Record<string, (this: Record<string, any>, ...args: any[]) => any> = {
    [`show${cap}`](this: Record<string, any>) {
      ensureController(this).show();
    },
    [`open${cap}`](this: Record<string, any>) {
      ensureController(this).show();
    },
    [`hide${cap}`](this: Record<string, any>) {
      ensureController(this).hide();
    },
    [`close${cap}`](this: Record<string, any>) {
      ensureController(this).hide();
    },
    [`toggle${cap}`](this: Record<string, any>) {
      ensureController(this).toggle();
    },
    [`set${cap}Open`](this: Record<string, any>, next: boolean) {
      ensureController(this).setPresent(Boolean(next));
    },
    [`handle${cap}ExitComplete`](this: Record<string, any>) {
      ensureController(this).onExitComplete();
    },
  };

  return Behavior({
    data: {
      [key]: initialSnapshot,
    },

    lifetimes: {
      attached(this: Record<string, any>) {
        const ctrl = ensureController(this);
        this.setData?.({ [key]: ctrl.getState() });
      },

      detached(this: Record<string, any>) {
        const ctrl = this[ctrlKey] as PresenceController | undefined;
        ctrl?.stop();
        this[ctrlKey] = undefined;
      },
    },

    methods,
  });
}
