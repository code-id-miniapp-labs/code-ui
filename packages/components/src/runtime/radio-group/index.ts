import type {
  RadioGroupItemTapDetail,
  RadioGroupOrientation,
  RadioGroupSize,
  RadioGroupVariant,
} from "@code-id-labs/radio-group";
import type { MiniAppEventLike } from "@code-id-labs/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withRadioGroup } from "@code-id-labs/miniapp/behaviors/radio";
import { withFormField } from "@code-id-labs/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import {
  radioGroupMachine,
  connectRadioGroup,
  defaultRadioGroupProps,
} from "@code-id-labs/radio-group";
import themeConfig from "virtual:cui/theme/radio-group";
import { tv } from "../../utils/variants";

const radioGroupTheme = tv(themeConfig);

const radioGroupBehavior = createMachineBehavior({
  machine: radioGroupMachine,
  connect: connectRadioGroup,
  key: "cRadioGroup",
  plugins: [withFormField(), withRadioGroup()],
  exportApi: true,
  exportApiKeys: ["value", "setValue", "clear"],
});

Component(
  createComponentOptions({
    behaviors: [radioGroupBehavior, computedBehavior],

    slots: {
      default: false,
      legend: false,
    },

    properties: createProperties(defaultRadioGroupProps, {
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "",
      },
      orientation: {
        type: String,
        value: "vertical",
      },
      variant: {
        type: String,
        value: "outline",
      },
      legend: {
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
      resolvedColor(): string {
        return this.data.color || "primary";
      },

      resolvedVariant(): RadioGroupVariant {
        return (this.data.variant || "outline") as RadioGroupVariant;
      },

      resolvedSize(): RadioGroupSize {
        return (this.data.size || this.data.fieldSize || "md") as RadioGroupSize;
      },

      resolvedOrientation(): RadioGroupOrientation {
        return (this.data.orientation || "vertical") as RadioGroupOrientation;
      },

      resolvedItems() {
        const apiItems = this.data.cRadioGroup?.items ?? [];
        const rawItems = this.data.items ?? [];
        const groupSize = this.data.resolvedSize;
        const groupColor = this.data.resolvedColor;
        const groupVariant = this.data.resolvedVariant;
        const groupUi = this.data.ui || {};

        return apiItems.map((apiItem: any, idx: number) => {
          const raw = rawItems[idx];
          const item =
            typeof raw === "string"
              ? { value: raw, label: raw }
              : (raw ?? {});
          return {
            ...apiItem,
            label: String(item.label ?? apiItem.value ?? ""),
            description: String(item.description ?? ""),
            color: item.color ?? groupColor,
            variant: item.variant ?? groupVariant,
            size: item.size || groupSize,
            ui: item.ui ?? groupUi,
          };
        });
      },

      classes() {
        const api = this.data.cRadioGroup;
        const isInvalid = Boolean(api?.invalid);
        const disabled = Boolean(api?.disabled);
        const size = this.data.resolvedSize;
        const color = this.data.resolvedColor;
        const orientation = this.data.resolvedOrientation;
        const variant = this.data.resolvedVariant;
        const required = Boolean(this.data.required);
        const ui = this.data.ui;

        const themeFns = radioGroupTheme({
          color,
          size,
          orientation,
          variant,
          disabled,
          required,
          invalid: isInvalid,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleItemTap(e: MiniAppEventLike<RadioGroupItemTapDetail>) {
        return getApi(this, "cRadioGroup")?.handleItemTap?.(e.detail);
      },
    },
  }),
);
