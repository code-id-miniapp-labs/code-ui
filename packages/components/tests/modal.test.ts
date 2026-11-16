import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { modalTheme as createModalTheme } from "@code-ui/core";
import {
  COMPONENT_SLOTS_MANIFEST,
  transformWxmlSlots,
} from "@code-ui/compiler";
import { resolveSlots } from "../src/utils/ui";
import { escapeClass, tv } from "../src/utils/variants";

const modalTheme = tv(createModalTheme());
const MODAL_RUNTIME_DIR = resolve(__dirname, "../src/runtime/modal");

describe("modalTheme runtime resolution (@code-ui/components)", () => {
  it("resolves closed iOS card classes by default", () => {
    const slots = resolveSlots(
      modalTheme({
        open: false,
      }),
      {},
      "",
    );

    expect(slots.root).toContain("fixed inset-0");
    expect(slots.root).toContain("overflow-hidden");
    expect(slots.overlay).toContain("opacity-0 pointer-events-none");
    expect(slots.overlay).toContain("backdrop-blur-md");
    expect(slots.overlay).toContain(escapeClass("bg-black/35"));
    expect(slots.overlay).not.toContain("cui-modal-overlay-enter");
    expect(slots.content).toContain("rounded-xl");
    expect(slots.content).toContain("opacity-0");
    expect(slots.content).toContain("scale-95");
    expect(slots.content).not.toContain("cui-modal-content-enter");
    expect(slots.closeTrigger).toContain("rounded-full");
    expect(slots.closeTrigger).toContain("bg-elevated");
  });

  it("resolves open iOS card modal classes with entrance animations", () => {
    const slots = resolveSlots(
      modalTheme({
        open: true,
        size: "md",
      }),
      {},
      "",
    );

    expect(slots.overlay).toContain("opacity-100 pointer-events-auto");
    expect(slots.overlay).toContain("cui-modal-overlay-enter");
    expect(slots.content).toContain("opacity-100");
    expect(slots.content).toContain("scale-100");
    expect(slots.content).toContain("cui-modal-content-enter");
    expect(slots.content).toContain("max-w-md");
    expect(slots.content).toContain(escapeClass("max-h-[85vh]"));
    expect(slots.header).toContain("pr-12");
    expect(slots.header).toContain("border-b border-muted");
  });

  it("resolves fullscreen mode with safe-area insets and slide-up entrance", () => {
    const slots = resolveSlots(
      modalTheme({
        open: true,
        fullscreen: true,
        hasFooter: false,
      }),
      {},
      "",
    );

    expect(slots.container).toContain("p-0");
    expect(slots.container).not.toContain("p-5");
    expect(slots.content).toContain("w-full h-full max-w-none max-h-none");
    expect(slots.content).toContain("rounded-none");
    expect(slots.content).not.toContain("rounded-3xl");
    expect(slots.content).toContain("border-0 shadow-none");
    expect(slots.content).toContain("cui-modal-fullscreen-enter");
    expect(slots.content).not.toContain("cui-modal-content-enter");
    expect(slots.header).toContain("env_psafe-area-inset-top_P");
    expect(slots.closeTrigger).toContain("env_psafe-area-inset-top_P");
    expect(slots.body).toContain("env_psafe-area-inset-bottom_P");
  });

  it("resolves scrollable overlay mode without height clipping", () => {
    const slots = resolveSlots(
      modalTheme({
        open: true,
        scrollable: true,
      }),
      {},
      "",
    );

    expect(slots.root).toContain("overflow-y-auto");
    expect(slots.root).not.toContain("overflow-hidden");
    expect(slots.container).toContain("min-h-full");
    expect(slots.container).toContain("pointer-events-auto");
    expect(slots.content).toContain("max-h-none");
    expect(slots.body).toContain("flex-none");
    expect(slots.body).not.toContain("flex-1");
  });

  it("supports centered alert-style composition via ui slot overrides", () => {
    const slots = resolveSlots(
      modalTheme({
        open: true,
        size: "xs",
        closable: true,
      }),
      {
        header: "border-b-0 px-11 pt-6 pb-2 items-center text-center",
        wrapper: "items-center text-center gap-1.5",
        title: "text-center",
        description: "text-center",
        body: "pt-1 pb-5 text-center text-muted",
        footer: "justify-center",
      },
      "",
    );

    expect(slots.content).toContain("max-w-xs");
    expect(slots.header).toContain("items-center text-center");
    expect(slots.header).toContain("px-11");
    expect(slots.header).toContain("border-b-0");
    expect(slots.title).toContain("text-center");
    expect(slots.description).toContain("text-center");
    expect(slots.body).toContain("text-center");
    expect(slots.footer).toContain("justify-center");
  });

  it("omits enter animations and transition classes when transition is false", () => {
    const slots = resolveSlots(
      modalTheme({
        open: true,
        transition: false,
      }),
      {},
      "",
    );

    expect(slots.overlay).toContain("transition-none");
    expect(slots.overlay).not.toContain("cui-modal-overlay-enter");
    expect(slots.content).toContain("transition-none");
    expect(slots.content).not.toContain("cui-modal-content-enter");
    expect(slots.content).toContain("opacity-100 scale-100");
  });

  it("avoids double header/footer borders when body is absent", () => {
    const slots = resolveSlots(
      modalTheme({
        open: true,
        hasBody: false,
        hasFooter: true,
        closable: false,
      }),
      {},
      "",
    );

    expect(slots.header).not.toContain("border-b");
    expect(slots.header).not.toContain("pr-12");
    expect(slots.footer).toContain("border-t border-muted");
  });

  it("supports custom slot overrides via ui and className", () => {
    const slots = resolveSlots(
      modalTheme({ open: true }),
      {
        overlay: "bg-black/60",
        content: "rounded-xl custom-modal-card",
      },
      "custom-root-class",
    );

    expect(slots.root).toContain("custom-root-class");
    expect(slots.overlay).toContain(escapeClass("bg-black/60"));
    expect(slots.overlay).not.toContain(escapeClass("bg-black/35"));
    expect(slots.content).toContain("rounded-xl");
    expect(slots.content).not.toContain("rounded-3xl");
    expect(slots.content).toContain("custom-modal-card");
  });
});

