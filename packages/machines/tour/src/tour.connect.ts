import * as dom from "./tour.dom";
import type { TourApi, TourService } from "./tour.types";

export function connectTour(service: TourService): TourApi {
  const { state, context, send, computed, scope } = service;

  const currentState = state.get();
  const open = computed("isOpen");
  const visible = computed("isVisible");
  const step = computed("step");
  const stepIndex = computed("stepIndex");
  const totalSteps = computed("totalSteps");
  const stepType = computed("stepType");
  const spotlight = computed("spotlight");
  const position = computed("position");
  const showBackdrop = computed("showBackdrop");
  const preventInteraction = computed("preventInteraction");
  const showCard =
    stepType !== "wait" ||
    Boolean(
      step?.title || step?.description || step?.badge || step?.actions?.length,
    );

  const backdropId = dom.getBackdropId(scope);
  const spotlightId = dom.getSpotlightId(scope);
  const positionerId = dom.getPositionerId(scope);
  const closeTriggerId = dom.getCloseTriggerId(scope);

  return {
    state: currentState,
    status: context.get("status"),
    open,
    visible,
    step,
    stepId: step?.id ?? null,
    stepIndex,
    totalSteps,
    stepType,
    hasNextStep: computed("hasNextStep"),
    hasPrevStep: computed("hasPrevStep"),
    firstStep: computed("firstStep"),
    lastStep: computed("lastStep"),
    progressPercent: computed("progressPercent"),
    progressText: computed("progressText"),
    showBackdrop,
    showSpotlight: spotlight.visible,
    showCard,
    showArrow: position.showArrow,
    preventInteraction,
    positioned: position.positioned,
    resolvedSide: position.resolvedSide,
    spotlightStyle: spotlight.spotlightStyle,
    backdropTopStyle: spotlight.backdropTopStyle,
    backdropBottomStyle: spotlight.backdropBottomStyle,
    backdropLeftStyle: spotlight.backdropLeftStyle,
    backdropRightStyle: spotlight.backdropRightStyle,
    positionerStyle: position.positionerStyle,
    arrowStyle: position.arrowStyle,

    start(stepId?: string) {
      send(stepId !== undefined ? { type: "START", stepId } : { type: "START" });
    },

    setOpen(nextOpen: boolean) {
      send({ type: nextOpen ? "OPEN" : "CLOSE" });
    },

    next() {
      send({ type: "NEXT" });
    },

    prev() {
      send({ type: "PREV" });
    },

    goTo(stepIdOrIndex: string | number) {
      if (typeof stepIdOrIndex === "number") {
        send({ type: "GO_TO", stepIndex: stepIdOrIndex });
      } else {
        send({ type: "GO_TO", stepId: stepIdOrIndex });
      }
    },

    skip() {
      send({ type: "SKIP" });
    },

    dismiss() {
      send({ type: "DISMISS" });
    },

    close() {
      send({ type: "CLOSE" });
    },

    reposition() {
      send({ type: "REPOSITION" });
    },

    handleBackdropTap() {
      send({ type: "BACKDROP.TAP" });
    },

    handleCloseTriggerTap() {
      send({ type: "CLOSE_TRIGGER.TAP" });
    },

    handleAction(index: number) {
      send({ type: "STEP.ACTION", index });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-scope": "tour",
      "data-part": "root",
      "data-state": currentState,
      "data-step": step?.id ?? "",
      "data-type": stepType,
    },

    backdropProps: {
      ...(backdropId ? { id: backdropId } : {}),
      "data-scope": "tour",
      "data-part": "backdrop",
      "data-state": open ? "open" : "closed",
      "aria-hidden": true,
    },

    spotlightProps: {
      ...(spotlightId ? { id: spotlightId } : {}),
      "data-scope": "tour",
      "data-part": "spotlight",
      "data-state": open ? "open" : "closed",
      "aria-hidden": true,
    },

    positionerProps: {
      ...(positionerId ? { id: positionerId } : {}),
      "data-scope": "tour",
      "data-part": "positioner",
      "data-state": currentState,
      "data-type": stepType,
      "data-side": position.resolvedSide,
    },

    contentProps: {
      id: dom.getContentId(scope),
      "data-scope": "tour",
      "data-part": "content",
      "data-state": currentState,
      "data-type": stepType,
      "data-side": position.resolvedSide,
      "aria-hidden": !open,
    },

    closeTriggerProps: {
      ...(closeTriggerId ? { id: closeTriggerId } : {}),
      "data-scope": "tour",
      "data-part": "close-trigger",
    },
  };
}
