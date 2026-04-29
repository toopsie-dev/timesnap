<script setup lang="ts">
import { ChevronRight, Coffee, Plus } from 'lucide-vue-next'
import type { Milestone } from '~/stores/projects'
import { useProjectsStore } from '~/stores/projects'

const props = defineProps<{ milestone: Milestone; isActive: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
const store = useProjectsStore()

const isIdle = computed(() => props.milestone.name === 'Idle')

const loaded = ref(false)
const addingIdle = ref(false)
const newIdleName = ref('')

const subFeatures = computed(() => store.subFeatures[props.milestone.id] ?? [])

const sortedSubFeatures = computed(() =>
  [...subFeatures.value].sort((a, b) => {
    if (a.status === 'running' && b.status !== 'running') return -1
    if (b.status === 'running' && a.status !== 'running') return 1
    return 0
  })
)

async function submitAddIdle() {
  const name = newIdleName.value.trim()
  if (!name) return
  await store.createSubFeature(props.milestone.id, name)
  newIdleName.value = ''
  addingIdle.value = false
}

const liveMs = computed(() => {
  store.now // reactive dependency for live update
  return loaded.value
    ? store.getMilestoneLiveMs(props.milestone.id)
    : props.milestone.totalMs
})

async function toggle() {
  emit('toggle')
  if (!props.isActive && !loaded.value) {
    await store.fetchSubFeatures(props.milestone.id)
    loaded.value = true
  }
}

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const estimatedLabel = computed(() => {
  const h = props.milestone.estimatedHours
  if (!h) return null
  return `Est. ${h}h`
})

const runningCount = computed(() =>
  subFeatures.value.filter(sf => sf.status === 'running').length
)
</script>

<template>
  <div>
    <!-- Milestone row -->
    <div
      @click="toggle"
      :class="[
        'flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors group',
        isIdle
          ? 'hover:bg-amber-500/5 border-t border-dashed border-border/40 mt-1'
          : 'hover:bg-white/5',
      ]"
    >
      <div class="flex items-center gap-2 min-w-0">
        <ChevronRight
          class="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
          :class="[isIdle ? 'text-amber-500/60' : 'text-muted-foreground', { 'rotate-90': isActive }]"
        />
        <!-- Coffee icon for Idle milestone -->
        <Coffee v-if="isIdle" class="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
        <span
          :class="['text-sm font-medium truncate', isIdle ? 'text-amber-400/80' : '']"
        >{{ milestone.name }}</span>
        <span v-if="estimatedLabel" class="text-xs text-muted-foreground shrink-0">
          {{ estimatedLabel }}
        </span>
        <span v-if="runningCount > 0" class="text-xs text-emerald-400 shrink-0">
          {{ runningCount }} running
        </span>
      </div>
      <div class="flex items-center gap-2 shrink-0 ml-4">
        <span
          :class="['font-mono text-sm tabular-nums',
            runningCount > 0 ? 'text-emerald-400' : isIdle ? 'text-amber-400/70' : 'text-muted-foreground'
          ]"
        >
          {{ formatMs(liveMs) }}
        </span>
      </div>
    </div>

    <!-- Sub-features -->
    <div v-if="isActive" class="ml-8 border-l border-border/50 pl-2">
      <div v-if="!loaded" class="py-3 px-3 text-xs text-muted-foreground animate-pulse">
        Loading...
      </div>
      <template v-else>
        <SubFeatureRow
          v-for="sf in sortedSubFeatures"
          :key="sf.id"
          :sub-feature="sf"
        />
        <p v-if="subFeatures.length === 0" class="py-3 px-3 text-xs text-muted-foreground">
          No sub-features defined.
        </p>

        <!-- Add custom idle activity (only shown in Idle milestone) -->
        <div v-if="isIdle" class="py-1 px-3">
          <div v-if="!addingIdle">
            <button
              @click="addingIdle = true"
              class="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-amber-400/80 transition-colors py-1"
            >
              <Plus class="w-3 h-3" />
              Add activity
            </button>
          </div>
          <div v-else class="flex items-center gap-2 py-1">
            <input
              v-model="newIdleName"
              @keydown.enter="submitAddIdle"
              @keydown.escape="addingIdle = false; newIdleName = ''"
              placeholder="e.g. Production Support"
              autofocus
              class="flex-1 rounded border border-border/50 bg-background/50 px-2.5 py-1 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:border-ring focus:text-foreground transition"
            />
            <button
              @click="submitAddIdle"
              class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/30 transition"
            >Add</button>
            <button
              @click="addingIdle = false; newIdleName = ''"
              class="px-2 py-1 rounded text-muted-foreground text-xs hover:text-foreground transition"
            >Cancel</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
