import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withStepperItem } from "@code-id-labs/miniapp/behaviors/stepper";
import { resolveSlots } from "../../utils/ui";
import {
  stepperItemMachine,
  connectStepperItem,
  defaultStepperItemProps,
} from "@code-id-labs/stepper-item";
import themeConfig from "virtual:cui/theme/stepper-item";
import { tv } from "../../utils/variants";

const stepperItemTheme = tv(themeConfig);

const stepperItemBehavior = createMachineBehavior({
  machine: stepperItemMachine,
  connect: connectStepperItem,
  key: "cStepperItem",
  plugins: [withStepperItem()],
  exportApi: true,
  exportApiKeys: ["index", "value", "status", "isCompleted", "isCurrent"],
});

Component(
  createComponentOptions({
    behaviors: [stepperItemBehavior, computedBehavior],

    slots: {
      default: false,
      indicator: false,
      completedIndicator: false,
      title: false,
      description: false,
    },

    properties: createProperties(defaultStepperItemProps, {
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
      completedIcon: {
        type: String,
        value: "check",
      },
      orientation: {
        type: String,
        value: "",
      },
      color: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "",
      },
      variant: {
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
      resolvedColor() {
        return this.data.color || this.data.groupColor || "primary";
      },

      resolvedSize() {
        return this.data.size || this.data.groupSize || "md";
      },

      resolvedOrientation() {
        return this.data.orientation || this.data.groupOrientation || "horizontal";
      },

      classes() {
        const api = this.data.cStepperItem;
        const themeFns = stepperItemTheme({
          color: this.data.resolvedColor,
          size: this.data.resolvedSize,
          orientation: this.data.resolvedOrientation,
          disabled: Boolean(api?.disabled),
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleTap() {
        getApi(this, "cStepperItem")?.handleTap();
      },
    },
  }),
);
