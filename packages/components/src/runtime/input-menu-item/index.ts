import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withInputMenuItem } from "@code-ui/miniapp/behaviors/input-menu";
import {
  connectInputMenuItem,
  defaultInputMenuItemProps,
  inputMenuItemMachine,
  type InputMenuItemColor,
  type InputMenuItemSize,
} from "@code-ui/input-menu-item";
import themeConfig from "virtual:cui/theme/input-menu-item";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";

const inputMenuItemTheme = tv(themeConfig);

const inputMenuItemBehavior = createMachineBehavior({
  machine: inputMenuItemMachine,
  connect: connectInputMenuItem,
  key: "inputMenuItem",
  plugins: [withInputMenuItem()],
  exportApi: true,
  exportApiKeys: ["value", "selected", "select"],
});

Component(
  createComponentOptions({
    behaviors: [inputMenuItemBehavior, computedBehavior],

    slots: {
      default: false,
      leading: false,
      label: false,
      description: false,
      trailing: false,
    },

    properties: createProperties(defaultInputMenuItemProps, {
      label: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
      },
      icon: {
        type: String,
        value: "",
      },
      trailingIcon: {
        type: String,
        value: "",
      },
      color: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "",
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
      resolvedColor(): InputMenuItemColor {
        return (this.data.color ||
          this.data.groupColor ||
          "primary") as InputMenuItemColor;
      },

      resolvedSize(): InputMenuItemSize {
        return (this.data.size ||
          this.data.groupSize ||
          "md") as InputMenuItemSize;
      },

      resolvedTrailingIcon(): string {
        return (
          this.data.trailingIcon ||
          this.data.groupSelectedIcon ||
          "check"
        );
      },

      classes() {
        const api = this.data.inputMenuItem;
        const themeFns = inputMenuItemTheme({
          color: this.data.resolvedColor,
          size: this.data.resolvedSize,
          selected: Boolean(api?.selected),
          disabled: Boolean(api?.disabled),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleTap() {
        getApi(this, "inputMenuItem")?.select?.();
      },

      select() {
        return getApi(this, "inputMenuItem")?.select?.();
      },
    },
  }),
);