describe("modal WXML & compiler slot manifest", () => {
  it("exposes all expected modal slots without duplicating <slot> nodes", () => {
    const wxml = readFileSync(resolve(MODAL_RUNTIME_DIR, "index.wxml"), "utf8");

    expect(wxml).toContain('aria-role="dialog"');
    expect(wxml).toContain('aria-modal="{{true}}"');
    expect(wxml).toContain('data-scope="modal"');
    expect(wxml).toContain('<slot name="trigger"');
    expect(wxml).toContain('<slot wx:if="{{slots.content}}" name="content"');
    expect(wxml).toContain('<slot wx:if="{{slots.header}}" name="header"');
    expect(wxml).toContain('<slot wx:else name="title"');
    expect(wxml).toContain('<slot wx:else name="description"');
    expect(wxml).toContain('<slot wx:if="{{slots.body}}" name="body"');
    expect(wxml).toContain("<slot wx:else />");
    expect(wxml).toContain('<slot name="close"');
    expect(wxml).toContain('<slot name="footer"');

    // Every slot name appears exactly once
    const slotMatches = wxml.match(/<slot\b[^>]*>/g) ?? [];
    expect(slotMatches).toHaveLength(9);

    expect(COMPONENT_SLOTS_MANIFEST.modal).toEqual([
      "default",
      "trigger",
      "content",
      "header",
      "title",
      "description",
      "close",
      "body",
      "footer",
    ]);
  });

  it("detects modal slots accurately at compile time", () => {
    const template = `
      <c-modal open="{{open}}" title="Edit Profile">
        <c-button slot="trigger" label="Open" />
        <view slot="body">Profile Form</view>
        <view slot="footer"><c-button label="Save" /></view>
      </c-modal>
    `;
    const result = transformWxmlSlots(template);
    expect(result.hasChanges).toBe(true);
    expect(result.code).toContain("trigger: true");
    expect(result.code).toContain("body: true");
    expect(result.code).toContain("footer: true");
  });
});
