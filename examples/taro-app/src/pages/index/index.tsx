import { useState } from 'react'
import { View, Text, Switch } from '@tarojs/components'
import './index.scss'

type Placement = 'bottom' | 'top' | 'left' | 'right'

export default function Index() {
  const [openHeadless, setOpenHeadless] = useState(false)
  const [openPrebuilt, setOpenPrebuilt] = useState(false)
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

      {/* Model Showcase Cards */}

      {/* MODEL 1: Headless Machine + Adapter */}
      <View className='config-card'>
        <Text className='card-title'>Model 1: Headless Machine (@code-ui/drawer)</Text>
        <Text className='model-desc'>
          Pure state machine + alien-signals adapter. You write 100% custom WXML / WXSS.
        </Text>
        <View className='action-card' style={{ marginTop: '16rpx', marginBottom: '0' }}>
          <cui-button
            variant='primary'
            onClick={() => setOpenHeadless(true)}
          >
            Open Headless Drawer ({placement})
          </cui-button>
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
                setOpenHeadless(true)
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

      {/* Headless Drawer (Model 1) */}
      <native-drawer
        open={openHeadless}
        placement={placement}
        closeOnBackdropClick={closeOnBackdrop}
        dismissible={dismissible}
        threshold={threshold}
        onClose={() => setOpenHeadless(false)}
      >
        <View slot='header'>
          <Text className='drawer-title'>Model 1: Headless Drawer ({placement})</Text>
        </View>

        <View className='drawer-content-inner'>
          <Text className='drawer-p'>
            This drawer is rendered via custom template WXML in your project connected to `@code-ui/drawer`.
          </Text>

          <View className='drawer-stat-grid'>
            <View className='stat-box'>
              <Text className='stat-label'>Placement</Text>
              <Text className='stat-val'>{placement}</Text>
            </View>
            <View className='stat-box'>
              <Text className='stat-label'>Dismissible</Text>
              <Text className='stat-val'>{dismissible ? 'Yes' : 'No'}</Text>
            </View>
            <View className='stat-box'>
              <Text className='stat-label'>Threshold</Text>
              <Text className='stat-val'>{threshold}px</Text>
            </View>
          </View>
        </View>

        <View slot='footer' className='drawer-footer-row'>
          <cui-button variant='secondary' onClick={() => setOpenHeadless(false)}>
            Close
          </cui-button>
          <cui-button variant='primary' onClick={() => setOpenHeadless(false)}>
            Got it
          </cui-button>
        </View>
      </native-drawer>

      {/* Prebuilt Drawer (Model 2) */}
      <cui-drawer
        open={openPrebuilt}
        placement='bottom'
        closeOnBackdropClick={true}
        dismissible={true}
        threshold={120}
        onClose={() => setOpenPrebuilt(false)}
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
    </View>
  )
}
