import { accordionItemMachine } from '@code-id-labs/accordion-item'
import { actionSheetMachine } from '@code-id-labs/action-sheet'
import { bannerMachine } from '@code-id-labs/banner'
import { buttonMachine } from '@code-id-labs/button'
import { checkboxMachine } from '@code-id-labs/checkbox'
import { drawerMachine } from '@code-id-labs/drawer'
import { fileUploadMachine } from '@code-id-labs/file-upload'
import { formMachine } from '@code-id-labs/form'
import { formFieldMachine } from '@code-id-labs/form-field'
import { inputMachine } from '@code-id-labs/input'
import { inputMenuMachine } from '@code-id-labs/input-menu'
import { modalMachine } from '@code-id-labs/modal'
import { pinInputMachine } from '@code-id-labs/pin-input'
import { popoverMachine } from '@code-id-labs/popover'
import { presenceMachine } from '@code-id-labs/presence'
import { pullDownRefreshMachine } from '@code-id-labs/pull-down-refresh'
import { radioMachine } from '@code-id-labs/radio'
import { selectMachine } from '@code-id-labs/select'
import { sliderMachine } from '@code-id-labs/slider'
import { stepperMachine } from '@code-id-labs/stepper'
import { swipeCellMachine } from '@code-id-labs/swipe-cell'
import { switchMachine } from '@code-id-labs/switch'
import { tabsMachine } from '@code-id-labs/tabs'
import { textareaMachine } from '@code-id-labs/textarea'
import { toastMachine } from '@code-id-labs/toast'

export interface MachineTransition {
  event: string
  target?: string
  guard?: string
  actions?: string[]
}

export interface MachineStateNode {
  id: string
  tags?: string[]
  entry?: string[]
  transitions: MachineTransition[]
}

export interface MachineGraph {
  id: string
  title: string
  initial: string
  states: MachineStateNode[]
  globalEvents: string[]
  machine: RawMachine
  booleanProps: Record<string, boolean>
}

interface RawTransition {
  target?: string
  guard?: string | ((...args: unknown[]) => boolean)
  actions?: string[]
}

interface RawStateConfig {
  tags?: string[]
  entry?: string[]
  on?: Record<string, RawTransition | RawTransition[] | undefined>
}

export interface RawMachine {
  props?: (params: { props: Record<string, unknown>, scope: Record<string, unknown> }) => Record<string, unknown>
  initialState?: string | ((...args: unknown[]) => string)
  on?: Record<string, RawTransition | RawTransition[] | undefined>
  states?: Record<string, RawStateConfig>
}

const IGNORED_BOOL_PROPS = new Set([
  'id',
  'dir',
  'debug'
])

function extractBooleanProps(machine: RawMachine): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  if (typeof machine.props !== 'function') return result
  try {
    const defaults = machine.props({
      props: {},
      scope: { id: 'preview', ids: {} }
    })
    if (defaults && typeof defaults === 'object') {
      for (const [key, val] of Object.entries(defaults)) {
        if (
          typeof val === 'boolean'
          && !IGNORED_BOOL_PROPS.has(key)
          && !key.startsWith('default')
        ) {
          result[key] = val
        }
      }
    }
  } catch {
    // Ignore machines whose props fn expects extra context
  }
  return result
}

