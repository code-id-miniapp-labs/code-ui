export const DEFAULT_ALIAS_MAP: Record<string, string[]> = /* @__PURE__ */ (() => {
  const map: Record<string, string[]> = {
    onChange: ["onValueChange", "onInput"],
    onValueChange: ["onChange"],
    onInput: ["onChange"],
    onBackdropClick: ["onBackdropTap", "onOverlayClick"],
    onBackdropTap: ["onBackdropClick"],
    onOverlayClick: ["onBackdropClick", "onBackdropTap"],
  };
  for (const pair of "Click:Tap,LongPress:LongTap,Close:Dismiss,Confirm:Ok,Getphonenumber:GetPhoneNumber,Chooseavatar:ChooseAvatar,Opensetting:OpenSetting,Launchapp:LaunchApp,Agreeprivacyauthorization:AgreePrivacyAuthorization".split(
    ",",
  )) {
    const [a, b] = pair.split(":");
    if (a && b) {
      map[`on${a}`] = [`on${b}`];
      map[`on${b}`] = [`on${a}`];
    }
  }
  return map;
})();

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
