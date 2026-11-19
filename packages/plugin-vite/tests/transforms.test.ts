import { describe, expect, it } from "vitest";
import {
  compatMiniProgramTransforms,
  minifyCss,
} from "../src/core/transforms";

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
    expect(result).not.toContain(
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

  it("handles minified CSS without trailing semicolons before closing braces", () => {
    const css =
      ".rotate-180{rotate:180deg}.transform{transform:var(--tw-rotate-x,)}.touch-pan-y{--tw-pan-y:pan-y}";
    const result = compatMiniProgramTransforms(css);
    expect(result).toContain("-webkit-transform: rotate(180deg);");
    expect(result).toContain("transform: rotate(180deg);");
    expect(result).not.toContain("rotate: 180deg;");
    expect(result).toContain(".touch-pan-y{--tw-pan-y:pan-y}");
  });
});

describe("minifyCss", () => {
  it("strips comments and whitespace while preserving strings, calc, var, and descendant pseudo-selectors", () => {
    const css = `
/* comment */
view, text {
  margin: 0;
  padding: 0;
}
.i-lucide-check {
  --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M20 6L9 17l-5-5'/%3E%3C/svg%3E");
}
.w-1_f2 {
  width: calc(var(--spacing) * 4);
}
div :where(.foo) {
  color: var(--ui-primary, #000);
}
@media (min-width: 640px) {
  .sm_cflex {
    display: flex;
  }
}
`;
    const out = minifyCss(css);
    expect(out).not.toContain("/* comment */");
    expect(out).toContain("view,text{margin:0;padding:0}");
    expect(out).toContain(
      `--svg:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M20 6L9 17l-5-5'/%3E%3C/svg%3E")`,
    );
    expect(out).toContain("width:calc(var(--spacing) * 4)");
    expect(out).toContain("div :where(.foo){color:var(--ui-primary,#000)}");
    expect(out).toContain("@media (min-width: 640px){.sm_cflex{display:flex}}");
  });
});
