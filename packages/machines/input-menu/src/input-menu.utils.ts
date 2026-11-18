import { isEqual } from "@code-id-labs/utils";
import type {
  InputMenuChildItemDescriptor,
  InputMenuCreateItemPosition,
  InputMenuCreateItemProp,
  InputMenuCreateItemWhen,
  InputMenuItemInput,
  InputMenuItemsInput,
  InputMenuScalarValue,
  InputMenuTagItem,
  InputMenuValue,
  NormalizedInputMenuItem,
} from "./input-menu.types";

function isObjectRecord(item: unknown): boolean {
  return typeof item === "object" && item !== null && !Array.isArray(item);
}

function normalizeEntry(
  raw: InputMenuItemInput | InputMenuChildItemDescriptor,
  rawIndex: number,
  groupIndex: number,
  seqIndex: number,
  valueKey: string,
  labelKey: string,
  descriptionKey: string,
  disabledKey: string,
  filterFields: string[],
): NormalizedInputMenuItem {
  if (
    typeof raw === "string" ||
    typeof raw === "number" ||
    typeof raw === "boolean"
  ) {
    const label = String(raw);
    return {
      key: `opt-${seqIndex}`,
      type: "item",
      value: raw,
      label,
      description: "",
      disabled: false,
      rawIndex,
      groupIndex,
      searchFields: [label],
    };
  }

  if (!isObjectRecord(raw)) {
    return {
      key: `opt-${seqIndex}`,
      type: "item",
      value: "",
      label: "",
      description: "",
      disabled: true,
      rawIndex,
      groupIndex,
      searchFields: [],
    };
  }

  const record = raw as Record<string, unknown>;
  const itemType =
    record.type === "label" || record.type === "separator"
      ? record.type
      : "item";
  const key = record.key !== undefined ? String(record.key) : `opt-${seqIndex}`;

  if (itemType === "separator") {
    return {
      key,
      type: "separator",
      value: "",
      label: "",
      description: "",
      disabled: true,
      rawIndex,
      groupIndex,
      searchFields: [],
    };
  }

  const rawLabel = record[labelKey] ?? record.label;
  if (itemType === "label") {
    return {
      key,
      type: "label",
      value: "",
      label:
        rawLabel !== undefined && rawLabel !== null ? String(rawLabel) : "",
      description: "",
      disabled: true,
      rawIndex,
      groupIndex,
      searchFields: [],
    };
  }

  const rawVal =
    record[valueKey] !== undefined
      ? record[valueKey]
      : record.value !== undefined
        ? record.value
        : rawLabel !== undefined
          ? rawLabel
          : rawIndex;

  const label =
    rawLabel !== undefined && rawLabel !== null
      ? String(rawLabel)
      : String(rawVal);

  const rawDesc = record[descriptionKey] ?? record.description;
  const description =
    rawDesc !== undefined && rawDesc !== null ? String(rawDesc) : "";

  const disabled = Boolean(record[disabledKey] ?? record.disabled);

  const fields =
    Array.isArray(filterFields) && filterFields.length > 0
      ? filterFields
      : ["label"];
  const searchFields: string[] = [];
  for (const field of fields) {
    if (field === "label" || field === labelKey) {
      searchFields.push(label);
    } else if (field === "description" || field === descriptionKey) {
      if (description) searchFields.push(description);
    } else if (field === "value" || field === valueKey) {
      searchFields.push(String(rawVal));
    } else {
      const candidate = record[field];
      if (candidate !== undefined && candidate !== null) {
        searchFields.push(String(candidate));
      }
    }
  }
  if (searchFields.length === 0) {
    searchFields.push(label);
  }

  return {
    key,
    type: "item",
    value: rawVal as InputMenuScalarValue,
    label,
    description,
    disabled,
    rawIndex,
    groupIndex,
    searchFields,
  };
}

