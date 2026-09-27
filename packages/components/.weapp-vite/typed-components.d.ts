/* eslint-disable */
// biome-ignore lint: disable
// oxlint-disable
// ------
// 由 weapp-vite 自动生成，请勿编辑。
declare module 'weapp-vite/typed-components' {
  export interface ComponentProps {
  }
  export type ComponentPropName = keyof ComponentProps;
  export type ComponentProp<Name extends string> = Name extends ComponentPropName ? ComponentProps[Name] : object;
  export const componentProps: ComponentProps;
}
