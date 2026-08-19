import { useState } from 'react'
import {  View, Text, Button, Switch } from '@tarojs/components'
import './index.scss'

type Placement = 'bottom' | 'top' | 'left' | 'right'

export default function Index() {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement>('bottom')
  const [closeOnBackdrop, setCloseOnBackdrop] = useState(true)
  const [dismissible, setDismissible] = useState(true)
  const [threshold, setThreshold] = useState(80)

  const placements: Placement[] = ['bottom', 'top', 'left', 'right']

  return (
    <View className='page-container'>
      {/* Header / Hero */}
      <View className='hero-section'>
        <View className='hero-badge'>
          <Text className='hero-badge-text'>@code-ui / miniapp</Text>
        </View>
        <Text className='hero-title'>Native WeChat Drawer</Text>
        <Text className='hero-subtitle'>
          High-performance hybrid component powered by FSM + alien-signals
        </Text>
      </View>

      {/* Main Trigger */}
      <View className='action-card'>
        <Button
          className='btn-open-drawer'
          onClick={() => {
            setOpen((prev) => !prev)
          }}
        >
          <Text className='btn-text'>Open Native Drawer ({placement})</Text>
        </Button>
      </View>

      {/* Configuration Controls */}
      <View className='config-card'>
        <Text className='card-title'>Placement</Text>
        <View className='placement-grid'>
          {placements.map((p) => (
            <View
              key={p}
              className={`placement-pill ${placement === p ? 'placement-pill--active' : ''}`}
              onClick={() => {
                setPlacement(p)
                setOpen(true)
              }}
            >
              <Text className='placement-text'>{p}</Text>
            </View>
          ))}
        </View>

        <Text className='card-title card-title--spaced'>Behavior Settings</Text>
        <View className='switch-row'>
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

      {/* Features Overview */}
      <View className='info-card'>
        <Text className='info-card-title'>⚡ Architecture Highlights</Text>
        <View className='feature-item'>
          <Text className='feature-dot'>•</Text>
          <Text className='feature-desc'>
            <Text className='feature-bold'>Native WXML / WXSS:</Text> Zero React reconciliation inside the drawer. Renders directly via WeChat MiniProgram runtime.
          </Text>
        </View>
        <View className='feature-item'>
          <Text className='feature-dot'>•</Text>
          <Text className='feature-desc'>
            <Text className='feature-bold'>alien-signals Engine:</Text> Fine-grained signal reactivity with automatic batched `setData`.
          </Text>
        </View>
        <View className='feature-item'>
          <Text className='feature-dot'>•</Text>
          <Text className='feature-desc'>
            <Text className='feature-bold'>60fps Gestures:</Text> Direct touch tracking with instant swipe-to-close transitions.
          </Text>
        </View>
      </View>

      {/* Native WeChat MiniProgram Drawer Component */}
      <native-drawer
        open={open}
        placement={placement}
        closeOnBackdropClick={closeOnBackdrop}
        dismissible={dismissible}
        threshold={threshold}
        onClose={() => setOpen(false)}
      >
        <View slot='header'>
          <Text className='drawer-title'>Native Drawer ({placement})</Text>
        </View>

        <View className='drawer-content-inner'>
          <Text className='drawer-p'>
            This drawer is rendered by a native WeChat MiniProgram Custom Component (`createMachineBehavior` + `drawerMachine`).
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

          {dismissible && (
            <View className='swipe-hint'>
              <Text className='swipe-hint-text'>
                👇 Try swiping towards the screen edge to dismiss!
              </Text>
            </View>
          )}
        </View>

        <View slot='footer' className='drawer-footer-row'>
          <Button className='btn-cancel' onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button className='btn-confirm' onClick={() => setOpen(false)}>
            Got it
          </Button>
        </View>
      </native-drawer>
    </View>
  )
}
