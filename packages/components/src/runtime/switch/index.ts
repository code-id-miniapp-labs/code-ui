import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
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
      addGlobalClass: true,
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultSwitchProps, {
      class: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const isInvalid = Boolean(this.data.cSwitch?.invalid);
        const disabled = Boolean(this.data.cSwitch?.disabled);
        const loading = Boolean(this.data.cSwitch?.loading);
        const checked = Boolean(this.data.cSwitch?.checked);
        const size = this.data.cSwitch?.size ?? "md";
        const color = isInvalid ? "danger" : this.data.color;
        const required = Boolean(this.data.required);
        const ui = this.data.ui;

        const themeFns = switchTheme({
          color,
          size,
          disabled,
          loading,
          checked,
          required,
        });

        return resolveSlots(themeFns, ui, this.data.class);
      },
    },

    methods: {
      handleTap(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.cSwitch;
        return api?.handleTap?.(e);
      },
    },
  }),
);
