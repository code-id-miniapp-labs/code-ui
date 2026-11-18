import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withSelectItem } from "@code-ui/miniapp/behaviors/select";
import {
  connectSelectItem,
  defaultSelectItemProps,
  selectItemMachine,
  type SelectItemColor,
  type SelectItemSize,
} from "@code-ui/select-item";
import themeConfig from "virtual:cui/theme/select-item";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";

const selectItemTheme = tv(themeConfig);

const selectItemBehavior = createMachineBehavior({
  machine: selectItemMachine,
  connect: connectSelectItem,
  key: "selectItem",
  plugins: [withSelectItem()],
  exportApi: true,
  exportApiKeys: ["value", "selected", "select"],
});

Component(
  createComponentOptions({
    behaviors: [selectItemBehavior, computedBehavior],

    slots: {
      default: false,
      leading: false,
      label: false,
      description: false,
      trailing: false,
    },

    properties: createProperties(defaultSelectItemProps, {
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
      resolvedColor(): SelectItemColor {
        return (this.data.color ||
          this.data.groupColor ||
          "primary") as SelectItemColor;
      },

      resolvedSize(): SelectItemSize {
        return (this.data.size ||
          this.data.groupSize ||
          "md") as SelectItemSize;
      },

      resolvedTrailingIcon(): string {
        return (
          this.data.trailingIcon ||
          this.data.groupSelectedIcon ||
          "check"
        );
      },

      classes() {
        const api = this.data.selectItem;
        const themeFns = selectItemTheme({
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
        getApi(this, "selectItem")?.select?.();
      },

      select() {
        return getApi(this, "selectItem")?.select?.();
      },
    },
  }),
);
