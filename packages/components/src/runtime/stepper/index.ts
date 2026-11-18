import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withStepper } from "@code-ui/miniapp/behaviors/stepper";
import type { MiniAppEventLike } from "@code-ui/utils";
import { resolveSlots } from "../../utils/ui";
import {
  stepperMachine,
  connectStepper,
  defaultStepperProps,
} from "@code-ui/stepper";
import themeConfig from "virtual:cui/theme/stepper";
import { tv } from "../../utils/variants";

const stepperTheme = tv(themeConfig);

const stepperBehavior = createMachineBehavior({
  machine: stepperMachine,
  connect: connectStepper,
  key: "stepper",
  plugins: [withStepper()],
  exportApi: true,
  exportApiKeys: [
    "step",
    "value",
    "hasNext",
    "hasPrev",
    "isCompleted",
    "setStep",
    "goToStep",
    "nextStep",
    "prevStep",
    "resetStep",
    "completeStep",
    "scrollTo",
    "scrollToStep",
  ],
});

Component(
  createComponentOptions({
    behaviors: [stepperBehavior, computedBehavior],

    slots: {
      default: false,
      content: false,
    },

    properties: createProperties(defaultStepperProps, {
      orientation: {
        type: String,
        value: "horizontal",
      },
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "md",
      },
      variant: {
        type: String,
        value: "subtle",
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
      hasItems() {
        const items = this.data.items;
        return Array.isArray(items) && items.length > 0;
      },

      resolvedItems() {
        const steps = this.data.stepper?.steps;
        if (!Array.isArray(steps)) return [];
        const rawItems = Array.isArray(this.data.items) ? this.data.items : [];
        const fallbackUi = this.data.ui;
        return steps.map((step: any, idx: number) => {
          const raw = rawItems[idx];
          const rawObj = raw && typeof raw === "object" ? raw : undefined;
          return {
            ...step,
            title: rawObj?.title ?? "",
            description: rawObj?.description ?? "",
            icon: rawObj?.icon ?? "",
            completedIcon: rawObj?.completedIcon ?? "",
            ui: rawObj?.ui ?? fallbackUi,
          };
        });
      },

      classes() {
        const { orientation, disabled, ui, className } = this.data;

        const themeFns = stepperTheme({
          orientation,
          disabled,
        });

        return resolveSlots(themeFns, ui, className);
      },
    },

    methods: {
      handleItemTap(e: MiniAppEventLike<{ index: number }>) {
        getApi(this, "stepper")?.setStep(e.detail.index);
      },
      setStep(index: number) {
        return getApi(this, "stepper")?.setStep(index);
      },
      goToStep(index: number) {
        return getApi(this, "stepper")?.setStep(index);
      },
      nextStep() {
        return getApi(this, "stepper")?.nextStep();
      },
      prevStep() {
        return getApi(this, "stepper")?.prevStep();
      },
      resetStep() {
        return getApi(this, "stepper")?.resetStep();
      },
      completeStep() {
        return getApi(this, "stepper")?.completeStep();
      },
      scrollTo(index: number) {
        return getApi(this, "stepper")?.scrollTo(index);
      },
      scrollToStep(index: number) {
        return getApi(this, "stepper")?.scrollTo(index);
      },
    },
  }),
);
