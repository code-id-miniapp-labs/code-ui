import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
  getApi,
} from "../_shared";
import { resolveSlots } from "../../utils/ui";
import {
  radioGroupMachine,
  connectRadioGroup,
  defaultRadioGroupProps,
} from "@code-ui/radio-group";
import themeConfig from "virtual:cui/theme/radio-group";
import { tv } from "../../utils/variants";

const radioGroupTheme = tv(themeConfig);

const radioGroupBehavior = createMachineBehavior({
  machine: radioGroupMachine,
  connect: connectRadioGroup,
  key: "cRadioGroup",
  formField: true,
  radioGroup: true,
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [radioGroupBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultRadioGroupProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.cRadioGroup;
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const size = api?.size ?? this.data.size;
        const color = api?.color ?? this.data.color;
        const orientation = api?.orientation ?? this.data.orientation;
        const variant = api?.variant ?? this.data.variant;
        const required = Boolean(api?.required ?? this.data.required);
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
      handleItemTap(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "cRadioGroup")?.handleItemTap?.(e);
      },
    },
  }),
);
