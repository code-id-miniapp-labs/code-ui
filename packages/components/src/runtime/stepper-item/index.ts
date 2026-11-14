import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withStepperItem } from "@code-ui/miniapp/behaviors/stepper";
import { resolveSlots } from "../../utils/ui";
import {
  stepperItemMachine,
  connectStepperItem,
  defaultStepperItemProps,
} from "@code-ui/stepper-item";
import themeConfig from "virtual:cui/theme/stepper-item";
import { tv } from "../../utils/variants";

const stepperItemTheme = tv(themeConfig);

const stepperItemBehavior = createMachineBehavior({
  machine: stepperItemMachine,
  connect: connectStepperItem,
  key: "cStepperItem",
  plugins: [withStepperItem()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [stepperItemBehavior, computedBehavior],

    properties: createProperties(defaultStepperItemProps, {
      className: {
        type: String,
        value: "",
      },
      customIndicator: {
        type: Boolean,
        value: false,
      },
      customCompletedIndicator: {
        type: Boolean,
        value: false,
      },
    }),

    computed: {
      classes() {
        const api = this.data.cStepperItem;
        const themeFns = stepperItemTheme({
          color: api ? api.color : this.data.color || "primary",
          size: api ? api.size : this.data.size || "md",
          orientation: api ? api.orientation : this.data.orientation || "horizontal",
          disabled: api ? api.isDisabled : this.data.disabled,
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
