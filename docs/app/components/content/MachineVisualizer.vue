<script setup lang="ts">
import dagre from '@dagrejs/dagre'
import {
  VueFlow,
  Handle,
  MarkerType,
  Position,
  useVueFlow,
  type Node,
  type Edge
} from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { MiniappMachine } from '@code-id-labs/miniapp'
import { machineGraphs, type MachineTransition } from '~/data/machines'

const props = defineProps<{
  name: string
}>()

const graph = computed(() => machineGraphs[props.name])
const currentStateId = ref(graph.value?.initial ?? '')
const liveProps = ref<Record<string, boolean>>({})
const userPositions = ref<Record<string, { x: number, y: number }>>({})
const history = ref<Array<{ from: string, event: string, to: string, kind?: 'transition' | 'action' | 'blocked' }>>([])

const { fitView } = useVueFlow()

let runner: MiniappMachine<any> | null = null
let unsubscribe: (() => void) | null = null
let pendingTransition: { from: string, event: string } | null = null

function initRunner() {
  unsubscribe?.()
  unsubscribe = null
  runner?.stop()
  runner = null
  pendingTransition = null

  const g = graph.value
  if (!g) return

  const initialProps: Record<string, boolean> = { ...g.booleanProps }
  liveProps.value = initialProps
  userPositions.value = {}
  history.value = []

  if (!import.meta.client) {
    currentStateId.value = g.initial
    return
  }

  try {
    // Strip platform effects (e.g. WeChat wx.* pickers / auto-timers) in the interactive
    // docs preview so transient states like `choosing` or `closing` stay inspectable
    // until the user clicks `CHOOSE_COMPLETE` / `ANIMATION_END`.
    const rawMachine = g.machine as Record<string, any>
    const previewStates: Record<string, any> = {}
    if (rawMachine.states) {
      for (const [k, v] of Object.entries(rawMachine.states)) {
        const { effects: _e, ...rest } = (v ?? {}) as Record<string, any>
        previewStates[k] = rest
      }
    }
    const { effects: _rootEffects, ...restMachine } = rawMachine
    const previewMachine = {
      ...restMachine,
      states: previewStates
    }

    const instance = new MiniappMachine(previewMachine as any, { ...initialProps })
    runner = instance
    unsubscribe = instance.subscribe((service) => {
      const nextState = String(service.state.get())
      if (nextState && nextState !== currentStateId.value) {
        const prev = pendingTransition?.from ?? currentStateId.value
        const ev = pendingTransition?.event
        currentStateId.value = nextState
        if (ev) {
          pushHistory({ from: prev, event: ev, to: nextState })
          pendingTransition = null
        }
      }
    })
    instance.start()
    currentStateId.value = String(instance.service.state.get()) || g.initial
  } catch {
    runner = null
    currentStateId.value = g.initial
  }
}

onMounted(() => {
  initRunner()
})

watch(graph, () => {
  initRunner()
})

onBeforeUnmount(() => {
  unsubscribe?.()
  runner?.stop()
  runner = null
})

function toggleProp(key: string, value: boolean) {
  const prev = currentStateId.value
  const nextProps = { ...liveProps.value, [key]: value }
  liveProps.value = nextProps

  if (runner) {
    try {
      runner.updateProps(nextProps)
      const after = String(runner.service.state.get())
      currentStateId.value = after
      if (after !== prev) {
        pushHistory({ from: prev, event: `prop:${key}=${value}`, to: after })
      }
    } catch {
      // Ignore prop watch errors in headless preview
    }
  }
}

function pushHistory(entry: { from: string, event: string, to: string, kind?: 'transition' | 'action' | 'blocked' }) {
  history.value.unshift(entry)
  if (history.value.length > 5) {
    history.value.pop()
  }
}

const currentState = computed(() =>
  graph.value?.states.find(s => s.id === currentStateId.value)
)

const propEntries = computed(() => Object.entries(liveProps.value))

const uniqueCurrentEvents = computed(() => {
  const transitions = currentState.value?.transitions ?? []
  const seen = new Set<string>()
  return transitions.filter((t) => {
    if (seen.has(t.event)) return false
    seen.add(t.event)
    return true
  })
})

