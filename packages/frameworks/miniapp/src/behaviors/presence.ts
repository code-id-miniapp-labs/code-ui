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

export interface PresenceEventLike {
  currentTarget?: {
    dataset?: Record<string, unknown> | undefined;
  } | undefined;
  target?: {
    dataset?: Record<string, unknown> | undefined;
  } | undefined;
}

export function resolvePresenceName(
  nameOrEvent: string | PresenceEventLike | null | undefined,
): string | undefined {
  if (typeof nameOrEvent === "string" && nameOrEvent.length > 0) {
    return nameOrEvent;
  }
  if (nameOrEvent && typeof nameOrEvent === "object") {
    const dataset =
      nameOrEvent.currentTarget?.dataset ?? nameOrEvent.target?.dataset;
    const raw = dataset?.name ?? dataset?.presence;
    if (typeof raw === "string" && raw.length > 0) {
      return raw;
    }
  }
  return undefined;
}

export interface CreatePresenceBehaviorOptions {
  /**
   * Data key(s) under `this.data`.
   * - `string` (default `"presence"`): manages a single overlay at `this.data[key]`.
   * - `readonly string[]`: manages multiple overlays at `this.data[name]` for each name in `key`,
   *   exposing shared `openPresence(nameOrEvent)`, `closePresence(nameOrEvent)`,
   *   `togglePresence(nameOrEvent)`, `handlePresenceExitComplete(nameOrEvent)`, and `closeAllPresence()`.
   */
  key?: string | readonly string[] | undefined;
  /** Initial open/present state (boolean in single mode, or per-key record in multi-key mode). @default false */
  defaultOpen?: boolean | Record<string, boolean> | undefined;
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

  if (Array.isArray(options.key) && options.key.length > 0) {
    const keyList = options.key as readonly string[];
    const ctrlMapKey = `__cuiPresenceCtrls_${keyList.join("_")}`;
    const defaultOpenMap =
      options.defaultOpen && typeof options.defaultOpen === "object"
        ? options.defaultOpen
        : undefined;

    const initialData: Record<string, PresenceSnapshot> = {};
    for (const name of keyList) {
      initialData[name] = createPresenceController({
        initialPresent: Boolean(defaultOpenMap?.[name]),
        lazyMount: options.lazyMount,
        unmountOnExit: options.unmountOnExit,
        duration: options.duration,
      }).getState();
    }

    function ensureControllers(
      instance: Record<string, any>,
    ): Record<string, PresenceController> {
      let ctrls = instance[ctrlMapKey] as
        | Record<string, PresenceController>
        | undefined;
      if (!ctrls) {
        ctrls = {};
        for (const name of keyList) {
          ctrls[name] = createPresenceController({
            initialPresent: Boolean(
              instance.data?.[name]?.open ?? defaultOpenMap?.[name],
            ),
            lazyMount: options.lazyMount,
            unmountOnExit: options.unmountOnExit,
            duration: options.duration,
            onChange: (snapshot) => {
              instance.setData?.({ [name]: snapshot });
            },
          });
        }
        instance[ctrlMapKey] = ctrls;
      }
      return ctrls;
    }

    const resolveTarget = (
      instance: Record<string, any>,
      nameOrEvent: string | PresenceEventLike,
    ): PresenceController | undefined => {
      const name = resolvePresenceName(nameOrEvent);
      if (!name) return undefined;
      return ensureControllers(instance)[name];
    };

    return Behavior({
      data: initialData,

      lifetimes: {
        attached(this: Record<string, any>) {
          const ctrls = ensureControllers(this);
          const patch: Record<string, PresenceSnapshot> = {};
          for (const name of keyList) {
            const ctrl = ctrls[name];
            if (ctrl) patch[name] = ctrl.getState();
          }
          this.setData?.(patch);
        },

        detached(this: Record<string, any>) {
          const ctrls = this[ctrlMapKey] as
            | Record<string, PresenceController>
            | undefined;
          if (ctrls) {
            for (const name of keyList) {
              ctrls[name]?.stop();
            }
          }
          this[ctrlMapKey] = undefined;
        },
      },

      methods: {
        showPresence(
          this: Record<string, any>,
          nameOrEvent: string | PresenceEventLike,
        ) {
          resolveTarget(this, nameOrEvent)?.show();
        },
        openPresence(
          this: Record<string, any>,
          nameOrEvent: string | PresenceEventLike,
        ) {
          resolveTarget(this, nameOrEvent)?.show();
        },
        hidePresence(
          this: Record<string, any>,
          nameOrEvent: string | PresenceEventLike,
        ) {
          resolveTarget(this, nameOrEvent)?.hide();
        },
        closePresence(
          this: Record<string, any>,
          nameOrEvent: string | PresenceEventLike,
        ) {
          resolveTarget(this, nameOrEvent)?.hide();
        },
        togglePresence(
          this: Record<string, any>,
          nameOrEvent: string | PresenceEventLike,
        ) {
          resolveTarget(this, nameOrEvent)?.toggle();
        },
        setPresenceOpen(
          this: Record<string, any>,
          name: string,
          next: boolean,
        ) {
          ensureControllers(this)[name]?.setPresent(Boolean(next));
        },
        handlePresenceExitComplete(
          this: Record<string, any>,
          nameOrEvent: string | PresenceEventLike,
        ) {
          resolveTarget(this, nameOrEvent)?.onExitComplete();
        },
        hideAllPresence(this: Record<string, any>) {
          const ctrls = ensureControllers(this);
          for (const name of keyList) {
            ctrls[name]?.hide();
          }
        },
        closeAllPresence(this: Record<string, any>) {
          const ctrls = ensureControllers(this);
          for (const name of keyList) {
            ctrls[name]?.hide();
          }
        },
      },
    });
  }

  const key = typeof options.key === "string" && options.key ? options.key : "presence";
  const cap = capitalize(key);

  const ctrlKey = `__cuiPresenceCtrl_${key}`;
  const initialOpen =
    typeof options.defaultOpen === "boolean" ? options.defaultOpen : false;

  const initialController = createPresenceController({
    initialPresent: initialOpen,
    lazyMount: options.lazyMount,
    unmountOnExit: options.unmountOnExit,
    duration: options.duration,
  });
  const initialSnapshot = initialController.getState();

  function ensureController(instance: Record<string, any>): PresenceController {
    let ctrl = instance[ctrlKey] as PresenceController | undefined;
    if (!ctrl) {
      ctrl = createPresenceController({
        initialPresent: Boolean(instance.data?.[key]?.open ?? initialOpen),
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

  const methods: Record<
    string,
    (this: Record<string, any>, ...args: any[]) => any
  > = {
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
