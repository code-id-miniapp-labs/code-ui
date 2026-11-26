import { createMachine } from "@code-id-labs/core";
import {
  isEqual,
  isMiniApp,
  isNotNull,
  queryRect,
  scheduleAnimationEnd,
} from "@code-id-labs/utils";
import * as dom from "./tour.dom";
import {
  computeTourPosition,
  computeTourSpotlight,
  parseComputedBorderRadius,
  readViewportSize,
} from "./tour.position";
import { defaultTourProps } from "./tour.props";
import type {
  TourMachine,
  TourParams,
  TourRect,
  TourSchema,
  TourStatus,
  TourStepActionContext,
  TourStepDetails,
  TourStepType,
} from "./tour.types";

const DEFAULT_CLOSE_DURATION = 200;
const AUTO_SCROLL_DURATION = 220;
const AUTO_SCROLL_SETTLE_DELAY = 260;
const TARGET_RETRY_DELAY = 60;

interface SelectorQueryLike {
  select: (selector: string) => SelectorQueryLike;
  boundingClientRect: () => SelectorQueryLike;
  fields?: (
    fields: { rect?: boolean; size?: boolean; computedStyle?: string[] },
  ) => SelectorQueryLike;
  selectViewport: () => SelectorQueryLike;
  scrollOffset: () => SelectorQueryLike;
  exec: (callback: (results: unknown) => void) => void;
}

interface WxPageScrollApi {
  createSelectorQuery?: () => SelectorQueryLike;
  pageScrollTo?: (options: { scrollTop: number; duration?: number }) => void;
}

function toRect(
  res: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
    width?: number;
    height?: number;
  } | null,
): TourRect | null {
  if (!res) return null;
  const width = typeof res.width === "number" ? res.width : 0;
  const height = typeof res.height === "number" ? res.height : 0;
  if (width <= 0 && height <= 0) return null;
  const left = typeof res.left === "number" ? res.left : 0;
  const top = typeof res.top === "number" ? res.top : 0;
  const right = typeof res.right === "number" ? res.right : left + width;
  const bottom = typeof res.bottom === "number" ? res.bottom : top + height;
  return { left, top, right, bottom, width, height };
}

function resolveStepType(step: TourStepDetails | null): TourStepType {
  if (!step) return "dialog";
  if (step.type) return step.type;
  return step.target ? "tooltip" : "dialog";
}

function resolveTargetSelector(step: TourStepDetails | null): string | null {
  if (!step || !step.target) return null;
  const raw = typeof step.target === "function" ? step.target() : step.target;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
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

function createActionContext(
  params: Pick<TourParams, "computed" | "send">,
): TourStepActionContext {
  const { computed, send } = params;
  return {
    next: () => send({ type: "NEXT" }),
    prev: () => send({ type: "PREV" }),
    goTo: (stepIdOrIndex: string | number) => {
      if (typeof stepIdOrIndex === "number") {
        send({ type: "GO_TO", stepIndex: stepIdOrIndex });
      } else {
        send({ type: "GO_TO", stepId: stepIdOrIndex });
      }
    },
    skip: () => send({ type: "SKIP" }),
    dismiss: () => send({ type: "DISMISS" }),
    close: () => send({ type: "CLOSE" }),
    reposition: () => send({ type: "REPOSITION" }),
    step: computed("step"),
    stepIndex: computed("stepIndex"),
    totalSteps: computed("totalSteps"),
  };
}

function clearTimers(refs: TourParams["refs"]): void {
  const scrollTimer = refs.get("scrollTimer");
  if (scrollTimer !== null) {
    clearTimeout(scrollTimer);
    refs.set("scrollTimer", null);
  }
  const retryTimer = refs.get("retryTimer");
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    refs.set("retryTimer", null);
  }
}

function teardownStepEffect(refs: TourParams["refs"]): void {
  const cleanup = refs.get("stepCleanup");
  if (cleanup) {
    refs.set("stepCleanup", null);
    refs.set("activeEffectStepId", null);
    try {
      cleanup();
    } catch {
      // Ignore user cleanup exceptions to keep FSM healthy
    }
  } else {
    refs.set("activeEffectStepId", null);
  }
}

