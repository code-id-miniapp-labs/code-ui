import {
  createPresenceController,
  type PresenceLifecycleState,
  type PresenceSnapshot,
} from "@code-id-labs/miniapp/behaviors/presence";

export type { PresenceLifecycleState, PresenceSnapshot };

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

export function usePresence(
  options: UsePresenceOptions = {},
): UsePresenceReturn {
  const {
    target,
    key,
    initialPresent,
    lazyMount,
    unmountOnExit,
    duration,
    onChange,
    onExitComplete,
  } = options;

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

  // Sync initial snapshot to target instance on creation
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
