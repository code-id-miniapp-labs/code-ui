import type { TabsItemResolvedProps } from "./tabs-item.types";

export const defaultTabsItemProps: TabsItemResolvedProps = {
  ui: {},
  mode: "auto",
  value: "",
  label: "",
  icon: "",
  trailingIcon: "",
  disabled: false,
  selected: null,
  lazy: true,
  triggerId: "",
  orientation: "horizontal",
  variant: "pill",
  color: "primary",
  size: "md",
  fitted: false,
  index: null,
};