export function normalizeDropdownItems(
  rawItems: InputMenuItemsInput | undefined,
  childItems: InputMenuChildItemDescriptor[] | undefined,
  valueKey: string,
  labelKey: string,
  descriptionKey: string,
  disabledKey: string,
  filterFields: string[],
): NormalizedInputMenuItem[] {
  const result: NormalizedInputMenuItem[] = [];
  let seq = 0;

  if (Array.isArray(rawItems) && rawItems.length > 0) {
    const isNested = rawItems.some((entry) => Array.isArray(entry));
    if (isNested) {
      let emittedBefore = false;
      for (let g = 0; g < rawItems.length; g++) {
        const group = rawItems[g];
        const list = Array.isArray(group) ? group : [group];
        if (list.length === 0) continue;
        if (emittedBefore) {
          result.push({
            key: `sep-${seq++}`,
            type: "separator",
            value: "",
            label: "",
            description: "",
            disabled: true,
            rawIndex: -1,
            groupIndex: g,
            searchFields: [],
          });
        }
        for (let i = 0; i < list.length; i++) {
          const entry = list[i];
          if (entry === undefined || entry === null) continue;
          result.push(
            normalizeEntry(
              entry as InputMenuItemInput,
              i,
              g,
              seq++,
              valueKey,
              labelKey,
              descriptionKey,
              disabledKey,
              filterFields,
            ),
          );
          emittedBefore = true;
        }
      }
      return result;
    }

    for (let i = 0; i < rawItems.length; i++) {
      const entry = rawItems[i];
      if (entry === undefined || entry === null || Array.isArray(entry)) {
        continue;
      }
      result.push(
        normalizeEntry(
          entry,
          i,
          0,
          seq++,
          valueKey,
          labelKey,
          descriptionKey,
          disabledKey,
          filterFields,
        ),
      );
    }
    return result;
  }

  if (Array.isArray(childItems) && childItems.length > 0) {
    for (let i = 0; i < childItems.length; i++) {
      const child = childItems[i];
      if (!child) continue;
      result.push(
        normalizeEntry(
          child,
          i,
          0,
          seq++,
          "value",
          "label",
          "description",
          "disabled",
          filterFields,
        ),
      );
    }
  }

  return result;
}

export function filterDropdownItems(
  items: NormalizedInputMenuItem[],
  searchTerm: string,
  ignoreFilter: boolean,
): NormalizedInputMenuItem[] {
  if (ignoreFilter) return items;
  const query = searchTerm.trim().toLowerCase();
  if (!query) return items;

  const matchedItemKeys = new Set<string>();
  for (const item of items) {
    if (item.type !== "item") continue;
    const isMatch = item.searchFields.some((field) =>
      field.toLowerCase().includes(query),
    );
    if (isMatch) {
      matchedItemKeys.add(item.key);
    }
  }

  if (matchedItemKeys.size === 0) return [];

  // Keep labels only if there is at least one matched item following the label
  // before the next label or separator in the same group.
  const keptWithLabels: NormalizedInputMenuItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    if (!current) continue;
    if (current.type === "item") {
      if (matchedItemKeys.has(current.key)) {
        keptWithLabels.push(current);
      }
      continue;
    }
    if (current.type === "label") {
      let hasFollowingMatch = false;
      for (let j = i + 1; j < items.length; j++) {
        const next = items[j];
        if (!next) continue;
        if (
          next.type === "label" ||
          next.type === "separator" ||
          next.groupIndex !== current.groupIndex
        ) {
          break;
        }
        if (next.type === "item" && matchedItemKeys.has(next.key)) {
          hasFollowingMatch = true;
          break;
        }
      }
      if (hasFollowingMatch) {
        keptWithLabels.push(current);
      }
      continue;
    }
    if (current.type === "separator") {
      keptWithLabels.push(current);
    }
  }

  // Prune leading, trailing, and consecutive separators
  const finalResult: NormalizedInputMenuItem[] = [];
  for (const entry of keptWithLabels) {
    if (entry.type === "separator") {
      if (
        finalResult.length === 0 ||
        finalResult[finalResult.length - 1]?.type === "separator"
      ) {
        continue;
      }
    }
    finalResult.push(entry);
  }
  while (
    finalResult.length > 0 &&
    finalResult[finalResult.length - 1]?.type === "separator"
  ) {
    finalResult.pop();
  }

  return finalResult;
}

