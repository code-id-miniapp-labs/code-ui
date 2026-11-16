import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { useComponentIcons } from "../src/utils/component-icons";
import {
  resolveSubcomponentList,
  resolveSubcomponentProps,
  resolveTriggerButtonProps,
} from "../src/utils/subcomponent";

describe("useComponentIcons", () => {
  it("resolves slot detection and icon placements", () => {
    expect(
      useComponentIcons({
        icon: "check",
        slots: { leading: true },
      }),
    ).toEqual({
      isLeading: true,
      isTrailing: false,
      hasLeadingSlot: true,
      hasTrailingSlot: false,
      hasLoadingSlot: false,
      leadingIconName: "check",
      trailingIconName: "",
      leadingLoading: false,
      trailingLoading: false,
    });

    expect(
      useComponentIcons({
        icon: "arrowRight",
        trailing: true,
        slots: { trailingIcon: true },
      }),
    ).toEqual({
      isLeading: false,
      isTrailing: true,
      hasLeadingSlot: false,
      hasTrailingSlot: true,
      hasLoadingSlot: false,
      leadingIconName: "",
      trailingIconName: "arrowRight",
      leadingLoading: false,
      trailingLoading: false,
    });
  });

  it("handles loading placement on auto vs trailing", () => {
    const autoLoading = useComponentIcons({
      loading: true,
      loadingIcon: "spinner",
      icon: "check",
    });
    expect(autoLoading.leadingLoading).toBe(true);
    expect(autoLoading.trailingLoading).toBe(false);
    expect(autoLoading.leadingIconName).toBe("spinner");

    const trailingLoading = useComponentIcons({
      loading: true,
      loadingPlacement: "trailing",
      leadingIcon: "search",
      slots: { loadingIcon: true },
    });
    expect(trailingLoading.leadingLoading).toBe(false);
    expect(trailingLoading.trailingLoading).toBe(true);
    expect(trailingLoading.hasLoadingSlot).toBe(true);
    expect(trailingLoading.leadingIconName).toBe("search");
    expect(trailingLoading.trailingIconName).toBe("loading");
  });
});

describe("subcomponent prop resolvers", () => {
  it("resolves boolean, string, and defu-merged object subcomponent props", () => {
    const defaults = {
      color: "primary",
      variant: "solid",
      ui: { icon: "w-4 h-4", label: "font-medium" },
    };

    expect(resolveSubcomponentProps(false, defaults)).toBeNull();
    expect(resolveSubcomponentProps("", defaults)).toBeNull();
    expect(resolveSubcomponentProps(true, defaults)).toEqual(defaults);
    expect(resolveSubcomponentProps("Beta", defaults)).toEqual({
      label: "Beta",
      ...defaults,
    });
    expect(
      resolveSubcomponentProps(
        { label: "New", color: "danger", ui: { label: "font-bold" } },
        defaults,
      ),
    ).toEqual({
      label: "New",
      color: "danger",
      variant: "solid",
      ui: { icon: "w-4 h-4", label: "font-bold" },
    });
  });

  it("applies trigger slot class unless custom color or variant is provided", () => {
    expect(
      resolveTriggerButtonProps(
        true,
        { icon: "close", color: "neutral", variant: "ghost" },
        "p-0.5 text-inherit",
      ),
    ).toEqual({
      icon: "close",
      color: "neutral",
      variant: "ghost",
      ui: {},
      className: "p-0.5 text-inherit",
    });

    expect(
      resolveTriggerButtonProps(
        { color: "warning", className: "ml-2" },
        { icon: "close", color: "neutral", variant: "ghost" },
        "p-0.5 text-inherit",
      ),
    ).toEqual({
      icon: "close",
      color: "warning",
      variant: "ghost",
      ui: {},
      className: "ml-2",
    });
  });

  it("normalizes subcomponent lists with defu defaults and transform", () => {
    const actions = resolveSubcomponentList<
      {
        label?: string;
        color?: string;
        loading?: boolean;
        className?: string;
        ui?: Record<string, string>;
      },
      {
        index: number;
        label?: string;
        color?: string;
        loading: boolean;
        className: string;
        ui?: Record<string, string>;
      }
    >(
      ["Retry", { label: "Dismiss", color: "danger", ui: { root: "px-3" } }],
      { color: "primary", ui: { icon: "w-3.5 h-3.5" } },
      "label",
      (item, raw) => ({
        ...item,
        loading: Boolean(item.loading),
        className: typeof raw === "object" && raw?.color ? "" : "text-inherit",
      }),
    );

    expect(actions).toEqual([
      {
        index: 0,
        label: "Retry",
        color: "primary",
        ui: { icon: "w-3.5 h-3.5" },
        loading: false,
        className: "text-inherit",
      },
      {
        index: 1,
        label: "Dismiss",
        color: "danger",
        ui: { icon: "w-3.5 h-3.5", root: "px-3" },
        loading: false,
        className: "",
      },
    ]);
  });
});

describe("runtime WXML template syntax", () => {
  it("contains no invalid braces or ES-only syntax inside mustache bindings", () => {
    const testDir = dirname(fileURLToPath(import.meta.url));
    const runtimeDir = resolve(testDir, "../src/runtime");
    const wxmlFiles: string[] = [];

    for (const entry of readdirSync(runtimeDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const wxmlPath = join(runtimeDir, entry.name, "index.wxml");
      try {
        wxmlFiles.push(readFileSync(wxmlPath, "utf8"));
      } catch {
        // Skip directories without index.wxml
      }
    }

    expect(wxmlFiles.length).toBeGreaterThan(0);

    for (const source of wxmlFiles) {
      expect(source).not.toMatch(/\}\}\}/);
      expect(source).not.toMatch(/\{\{[^}]*(\?\?|\?\.|=>|\{\s*\}|\.\.\.)[^}]*\}\}/);
    }
  });
});
