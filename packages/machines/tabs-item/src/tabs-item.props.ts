import type { TabsItemProps } from "./tabs-item.types";

export const defaultTabsItemProps: TabsItemProps = {
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
};