const NODE_WIDTH = 160
const NODE_HEIGHT = 64

const layouted = computed<{ nodes: Node[], edges: Edge[] }>(() => {
  const g = graph.value
  if (!g) return { nodes: [], edges: [] }

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 170,
    edgesep: 40
  })

  for (const state of g.states) {
    dagreGraph.setNode(state.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  const edgeGroups = new Map<string, {
    source: string
    target: string
    transitions: MachineTransition[]
  }>()

  for (const state of g.states) {
    for (const t of state.transitions) {
      if (!t.target || t.target === state.id) continue
      const key = `${state.id}__${t.target}`
      const existing = edgeGroups.get(key)
      if (existing) {
        existing.transitions.push(t)
      } else {
        edgeGroups.set(key, {
          source: state.id,
          target: t.target,
          transitions: [t]
        })
        dagreGraph.setEdge(state.id, t.target)
      }
    }
  }

  dagre.layout(dagreGraph)

  const nodePosMap = new Map<string, { x: number, y: number }>()

  const nodes: Node[] = g.states.map((state) => {
    const pos = dagreGraph.node(state.id)
    const customPos = userPositions.value[state.id]
    const x = customPos ? customPos.x : (pos?.x ?? 0) - NODE_WIDTH / 2
    const y = customPos ? customPos.y : (pos?.y ?? 0) - NODE_HEIGHT / 2
    nodePosMap.set(state.id, { x, y })
    const isActive = state.id === currentStateId.value
    const isInitial = state.id === g.initial
    return {
      id: state.id,
      type: 'stateNode',
      position: { x, y },
      data: {
        label: state.id,
        isActive,
        isInitial,
        tags: state.tags ?? []
      }
    }
  })

  const edges: Edge[] = Array.from(edgeGroups.entries()).map(([key, group]) => {
    const { source, target, transitions } = group
    const isActiveSource = source === currentStateId.value
    const uniqueEvents = transitions
      .map(t => t.event)
      .filter((v, idx, arr) => arr.indexOf(v) === idx)

    const labelText = uniqueEvents.length <= 2
      ? uniqueEvents.join(' / ')
      : `${uniqueEvents[0]} (+${uniqueEvents.length - 1})`

    const srcPos = nodePosMap.get(source)
    const tgtPos = nodePosMap.get(target)
    const isBackward = (srcPos?.x ?? 0) > (tgtPos?.x ?? 0)

    return {
      id: key,
      source,
      target,
      sourceHandle: isBackward ? 'bottom-src' : 'right-src',
      targetHandle: isBackward ? 'bottom-tgt' : 'left-tgt',
      label: labelText,
      animated: isActiveSource,
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isActiveSource ? 'var(--ui-primary)' : 'var(--ui-border-accented)'
      },
      style: {
        stroke: isActiveSource ? 'var(--ui-primary)' : 'var(--ui-border-accented)',
        strokeWidth: isActiveSource ? 2 : 1.5,
        cursor: isActiveSource ? 'pointer' : 'default'
      },
      labelStyle: {
        fill: isActiveSource ? 'var(--ui-text-highlighted)' : 'var(--ui-text-muted)',
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontWeight: isActiveSource ? 600 : 400
      },
      labelBgStyle: {
        fill: isActiveSource ? 'var(--ui-bg-elevated)' : 'var(--ui-bg)',
        stroke: isActiveSource ? 'var(--ui-primary)' : 'var(--ui-border)',
        strokeWidth: 1
      },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 6,
      data: { transition: transitions[0], source }
    }
  })

  return { nodes, edges }
})

