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
  type SwipeCellActionTapEvent,
  type SwipeCellApi,
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
});

Component(
  createComponentOptions({
    behaviors: [swipeCellBehavior, computedBehavior],

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
        const variant = this.data.variant;
        const size = this.data.size;
        const ui = this.data.ui;

        const themeFns = swipeCellTheme({
          variant,
          size,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      measure() {
        getApi<SwipeCellApi>(this, "swipeCell")?.measure();
      },

      handleTouchStart(data?: Record<string, unknown>) {
        getApi<SwipeCellApi>(this, "swipeCell")?.handleTouchStart(data);
      },

      handleTouchMove(data?: { offset?: number; deltaX?: number }) {
        getApi<SwipeCellApi>(this, "swipeCell")?.handleTouchMove(data);
      },

      handleTouchEnd(data?: {
        opened: boolean;
        side: SwipeSide | null;
        offset: number;
      }) {
        getApi<SwipeCellApi>(this, "swipeCell")?.handleTouchEnd(data);
      },

      handleContentTap() {
        getApi<SwipeCellApi>(this, "swipeCell")?.handleContentTap();
      },

      handleActionTap(ev: SwipeCellActionTapEvent) {
        getApi<SwipeCellApi>(this, "swipeCell")?.handleActionTap(ev);
      },

      open(side?: SwipeSide) {
        getApi<SwipeCellApi>(this, "swipeCell")?.openCell(side);
      },

      close() {
        getApi<SwipeCellApi>(this, "swipeCell")?.closeCell();
      },

      toggle(side?: SwipeSide) {
        getApi<SwipeCellApi>(this, "swipeCell")?.toggleCell(side);
      },
    },
  }),
);