export function normalizeInputMenuValue(
  raw: InputMenuValue | undefined,
  multiple: boolean,
): InputMenuValue {
  if (raw === undefined || raw === null) {
    return multiple ? [] : null;
  }
  if (multiple) {
    return Array.isArray(raw) ? [...raw] : [raw];
  }
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export function isOptionSelected(
  optionValue: InputMenuScalarValue,
  currentValue: InputMenuValue,
  multiple: boolean,
): boolean {
  if (currentValue === null || currentValue === undefined) return false;
  if (multiple) {
    return (
      Array.isArray(currentValue) &&
      currentValue.some((val) => isEqual(val, optionValue))
    );
  }
  if (Array.isArray(currentValue)) {
    return currentValue.length > 0 && isEqual(currentValue[0], optionValue);
  }
  return isEqual(optionValue, currentValue);
}

export function hasSelectedInputMenuValue(
  currentValue: InputMenuValue,
  items: NormalizedInputMenuItem[],
): boolean {
  if (currentValue === null || currentValue === undefined) return false;
  if (Array.isArray(currentValue)) return currentValue.length > 0;
  if (currentValue === "") {
    return items.some((it) => it.type === "item" && it.value === "");
  }
  return true;
}

export function resolveSelectedTags(
  currentValue: InputMenuValue,
  multiple: boolean,
  normalizedItems: NormalizedInputMenuItem[],
): InputMenuTagItem[] {
  if (!multiple || currentValue === null || currentValue === undefined) {
    return [];
  }
  const arr = Array.isArray(currentValue) ? currentValue : [currentValue];
  return arr.map((val, idx) => {
    const found = normalizedItems.find(
      (it) => it.type === "item" && isEqual(it.value, val),
    );
    return {
      key: found ? `tag-${found.key}` : `tag-val-${idx}-${String(val)}`,
      value: val,
      label: found ? found.label : String(val),
      disabled: found ? found.disabled : false,
      rawIndex: found ? found.rawIndex : -1,
      groupIndex: found ? found.groupIndex : 0,
    };
  });
}

export function resolveDisplayLabel(
  currentValue: InputMenuValue,
  multiple: boolean,
  normalizedItems: NormalizedInputMenuItem[],
): string {
  if (currentValue === null || currentValue === undefined) return "";
  if (multiple || Array.isArray(currentValue)) {
    const arr = Array.isArray(currentValue) ? currentValue : [currentValue];
    return arr
      .map((val) => {
        const found = normalizedItems.find(
          (it) => it.type === "item" && isEqual(it.value, val),
        );
        return found ? found.label : String(val);
      })
      .join(", ");
  }
  if (currentValue === "") {
    const foundEmpty = normalizedItems.find(
      (it) => it.type === "item" && it.value === "",
    );
    return foundEmpty ? foundEmpty.label : "";
  }
  const found = normalizedItems.find(
    (it) => it.type === "item" && isEqual(it.value, currentValue),
  );
  return found ? found.label : String(currentValue);
}

export function resolveCreateItemConfig(raw: InputMenuCreateItemProp): {
  enabled: boolean;
  position: InputMenuCreateItemPosition;
  when: InputMenuCreateItemWhen;
} {
  if (!raw) {
    return { enabled: false, position: "bottom", when: "empty" };
  }
  if (raw === true) {
    return { enabled: true, position: "bottom", when: "empty" };
  }
  if (raw === "always") {
    return { enabled: true, position: "bottom", when: "always" };
  }
  return {
    enabled: true,
    position: raw.position === "top" ? "top" : "bottom",
    when: raw.when === "always" ? "always" : "empty",
  };
}
