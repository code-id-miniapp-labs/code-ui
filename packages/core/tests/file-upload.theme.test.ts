import { describe, expect, it } from "vitest";
import { fileUploadTheme } from "../src";

describe("fileUploadTheme (@code-ui/core)", () => {
  it("provides all required slots", () => {
    const theme = fileUploadTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("dropzone");
    expect(theme.slots).toHaveProperty("icon");
    expect(theme.slots).toHaveProperty("content");
    expect(theme.slots).toHaveProperty("title");
    expect(theme.slots).toHaveProperty("description");
    expect(theme.slots).toHaveProperty("fileList");
    expect(theme.slots).toHaveProperty("file");
    expect(theme.slots).toHaveProperty("fileLeading");
    expect(theme.slots).toHaveProperty("fileContent");
    expect(theme.slots).toHaveProperty("fileName");
    expect(theme.slots).toHaveProperty("fileSize");
    expect(theme.slots).toHaveProperty("fileTrailing");
    expect(theme.slots).toHaveProperty("fileRemove");
    expect(theme.slots).toHaveProperty("fileProgress");
  });

  it("sets correct default variants", () => {
    const theme = fileUploadTheme();
    expect(theme.defaultVariants).toEqual({
      color: "primary",
      variant: "outline",
      size: "md",
      layout: "list",
      disabled: false,
      invalid: false,
    });
  });

  it("supports color variants and compound variants", () => {
    const theme = fileUploadTheme();
    expect(theme.variants.color).toHaveProperty("primary");
    expect(theme.variants.color).toHaveProperty("success");
    expect(theme.variants.color).toHaveProperty("warning");
    expect(theme.variants.color).toHaveProperty("danger");

    const primaryCompound = theme.compoundVariants.find(
      (c: any) => c.color === "primary",
    );
    expect(primaryCompound?.class).toEqual({
      dropzone: "hover:border-primary active:border-primary",
    });
  });

  it("supports size options sm, md, lg, xl", () => {
    const theme = fileUploadTheme();
    expect(theme.variants.size).toHaveProperty("sm");
    expect(theme.variants.size).toHaveProperty("md");
    expect(theme.variants.size).toHaveProperty("lg");
    expect(theme.variants.size).toHaveProperty("xl");
  });

  it("supports layout options list and grid", () => {
    const theme = fileUploadTheme();
    expect(theme.variants.layout).toHaveProperty("list");
    expect(theme.variants.layout).toHaveProperty("grid");
  });
});

