import { describe, it, expect } from "vitest";
import { transformWxmlSlots } from "../src";

/**
 * Helper to evaluate the generated `<wxs module="__cuiSlots">` block in JS
 * so we can assert the runtime behavior of generated ES5 WXS loop predicates.
 */
function evaluateWxsModule(code: string, moduleName = "__cuiSlots"): Record<string, (...args: unknown[]) => boolean> {
  const re = new RegExp(`<wxs\\s+module=["']${moduleName}["']>([\\s\\S]*?)<\\/wxs>`);
  const match = code.match(re);
  if (!match || !match[1]) {
    throw new Error(`No <wxs module="${moduleName}"> found in output:\n${code}`);
  }
  const mod = { exports: {} as Record<string, (...args: unknown[]) => boolean> };
  const fn = new Function("module", match[1]);
  fn(mod);
  return mod.exports;
}

describe("@code-id-labs/compiler - transformWxmlSlots", () => {
  describe("1. Empty, self-closing & non-component tags", () => {
    it("leaves self-closing and empty component tags unchanged", () => {
      const src = `<c-input placeholder="Enter" /><c-card>   <!-- comment -->  </c-card>`;
      const res = transformWxmlSlots(src);
      expect(res.hasChanges).toBe(false);
      expect(res.code).toBe(src);
    });

    it("ignores templates without matching component prefix", () => {
      const src = `<view class="box"><text>Hello</text></view>`;
      const res = transformWxmlSlots(src);
      expect(res.hasChanges).toBe(false);
      expect(res.code).toBe(src);
    });

    it("supports custom component prefix option", () => {
      const src = `<u-input><view slot="leading">Icon</view></u-input>`;
      const res = transformWxmlSlots(src, { prefix: "u-" });
      expect(res.hasChanges).toBe(true);
      expect(res.code).toBe(
        `<u-input slots="{{ { leading: true } }}"><view slot="leading">Icon</view></u-input>`,
      );
    });
  });

  describe("2. Static slots (named, default, multiple, kebab-case)", () => {
    it("detects static named slots on c-input", () => {
      const src = `<c-input><view slot="leading">custom leading</view></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.hasChanges).toBe(true);
      expect(res.code).toBe(
        `<c-input slots="{{ { leading: true } }}"><view slot="leading">custom leading</view></c-input>`,
      );
    });

    it("detects multiple distinct static slots on the same component", () => {
      const src = `<c-input><view slot="leading">L</view><view slot="trailing">T</view><view slot="loadingIcon">S</view></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toBe(
        `<c-input slots="{{ { leading: true, trailing: true, loadingIcon: true } }}"><view slot="leading">L</view><view slot="trailing">T</view><view slot="loadingIcon">S</view></c-input>`,
      );
    });

    it("detects default slot from element, static text, mixed text, or explicit slot='default'", () => {
      expect(transformWxmlSlots(`<c-button>Click me</c-button>`).code).toBe(
        `<c-button slots="{{ { default: true } }}">Click me</c-button>`,
      );

      expect(transformWxmlSlots(`<c-button>Hello {{userName}}</c-button>`).code).toBe(
        `<c-button slots="{{ { default: true } }}">Hello {{userName}}</c-button>`,
      );

      expect(
        transformWxmlSlots(`<c-card><view slot="header">Title</view><view>Body</view></c-card>`).code,
      ).toBe(
        `<c-card slots="{{ { header: true, default: true } }}"><view slot="header">Title</view><view>Body</view></c-card>`,
      );

      expect(
        transformWxmlSlots(`<c-card><view slot="default">Explicit default</view></c-card>`).code,
      ).toBe(
        `<c-card slots="{{ { default: true } }}"><view slot="default">Explicit default</view></c-card>`,
      );
    });

    it("reduces static + conditional elements on the same slot to static true", () => {
      const src = `<c-input><view wx:if="{{maybe}}" slot="leading">A</view><view slot="leading">B</view></c-input>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-input slots="{{ { leading: true } }}"><view wx:if="{{maybe}}" slot="leading">A</view><view slot="leading">B</view></c-input>`,
      );
    });

    it("converts kebab-case slot names to unquoted camelCase identifiers", () => {
      const src = `<c-stepper-item><view slot="completed-indicator">Done</view></c-stepper-item><c-tabs><view slot="list-trailing">Extra</view></c-tabs><c-progress><view slot="value-text">50%</view></c-progress>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-stepper-item slots="{{ { completedIndicator: true } }}"><view slot="completed-indicator">Done</view></c-stepper-item><c-tabs slots="{{ { listTrailing: true } }}"><view slot="list-trailing">Extra</view></c-tabs><c-progress slots="{{ { valueText: true } }}"><view slot="value-text">50%</view></c-progress>`,
      );
    });
  });

  describe("3. Conditional slots (wx:if, wx:elif, wx:else)", () => {
    it("handles wx:if conditional slot and normalizes inner double quotes", () => {
      const src = `<c-input><view wx:if="{{showLeading}}" slot="leading">L</view></c-input>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-input slots="{{ { leading: !!(showLeading) } }}"><view wx:if="{{showLeading}}" slot="leading">L</view></c-input>`,
      );

      const quotedSrc = `<c-stepper-item><view wx:if="{{status == "done"}}" slot="completed-indicator">Done</view></c-stepper-item>`;
      expect(transformWxmlSlots(quotedSrc).code).toBe(
        `<c-stepper-item slots="{{ { completedIndicator: !!(status == 'done') } }}"><view wx:if="{{status == "done"}}" slot="completed-indicator">Done</view></c-stepper-item>`,
      );
    });

    it("handles static boolean literals in wx:if", () => {
      const trueSrc = `<c-input><view wx:if="{{true}}" slot="leading">Always</view></c-input>`;
      expect(transformWxmlSlots(trueSrc).code).toBe(
        `<c-input slots="{{ { leading: true } }}"><view wx:if="{{true}}" slot="leading">Always</view></c-input>`,
      );

      const falseSrc = `<c-input><view wx:if="{{false}}" slot="leading">Never</view></c-input>`;
      const falseRes = transformWxmlSlots(falseSrc);
      expect(falseRes.hasChanges).toBe(false);
      expect(falseRes.code).toBe(falseSrc);
    });

    it("combines multiple independent wx:if elements targeting the same slot with ||", () => {
      const src = `<c-input><view wx:if="{{hasIcon}}" slot="leading">I</view><view wx:if="{{hasPrefix}}" slot="leading">P</view></c-input>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-input slots="{{ { leading: !!((hasIcon) || (hasPrefix)) } }}"><view wx:if="{{hasIcon}}" slot="leading">I</view><view wx:if="{{hasPrefix}}" slot="leading">P</view></c-input>`,
      );
    });

    it("handles wx:if / wx:elif / wx:else chains across different slots", () => {
      const src = `<c-input><view wx:if="{{mode === 'lead'}}" slot="leading">L</view><view wx:elif="{{mode === 'trail'}}" slot="trailing">T</view><view wx:else slot="loadingIcon">S</view></c-input>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-input slots="{{ { leading: !!(mode === 'lead'), trailing: !!(!(mode === 'lead') && (mode === 'trail')), loadingIcon: !!(!(mode === 'lead') && !(mode === 'trail')) } }}"><view wx:if="{{mode === 'lead'}}" slot="leading">L</view><view wx:elif="{{mode === 'trail'}}" slot="trailing">T</view><view wx:else slot="loadingIcon">S</view></c-input>`,
      );
    });

    it("handles non-exhaustive wx:if / wx:elif chain (without wx:else) on the same slot", () => {
      const src = `<c-input><view wx:if="{{a}}" slot="leading">A</view><view wx:elif="{{b}}" slot="leading">B</view></c-input>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-input slots="{{ { leading: !!((a) || (!(a) && b)) } }}"><view wx:if="{{a}}" slot="leading">A</view><view wx:elif="{{b}}" slot="leading">B</view></c-input>`,
      );
    });

    it("simplifies exhaustive wx:if / wx:elif / wx:else chain on the same slot to true", () => {
      const src = `<c-input><view wx:if="{{a}}" slot="leading">A</view><view wx:elif="{{b}}" slot="leading">B</view><view wx:else slot="leading">C</view></c-input>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-input slots="{{ { leading: true } }}"><view wx:if="{{a}}" slot="leading">A</view><view wx:elif="{{b}}" slot="leading">B</view><view wx:else slot="leading">C</view></c-input>`,
      );
    });

    it("handles partial slot overlap across exhaustive wx:if / wx:else branches", () => {
      const src = `<c-input><block wx:if="{{a}}"><view slot="leading">A</view><view wx:if="{{showTrail}}" slot="trailing">T</view></block><block wx:else><view slot="leading">B</view></block></c-input>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-input slots="{{ { leading: true, trailing: !!(a && showTrail) } }}"><block wx:if="{{a}}"><view slot="leading">A</view><view wx:if="{{showTrail}}" slot="trailing">T</view></block><block wx:else><view slot="leading">B</view></block></c-input>`,
      );
    });

    it("handles multiple sequential wx:if / wx:else chains inside one component", () => {
      const src = `<c-input><view wx:if="{{a}}" slot="leading">L1</view><view wx:else slot="leading">L2</view><view wx:if="{{x}}" slot="trailing">T1</view><view wx:elif="{{y}}" slot="loadingIcon">S1</view></c-input>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-input slots="{{ { leading: true, trailing: !!(x), loadingIcon: !!(!(x) && y) } }}"><view wx:if="{{a}}" slot="leading">L1</view><view wx:else slot="leading">L2</view><view wx:if="{{x}}" slot="trailing">T1</view><view wx:elif="{{y}}" slot="loadingIcon">S1</view></c-input>`,
      );
    });
  });

  describe("4. <block> wrappers & slot inheritance", () => {
    it("handles nested <block wx:if> and <block slot='...'> inheritance", () => {
      const src = `<c-card><block wx:if="{{hasHeader}}"><view slot="header">H</view><block wx:if="{{hasFooter}}" slot="footer"><text>F</text></block></block></c-card>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-card slots="{{ { header: !!(hasHeader), footer: !!(hasHeader && hasFooter) } }}"><block wx:if="{{hasHeader}}"><view slot="header">H</view><block wx:if="{{hasFooter}}" slot="footer"><text>F</text></block></block></c-card>`,
      );
    });

    it("allows child slot attribute to override <block slot='...'> inherited slot", () => {
      const src = `<c-card><block slot="header"><view>Header Title</view><view slot="footer">Override to Footer</view></block></c-card>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-card slots="{{ { header: true, footer: true } }}"><block slot="header"><view>Header Title</view><view slot="footer">Override to Footer</view></block></c-card>`,
      );
    });
  });

  describe("5. Ancestor wx:for loops (component inside loop)", () => {
    it("evaluates ancestor loop variables directly in WXML without WXS", () => {
      const src = `<view wx:for="{{list}}"><c-input><view wx:if="{{item.hasLeading}}" slot="leading">{{item.prefix}}</view><view wx:elif="{{index === 0}}" slot="trailing">First</view></c-input></view>`;
      const res = transformWxmlSlots(src);
      expect(res.code).not.toContain("<wxs");
      expect(res.code).toBe(
        `<view wx:for="{{list}}"><c-input slots="{{ { leading: !!(item.hasLeading), trailing: !!(!(item.hasLeading) && (index === 0)) } }}"><view wx:if="{{item.hasLeading}}" slot="leading">{{item.prefix}}</view><view wx:elif="{{index === 0}}" slot="trailing">First</view></c-input></view>`,
      );
    });

    it("handles custom wx:for-item and wx:for-index on ancestor loop", () => {
      const src = `<block wx:for="{{rows}}" wx:for-item="row" wx:for-index="rowIdx"><c-card><view wx:if="{{row.showHeader && rowIdx < 5}}" slot="header">{{row.title}}</view>{{row.body}}</c-card></block>`;
      const res = transformWxmlSlots(src);
      expect(res.code).not.toContain("<wxs");
      expect(res.code).toBe(
        `<block wx:for="{{rows}}" wx:for-item="row" wx:for-index="rowIdx"><c-card slots="{{ { header: !!(row.showHeader && rowIdx < 5), default: !!((row.body) !== '' && (row.body) !== null && (row.body) !== undefined) } }}"><view wx:if="{{row.showHeader && rowIdx < 5}}" slot="header">{{row.title}}</view>{{row.body}}</c-card></block>`,
      );
    });
  });

  describe("6. Child wx:for loops WITHOUT loop-variable condition (pure WXML)", () => {
    it("uses pure WXML length/count check for unconditional child wx:for and wx:for-items", () => {
      const src1 = `<c-card><view wx:for="{{items}}" slot="header">Row</view></c-card>`;
      expect(transformWxmlSlots(src1).code).toBe(
        `<c-card slots="{{ { header: !!(items && (items.length > 0 || items > 0)) } }}"><view wx:for="{{items}}" slot="header">Row</view></c-card>`,
      );

      const src2 = `<c-card><view wx:for-items="{{user.items}}" slot="footer">Row</view></c-card>`;
      expect(transformWxmlSlots(src2).code).toBe(
        `<c-card slots="{{ { footer: !!(user.items && (user.items.length > 0 || user.items > 0)) } }}"><view wx:for-items="{{user.items}}" slot="footer">Row</view></c-card>`,
      );
    });

    it("combines outer wx:if and non-loop inner wx:if with child wx:for length check", () => {
      const src = `<c-card><block wx:if="{{showSection}}"><view wx:for="{{items}}" wx:if="{{allowHeader}}" slot="header">Row</view></block></c-card>`;
      const res = transformWxmlSlots(src);
      expect(res.code).not.toContain("<wxs");
      expect(res.code).toBe(
        `<c-card slots="{{ { header: !!(showSection && ((items && (items.length > 0 || items > 0)) && allowHeader)) } }}"><block wx:if="{{showSection}}"><view wx:for="{{items}}" wx:if="{{allowHeader}}" slot="header">Row</view></block></c-card>`,
      );
    });

    it("handles <block wx:for> wrapping multiple slots", () => {
      const src = `<c-card><block wx:for="{{sections}}"><view slot="header">H</view><view>Body</view></block></c-card>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-card slots="{{ { header: !!(sections && (sections.length > 0 || sections > 0)), default: !!(sections && (sections.length > 0 || sections > 0)) } }}"><block wx:for="{{sections}}"><view slot="header">H</view><view>Body</view></block></c-card>`,
      );
    });

    it("simplifies exhaustive wx:if / wx:else on the same slot inside <block wx:for> to pure WXML length check without WXS", () => {
      const src = `<c-input><block wx:for="{{addons}}"><view wx:if="{{item.bold}}" slot="leading">Bold</view><view wx:else slot="leading">Normal</view></block></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.code).not.toContain("<wxs");
      expect(res.code).toBe(
        `<c-input slots="{{ { leading: !!(addons && (addons.length > 0 || addons > 0)) } }}"><block wx:for="{{addons}}"><view wx:if="{{item.bold}}" slot="leading">Bold</view><view wx:else slot="leading">Normal</view></block></c-input>`,
      );
    });

    it("handles wx:if static branch followed by wx:else with wx:for on the same element", () => {
      const src = `<c-card><view wx:if="{{useSingle}}" slot="header">One</view><view wx:else wx:for="{{items}}" slot="header">{{item}}</view></c-card>`;
      const res = transformWxmlSlots(src);
      expect(res.code).not.toContain("<wxs");
      expect(res.code).toBe(
        `<c-card slots="{{ { header: !!((useSingle) || (!(useSingle) && (items && (items.length > 0 || items > 0)))) } }}"><view wx:if="{{useSingle}}" slot="header">One</view><view wx:else wx:for="{{items}}" slot="header">{{item}}</view></c-card>`,
      );
    });
  });

  describe("7. Child wx:for loops WITH loop-variable conditions (WXS helpers)", () => {
    it("auto-injects WXS helper when wx:for and wx:if={{item...}} are on the same element", () => {
      const src = `<c-input><view wx:for="{{addons}}" wx:if="{{item.type === 'leading'}}" slot="leading">{{item.text}}</view></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(`<wxs module="__cuiSlots">`);
      expect(res.code).toContain(
        `slots="{{ { leading: !!(__cuiSlots.s0(addons)) } }}"`,
      );

      const wxs = evaluateWxsModule(res.code);
      expect(wxs.s0?.([])).toBe(false);
      expect(wxs.s0?.([{ type: "trailing" }])).toBe(false);
      expect(wxs.s0?.([{ type: "trailing" }, { type: "leading" }])).toBe(true);
    });

    it("handles <block wx:for> with inner wx:if referencing item and index", () => {
      const src = `<c-input><block wx:for="{{addons}}"><view wx:if="{{item.enabled && index > 0}}" slot="trailing">{{item.label}}</view></block></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(
        `slots="{{ { trailing: !!(__cuiSlots.s0(addons)) } }}"`,
      );

      const wxs = evaluateWxsModule(res.code);
      expect(wxs.s0?.([{ enabled: true }])).toBe(false); // index 0 only
      expect(wxs.s0?.([{ enabled: false }, { enabled: true }])).toBe(true); // index 1 enabled
    });

    it("handles custom wx:for-item and wx:for-index with outer page variables in predicate", () => {
      const src = `<c-input><view wx:for="{{user.addons}}" wx:for-item="addon" wx:for-index="idx" wx:if="{{addon.kind === activeKind && idx >= minIdx}}" slot="leading">{{addon.text}}</view></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(
        `slots="{{ { leading: !!(__cuiSlots.s0(user.addons, activeKind, minIdx)) } }}"`,
      );

      const wxs = evaluateWxsModule(res.code);
      expect(
        wxs.s0?.([{ kind: "icon" }, { kind: "badge" }], "badge", 1),
      ).toBe(true);
      expect(
        wxs.s0?.([{ kind: "badge" }, { kind: "icon" }], "badge", 1),
      ).toBe(false);
    });

    it("combines outer wx:if guard with WXS loop helper when <block wx:if> wraps <view wx:for>", () => {
      const src = `<c-input><block wx:if="{{showAddons}}"><view wx:for="{{addons}}" wx:if="{{item.isLead}}" slot="leading">{{item.text}}</view></block></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(
        `slots="{{ { leading: !!(showAddons && __cuiSlots.s0(addons)) } }}"`,
      );
    });

    it("handles wx:if / wx:elif / wx:else chain inside <block wx:for> across different slots", () => {
      const src = `<c-input><block wx:for="{{addons}}"><view wx:if="{{item.pos === 'left'}}" slot="leading">L</view><view wx:elif="{{item.pos === 'right'}}" slot="trailing">R</view><view wx:else slot="loadingIcon">S</view></block></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(
        `slots="{{ { leading: !!(__cuiSlots.s0(addons)), trailing: !!(__cuiSlots.s1(addons)), loadingIcon: !!(__cuiSlots.s2(addons)) } }}"`,
      );

      const wxs = evaluateWxsModule(res.code);
      expect(wxs.s0?.([{ pos: "left" }])).toBe(true);
      expect(wxs.s1?.([{ pos: "left" }])).toBe(false);
      expect(wxs.s2?.([{ pos: "left" }])).toBe(false);

      expect(wxs.s0?.([{ pos: "other" }])).toBe(false);
      expect(wxs.s1?.([{ pos: "other" }])).toBe(false);
      expect(wxs.s2?.([{ pos: "other" }])).toBe(true);
    });

    it("handles wx:if / wx:elif / wx:else chain inside <block wx:for> with multiple branches targeting the same slot", () => {
      const src = `<c-input><block wx:for="{{addons}}"><view wx:if="{{item.pos === 'left'}}" slot="leading">L1</view><view wx:elif="{{item.pos === 'start'}}" slot="leading">L2</view><view wx:else slot="trailing">R</view></block></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(
        `slots="{{ { leading: !!((__cuiSlots.s0(addons)) || (__cuiSlots.s1(addons))), trailing: !!(__cuiSlots.s2(addons)) } }}"`,
      );

      const wxs = evaluateWxsModule(res.code);
      const hasLeading = (arr: unknown[]) => Boolean(wxs.s0?.(arr) || wxs.s1?.(arr));
      expect(hasLeading([{ pos: "start" }])).toBe(true);
      expect(hasLeading([{ pos: "left" }])).toBe(true);
      expect(hasLeading([{ pos: "right" }])).toBe(false);
      expect(wxs.s2?.([{ pos: "right" }])).toBe(true);
    });

    it("reuses identical WXS helper across multiple components in the same template", () => {
      const src =
        `<c-input><view wx:for="{{addons}}" wx:if="{{item.lead}}" slot="leading">1</view></c-input>` +
        `<c-input><view wx:for="{{otherAddons}}" wx:if="{{item.lead}}" slot="leading">2</view></c-input>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(`slots="{{ { leading: !!(__cuiSlots.s0(addons)) } }}"`);
      expect(res.code).toContain(`slots="{{ { leading: !!(__cuiSlots.s0(otherAddons)) } }}"`);
      expect(res.code).not.toContain("s1");
    });
  });

  describe("8. Nested 2D child wx:for loops", () => {
    it("generates WXS helper for nested wx:for when inner list references outer loop item (even without inner wx:if)", () => {
      const src = `<c-card><block wx:for="{{groups}}" wx:for-item="group"><view wx:for="{{group.items}}" slot="header">{{item}}</view></block></c-card>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(
        `slots="{{ { header: !!(__cuiSlots.s0(groups)) } }}"`,
      );

      const wxs = evaluateWxsModule(res.code);
      expect(wxs.s0?.([])).toBe(false);
      expect(wxs.s0?.([{ items: [] }, { items: [] }])).toBe(false);
      expect(wxs.s0?.([{ items: [] }, { items: ["a"] }])).toBe(true);
    });

    it("generates WXS helper for nested wx:for with outer loop wx:if guard and inner loop wx:if predicate", () => {
      const src = `<c-card><block wx:for="{{groups}}" wx:for-item="group"><block wx:if="{{group.visible}}"><view wx:for="{{group.items}}" wx:if="{{item.active && item.role === targetRole}}" slot="header">{{item.name}}</view></block></block></c-card>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(
        `slots="{{ { header: !!(__cuiSlots.s0(groups, targetRole)) } }}"`,
      );

      const wxs = evaluateWxsModule(res.code);
      expect(
        wxs.s0?.(
          [
            { visible: false, items: [{ active: true, role: "admin" }] },
            { visible: true, items: [{ active: false, role: "admin" }] },
          ],
          "admin",
        ),
      ).toBe(false);
      expect(
        wxs.s0?.(
          [
            { visible: false, items: [{ active: true, role: "admin" }] },
            { visible: true, items: [{ active: true, role: "admin" }] },
          ],
          "admin",
        ),
      ).toBe(true);
    });

    it("uses pure WXML non-empty checks for nested wx:for over independent page arrays without item conditions", () => {
      const src = `<c-card><block wx:for="{{rows}}" wx:for-item="row"><view wx:for="{{cols}}" slot="header">Cell</view></block></c-card>`;
      const res = transformWxmlSlots(src);
      expect(res.code).not.toContain("<wxs");
      expect(res.code).toBe(
        `<c-card slots="{{ { header: !!((rows && (rows.length > 0 || rows > 0)) && (cols && (cols.length > 0 || cols > 0))) } }}"><block wx:for="{{rows}}" wx:for-item="row"><view wx:for="{{cols}}" slot="header">Cell</view></block></c-card>`,
      );
    });
  });

  describe("9. Dynamic slot='{{...}}' & dynamic text '{{...}}' in loops and conditions", () => {
    it("handles dynamic slot attribute with 2-way and 3-way ternary expressions", () => {
      const ternary2 = `<c-input><view slot="{{isLeft ? 'leading' : 'trailing'}}">Icon</view></c-input>`;
      expect(transformWxmlSlots(ternary2).code).toBe(
        `<c-input slots="{{ { leading: !!(isLeft), trailing: !!(!(isLeft)) } }}"><view slot="{{isLeft ? 'leading' : 'trailing'}}">Icon</view></c-input>`,
      );

      const ternary3 = `<c-card><view slot="{{pos === 'top' ? 'header' : pos === 'bottom' ? 'footer' : 'default'}}">Content</view></c-card>`;
      expect(transformWxmlSlots(ternary3).code).toBe(
        `<c-card slots="{{ { header: !!(pos === 'top'), footer: !!(!(pos === 'top') && (pos === 'bottom')), default: !!(!(pos === 'top') && !(pos === 'bottom')) } }}"><view slot="{{pos === 'top' ? 'header' : pos === 'bottom' ? 'footer' : 'default'}}">Content</view></c-card>`,
      );
    });

    it("handles general dynamic slot='{{activeArea}}' against component manifest", () => {
      const dynamicSrc = `<c-card><view slot="{{activeArea}}">Content</view></c-card>`;
      expect(transformWxmlSlots(dynamicSrc).code).toBe(
        `<c-card slots="{{ { default: !!((activeArea) === 'default'), header: !!((activeArea) === 'header'), footer: !!((activeArea) === 'footer') } }}"><view slot="{{activeArea}}">Content</view></c-card>`,
      );
    });

    it("handles ternary and general dynamic slot='{{...}}' inside child wx:for loops", () => {
      const loopTernary = `<c-input><view wx:for="{{addons}}" wx:if="{{item.enabled}}" slot="{{item.isLeft ? 'leading' : 'trailing'}}">Icon</view></c-input>`;
      const res1 = transformWxmlSlots(loopTernary);
      expect(res1.code).toContain(
        `slots="{{ { leading: !!(__cuiSlots.s0(addons)), trailing: !!(__cuiSlots.s1(addons)) } }}"`,
      );
      const wxs1 = evaluateWxsModule(res1.code);
      expect(wxs1.s0?.([{ enabled: false, isLeft: true }])).toBe(false);
      expect(wxs1.s0?.([{ enabled: true, isLeft: true }])).toBe(true);
      expect(wxs1.s1?.([{ enabled: true, isLeft: false }])).toBe(true);

      const loopGeneral = `<c-card><view wx:for="{{blocks}}" slot="{{item.targetSlot}}">{{item.body}}</view></c-card>`;
      const res2 = transformWxmlSlots(loopGeneral);
      expect(res2.code).toContain(
        `slots="{{ { default: !!(__cuiSlots.s0(blocks)), header: !!(__cuiSlots.s1(blocks)), footer: !!(__cuiSlots.s2(blocks)) } }}"`,
      );
      const wxs2 = evaluateWxsModule(res2.code);
      expect(wxs2.s1?.([{ targetSlot: "header" }])).toBe(true);
      expect(wxs2.s2?.([{ targetSlot: "header" }])).toBe(false);
    });

    it("handles dynamic mustache text interpolation in default slot (top-level, conditional, and inside wx:for)", () => {
      const topLevel = `<c-button>{{buttonText}}</c-button>`;
      expect(transformWxmlSlots(topLevel).code).toBe(
        `<c-button slots="{{ { default: !!((buttonText) !== '' && (buttonText) !== null && (buttonText) !== undefined) } }}">{{buttonText}}</c-button>`,
      );

      const conditionalText = `<c-button><block wx:if="{{showLabel}}">{{buttonText}}</block></c-button>`;
      expect(transformWxmlSlots(conditionalText).code).toBe(
        `<c-button slots="{{ { default: !!(showLabel && ((buttonText) !== '' && (buttonText) !== null && (buttonText) !== undefined)) } }}"><block wx:if="{{showLabel}}">{{buttonText}}</block></c-button>`,
      );

      const loopText = `<c-button><block wx:for="{{labels}}">{{item.text}}</block></c-button>`;
      const loopRes = transformWxmlSlots(loopText);
      expect(loopRes.code).toContain(
        `slots="{{ { default: !!(__cuiSlots.s0(labels)) } }}"`,
      );
      const wxs = evaluateWxsModule(loopRes.code);
      expect(wxs.s0?.([{ text: "" }, { text: null }])).toBe(false);
      expect(wxs.s0?.([{ text: "" }, { text: "OK" }])).toBe(true);
    });
  });

  describe("10. <slot> forwarding, nested components, existing slots merging & idempotency", () => {
    it("handles static, conditional, and dynamic <slot> forwarding inside component templates", () => {
      const src = `<c-accordion-item><slot name="leading-{{item.value}}" slot="leading" /><slot wx:if="{{allowBody}}" name="{{item.value}}" /></c-accordion-item>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-accordion-item slots="{{ { leading: !!(slots && slots['leading-' + (item.value)]), default: !!(allowBody && (slots && slots[item.value])) } }}"><slot name="leading-{{item.value}}" slot="leading" /><slot wx:if="{{allowBody}}" name="{{item.value}}" /></c-accordion-item>`,
      );
    });

    it("handles <slot> forwarding inside a child <block wx:for> loop", () => {
      const src = `<c-accordion-item><block wx:for="{{subItems}}"><slot name="lead-{{item.id}}" slot="leading" /></block></c-accordion-item>`;
      const res = transformWxmlSlots(src);
      expect(res.code).toContain(
        `slots="{{ { leading: !!(__cuiSlots.s0(subItems, slots)) } }}"`,
      );
      const wxs = evaluateWxsModule(res.code);
      expect(wxs.s0?.([{ id: "a" }], { "lead-b": true })).toBe(false);
      expect(wxs.s0?.([{ id: "a" }, { id: "b" }], { "lead-b": true })).toBe(true);
    });

    it("merges user-provided slots attribute with detected slots", () => {
      const src = `<c-input slots="{{ { customSlot: true } }}"><view slot="leading">L</view></c-input>`;
      expect(transformWxmlSlots(src).code).toBe(
        `<c-input slots="{{ { customSlot: true, leading: true } }}"><view slot="leading">L</view></c-input>`,
      );
    });

    it("handles nested <c-*> components and is idempotent on repeated runs (with and without WXS)", () => {
      const src1 = `<c-card><c-input slot="header"><view slot="leading">Icon</view></c-input></c-card>`;
      const first1 = transformWxmlSlots(src1);
      expect(first1.code).toBe(
        `<c-card slots="{{ { header: true } }}"><c-input slot="header" slots="{{ { leading: true } }}"><view slot="leading">Icon</view></c-input></c-card>`,
      );
      const second1 = transformWxmlSlots(first1.code);
      expect(second1.hasChanges).toBe(false);
      expect(second1.code).toBe(first1.code);

      const src2 = `<c-card><c-input slot="header"><view wx:for="{{addons}}" wx:if="{{item.lead}}" slot="leading">Icon</view></c-input></c-card>`;
      const first2 = transformWxmlSlots(src2);
      expect(first2.hasChanges).toBe(true);
      expect(first2.code).toContain(`<wxs module="__cuiSlots">`);
      const second2 = transformWxmlSlots(first2.code);
      expect(second2.hasChanges).toBe(false);
      expect(second2.code).toBe(first2.code);
    });
  });
});
