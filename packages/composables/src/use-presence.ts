import {
  createPresenceController,
  resolvePresenceName,
  type PresenceController,
  type PresenceEventLike,
  type PresenceLifecycleState,
  type PresenceSnapshot,
} from "@code-id-labs/miniapp/behaviors/presence";

export type {
  PresenceEventLike,
  PresenceLifecycleState,
  PresenceSnapshot,
};

export interface UsePresenceTarget {
  setData?: ((data: Record<string, unknown>) => void) | undefined;
}

export interface UsePresenceOptions {
  /** Optional Page or Component instance (`this`) to sync presence state into `target.data` */
  target?: UsePresenceTarget | undefined;
  /**
   * Data key under `target.data` (e.g. `key: "filterDrawer"` -> `target.data.filterDrawer = { open, present, mounted, state }`).
   * When omitted with `target`, writes `{ open, present, mounted, presenceState }` directly to `target.data`.
   */
  key?: string | undefined;
  /** Initial present/open state. @default false */
  initialPresent?: boolean | undefined;
  /** Defer mounting until first `show()`. @default true */
  lazyMount?: boolean | undefined;
  /** Unmount (`mounted: false`) once exit animation completes. @default true */
  unmountOnExit?: boolean | undefined;
  /**
   * Optional exit duration in ms.
   * - `0`: immediate unmount on `hide()`.
   * - `> 0`: auto-completes exit after duration if `onExitComplete()` isn't called earlier.
   * - `null` / omitted: waits for `onExitComplete()` (wired to `bind:exitcomplete`).
   */
  duration?: number | null | undefined;
  /** Callback fired whenever presence snapshot changes */
  onChange?: ((snapshot: PresenceSnapshot) => void) | undefined;
  /** Callback fired when exit animation finishes and settles into unmounted */
  onExitComplete?: (() => void) | undefined;
}

export interface UsePresenceMultiOptions<K extends string = string> {
  /** Optional Page or Component instance (`this`) to sync each overlay into `target.data[name]` */
  target?: UsePresenceTarget | undefined;
  /** Overlay data keys managed by this presence group (e.g. `["filterDrawer", "sortDrawer"] as const`) */
  key: readonly K[];
  /** Optional initial open state map per key */
  initialPresent?: Partial<Record<K, boolean>> | undefined;
  /** Defer mounting until first `show(name)`. @default true */
  lazyMount?: boolean | undefined;
  /** Unmount (`mounted: false`) once exit animation completes. @default true */
  unmountOnExit?: boolean | undefined;
  /** Optional exit duration in ms */
  duration?: number | null | undefined;
  /** Callback fired whenever any overlay snapshot changes */
  onChange?: ((name: K, snapshot: PresenceSnapshot) => void) | undefined;
  /** Callback fired when an overlay finishes exiting */
  onExitComplete?: ((name: K) => void) | undefined;
}

export interface UsePresenceReturn {
  /** Whether the overlay is logically present (`state === "open"`) */
  readonly present: boolean;
  /** Alias for `present` — binds to `<c-drawer open="{{...}}">` */
  readonly open: boolean;
  /** Whether the overlay should stay mounted — binds to `wx:if="{{...}}"` */
  readonly mounted: boolean;
  /** Current lifecycle state (`"unmounted" | "open" | "exiting"`) */
  readonly state: PresenceLifecycleState;
  /** Read current snapshot */
  getState: () => PresenceSnapshot;
  /** Mount (if needed) and open */
  show: () => void;
  /** Begin exit animation (remains mounted until `onExitComplete`) */
  hide: () => void;
  /** Imperatively set open/present state */
  setPresent: (next: boolean) => void;
  /** Toggle between open and exiting/unmounted */
  toggle: () => void;
  /** Bind to `bind:exitcomplete` on `<c-drawer>`, `<c-modal>`, `<c-action-sheet>`, or `<c-presence>` */
  onExitComplete: () => void;
  /** Clean up internal timers (call in `onUnload` / `detached`) */
  stop: () => void;
}

export interface UsePresenceMultiReturn<K extends string = string> {
  /** Read current snapshot for a specific overlay */
  getState: (name: K) => PresenceSnapshot;
  /** Read all overlay snapshots as a map */
  getAllStates: () => Record<K, PresenceSnapshot>;
  /** Mount (if needed) and open by overlay name or WXML event (`data-name` / `data-presence`) */
  show: (nameOrEvent: K | PresenceEventLike) => void;
  /** Begin exit animation by overlay name or WXML event (`data-name` / `data-presence`) */
  hide: (nameOrEvent: K | PresenceEventLike) => void;
  /** Imperatively set open/present state for a specific overlay */
  setPresent: (name: K, next: boolean) => void;
  /** Toggle a specific overlay by name or WXML event */
  toggle: (nameOrEvent: K | PresenceEventLike) => void;
  /** Complete exit for a specific overlay by name or WXML event (bind to `bind:exitcomplete`) */
  onExitComplete: (nameOrEvent: K | PresenceEventLike) => void;
  /** Hide all currently open overlays */
  hideAll: () => void;
  /** Clean up all internal timers (call in `onUnload` / `detached`) */
  stop: () => void;
}

