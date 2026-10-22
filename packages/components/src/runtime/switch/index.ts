import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
  getApi,
} from "../_shared";
import { resolveSlots } from "../../utils/ui";
import {
  switchMachine,
  connectSwitch,
  defaultSwitchProps,
} from "@code-ui/switch";
import themeConfig from "virtual:cui/theme/switch";
import { tv } from "../../utils/variants";

const switchTheme = tv(themeConfig);

const switchBehavior = createMachineBehavior({
  machine: switchMachine,
  connect: connectSwitch,
  key: "cSwitch",
  formField: true,
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [switchBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultSwitchProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.cSwitch;
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const loading = Boolean(api?.loading ?? this.data.loading);
        const checked = Boolean(api?.checked ?? this.data.checked);
        const size = api?.size ?? this.data.size;
        const color = api?.color ?? this.data.color;
        const required = Boolean(api?.required ?? this.data.required);
        const ui = this.data.ui;

        const themeFns = switchTheme({
          color,
          size,
          disabled,
          loading,
          checked,
          required,
          invalid: isInvalid,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTap(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "cSwitch")?.handleTap?.(e);
      },
    },
  }),
);
