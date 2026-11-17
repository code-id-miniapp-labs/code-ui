import type { MiniAppEventLike } from "@code-ui/utils";
import { isEqual } from "@code-ui/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { withInputMenu } from "@code-ui/miniapp/behaviors/input-menu";
import {
  connectInputMenu,
  defaultInputMenuProps,
  inputMenuMachine,
  type InputMenuContentConfig,
  type InputMenuItem,
  type InputMenuSize,
} from "@code-ui/input-menu";
import themeConfig from "virtual:cui/theme/input-menu";
import { useComponentIcons } from "../../utils/component-icons";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";

const inputMenuTheme = tv(themeConfig);

const inputMenuBehavior = createMachineBehavior({
  machine: inputMenuMachine,
  connect: connectInputMenu,
  key: "inputMenu",
  syncProps: ["rules", "validateOn"],
  plugins: [withFormField(), withInputMenu()],
  exportApi: true,
});

function resolveRawItemEntry(
  rawItems: any,
  groupIndex: number,
  rawIndex: number,
): Record<string, any> | undefined {
  if (!Array.isArray(rawItems) || rawIndex < 0) return undefined;
  const isNested = rawItems.some((entry) => Array.isArray(entry));
  const candidate = isNested
    ? Array.isArray(rawItems[groupIndex])
      ? rawItems[groupIndex][rawIndex]
      : undefined
    : rawItems[rawIndex];
  return candidate && typeof candidate === "object" && !Array.isArray(candidate)
    ? (candidate as Record<string, any>)
    : undefined;
}

