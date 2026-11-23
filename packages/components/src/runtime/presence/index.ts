import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";
import {
  type PresenceApi,
  connectPresence,
  defaultPresenceProps,
  presenceMachine,
} from "@code-id-labs/presence";
import themeConfig from "virtual:cui/theme/presence";

const presenceTheme = tv(themeConfig);

const presenceBehavior = createMachineBehavior({
  machine: presenceMachine,
  connect: connectPresence,
  key: "presence",
  exportApi: true,
  exportApiKeys: [
    "present",
    "mounted",
    "visible",
    "exiting",
    "state",
    "dataState",
    "setPresent",
    "handleAnimationEnd",
  ],
});

Component(
  createComponentOptions({
    behaviors: [presenceBehavior, computedBehavior],
    slots: {
      default: false,
    },

    properties: createProperties(defaultPresenceProps, {
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
        const api = this.data.presence;
        const themeFns = presenceTheme({
          present: Boolean(api?.present),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleAnimationEnd() {
        getApi<PresenceApi>(this, "presence")?.handleAnimationEnd();
      },
    },
  }),
);
