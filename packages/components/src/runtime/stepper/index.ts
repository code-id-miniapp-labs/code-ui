import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withStepper } from "@code-ui/miniapp/behaviors/stepper";
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
});

Component(
  createComponentOptions({
    behaviors: [stepperBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultStepperProps, {
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

      classes() {
        const api = this.data.stepper;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const orientation = api?.orientation ?? this.data.orientation;
        const ui = this.data.ui;

        const themeFns = stepperTheme({
          orientation,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleItemClick(e: WechatMiniprogram.CustomEvent) {
        const index = e.detail?.index ?? e.currentTarget?.dataset?.index;
        getApi(this, "stepper")?.goToStep?.(index);
      },
      setStep(index: number) {
        return getApi(this, "stepper")?.setStep?.(index);
      },
      goToStep(index: number) {
        return getApi(this, "stepper")?.goToStep?.(index);
      },
      nextStep() {
        return getApi(this, "stepper")?.nextStep?.();
      },
      prevStep() {
        return getApi(this, "stepper")?.prevStep?.();
      },
      resetStep() {
        return getApi(this, "stepper")?.resetStep?.();
      },
      completeStep() {
        return getApi(this, "stepper")?.completeStep?.();
      },
      scrollTo(index: number) {
        return getApi(this, "stepper")?.scrollTo?.(index);
      },
      scrollToStep(index: number) {
        return getApi(this, "stepper")?.scrollToStep?.(index);
      },
    },
  }),
);
