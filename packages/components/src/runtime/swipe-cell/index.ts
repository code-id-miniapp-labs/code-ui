import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { resolveSlots } from "../../utils/ui";
import {
  swipeCellMachine,
  connectSwipeCell,
  defaultSwipeCellProps,
  type SwipeCellApi,
} from "@code-ui/swipe-cell";
import themeConfig from "virtual:cui/theme/swipe-cell";
import { tv } from "../../utils/variants";

const swipeCellTheme = tv(themeConfig);

const swipeCellBehavior = createMachineBehavior({
  machine: swipeCellMachine,
  connect: connectSwipeCell,
  key: "swipeCell",
  exportApi: true,
  syncProps: [
    "variant",
    "size",
    "disabled",
    "opened",
    "defaultOpened",
    "left",
    "right",
    "leftWidth",
    "rightWidth",
    "threshold",
    "duration",
    "closeOnActionClick",
    "closeOnContentClick",
  ],
});

Component(
  createComponentOptions({
    behaviors: [swipeCellBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultSwipeCellProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.swipeCell;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const variant = api?.variant ?? this.data.variant;
        const size = api?.size ?? this.data.size;
        const ui = this.data.ui;

        const themeFns = swipeCellTheme({
          variant,
          size,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    lifetimes: {
      ready(this: any) {
        this.measure();
      },
    },

    observers: {
      "left, right": function (this: any) {
        this.measure();
      },
    },

    methods: {
      measure(this: any) {
        return getApi<SwipeCellApi>(this, "swipeCell")?.measure?.();
      },

      handleTouchStart(this: any, data?: Record<string, unknown>) {
        return getApi<SwipeCellApi>(
          this,
          "swipeCell",
        )?.handleTouchStart?.(data);
      },

      handleTouchMove(
        this: any,
        data?: { offset?: number; deltaX?: number },
      ) {
        return getApi<SwipeCellApi>(this, "swipeCell")?.handleTouchMove?.(data);
      },

      handleTouchEnd(
        this: any,
        data?: {
          opened: boolean;
          side: any;
          offset: number;
        },
      ) {
        return getApi<SwipeCellApi>(this, "swipeCell")?.handleTouchEnd?.(data);
      },

      handleContentTap(this: any) {
        return getApi<SwipeCellApi>(this, "swipeCell")?.handleContentTap?.();
      },

      handleActionTap(this: any, ev: WechatMiniprogram.CustomEvent) {
        return getApi<SwipeCellApi>(this, "swipeCell")?.handleActionTap?.(ev);
      },

      open(this: any, side?: any) {
        return getApi<SwipeCellApi>(this, "swipeCell")?.openCell?.(side);
      },

      close(this: any) {
        return getApi<SwipeCellApi>(this, "swipeCell")?.closeCell?.();
      },

      toggle(this: any, side?: any) {
        return getApi<SwipeCellApi>(this, "swipeCell")?.toggleCell?.(side);
      },
    },
  }),
);
