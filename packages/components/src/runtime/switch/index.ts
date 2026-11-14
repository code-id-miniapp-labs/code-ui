import type { MiniAppBaseEventLike } from "@code-ui/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
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
  plugins: [withFormField()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [switchBehavior, computedBehavior],

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
        const loading = Boolean(this.data.loading);
        const checked = Boolean(api?.checked ?? this.data.checked);
        const size = api?.size ?? this.data.size;
        const color = this.data.color;
        const required = Boolean(this.data.required);
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
      handleTap(e: MiniAppBaseEventLike) {
        return getApi(this, "cSwitch")?.handleTap?.(e);
      },
    },
  }),
);
