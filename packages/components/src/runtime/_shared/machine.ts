export {
  createMachineBehavior,
  createProperties,
} from "@code-ui/miniapp/behavior";
export type { MachinePlugin } from "@code-ui/miniapp";

export function getApi<T = any>(instance: any, key: string): T | undefined {
  return instance.__codeUiApi ?? instance.data[key];
}