export function usePresence<K extends string>(
  options: UsePresenceMultiOptions<K>,
): UsePresenceMultiReturn<K>;
export function usePresence(options?: UsePresenceOptions): UsePresenceReturn;
export function usePresence<K extends string = string>(
  options: UsePresenceOptions | UsePresenceMultiOptions<K> = {},
): UsePresenceReturn | UsePresenceMultiReturn<K> {
  if (Array.isArray(options.key)) {
    const multiOpts = options as UsePresenceMultiOptions<K>;
    const {
      target,
      initialPresent,
      lazyMount,
      unmountOnExit,
      duration,
      onChange,
      onExitComplete,
    } = multiOpts;
    const keys = multiOpts.key;

    const controllers = {} as Record<K, PresenceController>;
    const initialPatch = {} as Record<K, PresenceSnapshot>;

    for (const name of keys) {
      const ctrl = createPresenceController({
        initialPresent: Boolean(initialPresent?.[name]),
        lazyMount,
        unmountOnExit,
        duration,
        onChange: (snapshot) => {
          if (target && typeof target.setData === "function") {
            target.setData({ [name]: snapshot });
          }
          onChange?.(name, snapshot);
        },
        onExitComplete: () => {
          onExitComplete?.(name);
        },
      });
      controllers[name] = ctrl;
      initialPatch[name] = ctrl.getState();
    }

    if (target && typeof target.setData === "function") {
      target.setData(initialPatch);
    }

    const resolveCtrl = (
      nameOrEvent: K | PresenceEventLike,
    ): PresenceController | undefined => {
      const name = resolvePresenceName(nameOrEvent) as K | undefined;
      return name ? controllers[name] : undefined;
    };

    return {
      getState: (name: K) => {
        const ctrl = controllers[name];
        return ctrl
          ? ctrl.getState()
          : { present: false, open: false, mounted: false, state: "unmounted" };
      },
      getAllStates: () => {
        const result = {} as Record<K, PresenceSnapshot>;
        for (const name of keys) {
          result[name] = controllers[name].getState();
        }
        return result;
      },
      show: (nameOrEvent) => resolveCtrl(nameOrEvent)?.show(),
      hide: (nameOrEvent) => resolveCtrl(nameOrEvent)?.hide(),
      setPresent: (name, next) => controllers[name]?.setPresent(next),
      toggle: (nameOrEvent) => resolveCtrl(nameOrEvent)?.toggle(),
      onExitComplete: (nameOrEvent) =>
        resolveCtrl(nameOrEvent)?.onExitComplete(),
      hideAll: () => {
        for (const name of keys) {
          controllers[name].hide();
        }
      },
      stop: () => {
        for (const name of keys) {
          controllers[name].stop();
        }
      },
    };
  }

  const {
    target,
    key,
    initialPresent,
    lazyMount,
    unmountOnExit,
    duration,
    onChange,
    onExitComplete,
  } = options as UsePresenceOptions;

  const syncToTarget = (snapshot: PresenceSnapshot) => {
    if (!target || typeof target.setData !== "function") return;
    if (key) {
      target.setData({ [key]: snapshot });
    } else {
      target.setData({
        present: snapshot.present,
        open: snapshot.open,
        mounted: snapshot.mounted,
        presenceState: snapshot.state,
      });
    }
  };

  const controller = createPresenceController({
    initialPresent,
    lazyMount,
    unmountOnExit,
    duration,
    onChange: (snapshot) => {
      syncToTarget(snapshot);
      onChange?.(snapshot);
    },
    onExitComplete,
  });

  syncToTarget(controller.getState());

  return {
    get present() {
      return controller.getState().present;
    },
    get open() {
      return controller.getState().open;
    },
    get mounted() {
      return controller.getState().mounted;
    },
    get state() {
      return controller.getState().state;
    },
    getState: controller.getState,
    show: controller.show,
    hide: controller.hide,
    setPresent: controller.setPresent,
    toggle: controller.toggle,
    onExitComplete: controller.onExitComplete,
    stop: controller.stop,
  };
}