function syncStepEffect(
  params: Pick<TourParams, "computed" | "refs" | "send" | "state">,
): void {
  const { computed, refs, send, state } = params;
  if (!state.hasTag("open")) {
    teardownStepEffect(refs);
    return;
  }

  const step = computed("step");
  const nextStepId = step?.id ?? null;
  if (refs.get("activeEffectStepId") === nextStepId) {
    return;
  }

  teardownStepEffect(refs);
  refs.set("activeEffectStepId", nextStepId);

  if (step && typeof step.effect === "function") {
    const ctx = createActionContext({ computed, send });
    const cleanup = step.effect({
      ...ctx,
      show: () => send({ type: "REPOSITION" }),
    });
    if (typeof cleanup === "function") {
      refs.set("stepCleanup", cleanup);
    }
  }
}

function queryPageTargetAndScroll(
  selector: string,
  targetScope: TourParams["prop"] extends (k: "targetScope") => infer R
    ? R
    : unknown,
): Promise<{
  rect: TourRect | null;
  radius: number | null;
  scrollTop: number;
}> {
  return new Promise((resolve) => {
    const wxApi = (globalThis as { wx?: WxPageScrollApi }).wx;
    const scopeComp = targetScope as
      | { createSelectorQuery?: () => SelectorQueryLike }
      | undefined;

    let query: SelectorQueryLike | null = null;
    if (scopeComp && typeof scopeComp.createSelectorQuery === "function") {
      query = scopeComp.createSelectorQuery();
    } else if (wxApi && typeof wxApi.createSelectorQuery === "function") {
      query = wxApi.createSelectorQuery();
    }

    if (!query) {
      resolve({ rect: null, radius: null, scrollTop: 0 });
      return;
    }

    const selected = query.select(selector);
    const nodeQuery =
      typeof selected.fields === "function"
        ? selected.fields({
            rect: true,
            size: true,
            computedStyle: ["borderTopLeftRadius", "borderRadius"],
          })
        : selected.boundingClientRect();

    nodeQuery
      .selectViewport()
      .scrollOffset()
      .exec((results: unknown) => {
        const list = Array.isArray(results) ? results : [];
        const rawRect = (list[0] ?? null) as {
          left?: number;
          top?: number;
          right?: number;
          bottom?: number;
          width?: number;
          height?: number;
          borderTopLeftRadius?: unknown;
          borderRadius?: unknown;
        } | null;
        const rawScroll = (list[1] ?? null) as { scrollTop?: number } | null;
        const scrollTop =
          rawScroll && typeof rawScroll.scrollTop === "number"
            ? rawScroll.scrollTop
            : 0;
        const rect = toRect(rawRect);
        const rawRadius =
          rawRect?.borderTopLeftRadius ?? rawRect?.borderRadius ?? null;
        const radius =
          rect && rawRadius !== null
            ? parseComputedBorderRadius(rawRadius, rect.width, rect.height)
            : null;
        resolve({ rect, radius, scrollTop });
      });
  });
}

