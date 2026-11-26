export {
  createMachineBehavior,
  createProperties,
} from "@code-id-labs/miniapp/behavior";
export type { MachinePlugin } from "@code-id-labs/miniapp";

export function getApi<T = any>(instance: any, key: string): T | undefined {
  if (instance?.__codeUiDeferred) {
    instance.__codeUiEnsureStarted?.();
  }
  return instance?.__codeUiApi ?? instance?.data?.[key];
}
