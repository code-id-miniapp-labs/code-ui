export {
  createMachineBehavior,
  createProperties,
} from "@code-id-labs/miniapp/behavior";
export type { MachinePlugin } from "@code-id-labs/miniapp";

export function getApi<T = any>(instance: any, key: string): T | undefined {
  return instance.__codeUiApi ?? instance.data[key];
}
