import type { BindableRefs, MachineSchema } from "./types";

export function createRefs<T extends MachineSchema>(
  initial: T["refs"] = {},
): BindableRefs<T> {
  const store: Record<string, any> = { ...initial };
  return {
    get: (key: any) => store[key as string],
    set: (key: any, value: any) => {
      store[key as string] = value;
    },
  };
}
