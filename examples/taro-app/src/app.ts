import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { setConfig } from '@code-ui/components'

import './app.scss'

// Initialize Code-UI global configuration
setConfig({
  prefix: 'cui',
  components: {
    button: {
      defaultProps: {
        variant: 'primary',
        size: 'md',
      },
      ui: {
        root: 'cui-btn-global',
      },
    },
    drawer: {
      ui: {
        content: 'cui-drawer-global-content',
      },
    },
  },
})

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched with @code-ui setConfig initialized.')
  })

  return children
}

export default App

