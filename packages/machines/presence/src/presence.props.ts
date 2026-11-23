import type { PresenceResolvedProps } from "./presence.types";

export const defaultPresenceProps: PresenceResolvedProps = {
  present: false,
  lazyMount: false,
  unmountOnExit: false,
  duration: null,
};
