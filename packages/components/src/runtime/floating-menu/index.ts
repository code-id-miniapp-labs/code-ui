import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { createAppThemeBehavior } from "@code-ui/miniapp/behaviors/theme";
import {
  connectFloatingMenu,
  defaultFloatingMenuProps,
  floatingMenuMachine,
} from "@code-ui/floating-menu";
import themeConfig from "virtual:cui/theme/floating-menu";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";

const floatingMenuTheme = tv(themeConfig);

const floatingMenuBehavior = createMachineBehavior({
  machine: floatingMenuMachine,
  connect: connectFloatingMenu,
  key: "floatingMenu",
  exportApi: true,
});

const appThemeBehavior =
  typeof Behavior !== "undefined" ? createAppThemeBehavior() : ({} as any);

Component(
  createComponentOptions({
    behaviors: [appThemeBehavior, floatingMenuBehavior, computedBehavior],

    slots: {
      default: false,
      trigger: false,
    },

    properties: createProperties(defaultFloatingMenuProps, {
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
      wrapperStyle(): string {
        const visible = Boolean(this.data.floatingMenu?.visible);
        const base = this.data.portal ? this.data.themeCssVars || "" : "";
        if (visible) return base;
        if (!base) return "display:none;";
        return base.endsWith(";") ? `${base}display:none;` : `${base};display:none;`;
      },

      classes() {
        const api = this.data.floatingMenu;
        const themeFns = floatingMenuTheme({
          portal: Boolean(this.data.portal),
          open: Boolean(api?.open),
          visible: Boolean(api?.visible),
          side: api?.resolvedSide ?? this.data.side,
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      noop() {},

      handleTriggerTap() {
        getApi(this, "floatingMenu")?.handleTriggerTap?.();
      },

      handleBackdropTap() {
        getApi(this, "floatingMenu")?.handleBackdropTap?.();
      },
    },
  }),
);
