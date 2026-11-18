import { isEqual } from "@code-id-labs/utils";
import type {
  NormalizedSelectItem,
  SelectChildItemDescriptor,
  SelectItemInput,
  SelectItemsInput,
  SelectMode,
  SelectPickerColumnItem,
  SelectScalarValue,
  SelectValue,
} from "./select.types";

function isObjectRecord(item: unknown): boolean {
  return typeof item === "object" && item !== null && !Array.isArray(item);
}

function normalizeEntry(
  raw: SelectItemInput | SelectChildItemDescriptor,
  rawIndex: number,
  groupIndex: number,
  seqIndex: number,
  valueKey: string,
  labelKey: string,
  descriptionKey: string,
  disabledKey: string,
): NormalizedSelectItem {
  if (
    typeof raw === "string" ||
    typeof raw === "number" ||
    typeof raw === "boolean"
  ) {
    return {
      key: `opt-${seqIndex}`,
      type: "item",
      value: raw,
      label: String(raw),
      description: "",
      disabled: false,
      rawIndex,
      groupIndex,
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
    };
  }

  const record = raw as Record<string, unknown>;
  const itemType =
    record.type === "label" || record.type === "separator" ? record.type : "item";
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
    };
  }

  const rawLabel = record[labelKey] ?? record.label;
  if (itemType === "label") {
    return {
      key,
      type: "label",
      value: "",
      label: rawLabel !== undefined && rawLabel !== null ? String(rawLabel) : "",
      description: "",
      disabled: true,
      rawIndex,
      groupIndex,
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

  return {
    key,
    type: "item",
    value: rawVal as SelectScalarValue,
    label,
    description,
    disabled,
    rawIndex,
    groupIndex,
  };
}

export function normalizeDropdownItems(
  rawItems: SelectItemsInput | undefined,
  childItems: SelectChildItemDescriptor[] | undefined,
  valueKey: string,
  labelKey: string,
  descriptionKey: string,
  disabledKey: string,
): NormalizedSelectItem[] {
  const result: NormalizedSelectItem[] = [];
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
          });
        }
        for (let i = 0; i < list.length; i++) {
          const entry = list[i];
          if (entry === undefined || entry === null) continue;
          result.push(
            normalizeEntry(
              entry as SelectItemInput,
              i,
              g,
              seq++,
              valueKey,
              labelKey,
              descriptionKey,
              disabledKey,
            ),
          );
          emittedBefore = true;
        }
      }
      return result;
    }

    for (let i = 0; i < rawItems.length; i++) {
      const entry = rawItems[i];
      if (entry === undefined || entry === null || Array.isArray(entry)) continue;
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
        ),
      );
    }
  }

  return result;
}

export function normalizePickerColumns(
  rawItems: SelectItemsInput | undefined,
  childItems: SelectChildItemDescriptor[] | undefined,
  valueKey: string,
  labelKey: string,
  descriptionKey: string,
  disabledKey: string,
): SelectPickerColumnItem[][] {
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    const isNested = rawItems.some((entry) => Array.isArray(entry));
    const groups: SelectItemInput[][] = isNested
      ? rawItems.map((entry) => (Array.isArray(entry) ? entry : [entry]))
      : [rawItems as SelectItemInput[]];

    return groups.map((group, gIdx) => {
      const col: SelectPickerColumnItem[] = [];
      for (let i = 0; i < group.length; i++) {
        const raw = group[i];
        if (raw === undefined || raw === null) continue;
        const normalized = normalizeEntry(
          raw,
          i,
          gIdx,
          i,
          valueKey,
          labelKey,
          descriptionKey,
          disabledKey,
        );
        if (normalized.type !== "item") continue;
        col.push({
          key: normalized.key,
          value: normalized.value,
          label: normalized.label,
          disabled: normalized.disabled,
          index: col.length,
        });
      }
      return col;
    });
  }

  if (Array.isArray(childItems) && childItems.length > 0) {
    const col: SelectPickerColumnItem[] = [];
    for (let i = 0; i < childItems.length; i++) {
      const child = childItems[i];
      if (!child) continue;
      const normalized = normalizeEntry(
        child,
        i,
        0,
        i,
        "value",
        "label",
        "description",
        "disabled",
      );
      if (normalized.type !== "item") continue;
      col.push({
        key: normalized.key,
        value: normalized.value,
        label: normalized.label,
        disabled: normalized.disabled,
        index: col.length,
      });
    }
    return col.length > 0 ? [col] : [];
  }

  return [];
}

