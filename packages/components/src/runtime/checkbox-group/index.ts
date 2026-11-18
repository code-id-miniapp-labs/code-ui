import type {
  CheckboxGroupItemTapDetail,
  CheckboxGroupOrientation,
  CheckboxGroupSize,
  CheckboxGroupVariant,
} from "@code-id-labs/checkbox-group";
import type { MiniAppEventLike } from "@code-id-labs/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withCheckboxGroup } from "@code-id-labs/miniapp/behaviors/checkbox";
import { withFormField } from "@code-id-labs/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import {
  checkboxGroupMachine,
  connectCheckboxGroup,
  defaultCheckboxGroupProps,
} from "@code-id-labs/checkbox-group";
import themeConfig from "virtual:cui/theme/checkbox-group";
import { tv } from "../../utils/variants";

const checkboxGroupTheme = tv(themeConfig);

const checkboxGroupBehavior = createMachineBehavior({
  machine: checkboxGroupMachine,
  connect: connectCheckboxGroup,
  key: "cCheckboxGroup",
  plugins: [withFormField(), withCheckboxGroup()],
  exportApi: true,
  exportApiKeys: ["value", "setValue", "toggleValue", "selectAll", "clear"],
});

Component(
  createComponentOptions({
    behaviors: [checkboxGroupBehavior, computedBehavior],

    slots: {
      default: false,
      legend: false,
    },

    properties: createProperties(defaultCheckboxGroupProps, {
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

      resolvedVariant(): CheckboxGroupVariant {
        return (this.data.variant || "outline") as CheckboxGroupVariant;
      },

      resolvedSize(): CheckboxGroupSize {
        return (this.data.size ||
          this.data.fieldSize ||
          "md") as CheckboxGroupSize;
      },

      resolvedOrientation(): CheckboxGroupOrientation {
        return (this.data.orientation || "vertical") as CheckboxGroupOrientation;
      },

      resolvedItems() {
        const apiItems = this.data.cCheckboxGroup?.items ?? [];
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
        const api = this.data.cCheckboxGroup;
        const isInvalid = Boolean(api?.invalid);
        const disabled = Boolean(api?.disabled);
        const size = this.data.resolvedSize;
        const color = this.data.resolvedColor;
        const orientation = this.data.resolvedOrientation;
        const variant = this.data.resolvedVariant;
        const required = Boolean(this.data.required);
        const ui = this.data.ui;

        const themeFns = checkboxGroupTheme({
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
      handleItemTap(e: MiniAppEventLike<CheckboxGroupItemTapDetail>) {
        return getApi(this, "cCheckboxGroup")?.handleItemTap?.(e.detail);
      },
    },
  }),
);
