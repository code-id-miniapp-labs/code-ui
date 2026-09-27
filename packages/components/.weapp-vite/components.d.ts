/* eslint-disable */
// biome-ignore lint: disable
// oxlint-disable
// ------
// 由 weapp-vite autoImportComponents 生成
import type { ComponentOptionsMixin, DefineComponent, PublicProps } from 'wevu'
import type { WevuJsxHostAttributes } from 'wevu/jsx-runtime'
import type { ComponentProp } from 'weapp-vite/typed-components'

export {}

type WevuComponent<Props = object> = new (...args: never[]) => InstanceType<DefineComponent<{}, {}, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, Props & WevuJsxHostAttributes, {}>>
type __WevuComponentProps<TComponent> = TComponent extends new (...args: never[]) => { $props: infer Props } ? Props : TComponent extends (props: infer Props, ...args: never[]) => unknown ? Props : object
type __WevuComponentImport<TModule, Fallback = {}> = 0 extends 1 & TModule ? Fallback : TModule extends { default: infer Component } ? Component extends new (...args: infer Args) => infer Instance ? new (...args: Args) => Omit<Instance, '$props'> & { $props: __WevuComponentProps<Component> & __WevuComponentProps<Fallback> } : Fallback : Fallback

declare module 'vue' {
  export interface GlobalComponents {
  }
}

declare module 'wevu/jsx-runtime' {
  export interface WevuJsxGlobalComponents {
  }
}

// 用于 TSX 支持
declare global {
}
