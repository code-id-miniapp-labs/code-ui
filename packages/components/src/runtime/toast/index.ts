import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import {
  cuiAppChildBehavior,
  setupAppRelations,
} from "@code-ui/miniapp/behaviors/app";
import { resolveSlots } from "../../utils/ui";
import { connectToast, defaultToastProps, toastMachine } from "@code-ui/toast";
import themeConfig from "virtual:cui/theme/toast";
import { tv } from "../../utils/variants";

const toastTheme = tv(themeConfig);

const toastBehavior = createMachineBehavior({
  machine: toastMachine,
  connect: connectToast,
  key: "toast",
  exportApi: true,
  syncProps: ["id", "open", "duration", "actions"],
});

const relations: Record<string, WechatMiniprogram.Component.RelationOption> =
  {};
setupAppRelations(relations, "child");

Component(
  createComponentOptions({
    behaviors: [cuiAppChildBehavior, toastBehavior, computedBehavior],
    relations,

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultToastProps, {
      className: {
        type: String,
        value: "",
      },
      progress: {
        type: null,
        value: true,
      },
      progressPosition: {
        type: String,
        value: "bottom",
      },
      index: {
        type: Number,
        value: 0,
      },
      offset: {
        type: Number,
        value: 0,
      },
    }),

    computed: {
      resolvedIcon() {
        const icon = this.data.icon;
        if (icon) return icon;
        const color = this.data.color;
        if (color === "success") return "check";
        if (color === "error" || color === "danger") return "close";
        if (color === "loading") return "loading";
        return "";
      },

      classes() {
        const mode = this.data.mode || "default";
        const rawColor = this.data.color || "neutral";
        const color = rawColor === "error" ? "danger" : rawColor;
        const variant = this.data.variant || "outline";
        const orientation = this.data.orientation || "horizontal";
        const placement = this.data.placement || "top";
        const progressPosition = this.data.progressPosition || "bottom";

        const themeFns = toastTheme({
          mode,
          color,
          variant,
          orientation,
          placement,
          progressPosition,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },

      progressStyle() {
        const duration = Number(this.data.duration || 4000);
        if (duration <= 0) return "display: none;";
        const isPaused = Boolean(this.data.toast?.paused);
        const playState = isPaused ? "paused" : "running";
        return `width: 100%; animation: cui-toast-progress ${duration}ms linear forwards; -webkit-animation: cui-toast-progress ${duration}ms linear forwards; animation-play-state: ${playState}; -webkit-animation-play-state: ${playState};`;
      },

      resolvedProgressColor() {
        const rawProgress = this.data.progress;
        if (
          typeof rawProgress === "object" &&
          rawProgress !== null &&
          "color" in rawProgress
        ) {
          const customColor = (rawProgress as { color?: string }).color;
          if (customColor) {
            return customColor === "error" ? "danger" : customColor;
          }
        }
        const rawColor = this.data.color || "neutral";
        return rawColor === "error" ? "danger" : rawColor;
      },

      progressUi() {
        return {
          root: "w-full h-full min-w-0 overflow-hidden",
          track: "bg-transparent h-full min-w-0 rounded-none",
          range: "rounded-none h-full min-w-0 transition-none",
        };
      },

      rootStyle() {
        const index = Number(this.data.index || 0);
        const offset = Number(this.data.offset || 0);
        const placement = this.data.placement || "top";

        if (placement === "center") {
          return `--cui-toast-index:${index}; transform: translate3d(-50%, -50%, 0); z-index: ${100 + index};`;
        }

        if (placement === "top") {
          return `--cui-toast-index:${index}; --cui-toast-offset:${offset}px; transform: translate3d(-50%, ${offset}px, 0); z-index: ${100 + index};`;
        }

        if (placement === "bottom") {
          return `--cui-toast-index:${index}; --cui-toast-offset:${offset}px; transform: translate3d(-50%, -${offset}px, 0); z-index: ${100 + index};`;
        }

        return `--cui-toast-index:${index}; z-index: ${100 + index};`;
      },
    },

    methods: {
      handleCloseTap(this: any) {
        getApi(this, "toast")?.dismiss();
      },

      handleActionTap(this: any, event: any) {
        const index = Number(event.currentTarget.dataset.index);
        getApi(this, "toast")?.handleAction(index);
      },

      handleTouchStart(this: any) {
        getApi(this, "toast")?.pause();
      },

      handleTouchEnd(this: any) {
        getApi(this, "toast")?.resume();
      },
    },
  }),
);
