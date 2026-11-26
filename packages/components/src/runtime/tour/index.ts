import type { MiniAppBaseEventLike } from "@code-id-labs/utils";
import { createAppThemeBehavior } from "@code-id-labs/miniapp/behaviors/theme";
import {
  type TourApi,
  type TourCloseProps,
  type TourStepAction,
  connectTour,
  defaultTourProps,
  tourMachine,
} from "@code-id-labs/tour";
import themeConfig from "virtual:cui/theme/tour";
import { resolveTriggerButtonProps } from "../../utils/subcomponent";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";

interface ResolvedTourActionItem {
  key: string;
  label: string;
  icon: string;
  leadingIcon: string;
  trailingIcon: string;
  color: string;
  variant: string;
  size: string;
  disabled: boolean;
  actionType: "custom" | "prev" | "next" | "skip";
  actionIndex: number;
}

const tourTheme = tv(themeConfig);

const tourBehavior = createMachineBehavior({
  machine: tourMachine,
  connect: connectTour,
  key: "tour",
  deferred: true,
  shouldStart: (props) => Boolean(props.open || props.defaultOpen),
  exportApi: true,
  exportApiKeys: [
    "open",
    "visible",
    "status",
    "step",
    "stepId",
    "stepIndex",
    "totalSteps",
    "start",
    "setOpen",
    "next",
    "prev",
    "goTo",
    "skip",
    "dismiss",
    "close",
    "reposition",
  ],
});

const appThemeBehavior =
  typeof Behavior !== "undefined" ? createAppThemeBehavior() : ({} as any);

Component(
  createComponentOptions({
    behaviors: [appThemeBehavior, tourBehavior, computedBehavior],

    slots: {
      default: false,
      header: false,
      title: false,
      description: false,
      close: false,
      footer: false,
      progress: false,
      actions: false,
    },

    properties: createProperties(defaultTourProps, {
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "md",
      },
      portal: {
        type: Boolean,
        value: true,
      },
      close: {
        type: null,
        value: true,
      },
      closeIcon: {
        type: String,
        value: "",
      },
      showProgress: {
        type: Boolean,
        value: true,
      },
      progressVariant: {
        type: String,
        value: "dots",
      },
      prevLabel: {
        type: String,
        value: "Back",
      },
      nextLabel: {
        type: String,
        value: "Next",
      },
      doneLabel: {
        type: String,
        value: "Finish",
      },
      skipLabel: {
        type: String,
        value: "",
      },
      ui: {
        type: Object,
        value: {},
      },
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      portalStyle(): string {
        return this.data.portal ? this.data.themeCssVars || "" : "";
      },

      resolvedClose() {
        if (!this.data.tour?.visible) return null;
        const classes = this.data.classes as Record<string, string> | undefined;
        const closeIcon =
          (this.data.closeIcon as string | undefined) || "close";
        return resolveTriggerButtonProps<TourCloseProps>(
          this.data.close as boolean | TourCloseProps | null | undefined,
          {
            icon: closeIcon,
            color: "neutral",
            variant: "ghost",
            size: "xs",
            ui: { icon: classes?.closeIcon ?? "" },
          },
          classes?.closeButton,
        );
      },

      progressDots(): Array<{ index: number; active: boolean }> {
        const api = this.data.tour as TourApi | undefined;
        if (!api?.visible || !this.data.showProgress || api.totalSteps <= 1) {
          return [];
        }
        const dots: Array<{ index: number; active: boolean }> = [];
        for (let i = 0; i < api.totalSteps; i++) {
          dots.push({ index: i, active: i === api.stepIndex });
        }
        return dots;
      },

      resolvedActions(): ResolvedTourActionItem[] {
        const api = this.data.tour as TourApi | undefined;
        if (!api?.visible || !api.step || !api.showCard) return [];

        const primaryColor = (this.data.color as string) || "primary";
        const btnSize = this.data.size === "lg" ? "sm" : "xs";
        const stepActions = api.step.actions;

        if (Array.isArray(stepActions)) {
          return stepActions.map((act: TourStepAction, index: number) => {
            const isPrimary =
              act.action === "next" ||
              (index === stepActions.length - 1 &&
                act.action !== "prev" &&
                act.action !== "skip");
            return {
              key: `step-${api.stepIndex}-${index}`,
              label: act.label ?? "",
              icon: act.icon ?? "",
              leadingIcon: act.leadingIcon ?? "",
              trailingIcon: act.trailingIcon ?? "",
              color: act.color ?? (isPrimary ? primaryColor : "neutral"),
              variant: act.variant ?? (isPrimary ? "solid" : "ghost"),
              size: act.size ?? btnSize,
              disabled: Boolean(act.disabled),
              actionType: "custom",
              actionIndex: index,
            };
          });
        }

        const list: ResolvedTourActionItem[] = [];
        const skipLabel = (this.data.skipLabel as string) || "";
        if (skipLabel && api.hasNextStep) {
          list.push({
            key: "default-skip",
            label: skipLabel,
            icon: "",
            leadingIcon: "",
            trailingIcon: "",
            color: "neutral",
            variant: "ghost",
            size: btnSize,
            disabled: false,
            actionType: "skip",
            actionIndex: -1,
          });
        }
        if (api.hasPrevStep) {
          list.push({
            key: "default-prev",
            label: (this.data.prevLabel as string) || "Back",
            icon: "",
            leadingIcon: "",
            trailingIcon: "",
            color: "neutral",
            variant: "outline",
            size: btnSize,
            disabled: false,
            actionType: "prev",
            actionIndex: -1,
          });
        }
        list.push({
          key: "default-next",
          label: api.hasNextStep
            ? (this.data.nextLabel as string) || "Next"
            : (this.data.doneLabel as string) || "Finish",
          icon: "",
          leadingIcon: "",
          trailingIcon: "",
          color: primaryColor,
          variant: "solid",
          size: btnSize,
          disabled: false,
          actionType: "next",
          actionIndex: -1,
        });
        return list;
      },

      classes() {
        const api = this.data.tour as TourApi | undefined;
        if (!api?.visible) {
          return {};
        }
        const closable = Boolean(
          this.data.slots?.close ||
            (this.data.close !== false && this.data.close !== null),
        );
        const themeFns = tourTheme({
          color: this.data.color,
          size: this.data.size,
          spotlight: Boolean(api.showSpotlight),
          closable,
          side: api.resolvedSide,
          transition: this.data.transition !== false,
          open: Boolean(api.open),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      noop() {},

      handleBackdropTap() {
        getApi<TourApi>(this, "tour")?.handleBackdropTap();
      },

      handleCloseTap() {
        getApi<TourApi>(this, "tour")?.handleCloseTriggerTap();
      },

      handleActionTap(ev: MiniAppBaseEventLike) {
        const api = getApi<TourApi>(this, "tour");
        if (!api) return;
        const dataset = ev?.currentTarget?.dataset as
          | { actionType?: string; actionIndex?: number }
          | undefined;
        const actionType = dataset?.actionType;
        if (actionType === "custom") {
          const index = Number(dataset?.actionIndex);
          if (!Number.isNaN(index) && index >= 0) {
            api.handleAction(index);
          }
        } else if (actionType === "prev") {
          api.prev();
        } else if (actionType === "next") {
          api.next();
        } else if (actionType === "skip") {
          api.skip();
        }
      },
    },
  }),
);
