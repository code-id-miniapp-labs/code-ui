import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withAppScale } from "@code-id-labs/miniapp/behaviors/app";
import { createAppThemeBehavior } from "@code-id-labs/miniapp/behaviors/theme";
import { resolveSlots } from "../../utils/ui";
import { resolveTriggerButtonProps } from "../../utils/subcomponent";

import {
  type DrawerApi,
  type DrawerCloseProps,
  drawerMachine,
  connectDrawer,
  defaultDrawerProps,
} from "@code-id-labs/drawer";
import themeConfig from "virtual:cui/theme/drawer";
import { tv } from "../../utils/variants";

const drawerTheme = tv(themeConfig);
const EMPTY_CLASSES: Record<string, string> = {};

const drawerBehavior = createMachineBehavior({
  machine: drawerMachine,
  connect: connectDrawer,
  key: "drawer",
  omitDataKeys: ["closeTriggerProps"],
  exportApi: true,
  exportApiKeys: ["open", "visible", "setOpen", "openDrawer", "closeDrawer"],
  syncProps: [
    "shouldScaleBackground",
    "scaleFactor",
    "scaleBackground",
  ],
  plugins: [
    withAppScale({
      idPrefix: "drawer",
    }),
  ],
});

const appThemeBehavior =
  typeof Behavior !== "undefined" ? createAppThemeBehavior() : ({} as any);

Component(
  createComponentOptions({
    behaviors: [appThemeBehavior, drawerBehavior, computedBehavior],
    slots: {
      default: false,
      header: false,
      close: false,
      footer: false,
    },

    computed: {
      portalStyle(): string {
        return this.data.portal ? this.data.themeCssVars || "" : "";
      },

      resolvedClose() {
        const api = this.data.drawer;
        if (!api || api.state === "closed") return null;
        const classes = this.data.classes as Record<string, string> | undefined;
        return resolveTriggerButtonProps<DrawerCloseProps>(
          this.data.close as boolean | DrawerCloseProps | null | undefined,
          {
            icon: "close",
            color: "neutral",
            variant: "ghost",
            size: "xs",
            ui: { icon: classes?.closeIcon ?? "" },
          },
          classes?.closeButton,
        );
      },

      classes() {
        const api = this.data.drawer;
        if (!api || api.state === "closed") {
          return EMPTY_CLASSES;
        }
        const placement = this.data.placement;
        const isOpen = Boolean(api.open);
        const ui = this.data.ui;

        const themeFns = drawerTheme({
          placement,
          open: isOpen,
          keyboardOpen: Boolean(api.keyboardOpen),
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    properties: createProperties(defaultDrawerProps, {
      close: {
        type: null,
        value: true,
      },
      portal: {
        type: Boolean,
        value: true,
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

    methods: {
      noop() {},

      handleBackdropTap() {
        getApi<DrawerApi>(this, "drawer")?.handleBackdropTap();
      },

      handleCloseTap() {
        getApi<DrawerApi>(this, "drawer")?.handleCloseTriggerTap();
      },

      handleTouchStart(value?: { offset?: number }) {
        getApi<DrawerApi>(this, "drawer")?.handleDragStart(value || {});
      },

      handleTouchMove(value?: { offset?: number }) {
        getApi<DrawerApi>(this, "drawer")?.handleDragMove(value || {});
      },

      handleTouchEnd(value?: { passed: boolean; offset?: number }) {
        const passed = value ? value.passed : false;
        getApi<DrawerApi>(this, "drawer")?.handleDragEnd(
          passed,
          value || { passed: false },
        );
      },
    },
  }),
);