function runMeasure(
  params: Pick<TourParams, "prop" | "computed" | "scope" | "refs" | "send">,
  isCancelled: () => boolean,
  allowAutoScroll = true,
  allowRetry = true,
): void {
  const { prop, computed, scope, refs, send } = params;
  clearTimers(refs);

  const token = refs.get("measureToken") + 1;
  refs.set("measureToken", token);

  const isStale = () => isCancelled() || refs.get("measureToken") !== token;
  const viewport = readViewportSize();
  const step = computed("step");
  const stepType = resolveStepType(step);
  const selector = resolveTargetSelector(step);

  if (!selector || (stepType !== "tooltip" && stepType !== "wait")) {
    send({
      type: "MEASURE.DONE",
      targetRect: null,
      viewport,
      contentSize: null,
    });
    return;
  }

  const targetScope = prop("targetScope");
  const canQuery =
    Boolean(
      targetScope &&
        typeof (targetScope as { createSelectorQuery?: unknown })
          .createSelectorQuery === "function",
    ) || isMiniApp();

  if (!canQuery) {
    send({
      type: "MEASURE.DONE",
      targetRect: null,
      viewport,
      targetNotFound: true,
    });
    return;
  }

  queryPageTargetAndScroll(selector, targetScope)
    .then(({ rect, radius, scrollTop }) => {
      if (isStale()) return;

      if (!rect) {
        if (allowRetry) {
          const timer = setTimeout(() => {
            refs.set("retryTimer", null);
            if (!isStale()) {
              runMeasure(params, isCancelled, allowAutoScroll, false);
            }
          }, TARGET_RETRY_DELAY);
          refs.set("retryTimer", timer);
          return;
        }
        send({
          type: "MEASURE.DONE",
          targetRect: null,
          targetRadius: null,
          viewport,
          targetNotFound: true,
        });
        return;
      }

      const safeTop = viewport.safeTop ?? 0;
      const safeBottom = viewport.safeBottom ?? 0;
      const margin = 40;
      const isOutOfView =
        rect.top < safeTop + margin ||
        rect.bottom > viewport.height - safeBottom - margin;

      const wxApi = (globalThis as { wx?: WxPageScrollApi }).wx;
      if (
        allowAutoScroll &&
        prop("autoScroll") &&
        isOutOfView &&
        wxApi &&
        typeof wxApi.pageScrollTo === "function"
      ) {
        const desiredScrollTop = Math.max(
          0,
          Math.round(
            scrollTop +
              rect.top -
              Math.max(safeTop + 88, (viewport.height - rect.height) / 2.6),
          ),
        );
        if (Math.abs(desiredScrollTop - scrollTop) > 12) {
          wxApi.pageScrollTo({
            scrollTop: desiredScrollTop,
            duration: AUTO_SCROLL_DURATION,
          });
          const timer = setTimeout(() => {
            refs.set("scrollTimer", null);
            if (!isStale()) {
              runMeasure(params, isCancelled, false, false);
            }
          }, AUTO_SCROLL_SETTLE_DELAY);
          refs.set("scrollTimer", timer);
          return;
        }
      }

      send({
        type: "MEASURE.DONE",
        targetRect: rect,
        targetRadius: radius,
        viewport,
      });

      const comp = scope.component;
      if (
        comp &&
        typeof (comp as { createSelectorQuery?: unknown })
          .createSelectorQuery === "function"
      ) {
        Promise.resolve()
          .then(() => queryRect(`#${dom.getContentId(scope)}`, comp))
          .then((contentRes) => {
            if (isStale() || !contentRes) return;
            if (contentRes.width > 0 || contentRes.height > 0) {
              send({
                type: "MEASURE.DONE",
                targetRect: rect,
                targetRadius: radius,
                viewport,
                contentSize: {
                  width: contentRes.width,
                  height: contentRes.height,
                },
              });
            }
          })
          .catch(() => {});
      }
    })
    .catch(() => {});
}

function resolveStartStepId(
  steps: TourStepDetails[],
  requestedId: string | null | undefined,
  controlledId: string | null | undefined,
  defaultId: string | null | undefined,
): string | null {
  if (!Array.isArray(steps) || steps.length === 0) return null;
  const candidate = requestedId ?? controlledId ?? defaultId;
  if (candidate && steps.some((s) => s.id === candidate)) {
    return candidate;
  }
  return steps[0]?.id ?? null;
}

const openCloseTransitions = [
  {
    guard: "isInstantClose" as const,
    target: "closed" as const,
    actions: ["invokeOnDismiss" as const, "invokeOnExitComplete" as const],
  },
  {
    target: "closing" as const,
    actions: ["invokeOnDismiss" as const],
  },
];

const closedStartTransitions = {
  START: {
    guard: "hasSteps" as const,
    target: "open" as const,
    actions: ["selectStartStep" as const, "invokeOnStart" as const],
  },
  OPEN: {
    guard: "hasSteps" as const,
    target: "open" as const,
    actions: ["selectStartStep" as const, "invokeOnStart" as const],
  },
  GO_TO: {
    guard: "canGoToStep" as const,
    target: "open" as const,
    actions: ["applyGoToStep" as const, "invokeOnStart" as const],
  },
};