function buildEventPayload(eventName: string): Record<string, unknown> {
  if (eventName === 'SET_INDETERMINATE') {
    return { type: eventName, indeterminate: currentStateId.value !== 'indeterminate' }
  }
  if (eventName === 'SET_CHECKED') {
    return { type: eventName, checked: currentStateId.value !== 'checked' }
  }
  if (eventName === 'SET_INVALID') {
    return { type: eventName, invalid: currentStateId.value !== 'invalid' }
  }
  if (eventName === 'SET_DISABLED') {
    return { type: eventName, disabled: !liveProps.value.disabled }
  }
  if (eventName === 'SET_UPLOADING') {
    return { type: eventName, uploading: currentStateId.value !== 'uploading' }
  }
  if (eventName === 'SET_LOADING') {
    return { type: eventName, loading: currentStateId.value !== 'loading' }
  }
  if (eventName === 'SET_VALUE') {
    return { type: eventName, value: [] }
  }
  if (eventName === 'ADD_FILES' || eventName === 'PICKED_RAW') {
    return { type: eventName, files: [] }
  }
  if (eventName === 'SET_VALUES' || eventName === 'SET_ERRORS') {
    return { type: eventName, values: {}, errors: {} }
  }
  return { type: eventName }
}

function send(transition: MachineTransition) {
  const from = currentStateId.value

  if (runner) {
    try {
      const pending = { from, event: transition.event }
      pendingTransition = pending
      runner.send(buildEventPayload(transition.event))

      // Check synchronously first, then after microtask flush (for watch/nextTick transitions)
      const syncTo = String(runner.service.state.get())
      if (syncTo !== from) {
        currentStateId.value = syncTo
        if (pendingTransition === pending) {
          pushHistory({ from, event: transition.event, to: syncTo })
          pendingTransition = null
        }
        return
      }

      queueMicrotask(() => {
        if (pendingTransition !== pending) return
        const asyncTo = runner ? String(runner.service.state.get()) : from
        currentStateId.value = asyncTo
        if (asyncTo !== from) {
          pushHistory({ from, event: transition.event, to: asyncTo, kind: 'transition' })
        } else if (transition.target && transition.target !== from) {
          pushHistory({ from, event: transition.event, to: asyncTo, kind: 'blocked' })
        } else {
          pushHistory({ from, event: transition.event, to: asyncTo, kind: 'action' })
        }
        pendingTransition = null
      })
      return
    } catch {
      pendingTransition = null
      // Fallback to static transition if event requires payload
    }
  }

  const to = transition.target ?? from
  currentStateId.value = to
  pushHistory({ from, event: transition.event, to })
}

function sendGlobal(eventName: string) {
  send({ event: eventName })
}

function onNodeDragStop({ node }: { node: Node }) {
  userPositions.value = {
    ...userPositions.value,
    [node.id]: { x: node.position.x, y: node.position.y }
  }
}

function onEdgeClick({ edge }: { edge: Edge }) {
  if (edge.data?.source !== currentStateId.value) return
  if (edge.data?.transition) {
    send(edge.data.transition as MachineTransition)
  }
}

function reset() {
  initRunner()
}

function handleFitView() {
  fitView({ padding: 0.2, duration: 250 })
}
</script>

