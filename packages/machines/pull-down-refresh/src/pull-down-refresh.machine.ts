import { createMachine } from "@code-ui/core";
import { isNotNull, isPromise } from "@code-ui/utils";
import type {
  PullDownRefreshMachine,
  PullDownRefreshParams,
  PullDownRefreshSchema,
} from "./pull-down-refresh.types";
import {
  DEFAULT_LOADING_TEXTS,
  defaultPullDownRefreshProps,
} from "./pull-down-refresh.props";

const DEFAULT_THRESHOLD = 40;
const DEFAULT_MAX_PULL_DISTANCE = 60;

function resolveNumber(value: unknown, fallback: number, min = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, parsed);
}

function resolveThreshold(prop: PullDownRefreshParams["prop"]): number {
  return resolveNumber(prop("threshold"), DEFAULT_THRESHOLD, 0);
}

function resolveMaxPullDistance(prop: PullDownRefreshParams["prop"]): number {
  return resolveNumber(prop("maxPullDistance"), DEFAULT_MAX_PULL_DISTANCE, 0);
}

function clampPullOffset(offset: unknown, maxPullDistance: number): number {
  const parsed = Number(offset);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, maxPullDistance);
}

function resolveEventOffset(
  params: PullDownRefreshParams,
  event: PullDownRefreshParams["event"],
): number {
  const raw =
    event.type === "DRAG_MOVE" || event.type === "DRAG_END"
      ? event.offset
      : params.context.get("offset");
  return clampPullOffset(raw, resolveMaxPullDistance(params.prop));
}

const dragMoveActions = ["setOffsetFromEvent" as const, "invokeDrag" as const];

const dragEndTransitions = [
  {
    guard: "reachedThreshold" as const,
    target: "refreshing" as const,
    actions: ["invokeDragEnd" as const, "emitRefresh" as const],
  },
  {
    target: "idle" as const,
    actions: ["invokeDragEnd" as const, "resetOffset" as const],
  },
];

