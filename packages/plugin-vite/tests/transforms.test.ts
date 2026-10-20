import { describe, expect, it } from "vitest";
import { compatMiniProgramTransforms } from "../src/core/transforms";

describe("compatMiniProgramTransforms", () => {
  it("leaves CSS without transforms untouched", () => {
    const css = ".block { display: block; }";
    expect(compatMiniProgramTransforms(css)).toBe(css);
  });

  it("injects -webkit-transform and transform fallbacks for Tailwind v4 translate", () => {
    const css = `
.translate-x-4 {
  --tw-translate-x: calc(var(--spacing) * 4);
  translate: var(--tw-translate-x) var(--tw-translate-y);
}
.translate-y-0 {
  --tw-translate-y: 0px;
  translate: var(--tw-translate-x) var(--tw-translate-y);
}
`;
    const result = compatMiniProgramTransforms(css);
    expect(result).toContain(
      "-webkit-transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));",
    );
    expect(result).toContain(
      "transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));",
    );
    expect(result).toContain(
      "translate: var(--tw-translate-x) var(--tw-translate-y);",
    );
  });

  it("injects -webkit-transform and transform fallbacks for scale and rotate", () => {
    const css = `
.scale-95 {
  --tw-scale-x: 95%;
  --tw-scale-y: 95%;
  scale: var(--tw-scale-x) var(--tw-scale-y);
}
.rotate-45 {
  rotate: 45deg;
}
.transition-transform {
  transition-property: transform, translate, scale, rotate;
}
`;
    const result = compatMiniProgramTransforms(css);
    expect(result).toContain(
      "-webkit-transform: scale(var(--tw-scale-x, 1), var(--tw-scale-y, 1));",
    );
    expect(result).toContain(
      "transform: scale(var(--tw-scale-x, 1), var(--tw-scale-y, 1));",
    );
    expect(result).toContain("-webkit-transform: rotate(45deg);");
    expect(result).toContain("transform: rotate(45deg);");
    expect(result).toContain(
      "transition-property: transform, translate, scale, rotate;",
    );
  });

  it("is strictly idempotent and deduplicates already transformed CSS", () => {
    const css = `
.-translate-x-1_f2 {
  --tw-translate-x: calc((1 / 2 * 100%) * -1);
  translate: var(--tw-translate-x) var(--tw-translate-y);
}
.scale-90 {
  scale: var(--tw-scale-x) var(--tw-scale-y);
}
.rotate-45 {
  rotate: 45deg;
}
`;
    const run1 = compatMiniProgramTransforms(css);
    const run2 = compatMiniProgramTransforms(run1);
    const run3 = compatMiniProgramTransforms(run2);

    expect(run2).toBe(run1);
    expect(run3).toBe(run1);

    // Test cleaning up an already heavily duplicated snippet (e.g. from repeated dev server saves)
    const polluted = `
.-translate-x-1_f2 {
  --tw-translate-x: calc((1 / 2 * 100%) * -1);
  -webkit-transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));
  transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));
  -webkit-transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));
  transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));
  -webkit-transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));
  transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));
  translate: var(--tw-translate-x) var(--tw-translate-y);
}
`;
    const cleaned = compatMiniProgramTransforms(polluted);
    const countWebkit = (cleaned.match(/-webkit-transform/g) || []).length;
    const countTransform = (cleaned.match(/(?<!-webkit-)transform/g) || []).length;

    expect(countWebkit).toBe(1);
    expect(countTransform).toBe(1);
  });
});