<template>
  <div
    v-if="graph"
    class="my-6 rounded-xl border border-default bg-default overflow-hidden"
  >
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-default bg-elevated/50">
      <div class="flex items-center gap-2 min-w-0">
        <UIcon
          name="i-lucide-workflow"
          class="size-4 text-primary shrink-0"
        />
        <span class="text-sm font-semibold text-highlighted truncate">
          {{ graph.title }}
        </span>
        <UBadge
          :label="currentStateId"
          color="primary"
          variant="soft"
          size="xs"
        />
      </div>

      <div class="flex items-center gap-1">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-maximize-2"
          label="Fit"
          @click="handleFitView"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-rotate-ccw"
          label="Reset"
          @click="reset"
        />
      </div>
    </div>

    <!-- Reactive Props Bar -->
    <div
      v-if="propEntries.length > 0"
      class="px-4 py-2 border-b border-default bg-default flex flex-wrap items-center gap-x-4 gap-y-2"
    >
      <span class="text-xs font-medium text-muted">Props:</span>
      <label
        v-for="[key, val] in propEntries"
        :key="key"
        class="inline-flex items-center gap-1.5 text-xs font-mono text-toned cursor-pointer select-none"
      >
        <USwitch
          size="xs"
          :model-value="val"
          @update:model-value="toggleProp(key, Boolean($event))"
        />
        <span>{{ key }}</span>
      </label>
    </div>

    <!-- XState-style Node & Edge Canvas -->
    <div class="h-80 w-full bg-elevated/20 relative">
      <ClientOnly>
        <VueFlow
          :nodes="layouted.nodes"
          :edges="layouted.edges"
          :fit-view-on-init="true"
          :min-zoom="0.4"
          :max-zoom="1.8"
          :nodes-draggable="true"
          :nodes-connectable="false"
          @node-drag-stop="onNodeDragStop"
          @edge-click="onEdgeClick"
        >
          <template #node-stateNode="{ data }">
            <div
              class="min-w-36 rounded-lg border-2 px-3.5 py-2.5 shadow-sm transition-all relative"
              :class="data.isActive
                ? 'border-primary bg-default ring-4 ring-primary/15'
                : 'border-default bg-elevated/80 opacity-80'"
            >
              <Handle
                id="left-tgt"
                type="target"
                :position="Position.Left"
                class="!opacity-0"
              />
              <Handle
                id="right-src"
                type="source"
                :position="Position.Right"
                class="!opacity-0"
              />
              <Handle
                id="bottom-src"
                type="source"
                :position="Position.Bottom"
                class="!opacity-0"
              />
              <Handle
                id="bottom-tgt"
                type="target"
                :position="Position.Bottom"
                class="!opacity-0"
              />
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                    class="size-2 rounded-full shrink-0"
                    :class="data.isActive ? 'bg-primary animate-pulse' : 'bg-muted'"
                  />
                  <span class="text-xs font-mono font-semibold text-highlighted">
                    {{ data.label }}
                  </span>
                </div>
                <span
                  v-if="data.isInitial"
                  class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-elevated text-muted border border-default"
                >
                  init
                </span>
              </div>
              <div
                v-if="data.tags.length"
                class="flex flex-wrap gap-1 mt-1.5"
              >
                <span
                  v-for="tag in data.tags"
                  :key="tag"
                  class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
          </template>
        </VueFlow>
      </ClientOnly>
    </div>

    <!-- Interactive Event Bar -->
    <div
      v-if="uniqueCurrentEvents.length > 0"
      class="px-4 py-3 border-t border-default bg-elevated/30 flex flex-wrap items-center gap-2"
    >
      <span class="text-xs font-medium text-muted mr-1">Send event:</span>
      <UButton
        v-for="t in uniqueCurrentEvents"
        :key="t.event"
        size="xs"
        color="primary"
        variant="soft"
        :label="t.event"
        @click="send(t)"
      />
    </div>

    <!-- Global Root Events -->
    <div
      v-if="graph.globalEvents.length > 0"
      class="px-4 py-2 border-t border-default bg-default flex flex-wrap items-center gap-1.5"
    >
      <span class="text-[11px] font-medium text-muted mr-1">Global events:</span>
      <UButton
        v-for="ev in graph.globalEvents"
        :key="ev"
        size="xs"
        color="neutral"
        variant="subtle"
        :label="ev"
        @click="sendGlobal(ev)"
      />
    </div>

    <!-- Transition Log -->
    <div
      v-if="history.length > 0"
      class="px-4 py-2 border-t border-default bg-default flex flex-col gap-1"
    >
      <div
        v-for="(item, idx) in history"
        :key="idx"
        class="text-xs font-mono text-toned flex items-center gap-1.5 flex-wrap"
      >
        <template v-if="item.kind === 'blocked'">
          <span class="text-muted">{{ item.from }}</span>
          <span class="text-warning">--[{{ item.event }} blocked by guard]--></span>
          <span class="text-muted">{{ item.to }}</span>
        </template>
        <template v-else-if="item.kind === 'action'">
          <span class="text-muted">{{ item.from }}</span>
          <span class="text-info">· {{ item.event }} (self-action)</span>
        </template>
        <template v-else>
          <span class="text-muted">{{ item.from }}</span>
          <span class="text-primary">--[{{ item.event }}]--></span>
          <span class="font-semibold text-highlighted">{{ item.to }}</span>
        </template>
      </div>
    </div>
  </div>
</template>
