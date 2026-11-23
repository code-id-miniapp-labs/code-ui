import { computedBehavior, createComponentOptions } from "../_shared/base";
import type { MiniAppBaseEventLike } from "@code-id-labs/utils";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import {
  cuiAppChildBehavior,
  setupAppRelations,
} from "@code-id-labs/miniapp/behaviors/app";
import { resolveSlots } from "../../utils/ui";
import {
  resolveSubcomponentList,
  resolveTriggerButtonProps,
} from "../../utils/subcomponent";
import {
  type ToastAction,
  type ToastCloseProps,
  connectToast,
  defaultToastProps,
  toastMachine,
} from "@code-id-labs/toast";
import themeConfig from "virtual:cui/theme/toast";
import { tv } from "../../utils/variants";

const toastTheme = tv(themeConfig);

const toastBehavior = createMachineBehavior({
  machine: toastMachine,
  connect: connectToast,
  key: "toast",
  exportApi: true,
  exportApiKeys: ["open", "visible", "dismiss", "pause", "resume", "handleAction"],
  syncProps: ["id", "open", "duration", "actions"],
});

const relations: Record<string, WechatMiniprogram.Component.RelationOption> =
  {};
setupAppRelations(relations, "child");

Component(
  createComponentOptions({
    behaviors: [cuiAppChildBehavior, toastBehavior, computedBehavior],
    relations,
    slots: {
      title: false,
      description: false,
      icon: false,
      close: false,
      actions: false,
    },

    properties: createProperties(defaultToastProps, {
      className: {
        type: String,
        value: "",
      },
      mode: {
        type: String,
        value: "default",
      },
      color: {
        type: String,
        value: "neutral",
      },
      variant: {
        type: String,
        value: "outline",
      },
      orientation: {
        type: String,
        value: "vertical",
      },
      placement: {
        type: String,
        value: "top",
      },
      title: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
      },
      icon: {
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
      close: {
        type: null,
        value: true,
      },
      ui: {
        type: Object,
        value: {},
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
      resolvedColor() {
        const rawColor = this.data.color as string;
        if (rawColor === "error") return "danger";
        if (rawColor === "loading") return "neutral";
        return rawColor;
      },

      resolvedActions() {
        const rawActions = (this.data.actions || []) as ToastAction[];
        const classes = this.data.classes as Record<string, string> | undefined;
        const color = this.data.resolvedColor as string;
        const variant = this.data.variant as string;

        return resolveSubcomponentList<ToastAction>(
          rawActions,
          {
            label: "",
            color: variant === "solid" ? "neutral" : color,
            variant: "outline",
            size: "xs",
            loadingIcon: "loading",
            ui: {},
          },
          "label",
          (action) => {
            action.loading = Boolean(action.loading);
            action.disabled = Boolean(action.disabled);
            action.closeOnClick = Boolean(action.closeOnClick);
            action.ui = action.ui ?? {};
            action.className = [classes?.action, action.className]
              .filter(Boolean)
              .join(" ");
            return action;
          },
        );
      },

      resolvedClose() {
        const classes = this.data.classes as Record<string, string> | undefined;
        const color = this.data.resolvedColor as string;
        const variant = this.data.variant as string;

        return resolveTriggerButtonProps<ToastCloseProps>(
          this.data.close as boolean | ToastCloseProps | null | undefined,
          {
            icon: "close",
            color: variant === "solid" ? "neutral" : color,
            variant: "ghost",
            size: "xs",
            ui: { icon: classes?.closeIcon ?? "" },
          },
          classes?.closeButton,
        );
      },

      resolvedIcon() {
        const icon = this.data.icon;
        if (icon) return icon;
        const color = this.data.color;
        if (color === "success") return "check";
        if (color === "danger" || color === "error") return "close";
        if (color === "loading") return "loading";
        return "";
      },

      classes() {
        const mode = this.data.mode;
        const color = this.data.resolvedColor;
        const variant = this.data.variant;
        const orientation = this.data.orientation;
        const placement = this.data.placement;
        const progressPosition = this.data.progressPosition;

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
        const duration = Number(this.data.duration);
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
        return this.data.resolvedColor;
      },

      progressUi() {
        const classes = this.data.classes as Record<string, string> | undefined;
        return {
          root: classes?.progressBar ?? "",
          track: classes?.progressTrack ?? "",
          range: classes?.progressRange ?? "",
        };
      },

      rootStyle() {
        const index = Number(this.data.index);
        const offset = Number(this.data.offset);
        const placement = this.data.placement;
        const zPart =
          index > 0 ? ` z-index: calc(var(--z-toast, 10150) + ${index});` : "";

        if (placement === "center") {
          return `--cui-toast-index:${index}; -webkit-transform: translate3d(-50%, -50%, 0); transform: translate3d(-50%, -50%, 0);${zPart}`;
        }

        if (placement === "top") {
          return `--cui-toast-index:${index}; --cui-toast-offset:${offset}px; -webkit-transform: translate3d(-50%, ${offset}px, 0); transform: translate3d(-50%, ${offset}px, 0);${zPart}`;
        }

        if (placement === "bottom") {
          return `--cui-toast-index:${index}; --cui-toast-offset:${offset}px; -webkit-transform: translate3d(-50%, -${offset}px, 0); transform: translate3d(-50%, -${offset}px, 0);${zPart}`;
        }

        return `--cui-toast-index:${index};${zPart}`;
      },
    },

    methods: {
      handleCloseTap(this: any) {
        getApi(this, "toast")?.dismiss();
      },

      handleActionTap(
        this: any,
        event: MiniAppBaseEventLike<{ index: number }>,
      ) {
        const index = Number(event.currentTarget?.dataset?.index);
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
