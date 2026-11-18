import type { MiniAppEventLike } from "@code-id-labs/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { resolveSlots } from "../../utils/ui";
import {
  pullDownRefreshMachine,
  connectPullDownRefresh,
  defaultPullDownRefreshProps,
  type PullDownRefreshApi,
} from "@code-id-labs/pull-down-refresh";
import themeConfig from "virtual:cui/theme/pull-down-refresh";
import { tv } from "../../utils/variants";

const pullDownRefreshTheme = tv(themeConfig);

const pullDownRefreshBehavior = createMachineBehavior({
  machine: pullDownRefreshMachine,
  connect: connectPullDownRefresh,
  key: "pullDownRefresh",
  exportApi: true,
  exportApiKeys: ["status", "refreshing", "refresh", "close"],
});

Component(
  createComponentOptions({
    behaviors: [pullDownRefreshBehavior, computedBehavior],
    slots: {
      default: false,
      header: false,
      indicator: false,
    },

    properties: createProperties(defaultPullDownRefreshProps, {
      showScrollbar: {
        type: Boolean,
        value: true,
      },
      enableBackToTop: {
        type: Boolean,
        value: true,
      },
      scrollIntoView: {
        type: String,
        value: "",
      },
      upperThreshold: {
        type: Number,
        value: 50,
      },
      lowerThreshold: {
        type: Number,
        value: 50,
      },
      scrollWithAnimation: {
        type: Boolean,
        value: false,
      },
      loadingIcon: {
        type: String,
        value: "loading",
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
      classes() {
        const api = this.data.pullDownRefresh;
        const status = api?.statusKey ?? "idle";
        const disabled = Boolean(api?.disabled);

        const themeFns = pullDownRefreshTheme({
          status,
          disabled,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleTouchStart(data?: Record<string, unknown>) {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.handleTouchStart(
          data,
        );
      },

      handleTouchMove(data?: { offset?: number }) {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.handleTouchMove(
          data,
        );
      },

      handleTouchEnd(data?: { offset?: number }) {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.handleTouchEnd(
          data,
        );
      },

      handleScroll(
        event: MiniAppEventLike<{ scrollTop: number; scrollLeft: number }>,
      ) {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.handleScroll(
          event?.detail ?? {},
        );
      },

      handleScrollToUpper() {
        getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleScrollToUpper();
      },

      handleScrollToLower() {
        getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleScrollToLower();
      },

      refresh() {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.refresh();
      },

      close() {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.close();
      },
    },
  }),
);
