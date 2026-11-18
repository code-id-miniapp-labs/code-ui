import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { createAppThemeBehavior } from "@code-ui/miniapp/behaviors/theme";
import {
  connectPopover,
  defaultPopoverProps,
  popoverMachine,
} from "@code-ui/popover";
import themeConfig from "virtual:cui/theme/popover";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";

const popoverTheme = tv(themeConfig);

const popoverBehavior = createMachineBehavior({
  machine: popoverMachine,
  connect: connectPopover,
  key: "popover",
  exportApi: true,
  exportApiKeys: [
    "open",
    "visible",
    "setOpen",
    "openMenu",
    "closeMenu",
    "toggle",
    "reposition",
  ],
});

const appThemeBehavior =
  typeof Behavior !== "undefined" ? createAppThemeBehavior() : ({} as any);

Component(
  createComponentOptions({
    behaviors: [appThemeBehavior, popoverBehavior, computedBehavior],

    slots: {
      default: false,
      trigger: false,
    },

    properties: createProperties(defaultPopoverProps, {
      block: {
        type: Boolean,
        value: false,
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
      wrapperStyle(): string {
        const visible = Boolean(this.data.popover?.visible);
        const base = this.data.portal ? this.data.themeCssVars || "" : "";
        if (visible) return base;
        if (!base) return "display:none;";
        return base.endsWith(";")
          ? `${base}display:none;`
          : `${base};display:none;`;
      },

      bodyStyle(): string {
        const maxHeight = this.data.popover?.maxHeight;
        return typeof maxHeight === "number"
          ? `max-height: ${maxHeight}px;`
          : "";
      },

      classes() {
        const api = this.data.popover;
        const themeFns = popoverTheme({
          portal: Boolean(this.data.portal),
          block: Boolean(this.data.block),
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
        getApi(this, "popover")?.handleTriggerTap?.();
      },

      handleBackdropTap() {
        getApi(this, "popover")?.handleBackdropTap?.();
      },
    },
  }),
);
