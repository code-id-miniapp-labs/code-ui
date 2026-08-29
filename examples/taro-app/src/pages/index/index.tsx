import { useState } from 'react'
import { View, Text, Switch } from '@tarojs/components'
import { setConfig } from '@code-ui/components'
import './index.scss'

type Placement = 'bottom' | 'top' | 'left' | 'right'
type ThemeName = 'indigo' | 'emerald' | 'sunset'

export default function Index() {
  const [openPrebuilt, setOpenPrebuilt] = useState(false)
  const [openCustomDrawer, setOpenCustomDrawer] = useState(false)
  const [activeTheme, setActiveTheme] = useState<ThemeName>('indigo')
  const [placement, setPlacement] = useState<Placement>('bottom')
  const [closeOnBackdrop, setCloseOnBackdrop] = useState(true)
  const [dismissible, setDismissible] = useState(true)
  const [threshold, setThreshold] = useState(80)
  const [asyncLoading, setAsyncLoading] = useState(false)

  const placements: Placement[] = ['bottom', 'top', 'left', 'right']

  const handleAsyncSubmit = () => {
    setAsyncLoading(true)
    setTimeout(() => {
      setAsyncLoading(false)
    }, 2000)
  }

  const handleThemeChange = (theme: ThemeName) => {
    setActiveTheme(theme)
    if (theme === 'emerald') {
      setConfig({
        components: {
          button: {
            variants: {
              variant: {
                primary: {
                  root: 'custom-neon-btn',
                  label: 'custom-neon-label',
                },
              },
            },
          },
        },
      })
    } else if (theme === 'sunset') {
      setConfig({
        components: {
          button: {
            variants: {
              variant: {
                primary: {
                  root: 'custom-sunset-btn',
                  label: 'custom-sunset-label',
                },
              },
            },
          },
        },
      })

    } else {
      setConfig({
        components: {
          button: {
            variants: {
              variant: {
                primary: {
                  root: '',
                  label: '',
                },
              },
            },
          },
        },
      })
    }
  }


  return (
    <View className='page-container'>
      {/* Header / Hero */}
      <View className='hero-section'>
        <View className='hero-badge'>
          <Text className='hero-badge-text'>@code-ui Ecosystem</Text>
        </View>
        <Text className='hero-title'>Native WeChat MiniApp</Text>
        <Text className='hero-subtitle'>
          3 Installation Models: Headless FSM, Prebuilt Library, and shadcn-style CLI
        </Text>
      </View>

        {/* Configuration Controls */}
      <View className='config-card'>
        <Text className='card-title'>Drawer Settings</Text>
        <Text className='switch-label' style={{ marginBottom: '12rpx', display: 'block' }}>Placement</Text>
        <View className='placement-grid'>
          {placements.map((p) => (
            <View
              key={p}
              className={`placement-pill ${placement === p ? 'placement-pill--active' : ''}`}
              onClick={() => {
                setPlacement(p)
              }}
            >
              <Text className='placement-text'>{p}</Text>
            </View>
          ))}
        </View>

        <View className='switch-row' style={{ marginTop: '20rpx' }}>
          <Text className='switch-label'>Close on Backdrop Tap</Text>
          <Switch
            checked={closeOnBackdrop}
            color='#6366f1'
            onChange={(e) => setCloseOnBackdrop(e.detail.value)}
          />
        </View>

        <View className='switch-row'>
          <Text className='switch-label'>Swipe to Dismiss (Gesture)</Text>
          <Switch
            checked={dismissible}
            color='#6366f1'
            onChange={(e) => setDismissible(e.detail.value)}
          />
        </View>

        <View className='threshold-row'>
          <Text className='switch-label'>Swipe Threshold ({threshold}px)</Text>
          <View className='threshold-options'>
            {[40, 80, 120].map((val) => (
              <View
                key={val}
                className={`threshold-btn ${threshold === val ? 'threshold-btn--active' : ''}`}
                onClick={() => setThreshold(val)}
              >
                <Text className='threshold-text'>{val}px</Text>
              </View>
            ))}
          </View>
        </View>
      </View>


      {/* MODEL 2: Prebuilt Package (@code-ui/components) */}
      <View className='config-card'>
        <Text className='card-title'>Model 2: Prebuilt Package (@code-ui/components)</Text>
        <Text className='model-desc'>
          Zero-configuration components. Import directly from <Text style={{ color: '#818cf8' }}>@code-ui/components/drawer</Text>.
        </Text>
        <View className='button-group' style={{ marginTop: '16rpx' }}>
          <cui-button
            variant='secondary'
            onClick={() => setOpenPrebuilt(true)}
          >
            Open Prebuilt Drawer
          </cui-button>
        </View>
      </View>

      {/* MODEL 3: shadcn-style CLI (src/components/ui/button) */}
      <View className='config-card'>
        <Text className='card-title'>Model 3: shadcn-style CLI (code-ui add button)</Text>
        <Text className='model-desc'>
          Source code copied directly to <Text style={{ color: '#818cf8' }}>src/components/ui/button</Text>. Fully editable locally.
        </Text>
        <View className='button-group' style={{ marginTop: '16rpx' }}>
          <cui-button
            variant='primary'
            loadingAuto
            onClick={handleAsyncSubmit}
          >
            {asyncLoading ? 'Resolving...' : 'Auto-Loading Button (2s)'}
          </cui-button>
          <cui-button variant='outline'>
            Outline Variant
          </cui-button>
          <cui-button variant='danger'>
            Danger Variant
          </cui-button>
        </View>
      </View>

      {/* MODEL 4: High-Customization Styling Engine (setConfig + ui Prop) */}
      <View className='config-card'>
        <Text className='card-title'>Model 4: Styling Engine (setConfig + ui Prop)</Text>
        <Text className='model-desc'>
          Fine-grained control over anatomy slots via <Text style={{ color: '#818cf8' }}>ui</Text> prop + reactive global theming with <Text style={{ color: '#818cf8' }}>setConfig()</Text>.
        </Text>
        
        {/* Instance UI prop override */}
        <View style={{ marginTop: '16rpx', marginBottom: '20rpx' }}>
          <Text className='switch-label' style={{ marginBottom: '12rpx', display: 'block', fontSize: '24rpx', color: '#94a3b8' }}>
            1. Instance Slot Override via ui Prop:
          </Text>
          <View className='button-group'>
            <cui-button
              ui={{
                root: 'custom-neon-btn',
                label: 'custom-neon-label',
              }}
              onClick={() => setOpenCustomDrawer(true)}
            >
              Neon Glow UI Button & Drawer
            </cui-button>
          </View>
        </View>

        {/* Global setConfig dynamic theme switcher */}
        <View style={{ borderTop: '1rpx solid rgba(255, 255, 255, 0.08)', paddingTop: '16rpx' }}>
          <Text className='switch-label' style={{ display: 'block', fontSize: '24rpx', color: '#94a3b8' }}>
            2. Reactive Runtime setConfig (alien-signals):
          </Text>
          <View className='theme-pill-grid'>
            <View
              className={`theme-pill ${activeTheme === 'indigo' ? 'theme-pill--active' : ''}`}
              onClick={() => handleThemeChange('indigo')}
            >
              <Text className='theme-pill-text'>Indigo (Default)</Text>
            </View>
            <View
              className={`theme-pill ${activeTheme === 'emerald' ? 'theme-pill--active' : ''}`}
              onClick={() => handleThemeChange('emerald')}
            >
              <Text className='theme-pill-text'>Emerald Mint</Text>
            </View>
            <View
              className={`theme-pill ${activeTheme === 'sunset' ? 'theme-pill--active' : ''}`}
              onClick={() => handleThemeChange('sunset')}
            >
              <Text className='theme-pill-text'>Sunset Rose</Text>
            </View>
          </View>
        </View>
      </View>


    
     

      {/* Prebuilt Drawer (Model 2) */}
      <cui-drawer
        open={openPrebuilt}
        placement='bottom'
        closeOnBackdropClick={true}
        dismissible={true}
        threshold={120}
        onClose={() => setOpenPrebuilt(false)}
        onBackdropTap={console.log}
        onCloseTriggerTap={console.log}
      >
        <View slot='header'>
          <Text className='drawer-title'>Model 2: Prebuilt Drawer</Text>
        </View>

        <View className='drawer-content-inner'>
          <Text className='drawer-p'>
            This drawer comes ready-to-use straight out of `@code-ui/components/drawer`. No local template files needed!
          </Text>
        </View>

        <View slot='footer' className='drawer-footer-row'>
          <cui-button variant='primary' onClick={() => setOpenPrebuilt(false)}>
            Close Prebuilt
          </cui-button>
        </View>
      </cui-drawer>

      {/* Customized Drawer (Model 4 with ui Prop) */}
      <cui-drawer
        open={openCustomDrawer}
        placement='bottom'
        closeOnBackdropClick={closeOnBackdrop}
        dismissible={dismissible}
        threshold={120}
        ui={{
          backdrop: 'custom-glass-drawer-backdrop',
          content: 'custom-glass-drawer-content',
          header: 'custom-glass-drawer-header',
        }}
        onClose={() => setOpenCustomDrawer(false)}
      >
        <View slot='header'>
          <Text className='drawer-title' style={{ color: '#a5b4fc' }}>
            Model 4: Custom UI Drawer
          </Text>
        </View>

        <View className='drawer-content-inner'>
          <Text className='drawer-p' style={{ color: '#cbd5e1' }}>
            This drawer is styled using the <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>ui prop</Text> with custom glassmorphism backdrop, indigo gradient sheet, and accent border.
          </Text>
        </View>

        <View slot='footer' className='drawer-footer-row'>
          <cui-button
            ui={{
              root: 'custom-neon-btn',
              label: 'custom-neon-label',
            }}
            onClick={() => setOpenCustomDrawer(false)}
          >
            Done
          </cui-button>
        </View>
      </cui-drawer>
    </View>
  )
}

