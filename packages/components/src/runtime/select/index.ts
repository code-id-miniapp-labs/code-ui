import type { MiniAppEventLike } from "@code-id-labs/utils";
import { isEqual } from "@code-id-labs/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withFormField } from "@code-id-labs/miniapp/behaviors/form";
import { withSelect } from "@code-id-labs/miniapp/behaviors/select";
import { createAppThemeBehavior } from "@code-id-labs/miniapp/behaviors/theme";
import {
  connectSelect,
  defaultSelectProps,
  selectMachine,
  type SelectContentConfig,
  type SelectItem,
  type SelectSize,
} from "@code-id-labs/select";
import themeConfig from "virtual:cui/theme/select";
import { useComponentIcons } from "../../utils/component-icons";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";

const selectTheme = tv(themeConfig);

const selectBehavior = createMachineBehavior({
  machine: selectMachine,
  connect: connectSelect,
  key: "select",
  omitDataKeys: ["contentProps", "hiddenInputProps"],
  syncProps: ["rules", "validateOn"],
  plugins: [withFormField(), withSelect()],
  exportApi: true,
  exportApiKeys: [
    "open",
    "visible",
    "value",
    "displayLabel",
    "openSelect",
    "closeSelect",
    "toggle",
    "setOpen",
    "setValue",
    "selectValue",
    "clearValue",
    "resetValue",
  ],
});

const appThemeBehavior =
  typeof Behavior !== "undefined" ? createAppThemeBehavior() : ({} as any);

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

function resolveButtonText(raw: unknown, fallback: string): string {
  if (raw === false || raw === null || raw === "") return "";
  if (raw === true || raw === undefined) return fallback;
  return String(raw);
}

Component(
  createComponentOptions({
    behaviors: [appThemeBehavior, selectBehavior, computedBehavior],

    slots: {
      default: false,
      leading: false,
      trailing: false,
      loadingIcon: false,
      value: false,
      empty: false,
      header: false,
      footer: false,
    },

    properties: createProperties(defaultSelectProps, {
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
      title: {
        type: String,
        value: "",
      },
      cancelBtn: {
        type: null,
        value: "Cancel",
      },
      confirmBtn: {
        type: null,
        value: "Confirm",
      },
      header: {
        type: Boolean,
        value: true,
      },
      itemHeight: {
        type: Number,
        value: 44,
      },
      emptyText: {
        type: String,
        value: "No options",
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
      resolvedSize(): SelectSize {
        return (this.data.size || this.data.fieldSize || "md") as SelectSize;
      },

      selectedItemIcon(): string {
        if (this.data.multiple) return "";
        const api = this.data.select;
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

      menuConfig(): Required<SelectContentConfig> {
        const cfg = (this.data.content || {}) as SelectContentConfig;
        return {
          block: cfg.block ?? true,
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

      popoverUi() {
        const classes = this.data.classes as Record<string, string> | undefined;
        const ui = this.data.ui as
          | { popover?: Record<string, string> }
          | undefined;
        return {
          content: classes?.content ?? "",
          ...ui?.popover,
        };
      },

      hasItems(): boolean {
        return Array.isArray(this.data.items) && this.data.items.length > 0;
      },

      hasDropdownContent(): boolean {
        return this.data.hasItems || Number(this.data.linkedChildCount) > 0;
      },

      resolvedDropdownItems() {
        if (!this.data.select?.visible || !this.data.hasItems) return [];
        const apiItems = this.data.select?.items ?? [];
        const rawItems = this.data.items;
        const descKey = this.data.descriptionKey || "description";
        const defaultSelectedIcon = this.data.selectedIcon || "check";

        return apiItems.map((apiItem: any) => {
          const rawObj = resolveRawItemEntry(
            rawItems,
            apiItem.groupIndex,
            apiItem.rawIndex,
          ) as SelectItem | undefined;
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

      resolvedPickerColumns() {
        if (!this.data.select?.visible) return [];
        return this.data.select?.pickerColumns ?? [];
      },

      resolvedCancelBtn(): string {
        return resolveButtonText(this.data.cancelBtn, "Cancel");
      },

      resolvedConfirmBtn(): string {
        return resolveButtonText(this.data.confirmBtn, "Confirm");
      },

      pickerViewHeight(): number {
        const h = Number(this.data.itemHeight);
        return Math.max(120, (Number.isFinite(h) && h > 0 ? h : 44) * 5);
      },

      pickerMaskStyle(): string {
        const stop =
          this.data.themeMode === "dark" ? "24, 24, 27" : "255, 255, 255";
        return `background-image: linear-gradient(180deg, rgba(${stop}, 0.94), rgba(${stop}, 0.45)), linear-gradient(0deg, rgba(${stop}, 0.94), rgba(${stop}, 0.45));`;
      },

      pickerIndicatorStyle(): string {
        const h = Number(this.data.itemHeight);
        const height = Number.isFinite(h) && h > 0 ? h : 44;
        const borderColor =
          this.data.themeMode === "dark"
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(0, 0, 0, 0.08)";
        return `height: ${height}px; border-top: 1px solid ${borderColor}; border-bottom: 1px solid ${borderColor}; box-sizing: border-box;`;
      },

      pickerThemeStyle(): string {
        return this.data.themeCssVars || "";
      },

      classes() {
        const api = this.data.select;
        const icons = this.data.icons;
        const themeFns = selectTheme({
          variant: this.data.variant,
          color: this.data.color,
          size: this.data.resolvedSize,
          open: Boolean(api?.open),
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
      noop() {},

      handleTriggerTap() {
        getApi(this, "select")?.toggle?.();
      },

      handleClear() {
        getApi(this, "select")?.clearValue?.();
      },

      handleItemSelect(e: MiniAppEventLike<{ value?: any }>) {
        if (e?.detail?.value !== undefined) {
          getApi(this, "select")?.selectValue?.(e.detail.value);
        }
      },

      handleMenuOpenChange(e: MiniAppEventLike<{ open?: boolean }>) {
        if (e?.detail && e.detail.open === false) {
          getApi(this, "select")?.closeSelect?.();
        }
      },

      handlePickerChange(e: MiniAppEventLike<{ value?: number[] }>) {
        const val = e?.detail?.value;
        if (Array.isArray(val)) {
          getApi(this, "select")?.handlePickerChange?.(val.map(Number));
        }
      },

      handlePickerConfirm() {
        getApi(this, "select")?.confirmPicker?.();
      },

      handlePickerCancel() {
        getApi(this, "select")?.cancelPicker?.("cancel");
      },

      handlePickerBackdropTap() {
        getApi(this, "select")?.handleBackdropTap?.();
      },

      handlePickerStart() {
        this.triggerEvent("pickstart");
      },

      handlePickerEnd() {
        this.triggerEvent("pickend");
      },
    },
  }),
);