function extractMachineGraph(
  id: string,
  title: string,
  machine: RawMachine,
  defaultInitial?: string
): MachineGraph {
  const statesRecord = machine.states ?? {}
  const stateIds = Object.keys(statesRecord)
  const initial = typeof machine.initialState === 'string'
    ? machine.initialState
    : (defaultInitial ?? stateIds[0] ?? 'idle')

  const rootOn = machine.on ?? {}
  const rootTargeted: MachineTransition[] = []
  const globalEvents: string[] = []

  for (const [event, raw] of Object.entries(rootOn)) {
    if (!raw) continue
    const list = Array.isArray(raw) ? raw : [raw]
    let hasTarget = false
    for (const item of list) {
      if (item.target) {
        hasTarget = true
        rootTargeted.push({
          event,
          target: item.target,
          guard: typeof item.guard === 'string' ? item.guard : undefined,
          actions: item.actions
        })
      }
    }
    if (!hasTarget) {
      globalEvents.push(event)
    }
  }

  const states: MachineStateNode[] = stateIds.map((stateId) => {
    const cfg = statesRecord[stateId] ?? {}
    const transitions: MachineTransition[] = []
    const localEvents = new Set<string>()

    if (cfg.on) {
      for (const [event, raw] of Object.entries(cfg.on)) {
        if (!raw) continue
        localEvents.add(event)
        const list = Array.isArray(raw) ? raw : [raw]
        for (const item of list) {
          if (!item.target && list.length > 1) continue
          transitions.push({
            event,
            target: item.target,
            guard: typeof item.guard === 'string' ? item.guard : undefined,
            actions: item.actions
          })
        }
      }
    }

    // Inherit root-level targeted transitions for states that don't override them
    for (const rt of rootTargeted) {
      if (rt.target !== stateId && !localEvents.has(rt.event)) {
        transitions.push(rt)
      }
    }

    return {
      id: stateId,
      tags: cfg.tags,
      entry: cfg.entry,
      transitions
    }
  })

  return {
    id,
    title,
    initial,
    states,
    globalEvents,
    machine,
    booleanProps: extractBooleanProps(machine)
  }
}

export const machineGraphs: Record<string, MachineGraph> = {
  'accordion-item': extractMachineGraph('accordion-item', 'AccordionItem State Machine', accordionItemMachine as RawMachine, 'closed'),
  'action-sheet': extractMachineGraph('action-sheet', 'ActionSheet State Machine', actionSheetMachine as RawMachine, 'closed'),
  banner: extractMachineGraph('banner', 'Banner State Machine', bannerMachine as RawMachine, 'open'),
  button: extractMachineGraph('button', 'Button State Machine', buttonMachine as RawMachine, 'idle'),
  checkbox: extractMachineGraph('checkbox', 'Checkbox State Machine', checkboxMachine as RawMachine),
  drawer: extractMachineGraph('drawer', 'Drawer State Machine', drawerMachine as RawMachine, 'closed'),
  'file-upload': extractMachineGraph('file-upload', 'FileUpload State Machine', fileUploadMachine as RawMachine),
  form: extractMachineGraph('form', 'Form State Machine', formMachine as RawMachine, 'idle'),
  'form-field': extractMachineGraph('form-field', 'FormField State Machine', formFieldMachine as RawMachine),
  input: extractMachineGraph('input', 'Input State Machine', inputMachine as RawMachine, 'idle'),
  'input-menu': extractMachineGraph('input-menu', 'InputMenu State Machine', inputMenuMachine as RawMachine, 'closed'),
  modal: extractMachineGraph('modal', 'Modal State Machine', modalMachine as RawMachine, 'closed'),
  'pin-input': extractMachineGraph('pin-input', 'PinInput State Machine', pinInputMachine as RawMachine, 'idle'),
  popover: extractMachineGraph('popover', 'Popover State Machine', popoverMachine as RawMachine, 'closed'),
  presence: extractMachineGraph('presence', 'Presence State Machine', presenceMachine as RawMachine, 'unmounted'),
  'pull-down-refresh': extractMachineGraph('pull-down-refresh', 'PullDownRefresh State Machine', pullDownRefreshMachine as RawMachine, 'idle'),
  radio: extractMachineGraph('radio', 'Radio State Machine', radioMachine as RawMachine),
  select: extractMachineGraph('select', 'Select State Machine', selectMachine as RawMachine, 'closed'),
  slider: extractMachineGraph('slider', 'Slider State Machine', sliderMachine as RawMachine, 'idle'),
  stepper: extractMachineGraph('stepper', 'Stepper State Machine', stepperMachine as RawMachine),
  'swipe-cell': extractMachineGraph('swipe-cell', 'SwipeCell State Machine', swipeCellMachine as RawMachine, 'closed'),
  switch: extractMachineGraph('switch', 'Switch State Machine', switchMachine as RawMachine),
  tabs: extractMachineGraph('tabs', 'Tabs State Machine', tabsMachine as RawMachine),
  textarea: extractMachineGraph('textarea', 'Textarea State Machine', textareaMachine as RawMachine, 'idle'),
  toast: extractMachineGraph('toast', 'Toast State Machine', toastMachine as RawMachine, 'closed')
}
