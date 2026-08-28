export const DEFAULT_ALIAS_MAP: Record<string, string[]> = {
  onClick: ["onTap"],
  onTap: ["onClick"],
  onLongPress: ["onLongTap"],
  onLongTap: ["onLongPress"],

  onChange: ["onValueChange", "onInput"],
  onValueChange: ["onChange"],
  onInput: ["onChange"],

  onClose: ["onDismiss"],
  onDismiss: ["onClose"],
  onBackdropClick: ["onBackdropTap", "onOverlayClick"],
  onBackdropTap: ["onBackdropClick"],
  onOverlayClick: ["onBackdropClick", "onBackdropTap"],

  onConfirm: ["onOk"],
  onOk: ["onConfirm"],

  onGetphonenumber: ["onGetPhoneNumber"],
  onGetPhoneNumber: ["onGetphonenumber"],
  onChooseavatar: ["onChooseAvatar"],
  onChooseAvatar: ["onChooseavatar"],
  onOpensetting: ["onOpenSetting"],
  onOpenSetting: ["onOpensetting"],
  onLaunchapp: ["onLaunchApp"],
  onLaunchApp: ["onLaunchapp"],
  onAgreeprivacyauthorization: ["onAgreePrivacyAuthorization"],
  onAgreePrivacyAuthorization: ["onAgreeprivacyauthorization"],
};

export function normalizeProps<
  T extends Record<string, any> = Record<string, any>,
>(props: Record<string, any>, customAliases?: Record<string, string[]>): T {
  if (!props || typeof props !== "object") return props as T;

  const aliasMap = customAliases
    ? { ...DEFAULT_ALIAS_MAP, ...customAliases }
    : DEFAULT_ALIAS_MAP;

  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(props)) {
    const camelKey = key.includes("-")
      ? key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
      : key;

    let val = value;
    if (val === "true") val = true;
    else if (val === "false") val = false;

    normalized[camelKey] = val;

    const aliases = aliasMap[camelKey];
    if (aliases) {
      for (const alias of aliases) {
        if (normalized[alias] === undefined) {
          normalized[alias] = val;
        }
      }
    }
  }

  return normalized as T;
}