export const pullDownRefreshMachine: PullDownRefreshMachine =
  createMachine<PullDownRefreshSchema>({
    props: ({ props }) => ({
      ...defaultPullDownRefreshProps,
      ...props,
    }),

    initialState: ({ prop }) => {
      const rawValue = prop("value");
      const refreshing = isNotNull(rawValue)
        ? Boolean(rawValue)
        : Boolean(prop("defaultValue"));
      return refreshing ? "refreshing" : "idle";
    },

    context: ({ bindable }) => ({
      offset: bindable<number>(() => ({
        defaultValue: 0,
      })),
      scrollTop: bindable<number>(() => ({
        defaultValue: 0,
      })),
    }),

    refs: () => ({
      refreshTask: undefined as Promise<unknown> | undefined,
    }),

    computed: {
      isDisabled: ({ prop }) => Boolean(prop("disabled")),
      isPulling: ({ state }) => state.matches("pulling", "armed"),
      isArmed: ({ state }) => state.matches("armed"),
      isRefreshing: ({ state }) => state.matches("refreshing"),
      isAtTop: ({ context }) => context.get("scrollTop") <= 0,
      canPull: ({ state, prop, context }) =>
        !prop("disabled") &&
        context.get("scrollTop") <= 0 &&
        state.matches("idle"),

      barHeight: ({ state, context, prop }) => {
        if (state.matches("refreshing", "success")) {
          return resolveThreshold(prop);
        }
        if (state.matches("pulling", "armed")) {
          return clampPullOffset(
            context.get("offset"),
            resolveMaxPullDistance(prop),
          );
        }
        return 0;
      },

      tipsHeight: ({ state, context, prop }) => {
        const threshold = resolveThreshold(prop);
        if (threshold <= 0) return 0;
        const height = state.matches("refreshing", "success")
          ? threshold
          : state.matches("pulling", "armed")
            ? clampPullOffset(
                context.get("offset"),
                resolveMaxPullDistance(prop),
              )
            : 0;
        return Math.min(height, threshold);
      },

      status: ({ state }) => {
        if (state.matches("pulling")) return 0;
        if (state.matches("armed")) return 1;
        if (state.matches("refreshing")) return 2;
        if (state.matches("success")) return 3;
        return -1;
      },

      statusKey: ({ state }) => state.get(),

      text: ({ prop, computed }) => {
        const status = computed("status");
        if (status < 0) return "";
        const texts = prop("loadingTexts");
        const list =
          Array.isArray(texts) && texts.length >= 4
            ? texts
            : DEFAULT_LOADING_TEXTS;
        return list[status] ?? "";
      },
    },

    watch: ({ prop, state, send }) => {
      const rawValue = prop("value");
      if (!isNotNull(rawValue)) return;

      if (rawValue) {
        if (!state.matches("refreshing")) {
          send({ type: "CONTROLLED.REFRESH" });
        }
      } else if (state.matches("refreshing")) {
        send({ type: "CONTROLLED.CLOSE" });
      }
    },

    on: {
      SCROLL: {
        actions: ["setScrollTopFromEvent", "invokeScroll"],
      },
      SCROLL_TO_UPPER: {
        actions: ["resetScrollTop", "invokeScrollToUpper"],
      },
      SCROLL_TO_LOWER: {
        actions: ["invokeScrollToLower"],
      },
      REFRESH: {
        guard: "isNotRefreshing",
        target: "refreshing",
        actions: ["emitRefresh"],
      },
      "CONTROLLED.REFRESH": {
        guard: "isNotRefreshing",
        target: "refreshing",
      },
    },

    states: {
      idle: {
        tags: ["idle"],
        on: {
          DRAG_START: {
            guard: "canPull",
            target: "pulling",
            actions: ["resetOffset", "invokeDragStart"],
          },
        },
      },

      pulling: {
        tags: ["pulling"],
        on: {
          DRAG_MOVE: [
            {
              guard: "reachedThreshold",
              target: "armed",
              actions: dragMoveActions,
            },
            {
              actions: dragMoveActions,
            },
          ],
          DRAG_END: dragEndTransitions,
        },
      },

      armed: {
        tags: ["armed"],
        on: {
          DRAG_MOVE: [
            {
              guard: "reachedThreshold",
              actions: dragMoveActions,
            },
            {
              guard: "belowThreshold",
              target: "pulling",
              actions: dragMoveActions,
            },
          ],
          DRAG_END: dragEndTransitions,
        },
      },

      refreshing: {
        tags: ["refreshing"],
        effects: ["waitForRefreshTimeout"],
        on: {
          TIMEOUT: {
            target: "idle",
            actions: ["invokeTimeout", "emitChangeFalse", "resetOffset"],
          },
          CLOSE: {
            target: "success",
          },
          "CONTROLLED.CLOSE": {
            target: "success",
          },
        },
      },

      success: {
        tags: ["success"],
        effects: ["waitForSuccessDuration"],
        on: {
          SUCCESS_TIMEOUT: {
            target: "idle",
            actions: ["resetOffset"],
          },
          CLOSE: {
            target: "idle",
            actions: ["resetOffset"],
          },
        },
      },
    },

    implementations: {
      guards: {
        canPull: ({ computed }) => computed("canPull"),
        isNotRefreshing: ({ state }) => !state.matches("refreshing"),
        reachedThreshold: (params) => {
          const threshold = resolveThreshold(params.prop);
          return resolveEventOffset(params, params.event) >= threshold;
        },
        belowThreshold: (params) => {
          const threshold = resolveThreshold(params.prop);
          return resolveEventOffset(params, params.event) < threshold;
        },
      },

      actions: {
        setOffsetFromEvent: ({ context, event }) => {
          if (event.type !== "DRAG_MOVE") return;
          context.set("offset", Math.max(0, Number(event.offset) || 0));
        },

        resetOffset: ({ context }) => {
          context.set("offset", 0);
        },

        setScrollTopFromEvent: ({ context, event }) => {
          if (event.type !== "SCROLL") return;
          context.set("scrollTop", Math.max(0, Number(event.scrollTop) || 0));
        },

        resetScrollTop: ({ context }) => {
          context.set("scrollTop", 0);
        },

        emitRefresh: ({ prop, refs, send }) => {
          prop("onChange")?.({ value: true });
          refs.set("refreshTask", undefined);

          const result = prop("onRefresh")?.({
            close: () => send({ type: "CLOSE" }),
            setPromise: (task: Promise<unknown>) => {
              refs.set("refreshTask", task);
            },
          });

          if (isPromise(result)) {
            refs.set("refreshTask", result as Promise<unknown>);
          }
        },

        emitChangeFalse: ({ prop }) => {
          prop("onChange")?.({ value: false });
        },

        invokeTimeout: ({ prop }) => {
          prop("onTimeout")?.();
        },

        invokeScroll: ({ prop, event }) => {
          if (event.type !== "SCROLL") return;
          prop("onScroll")?.({
            scrollTop: event.scrollTop,
            scrollLeft: event.scrollLeft,
          });
        },

        invokeScrollToUpper: ({ prop }) => {
          prop("onScrollToUpper")?.();
        },

        invokeScrollToLower: ({ prop }) => {
          prop("onScrollToLower")?.();
        },

        invokeDragStart: ({ prop }) => {
          prop("onDragStart")?.();
        },

        invokeDrag: ({ prop, event }) => {
          if (event.type !== "DRAG_MOVE") return;
          prop("onDrag")?.({ offset: event.offset });
        },

        invokeDragEnd: ({ prop, event }) => {
          if (event.type !== "DRAG_END") return;
          prop("onDragEnd")?.({ offset: event.offset });
        },
      },

      effects: {
        waitForRefreshTimeout: ({ send, prop, refs }) => {
          const task = refs.get("refreshTask");
          refs.set("refreshTask", undefined);

          if (isPromise(task)) {
            let active = true;
            Promise.resolve(task).then(
              () => {
                if (active) send({ type: "CLOSE" });
              },
              () => {
                if (active) send({ type: "CLOSE" });
              },
            );
            return () => {
              active = false;
            };
          }

          const timeout = resolveNumber(prop("refreshTimeout"), 3000, 0);
          if (timeout <= 0) return;
          const timer = setTimeout(() => {
            send({ type: "TIMEOUT" });
          }, timeout);
          return () => {
            clearTimeout(timer);
          };
        },

        waitForSuccessDuration: ({ send, prop }) => {
          const duration = resolveNumber(prop("successDuration"), 500, 0);
          if (duration <= 0) return;
          const timer = setTimeout(() => {
            send({ type: "SUCCESS_TIMEOUT" });
          }, duration);
          return () => {
            clearTimeout(timer);
          };
        },
      },
    },
  });
