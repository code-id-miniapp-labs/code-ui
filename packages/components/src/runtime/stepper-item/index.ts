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

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultStepperItemProps, {
      className: {
        type: String,
        value: "",
      },
      customIndicator: {
        type: Boolean,
        value: false,
      },
    }),

    computed: {
      classes() {
        const api = this.data.cStepperItem;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const size = api?.size ?? (this.data.size || "md");
        const color = api?.color ?? (this.data.color || "primary");
        const orientation =
          api?.orientation ?? (this.data.orientation || "horizontal");
        const ui = this.data.ui;

        const themeFns = stepperItemTheme({
          color,
          size,
          orientation,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTap(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "cStepperItem")?.handleTap?.(e);
      },
    },
  }),
);
