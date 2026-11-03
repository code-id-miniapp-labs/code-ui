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
import {
  connectToast,
  defaultToastProps,
  toastMachine,
} from "@code-ui/toast";
import themeConfig from "virtual:cui/theme/toast";
import { tv } from "../../utils/variants";

const toastTheme = tv(themeConfig);

const toastBehavior = createMachineBehavior({
  machine: toastMachine,
  connect: connectToast,
  key: "toast",
  exportApi: true,
  syncProps: [
    "id",
    "open",
    "duration",
    "mode",
    "color",
    "variant",
    "orientation",
    "placement",
    "title",
    "description",
    "icon",
    "close",
    "actions",
  ],
});

const relations: Record<string, WechatMiniprogram.Component.RelationOption> = {};
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

    data: {
      progress: false,
    },

    properties: createProperties(defaultToastProps, {
      className: {
        type: String,
        value: "",
      },
      progress: {
        type: Boolean,
        value: true,
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
      resolvedMode() {
        const api = this.data.toast;
        return api?.mode ?? this.data.mode ?? "default";
      },

      resolvedTitle() {
        const api = this.data.toast;
        return api?.title !== undefined && api?.title !== ""
          ? api.title
          : this.data.title || "";
      },

      resolvedDescription() {
        const api = this.data.toast;
        return api?.description !== undefined && api?.description !== ""
          ? api.description
          : this.data.description || "";
      },

      resolvedIcon() {
        const api = this.data.toast;
        const icon = api?.icon || this.data.icon;
        if (icon) return icon;
        const color = api?.color || this.data.color;
        if (color === "success") return "check";
        if (color === "error" || color === "danger") return "close";
        if (color === "loading") return "loading";
        return "";
      },

      classes() {
        const api = this.data.toast;
        const mode = api?.mode ?? this.data.mode ?? "default";
        const rawColor = api?.color ?? this.data.color ?? "neutral";
        const color = rawColor === "error" ? "danger" : rawColor;
        const variant = api?.variant ?? this.data.variant ?? "outline";
        const orientation =
          api?.orientation ?? this.data.orientation ?? "horizontal";
        const placement =
          api?.placement ?? this.data.placement ?? "top";

        const themeFns = toastTheme({
          mode,
          color,
          variant,
          orientation,
          placement,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },

      progressStyle() {
        const api = this.data.toast;
        const duration = Number(api?.duration ?? this.data.duration ?? 4000);
        if (duration <= 0) return "display: none;";
        const isPaused = Boolean(api?.paused);
        return `width: 100%; animation: cui-toast-progress ${duration}ms linear forwards; animation-play-state: ${isPaused ? "paused" : "running"};`;
      },

      resolvedProgressColor() {
        const api = this.data.toast;
        const rawColor = api?.color ?? this.data.color ?? "neutral";
        return rawColor === "error" ? "danger" : rawColor;
      },

      progressUi() {
        return {
          root: "w-full overflow-hidden",
          track: "bg-transparent h-0.5 rounded-none",
          range: "rounded-none h-full",
        };
      },

      rootStyle() {
        const index = Number(this.data.index || 0);
        const offset = Number(this.data.offset || 0);
        const api = this.data.toast;
        const placement = api?.placement ?? this.data.placement ?? "top";

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