export function normalizeSelectValue(
  raw: SelectValue | undefined,
  multiple: boolean,
): SelectValue {
  if (raw === undefined || raw === null) {
    return multiple ? [] : null;
  }
  if (multiple) {
    return Array.isArray(raw) ? [...raw] : [raw];
  }
  return Array.isArray(raw) ? [...raw] : raw;
}

export function isOptionSelected(
  optionValue: SelectScalarValue,
  currentValue: SelectValue,
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

export function hasSelectedSelectValue(
  currentValue: SelectValue,
  items: NormalizedSelectItem[],
): boolean {
  if (currentValue === null || currentValue === undefined) return false;
  if (Array.isArray(currentValue)) return currentValue.length > 0;
  if (currentValue === "") {
    return items.some((it) => it.type === "item" && it.value === "");
  }
  return true;
}

export function resolveSelectedLabels(
  currentValue: SelectValue,
  mode: SelectMode,
  multiple: boolean,
  normalizedItems: NormalizedSelectItem[],
  pickerColumns: SelectPickerColumnItem[][],
): string[] {
  if (currentValue === null || currentValue === undefined) return [];

  if (mode === "picker" && pickerColumns.length > 1) {
    const arr = Array.isArray(currentValue) ? currentValue : [currentValue];
    const labels: string[] = [];
    for (let c = 0; c < pickerColumns.length; c++) {
      const col = pickerColumns[c];
      const v = arr[c];
      if (v === undefined || v === null) continue;
      const found = col?.find((it) => isEqual(it.value, v));
      labels.push(found ? found.label : String(v));
    }
    return labels;
  }

  if (multiple || Array.isArray(currentValue)) {
    const arr = Array.isArray(currentValue) ? currentValue : [currentValue];
    return arr.map((v) => {
      const found = normalizedItems.find(
        (it) => it.type === "item" && isEqual(it.value, v),
      );
      return found ? found.label : String(v);
    });
  }

  if (currentValue === "") {
    const foundEmpty = normalizedItems.find(
      (it) => it.type === "item" && it.value === "",
    );
    return foundEmpty ? [foundEmpty.label] : [];
  }

  const found = normalizedItems.find(
    (it) => it.type === "item" && isEqual(it.value, currentValue),
  );
  return [found ? found.label : String(currentValue)];
}

export function findFirstEnabledIndex(
  col: SelectPickerColumnItem[],
): number {
  const idx = col.findIndex((it) => !it.disabled);
  return idx >= 0 ? idx : 0;
}

export function resolvePickerIndicesFromValue(
  columns: SelectPickerColumnItem[][],
  currentValue: SelectValue,
): number[] {
  if (columns.length === 0) return [];
  const arr = Array.isArray(currentValue)
    ? currentValue
    : currentValue !== null && currentValue !== undefined && currentValue !== ""
      ? [currentValue]
      : [];

  return columns.map((col, colIndex) => {
    if (col.length === 0) return 0;
    const targetVal = arr[colIndex];
    if (targetVal !== undefined && targetVal !== null) {
      const matchIdx = col.findIndex((it) => isEqual(it.value, targetVal));
      if (matchIdx >= 0 && !col[matchIdx]?.disabled) {
        return matchIdx;
      }
    }
    return findFirstEnabledIndex(col);
  });
}

function snapToEnabledIndex(
  col: SelectPickerColumnItem[],
  targetIdx: number,
  prevIdx: number,
): number {
  if (col.length === 0) return 0;
  const clamped = Math.min(Math.max(0, Math.round(targetIdx)), col.length - 1);
  if (!col[clamped]?.disabled) return clamped;

  const dir = clamped >= prevIdx ? 1 : -1;
  for (let offset = 1; offset < col.length; offset++) {
    const primary = clamped + dir * offset;
    if (primary >= 0 && primary < col.length && !col[primary]?.disabled) {
      return primary;
    }
    const secondary = clamped - dir * offset;
    if (secondary >= 0 && secondary < col.length && !col[secondary]?.disabled) {
      return secondary;
    }
  }
  return clamped;
}

export function clampAndSnapPickerIndices(
  columns: SelectPickerColumnItem[][],
  nextIndices: number[],
  prevIndices: number[],
): number[] {
  return columns.map((col, c) =>
    snapToEnabledIndex(col, nextIndices[c] ?? 0, prevIndices[c] ?? 0),
  );
}
