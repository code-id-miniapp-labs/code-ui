import { describe, expect, it } from "vitest";
import { toastTheme as createToastTheme } from "@code-ui/core";
import { tv } from "../src/utils/variants";
import { resolveSlots } from "../src/utils/ui";

const toastTheme = tv(createToastTheme());

describe("toastTheme runtime resolution (@code-ui/components)", () => {
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
});
