import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withCheckboxGroup } from "@code-ui/miniapp/behaviors/checkbox";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import {
  checkboxGroupMachine,
  connectCheckboxGroup,
  defaultCheckboxGroupProps,
} from "@code-ui/checkbox-group";
import themeConfig from "virtual:cui/theme/checkbox-group";
import { tv } from "../../utils/variants";

const checkboxGroupTheme = tv(themeConfig);

const checkboxGroupBehavior = createMachineBehavior({
  machine: checkboxGroupMachine,
  connect: connectCheckboxGroup,
  key: "cCheckboxGroup",
  plugins: [withFormField(), withCheckboxGroup()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [checkboxGroupBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultCheckboxGroupProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.cCheckboxGroup;
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const size = api?.size ?? this.data.size;
        const color = api?.color ?? this.data.color;
        const orientation = api?.orientation ?? this.data.orientation;
        const variant = api?.variant ?? this.data.variant;
        const required = Boolean(api?.required ?? this.data.required);
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
      handleItemTap(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "cCheckboxGroup")?.handleItemTap?.(e);
      },
    },
  }),
);
