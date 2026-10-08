import { expectTypeOf, it } from "vitest";
import { setupComputed } from "../src/behaviors/computed-behavior";

// Mock WeChat Component instance
const fakeComponent = {
  data: {
    loading: false,
    text: "hello",
  },
  methods: {
    onClick() {
      // should have access to data
      expectTypeOf(this.data.loading).toBeBoolean();
    },
  },
  setData(data: Record<string, any>) {},
};

it("should strongly type computed getters and their this context", () => {
  setupComputed(fakeComponent, {
    isSubmitDisabled() {
      // Should know that `loading` is a boolean from `data`
      expectTypeOf(this.loading).toBeBoolean();

      // Should not allow accessing arbitrary keys without 'any' fallback logic,
      // but `loading` is strictly known.
      return this.loading === true;
    },
    greeting() {
      expectTypeOf(this.text).toBeString();
      return this.text + " world";
    },
  });
});
