import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties } from "../_shared/machine";
import { resolveSlots } from "../../utils/ui";
import {
  swipeCellMachine,
  connectSwipeCell,
  defaultSwipeCellProps,
  type SwipeActionItem,
  type SwipeSide,
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
    "disabled",
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

    computed: {
      classes() {
        const api = this.data.swipeCell;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const ui = this.data.ui;

        const themeFns = swipeCellTheme({
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    lifetimes: {
      ready() {
        this.updateWidths();
      },
    },

    observers: {
      "left, right": function () {
        this.updateWidths();
      },
    },

    properties: createProperties(defaultSwipeCellProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    methods: {
      updateWidths() {
        if (this.data.leftWidth > 0 && this.data.rightWidth > 0) return;
        if (typeof this.createSelectorQuery !== "function") return;

        const query = this.createSelectorQuery();
        const api = this.data.swipeCell;
        const leftId = api?.leftProps?.id as string | undefined;
        const rightId = api?.rightProps?.id as string | undefined;

        if (leftId) query.select(`#${leftId}`).boundingClientRect();
        if (rightId) query.select(`#${rightId}`).boundingClientRect();

        query.exec((res: Array<{ width?: number } | null>) => {
          if (!res || res.length === 0) return;
          let idx = 0;
          let leftWidth = this.data.leftWidth;
          let rightWidth = this.data.rightWidth;

          if (leftId) {
            const rect = res[idx++];
            if (rect && typeof rect.width === "number" && rect.width > 0) {
              leftWidth = rect.width;
            }
          }
          if (rightId) {
            const rect = res[idx++];
            if (rect && typeof rect.width === "number" && rect.width > 0) {
              rightWidth = rect.width;
            }
          }

          this.send({ type: "SET_WIDTHS", leftWidth, rightWidth });
        });
      },

      handleTouchStart(data?: Record<string, unknown>) {
        this.send({ type: "DRAG_START" });
        this.triggerEvent("dragstart", data ?? {});
      },

      handleTouchMove(data?: { offset?: number; deltaX?: number }) {
        const offset = typeof data?.offset === "number" ? data.offset : 0;
        this.send({ type: "DRAG_MOVE", offset });
        this.triggerEvent("drag", data ?? {});
      },

      handleTouchEnd(data?: {
        opened: boolean;
        side: SwipeSide | null;
        offset: number;
      }) {
        const opened = Boolean(data?.opened);
        const side = data?.side ?? null;
        const offset = typeof data?.offset === "number" ? data.offset : 0;
        this.send({ type: "DRAG_END", opened, side, offset });
        this.triggerEvent("dragend", data ?? { opened, side, offset });
      },

      handleContentTap() {
        this.send({ type: "CONTENT_TAP" });
        this.triggerEvent("contentTap");
      },

      handleActionTap(ev: WechatMiniprogram.CustomEvent) {
        const side = ev.currentTarget?.dataset?.side as SwipeSide | undefined;
        const index = Number(ev.currentTarget?.dataset?.index);
        if (!side || isNaN(index)) return;

        const list = side === "left" ? this.data.left : this.data.right;
        const action: SwipeActionItem | undefined = list?.[index];
        if (action) {
          this.send({ type: "ACTION_CLICK", action, side, index });
          this.triggerEvent("actionClick", { action, side, index });
          this.triggerEvent("click", { action, side, index });
        }
      },
    },
  }),
);

