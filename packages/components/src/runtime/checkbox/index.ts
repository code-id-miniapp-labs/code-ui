import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
  getApi,
} from "../_shared";
import { resolveSlots } from "../../utils/ui";
import {
  checkboxMachine,
  connectCheckbox,
  defaultCheckboxProps,
} from "@code-ui/checkbox";
import themeConfig from "virtual:cui/theme/checkbox";
import { tv } from "../../utils/variants";

const checkboxTheme = tv(themeConfig);

const checkboxBehavior = createMachineBehavior({
  machine: checkboxMachine,
  connect: connectCheckbox,
  key: "cCheckbox",
  formField: true,
  checkboxItem: true,
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [checkboxBehavior, computedBehavior],

    options: {
      addGlobalClass: true,
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultCheckboxProps, {
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
        const api = this.data.cCheckbox;
        const checked = Boolean(api?.checked ?? this.data.checked);
        const indeterminate = Boolean(
          api?.indeterminate ?? this.data.indeterminate,
        );
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const size = api?.size ?? this.data.size;
        const color = api?.color ?? this.data.color;
        const variant = api?.variant ?? this.data.variant;
        const required = Boolean(api?.required ?? this.data.required);
        const ui = this.data.ui;

        const themeFns = checkboxTheme({
          color,
          size,
          variant,
          disabled,
          checked,
          indeterminate,
          required,
          invalid: isInvalid,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTap(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "cCheckbox")?.handleTap?.(e);
      },
    },
  }),
);
