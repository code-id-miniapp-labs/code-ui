import { describe, it, expect } from "vitest";
import { codeUI } from "../src";

describe("codeUI Vite plugin - slotDetect", () => {
  it("transforms .wxml files in transform hook and injects slots prop", async () => {
    const plugin = codeUI({
      appWrapper: false,
      slotDetect: true,
    });

    const transform =
      typeof plugin.transform === "function"
        ? plugin.transform
        : plugin.transform?.handler;

    const rawWxml = `<view><c-input><view slot="leading">Prefix</view></c-input></view>`;
    const res = (await transform?.call(
      {} as any,
      rawWxml,
      "/project/src/pages/demo/index.wxml",
    )) as { code: string } | null;

    expect(res).toBeTruthy();
    expect(res?.code).toBe(
      `<view><c-input slots="{{ { leading: true } }}"><view slot="leading">Prefix</view></c-input></view>`,
    );
  });

  it("supports export default wrapped WXML modules in transform hook", async () => {
    const plugin = codeUI({
      appWrapper: false,
      slotDetect: true,
    });

    const transform =
      typeof plugin.transform === "function"
        ? plugin.transform
        : plugin.transform?.handler;

    const moduleCode = `export default "<c-card><view slot=\\"header\\">H</view></c-card>";`;
    const res = (await transform?.call(
      {} as any,
      moduleCode,
      "/project/src/pages/demo/index.wxml",
    )) as { code: string } | null;

    expect(res).toBeTruthy();
    expect(res?.code).toContain(`slots=\\"{{ { header: true } }}\\"`);
  });

  it("transforms .wxml assets in generateBundle hook", () => {
    const plugin = codeUI({
      appWrapper: false,
      autoImport: false,
      slotDetect: true,
    });

    const generateBundle =
      typeof plugin.generateBundle === "function"
        ? plugin.generateBundle
        : plugin.generateBundle?.handler;

    const bundle: Record<string, any> = {
      "pages/input/index.wxml": {
        type: "asset",
        fileName: "pages/input/index.wxml",
        source: `<c-input><view wx:if="{{hasTrail}}" slot="trailing">T</view></c-input>`,
      },
    };

    generateBundle?.call(
      { meta: { watchMode: false } } as any,
      {} as any,
      bundle as any,
      false,
    );

    expect(bundle["pages/input/index.wxml"].source).toBe(
      `<c-input slots="{{ { trailing: !!(hasTrail) } }}"><view wx:if="{{hasTrail}}" slot="trailing">T</view></c-input>`,
    );
  });
});