export const tourMachine: TourMachine = createMachine<TourSchema>({
  props: ({ props }) => ({
    ...defaultTourProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const steps = prop("steps");
    if (!Array.isArray(steps) || steps.length === 0) return "closed";
    const rawOpen = prop("open");
    const isOpen = isNotNull(rawOpen)
      ? Boolean(rawOpen)
      : Boolean(prop("defaultOpen"));
    return isOpen ? "open" : "closed";
  },

  refs: () => ({
    measureToken: 0,
    scrollTimer: null,
    retryTimer: null,
    stepCleanup: null,
    activeEffectStepId: null,
  }),

  context: ({ prop, bindable }) => {
    const initialStepId = resolveStartStepId(
      prop("steps"),
      undefined,
      prop("stepId"),
      prop("defaultStepId"),
    );

    return {
      stepId: bindable<string | null>(() => ({
        value: isNotNull(prop("stepId")) ? prop("stepId") : undefined,
        defaultValue: initialStepId,
        onChange: (nextStepId) => {
          const steps = prop("steps");
          const stepIndex = findStepIndex(steps, nextStepId);
          const step = stepIndex >= 0 ? (steps[stepIndex] ?? null) : null;
          prop("onStepChange")?.({
            stepId: step?.id ?? null,
            stepIndex,
            totalSteps: steps.length,
            step,
          });
        },
      })),
      status: bindable<TourStatus>(() => ({
        defaultValue: "idle",
      })),
      targetRect: bindable<TourRect | null>(() => ({
        defaultValue: null,
        isEqual,
      })),
      targetRadius: bindable<number | null>(() => ({
        defaultValue: null,
      })),
      contentSize: bindable<TourSchema["context"]["contentSize"]>(() => ({
        defaultValue: null,
        isEqual,
      })),
      viewport: bindable<TourSchema["context"]["viewport"]>(() => ({
        defaultValue: readViewportSize(),
        isEqual,
      })),
      measureResolved: bindable<boolean>(() => ({
        defaultValue: false,
      })),
    };
  },

  computed: {
    isOpen: ({ state }) => state.hasTag("open"),
    isVisible: ({ state }) => state.hasTag("open") || state.hasTag("closing"),

    totalSteps: ({ prop }) => {
      const steps = prop("steps");
      return Array.isArray(steps) ? steps.length : 0;
    },

    stepIndex: ({ prop, context }) =>
      findStepIndex(prop("steps"), context.get("stepId")),

    step: ({ prop, computed }) => {
      const idx = computed("stepIndex");
      const steps = prop("steps");
      if (idx < 0 || idx >= steps.length) return null;
      return steps[idx] ?? null;
    },

    stepType: ({ computed }) => resolveStepType(computed("step")),

    hasNextStep: ({ computed }) => {
      const total = computed("totalSteps");
      const idx = computed("stepIndex");
      return total > 0 && idx >= 0 && idx < total - 1;
    },

    hasPrevStep: ({ computed }) => computed("stepIndex") > 0,

    firstStep: ({ computed }) => computed("stepIndex") <= 0,

    lastStep: ({ computed }) => {
      const total = computed("totalSteps");
      return total <= 0 || computed("stepIndex") >= total - 1;
    },

    progressPercent: ({ computed }) => {
      const total = computed("totalSteps");
      const idx = computed("stepIndex");
      if (total <= 0 || idx < 0) return 0;
      return Math.round(((idx + 1) / total) * 100);
    },

    progressText: ({ prop, computed }) => {
      const totalSteps = computed("totalSteps");
      const stepIndex = computed("stepIndex");
      if (totalSteps <= 0 || stepIndex < 0) return "";
      const formatter = prop("getProgressText");
      if (typeof formatter === "function") {
        return formatter({ stepIndex, totalSteps });
      }
      return `${stepIndex + 1} / ${totalSteps}`;
    },

    showBackdrop: ({ computed }) => {
      const step = computed("step");
      return step?.backdrop !== false;
    },

    preventInteraction: ({ prop, computed }) => {
      const step = computed("step");
      if (typeof step?.preventInteraction === "boolean") {
        return step.preventInteraction;
      }
      return Boolean(prop("preventInteraction"));
    },

    spotlight: ({ prop, context, computed }) => {
      const step = computed("step");
      const offset =
        typeof step?.spotlightOffset === "number"
          ? step.spotlightOffset
          : prop("spotlightOffset");
      const radius =
        step?.spotlightRadius !== undefined
          ? step.spotlightRadius
          : prop("spotlightRadius");

      return computeTourSpotlight({
        targetRect: context.get("targetRect"),
        viewport: context.get("viewport"),
        stepType: computed("stepType"),
        spotlightOffset: offset,
        spotlightRadius: radius,
        targetRadius: context.get("targetRadius"),
        preventInteraction: computed("preventInteraction"),
        showBackdrop: computed("showBackdrop"),
      });
    },

    position: ({ prop, context, computed }) => {
      const step = computed("step");
      const stepType = computed("stepType");
      const spotlight = computed("spotlight");
      const hasTarget = Boolean(resolveTargetSelector(step));
      const hasCardContent = Boolean(
        step?.title || step?.description || step?.badge || step?.actions?.length,
      );
      const defaultPlacement = stepType === "dialog" ? "center" : "bottom";
      const showArrow =
        typeof step?.arrow === "boolean" ? step.arrow : stepType === "tooltip";

      return computeTourPosition({
        stepType,
        hasTarget,
        hasCardContent,
        measureResolved: context.get("measureResolved"),
        targetRect: context.get("targetRect"),
        spotlightRect: spotlight.rect,
        viewport: context.get("viewport"),
        contentSize: context.get("contentSize"),
        placement: step?.placement ?? defaultPlacement,
        arrow: showArrow,
        sideOffset: prop("sideOffset"),
        collisionPadding: prop("collisionPadding"),
        avoidCollisions: prop("avoidCollisions"),
        maxWidth: prop("maxWidth"),
      });
    },
  },

  watch: ({ prop, state, track, context, computed, scope, refs, send }) => {
    track([() => prop("open")], () => {
      const rawOpen = prop("open");
      if (!isNotNull(rawOpen)) return;

      const shouldBeOpen = Boolean(rawOpen);
      const isCurrentlyOpen = state.hasTag("open");
      if (shouldBeOpen && !isCurrentlyOpen) {
        const steps = prop("steps");
        if (!Array.isArray(steps) || steps.length === 0) return;
        const startId = resolveStartStepId(
          steps,
          undefined,
          prop("stepId"),
          context.get("stepId") ?? prop("defaultStepId"),
        );
        context.set("stepId", startId);
        context.set("status", "started");
        state.set("open");
      } else if (!shouldBeOpen && isCurrentlyOpen) {
        if (prop("transition") === false) {
          state.set("closed");
          prop("onExitComplete")?.();
        } else {
          state.set("closing");
        }
      }
    });

    track([() => prop("stepId")], () => {
      const rawStepId = prop("stepId");
      if (!isNotNull(rawStepId)) return;
      if (state.hasTag("open")) {
        context.set("measureResolved", false);
        syncStepEffect({ computed, refs, send, state });
        runMeasure(
          { prop, computed, scope, refs, send },
          () => !state.hasTag("open"),
        );
      }
    });
  },

  states: {
    closed: {
      tags: ["closed"],
      entry: ["resetMeasurements"],
      on: closedStartTransitions,
    },

    open: {
      tags: ["open"],
      effects: ["tourLifecycleEffect"],
      exit: ["cleanupOnExit"],
      on: {
        NEXT: [
          {
            guard: "hasNextStep",
            actions: ["advanceStep", "syncActiveStep"],
          },
          {
            guard: "isInstantClose",
            target: "closed",
            actions: ["invokeOnComplete", "invokeOnExitComplete"],
          },
          {
            target: "closing",
            actions: ["invokeOnComplete"],
          },
        ],
        PREV: {
          guard: "hasPrevStep",
          actions: ["retreatStep", "syncActiveStep"],
        },
        GO_TO: {
          guard: "canGoToStep",
          actions: ["applyGoToStep", "syncActiveStep"],
        },
        SKIP: [
          {
            guard: "isInstantClose",
            target: "closed",
            actions: ["invokeOnSkip", "invokeOnExitComplete"],
          },
          {
            target: "closing",
            actions: ["invokeOnSkip"],
          },
        ],
        DISMISS: openCloseTransitions,
        CLOSE: openCloseTransitions,
        "BACKDROP.TAP": [
          {
            guard: "cannotCloseOnInteractOutside",
            actions: ["invokeOnBackdropTap"],
          },
          {
            guard: "isInstantClose",
            target: "closed",
            actions: [
              "invokeOnBackdropTap",
              "invokeOnDismiss",
              "invokeOnExitComplete",
            ],
          },
          {
            target: "closing",
            actions: ["invokeOnBackdropTap", "invokeOnDismiss"],
          },
        ],
        "CLOSE_TRIGGER.TAP": [
          {
            guard: "isInstantClose",
            target: "closed",
            actions: [
              "invokeOnCloseTriggerTap",
              "invokeOnDismiss",
              "invokeOnExitComplete",
            ],
          },
          {
            target: "closing",
            actions: ["invokeOnCloseTriggerTap", "invokeOnDismiss"],
          },
        ],
        "STEP.ACTION": {
          actions: ["executeStepAction"],
        },
        REPOSITION: {
          actions: ["remeasureTarget"],
        },
        "MEASURE.DONE": {
          actions: ["applyMeasurement"],
        },
      },
    },

    closing: {
      tags: ["closing"],
      effects: ["waitForCloseAnimation"],
      on: {
        ANIMATION_END: {
          target: "closed",
          actions: ["invokeOnExitComplete"],
        },
        ...closedStartTransitions,
      },
    },
  },

  implementations: {
    guards: {
      hasSteps: ({ prop }) => {
        const steps = prop("steps");
        return Array.isArray(steps) && steps.length > 0;
      },
      hasNextStep: ({ computed }) => computed("hasNextStep"),
      hasPrevStep: ({ computed }) => computed("hasPrevStep"),
      isInstantClose: ({ prop }) => prop("transition") === false,
      cannotCloseOnInteractOutside: ({ prop }) =>
        prop("closeOnInteractOutside") === false,
      canGoToStep: ({ prop, event }) => {
        if (event.type !== "GO_TO") return false;
        const steps = prop("steps");
        if (!Array.isArray(steps) || steps.length === 0) return false;
        if (typeof event.stepIndex === "number") {
          return event.stepIndex >= 0 && event.stepIndex < steps.length;
        }
        if (typeof event.stepId === "string") {
          return steps.some((s) => s.id === event.stepId);
        }
        return false;
      },
    },

    actions: {
      selectStartStep: ({ prop, context, event }) => {
        const requestedId =
          event.type === "START" || event.type === "OPEN"
            ? event.stepId
            : undefined;
        const startId = resolveStartStepId(
          prop("steps"),
          requestedId,
          prop("stepId"),
          prop("defaultStepId"),
        );
        context.set("measureResolved", false);
        context.set("stepId", startId);
      },

      advanceStep: ({ prop, context, computed }) => {
        const steps = prop("steps");
        const nextIdx = computed("stepIndex") + 1;
        const nextStep = steps[nextIdx];
        if (!nextStep) return;
        context.set("measureResolved", false);
        context.set("contentSize", null);
        context.set("stepId", nextStep.id);
      },

      retreatStep: ({ prop, context, computed }) => {
        const steps = prop("steps");
        const prevIdx = computed("stepIndex") - 1;
        const prevStep = steps[prevIdx];
        if (!prevStep) return;
        context.set("measureResolved", false);
        context.set("contentSize", null);
        context.set("stepId", prevStep.id);
      },

      applyGoToStep: ({ prop, context, event }) => {
        if (event.type !== "GO_TO") return;
        const steps = prop("steps");
        let target: TourStepDetails | undefined;
        if (typeof event.stepIndex === "number") {
          target = steps[event.stepIndex];
        } else if (typeof event.stepId === "string") {
          target = steps.find((s) => s.id === event.stepId);
        }
        if (!target) return;
        context.set("measureResolved", false);
        context.set("contentSize", null);
        context.set("stepId", target.id);
      },

      syncActiveStep: (params) => {
        syncStepEffect(params);
        runMeasure(params, () => !params.state.hasTag("open"));
      },

      executeStepAction: ({ computed, send, event }) => {
        if (event.type !== "STEP.ACTION") return;
        const step = computed("step");
        const actionItem = step?.actions?.[event.index];
        if (!actionItem || actionItem.disabled) return;

        const cmd = actionItem.action;
        if (typeof cmd === "function") {
          cmd(createActionContext({ computed, send }));
          return;
        }
        if (cmd === "next") {
          send({ type: "NEXT" });
        } else if (cmd === "prev") {
          send({ type: "PREV" });
        } else if (cmd === "skip") {
          send({ type: "SKIP" });
        } else if (cmd === "dismiss") {
          send({ type: "DISMISS" });
        }
      },

      invokeOnStart: ({ prop, context, computed }) => {
        context.set("status", "started");
        prop("onStatusChange")?.({
          status: "started",
          stepId: computed("step")?.id ?? null,
          stepIndex: computed("stepIndex"),
        });
        prop("onOpenChange")?.({ open: true });
        prop("onOpen")?.();
      },

      invokeOnComplete: ({ prop, context, computed }) => {
        context.set("status", "completed");
        prop("onStatusChange")?.({
          status: "completed",
          stepId: computed("step")?.id ?? null,
          stepIndex: computed("stepIndex"),
        });
        prop("onOpenChange")?.({ open: false });
        prop("onClose")?.();
      },

      invokeOnSkip: ({ prop, context, computed }) => {
        context.set("status", "skipped");
        prop("onStatusChange")?.({
          status: "skipped",
          stepId: computed("step")?.id ?? null,
          stepIndex: computed("stepIndex"),
        });
        prop("onOpenChange")?.({ open: false });
        prop("onClose")?.();
      },

      invokeOnDismiss: ({ prop, context, computed }) => {
        context.set("status", "dismissed");
        prop("onStatusChange")?.({
          status: "dismissed",
          stepId: computed("step")?.id ?? null,
          stepIndex: computed("stepIndex"),
        });
        prop("onOpenChange")?.({ open: false });
        prop("onClose")?.();
      },

      invokeOnBackdropTap: ({ prop }) => {
        prop("onBackdropTap")?.();
      },

      invokeOnCloseTriggerTap: ({ prop }) => {
        prop("onCloseTriggerTap")?.();
      },

      invokeOnExitComplete: ({ prop }) => {
        prop("onExitComplete")?.();
      },

      cleanupOnExit: ({ refs }) => {
        refs.set("measureToken", refs.get("measureToken") + 1);
        clearTimers(refs);
        teardownStepEffect(refs);
      },

      resetMeasurements: ({ context, refs }) => {
        refs.set("measureToken", refs.get("measureToken") + 1);
        clearTimers(refs);
        teardownStepEffect(refs);
        context.set("targetRect", null);
        context.set("targetRadius", null);
        context.set("contentSize", null);
        context.set("measureResolved", false);
      },

      remeasureTarget: (params) => {
        runMeasure(params, () => !params.state.hasTag("open"), false, false);
      },

      applyMeasurement: ({ prop, context, computed, event }) => {
        if (event.type !== "MEASURE.DONE") return;
        context.set("viewport", event.viewport);
        context.set("targetRect", event.targetRect);
        if (event.targetRadius !== undefined) {
          context.set("targetRadius", event.targetRadius);
        }
        context.set("measureResolved", true);
        if (event.contentSize !== undefined) {
          context.set("contentSize", event.contentSize);
        }
        if (event.targetNotFound) {
          context.set("status", "not-found");
          prop("onStatusChange")?.({
            status: "not-found",
            stepId: computed("step")?.id ?? null,
            stepIndex: computed("stepIndex"),
          });
        }
      },
    },

    effects: {
      tourLifecycleEffect: (params) => {
        let cancelled = false;
        syncStepEffect(params);
        runMeasure(params, () => cancelled);
        return () => {
          cancelled = true;
          params.refs.set(
            "measureToken",
            params.refs.get("measureToken") + 1,
          );
          clearTimers(params.refs);
          teardownStepEffect(params.refs);
        };
      },

      waitForCloseAnimation: ({ send, prop }) => {
        return scheduleAnimationEnd({
          duration: prop("duration"),
          fallbackDuration: DEFAULT_CLOSE_DURATION,
          onEnd: () => send({ type: "ANIMATION_END" }),
        });
      },
    },
  },
});
