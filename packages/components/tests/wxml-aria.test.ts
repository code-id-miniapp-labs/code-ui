import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const RUNTIME_DIR = resolve(__dirname, "../src/runtime");

/**
 * Official WeChat MiniProgram documented ARIA attributes:
 * https://developers.weixin.qq.com/miniprogram/dev/component/aria-component.html
 */
const WECHAT_ARIA_ALLOWLIST = new Set([
  "aria-activedescendant",
  "aria-atomic",
  "aria-autocomplete",
  "aria-busy",
  "aria-checked",
  "aria-colcount",
  "aria-colindex",
  "aria-colspan",
  "aria-controls",
  "aria-current",
  "aria-describedby",
  "aria-details",
  "aria-disabled",
  "aria-dropeffect",
  "aria-errormessage",
  "aria-expanded",
  "aria-flowto",
  "aria-grabbed",
  "aria-haspopup",
  "aria-hidden",
  "aria-invalid",
  "aria-keyshortcuts",
  "aria-label",
  "aria-labelledby",
  "aria-level",
  "aria-live",
  "aria-modal",
  "aria-multiline",
  "aria-multiselectable",
  "aria-orientation",
  "aria-owns",
  "aria-placeholder",
  "aria-posinset",
  "aria-pressed",
  "aria-readonly",
  "aria-relevant",
  "aria-required",
  "aria-role",
  "aria-roledescription",
  "aria-rowcount",
  "aria-rowindex",
  "aria-rowspan",
  "aria-selected",
  "aria-setsize",
  "aria-sort",
  "aria-valuemax",
  "aria-valuemin",
  "aria-valuenow",
  "aria-valuetext",
]);

function collectWxmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectWxmlFiles(full));
    } else if (entry.name.endsWith(".wxml")) {
      results.push(full);
    }
  }
  return results.sort();
}

function extractTagAttributes(wxmlSource: string): string[] {
  const withoutComments = wxmlSource.replace(/<!--[\s\S]*?-->/g, "");
  const attrs: string[] = [];
  // Match opening/self-closing tags while skipping {{ ... }} expressions inside attribute values
  const tagRe = /<[a-zA-Z][\w-]*((?:\s+[^>"'{]+|\s+[a-zA-Z_:][\w:.-]*\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRe.exec(withoutComments)) !== null) {
    const attrBlock = tagMatch[1] ?? "";
    const cleaned = attrBlock.replace(/="[^"]*"|='[^']*'/g, '=""');
    const nameRe = /(?:^|\s)([a-zA-Z_:][\w:.-]*)(?=\s*=|\s|$)/g;
    let nameMatch: RegExpExecArray | null;
    while ((nameMatch = nameRe.exec(cleaned)) !== null) {
      if (nameMatch[1]) attrs.push(nameMatch[1]);
    }
  }
  return attrs;
}

describe("WeChat WXML ARIA compliance & attribute allowlist", () => {
  const wxmlFiles = collectWxmlFiles(RUNTIME_DIR);

  it("discovers runtime WXML templates", () => {
    expect(wxmlFiles.length).toBeGreaterThanOrEqual(25);
  });

  it("never emits standalone role= or tabindex= attributes in runtime WXML", () => {
    const violations: string[] = [];

    for (const file of wxmlFiles) {
      const rel = relative(RUNTIME_DIR, file);
      const source = readFileSync(file, "utf8");
      const attrs = extractTagAttributes(source);

      for (const attr of attrs) {
        if (attr === "role") {
          violations.push(`${rel}: standalone role= found (use aria-role= instead)`);
        }
        if (attr === "tabindex") {
          violations.push(`${rel}: unsupported tabindex= found`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("only emits documented WeChat aria-* attributes", () => {
    const unsupported: string[] = [];

    for (const file of wxmlFiles) {
      const rel = relative(RUNTIME_DIR, file);
      const source = readFileSync(file, "utf8");
      const attrs = extractTagAttributes(source);

      for (const attr of attrs) {
        if (attr.startsWith("aria-") && !WECHAT_ARIA_ALLOWLIST.has(attr)) {
          unsupported.push(`${rel}: ${attr}`);
        }
      }
    }

    expect(unsupported).toEqual([]);
  });

  it("emits aria-role on interactive and semantic custom views", () => {
    const expectedRoles: Array<[string, string]> = [
      ["checkbox/index.wxml", 'aria-role="checkbox"'],
      ["radio/index.wxml", 'aria-role="radio"'],
      ["switch/index.wxml", 'aria-role="switch"'],
      ["slider/index.wxml", 'aria-role="slider"'],
      ["tabs/index.wxml", 'aria-role="tablist"'],
      ["tabs-item/index.wxml", 'aria-role="tabpanel"'],
      ["stepper/index.wxml", 'aria-role="tablist"'],
      ["stepper-item/index.wxml", 'aria-role="tab"'],
      ["drawer/index.wxml", 'aria-role="dialog"'],
      ["progress/index.wxml", 'aria-role="progressbar"'],
      ["qr-code/index.wxml", 'aria-role="img"'],
      ["toast/index.wxml", 'aria-role="status"'],
      ["pull-down-refresh/index.wxml", 'aria-role="status"'],
      ["accordion-item/index.wxml", 'aria-role="button"'],
    ];

    for (const [relPath, expectedSnippet] of expectedRoles) {
      const content = readFileSync(join(RUNTIME_DIR, relPath), "utf8");
      expect(content, `${relPath} should contain ${expectedSnippet}`).toContain(
        expectedSnippet,
      );
    }
  });
});

