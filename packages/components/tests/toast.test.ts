import { describe, expect, it } from "vitest";
import {
  progressTheme as createProgressTheme,
  toastTheme as createToastTheme,
} from "@code-id-labs/core";
import { tv } from "../src/utils/variants";
import { resolveSlots } from "../src/utils/ui";

const toastTheme = tv(createToastTheme());
const progressTheme = tv(createProgressTheme());

describe("toastTheme runtime resolution (@code-id-labs/components)", () => {
  it.each(["top", "bottom"] as const)(
    "keeps native %s placement centered",
    (placement) => {
      const slots = resolveSlots(
        toastTheme({
          mode: "native",
          orientation: "horizontal",
          placement,
        }),
        {},
        "",
      );

      expect(slots.root).toContain(
        `fixed ${placement === "top" ? "top-0" : "bottom-0"}`,
      );
      expect(slots.root).toContain("left-1_f2");
      expect(slots.root).toContain("-translate-x-1_f2");
      expect(slots.root).not.toContain("inset-x-auto");

      expect(slots.title.split(" ")).toContain("text-white");
      expect(slots.title.split(" ")).not.toContain("text-neutral-900");
      expect(slots.description.split(" ")).toContain("text-white_f85");
      expect(slots.description.split(" ")).not.toContain("text-neutral-500");
    },
  );

  it.each(["soft", "subtle"] as const)(
    "keeps opaque bg-default surface under %s variant tint",
    (variant) => {
      const slots = resolveSlots(
        toastTheme({
          mode: "default",
          color: "success",
          variant,
        }),
        {},
        "",
      );

      expect(slots.root.split(" ")).toContain("bg-default");
      expect(slots.root.split(" ")).not.toContain("bg-success_f10");
      expect(slots.tint.split(" ")).toContain("bg-success_f10");
      expect(slots.iconWrapper.split(" ")).toContain("z-1");
      expect(slots.wrapper.split(" ")).toContain("z-1");
    },
  );

  it("overrides solid progress bar background to white via theme slots", () => {
    const toastSlots = resolveSlots(
      toastTheme({
        mode: "default",
        color: "primary",
        variant: "solid",
      }),
      {},
      "",
    );

    expect(toastSlots.progressRange.split(" ")).toContain("bg-white");

    const progressSlots = resolveSlots(
      progressTheme({ color: "primary", size: "2xs" }),
      {
        root: toastSlots.progressBar,
        track: toastSlots.progressTrack,
        range: toastSlots.progressRange,
      },
      toastSlots.progressBar,
    );

    expect(progressSlots.range.split(" ")).toContain("bg-white");
    expect(progressSlots.range.split(" ")).not.toContain("bg-primary");
  });

  it("uses contrasting bg-default progress bar for neutral solid toast", () => {
    const toastSlots = resolveSlots(
      toastTheme({
        mode: "default",
        color: "neutral",
        variant: "solid",
      }),
      {},
      "",
    );

    expect(toastSlots.progressRange.split(" ")).toContain("bg-default");
    expect(toastSlots.progressRange.split(" ")).not.toContain("bg-white");
  });
});
