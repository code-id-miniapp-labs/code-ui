export {
  createMachineBehavior,
  createProperties,
  cuiFormParentBehavior,
  cuiFormFieldBehavior,
  cuiFormFieldWrapperBehavior,
  cuiRadioGroupBehavior,
  cuiRadioGroupParentBehavior,
  cuiRadioItemBehavior,
  wxButtonBehavior,
  computedBehavior,
  createComponentOptions,
} from "@code-ui/miniapp";

export function getApi<T = any>(instance: any, key: string): T | undefined {
  return instance.__codeUiApi ?? instance.data[key];
}