Component(
  createComponentOptions({
    behaviors: [inputMenuBehavior, computedBehavior],

    slots: {
      default: false,
      leading: false,
      trailing: false,
      loadingIcon: false,
      empty: false,
      header: false,
      footer: false,
      createItem: false,
    },

    properties: createProperties(defaultInputMenuProps, {
      rules: {
        type: Array,
        value: [],
      },
      validateOn: {
        type: null,
        value: null,
      },
      variant: {
        type: String,
        value: "outline",
      },
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "",
      },
      highlight: {
        type: Boolean,
        value: false,
      },
      placeholder: {
        type: String,
        value: "",
      },
      placeholderClass: {
        type: String,
        value: "",
      },
      placeholderStyle: {
        type: String,
        value: "",
      },
      maxlength: {
        type: Number,
        value: 140,
      },
      cursorSpacing: {
        type: Number,
        value: 0,
      },
      confirmType: {
        type: String,
        value: "done",
      },
      confirmHold: {
        type: Boolean,
        value: false,
      },
      adjustPosition: {
        type: Boolean,
        value: true,
      },
      holdKeyboard: {
        type: Boolean,
        value: false,
      },
      icon: {
        type: String,
        value: "",
      },
      leading: {
        type: Boolean,
        value: false,
      },
      leadingIcon: {
        type: String,
        value: "",
      },
      trailing: {
        type: Boolean,
        value: true,
      },
      trailingIcon: {
        type: String,
        value: "chevronDown",
      },
      selectedIcon: {
        type: String,
        value: "check",
      },
      clearIcon: {
        type: String,
        value: "close",
      },
      deleteIcon: {
        type: String,
        value: "close",
      },
      createIcon: {
        type: String,
        value: "",
      },
      createItemText: {
        type: String,
        value: "Create",
      },
      loading: {
        type: Boolean,
        value: false,
      },
      loadingIcon: {
        type: String,
        value: "loading",
      },
      portal: {
        type: Boolean,
        value: false,
      },
      arrow: {
        type: Boolean,
        value: false,
      },
      content: {
        type: Object,
        value: {},
      },
      emptyText: {
        type: String,
        value: "No matching items",
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

    data: {
      linkedChildCount: 0,
    },

    computed: {
      resolvedSize(): InputMenuSize {
        return (this.data.size || this.data.fieldSize || "md") as InputMenuSize;
      },

      selectedItemIcon(): string {
        if (this.data.multiple) return "";
        const api = this.data.inputMenu;
        if (!api?.hasValue || api.value === null || api.value === undefined) {
          return "";
        }
        const rawItems = this.data.items;
        const apiItems = api.items ?? [];
        const selectedSnap = apiItems.find(
          (it: any) => it.type === "item" && it.selected,
        );
        if (!selectedSnap) return "";
        const rawObj = resolveRawItemEntry(
          rawItems,
          selectedSnap.groupIndex,
          selectedSnap.rawIndex,
        );
        if (
          rawObj &&
          typeof rawObj.icon === "string" &&
          isEqual(selectedSnap.value, api.value)
        ) {
          return rawObj.icon;
        }
        return rawObj && typeof rawObj.icon === "string" ? rawObj.icon : "";
      },

      icons() {
        return useComponentIcons({
          icon: this.data.icon,
          leading: Boolean(this.data.leading),
          leadingIcon: this.data.leadingIcon || this.data.selectedItemIcon,
          trailing: Boolean(this.data.trailing),
          trailingIcon: this.data.trailingIcon,
          defaultTrailingIcon: "chevronDown",
          loading: Boolean(this.data.loading),
          loadingIcon: this.data.loadingIcon,
          loadingPlacement: "trailing",
          slots: this.data.slots,
        });
      },

      menuConfig(): Required<InputMenuContentConfig> {
        const cfg = (this.data.content || {}) as InputMenuContentConfig;
        return {
          side: cfg.side ?? "bottom",
          align: cfg.align ?? "start",
          sideOffset: cfg.sideOffset ?? 4,
          alignOffset: cfg.alignOffset ?? 0,
          collisionPadding: cfg.collisionPadding ?? 8,
          avoidCollisions: cfg.avoidCollisions ?? true,
          matchTriggerWidth: cfg.matchTriggerWidth ?? true,
          maxHeight: cfg.maxHeight ?? 240,
        };
      },

      viewportMaxHeightStyle(): string {
        return `max-height: ${this.data.menuConfig.maxHeight}px;`;
      },

      floatingMenuUi() {
        const classes = this.data.classes as Record<string, string> | undefined;
        return {
          content: classes?.content ?? "",
        };
      },

      hasItems(): boolean {
        return Array.isArray(this.data.items) && this.data.items.length > 0;
      },

      hasDropdownContent(): boolean {
        const apiItems = this.data.inputMenu?.items;
        return Array.isArray(apiItems) && apiItems.length > 0;
      },

      resolvedTags() {
        const apiTags = this.data.inputMenu?.tags ?? [];
        const rawItems = this.data.items;
        return apiTags.map((tag: any) => {
          const rawObj = resolveRawItemEntry(
            rawItems,
            tag.groupIndex,
            tag.rawIndex,
          ) as InputMenuItem | undefined;
          return {
            key: tag.key,
            value: tag.value,
            label: tag.label,
            disabled: tag.disabled,
            icon: rawObj?.icon ?? "",
          };
        });
      },

      resolvedDropdownItems() {
        if (!this.data.hasItems) return [];
        const apiItems = this.data.inputMenu?.items ?? [];
        const rawItems = this.data.items;
        const descKey = this.data.descriptionKey || "description";
        const defaultSelectedIcon = this.data.selectedIcon || "check";

        return apiItems.map((apiItem: any) => {
          const rawObj = resolveRawItemEntry(
            rawItems,
            apiItem.groupIndex,
            apiItem.rawIndex,
          ) as InputMenuItem | undefined;
          const descRaw = rawObj ? (rawObj[descKey] ?? rawObj.description) : "";
          return {
            key: apiItem.key,
            domId: apiItem.domId,
            type: apiItem.type,
            value: apiItem.value,
            label: apiItem.label,
            disabled: apiItem.disabled,
            selected: apiItem.selected,
            rawIndex: apiItem.rawIndex,
            groupIndex: apiItem.groupIndex,
            description:
              descRaw !== undefined && descRaw !== null ? String(descRaw) : "",
            icon: rawObj?.icon ?? "",
            trailingIcon: rawObj?.trailingIcon || defaultSelectedIcon,
            ui: rawObj?.ui ?? {},
            className: rawObj?.className ?? "",
          };
        });
      },

      classes() {
        const api = this.data.inputMenu;
        const icons = this.data.icons;
        const themeFns = inputMenuTheme({
          variant: this.data.variant,
          color: this.data.color,
          size: this.data.resolvedSize,
          multiple: Boolean(this.data.multiple),
          open: Boolean(api?.open),
          focused: Boolean(api?.focused),
          highlight: Boolean(this.data.highlight),
          invalid: Boolean(api?.invalid),
          disabled: Boolean(api?.disabled),
          leading: icons.isLeading,
          trailing: Boolean(icons.isTrailing || api?.isClearable),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleTriggerTap() {
        getApi(this, "inputMenu")?.handleTriggerTap?.();
      },

      handleToggleTap() {
        getApi(this, "inputMenu")?.toggle?.();
      },

      handleFocus() {
        getApi(this, "inputMenu")?.handleFocus?.();
      },

      handleBlur() {
        getApi(this, "inputMenu")?.handleBlur?.();
      },

      handleInput(e: MiniAppEventLike<{ value?: string }>) {
        const nextVal = e?.detail?.value ?? "";
        if (nextVal === this.data.inputMenu?.inputValue) return;
        getApi(this, "inputMenu")?.handleInput?.(nextVal);
      },

      handleConfirm(e: MiniAppEventLike<{ value?: string }>) {
        getApi(this, "inputMenu")?.handleConfirm?.(e?.detail?.value);
      },

      handleClear() {
        getApi(this, "inputMenu")?.clearValue?.();
      },

      handleCreateItem() {
        getApi(this, "inputMenu")?.createItem?.();
      },

      handleTagRemove(e: WechatMiniprogram.TouchEvent) {
        const idx = Number(e?.currentTarget?.dataset?.index);
        const tag = this.data.resolvedTags?.[idx];
        if (tag && tag.value !== undefined) {
          getApi(this, "inputMenu")?.removeTag?.(tag.value);
        }
      },

      handleItemSelect(e: MiniAppEventLike<{ value?: any }>) {
        if (e?.detail?.value !== undefined) {
          getApi(this, "inputMenu")?.selectValue?.(e.detail.value);
        }
      },

      handleMenuOpenChange(e: MiniAppEventLike<{ open?: boolean }>) {
        if (e?.detail && e.detail.open === false) {
          getApi(this, "inputMenu")?.closeInputMenu?.();
        }
      },
    },
  }),
);
