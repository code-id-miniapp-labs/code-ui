import * as dom from "./presence.dom";
import type { PresenceApi, PresenceService } from "./presence.types";

export function connectPresence(service: PresenceService): PresenceApi {
  const { state, send, computed, scope } = service;

  const present = computed("isPresent");
  const mounted = computed("isMounted");
  const visible = computed("isVisible");
  const exiting = computed("isExiting");
  const dataState = computed("dataState");
  const currentState = state.get();

  return {
    present,
    mounted,
    visible,
    exiting,
    state: currentState,
    dataState,

    handleAnimationEnd() {
      send({ type: "ANIMATION_END" });
    },

    setPresent(next: boolean) {
      send({ type: next ? "PRESENT" : "HIDE" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": dataState,
      "data-presence-state": currentState,
      hidden: !visible,
    },
  };
}
