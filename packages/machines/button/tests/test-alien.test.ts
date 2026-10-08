import { describe, it } from "vitest";
import { effect, signal, computed } from "alien-signals";

describe("Alien Signals test", () => {
  it("runs effect when computed reads signal", () => {
    const state = signal("idle");

    const cache = new Map();

    const machine = {
      get service() {
        return {
          state: state(),
          computed: (key: string) => {
            let getter = cache.get(key);
            if (!getter) {
              getter = computed(() => state() === "loading" || state() === "success");
              cache.set(key, getter);
            }
            return getter();
          }
        };
      }
    };

    effect(() => {
      console.log("EFFECT RUN, state=", machine.service.state, " computed=", machine.service.computed("isLoading"));
    });

    console.log("setting loading");
    state("loading");
  });
});
