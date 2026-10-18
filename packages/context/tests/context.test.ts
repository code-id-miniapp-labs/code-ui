import { describe, it, expect, vi } from "vitest";
import {
  createInjectionKey,
  provide,
  inject,
  onProvide,
  resolveContextRequest,
  CONTEXT_REQUEST_EVENT,
} from "../src";

function createMockComponent(owner?: any) {
  const listeners: Record<string, ((e: any) => void)[]> = {};
  return {
    selectOwnerComponent: () => owner ?? null,
    on(event: string, handler: (e: any) => void) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    },
    triggerEvent(name: string, detail: any, options?: { bubbles?: boolean; composed?: boolean }) {
      const event = { detail, target: this, currentTarget: this };
      if (listeners[name]) {
        for (const handler of listeners[name]) {
          handler(event);
        }
      }
    },
  };
}

describe("@code-ui/context - cui-context-request handshake", () => {
  const TestKey = createInjectionKey<string>("test-key");

  it("resolves context synchronously when parent has already called provide", () => {
    const parent = createMockComponent();
    const child = createMockComponent(parent);

    // Parent catches bubbling context requests
    child.on(CONTEXT_REQUEST_EVENT, (e) => {
      resolveContextRequest(parent, e);
    });

    provide(parent, TestKey, "hello-from-parent");

    const result = inject(child, TestKey);
    expect(result).toBe("hello-from-parent");
  });

  it("isolates two parents on the same Page via cui-context-request without ID or form prop", () => {
    // Both parents and children share the same Page as template owner
    const sharedPage = createMockComponent();
    const formA = createMockComponent(sharedPage);
    const formB = createMockComponent(sharedPage);
    const inputA = createMockComponent(sharedPage);
    const inputB = createMockComponent(sharedPage);

    // inputA bubbles up into formA's slot
    inputA.on(CONTEXT_REQUEST_EVENT, (e) => {
      resolveContextRequest(formA, e);
    });

    // inputB bubbles up into formB's slot
    inputB.on(CONTEXT_REQUEST_EVENT, (e) => {
      resolveContextRequest(formB, e);
    });

    provide(formA, TestKey, "form-a-bus");
    provide(formB, TestKey, "form-b-bus");

    expect(inject(inputA, TestKey)).toBe("form-a-bus");
    expect(inject(inputB, TestKey)).toBe("form-b-bus");
  });

  it("handles child attached before parent: links slot parent and receives value via onProvide", () => {
    const form = createMockComponent();
    const input = createMockComponent();

    // Input bubbles request before form has called provide
    input.on(CONTEXT_REQUEST_EVENT, (e) => {
      resolveContextRequest(form, e);
    });

    const received: string[] = [];
    onProvide(input, TestKey, (val) => {
      received.push(val);
    });

    expect(received.length).toBe(0);

    // Form now mounts and provides value
    provide(form, TestKey, "late-form-bus");

    expect(received.length).toBe(1);
    expect(received[0]).toBe("late-form-bus");
  });
});
