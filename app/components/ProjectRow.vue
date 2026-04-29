<script setup lang="ts">
import { ChevronRight, Trash2, History } from 'lucide-vue-next'
import type { Project } from '~/stores/projects'
import { useProjectsStore } from '~/stores/projects'

const props = defineProps<{ project: Project; isActive: boolean }>()
const emit = defineEmits<{ delete: [id: string]; toggle: [] }>()

const store = useProjectsStore()

const loaded = ref(false)
const confirmOpen = ref(false)
const activeMilestoneId = ref<string | null>(null)

const router = useRouter()

const milestones = computed(() => store.milestones[props.project.id] ?? [])

const liveMs = computed(() => {
  store.now // reactive dependency for live update
  return loaded.value
    ? store.getProjectLiveMs(props.project.id)
    : props.project.totalMs
})

async function toggle() {
  emit('toggle')
  if (!props.isActive && !loaded.value) {
    await store.fetchMilestones(props.project.id)
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

const runningCount = computed(() =>
  Object.values(store.subFeatures)
    .flat()
    .filter(sf => {
      // Only count sub-features belonging to this project's milestones
      return milestones.value.some(m => m.id === sf.milestoneId) && sf.status === 'running'
    }).length
)

const estimatedMs = computed(() => {
  const h = props.project.estimatedHours
  return h ? h * 3600 * 1000 : null
})

const remainingMs = computed(() => {
  if (estimatedMs.value === null) return null
  return Math.max(0, estimatedMs.value - liveMs.value)
})

const isOverBudget = computed(() => {
  if (estimatedMs.value === null) return false
  return liveMs.value >= estimatedMs.value
})

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div class="rounded-lg border border-border bg-card overflow-hidden">
    <!-- Project header row -->
    <div
      @click="toggle"
      class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors group"
    >
      <!-- Left: chevron + title + badges -->
      <div class="flex items-center gap-3 min-w-0">
        <ChevronRight
          class="w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200"
          :class="{ 'rotate-90': isActive }"
        />
        <span class="font-semibold truncate">{{ project.name }}</span>
        <span
          v-if="remainingMs !== null"
          :class="['text-sm font-mono tabular-nums flex-shrink-0', isOverBudget ? 'text-red-400' : 'text-muted-foreground/60']"
        >({{ formatCountdown(remainingMs) }})</span>
        <span
          v-if="runningCount > 0"
          class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0"
        >
          {{ runningCount }} running
        </span>
      </div>

      <!-- Right: action buttons + total time -->
      <div class="flex items-center gap-3 flex-shrink-0 ml-4">
        <button
          @click.stop="router.push(`/projects/${project.id}/logs`)"
          class="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-white/10 text-muted-foreground transition"
          title="View history"
        >
          <History class="w-4 h-4" />
        </button>
        <button
          @click.stop="confirmOpen = true"
          class="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-white/10 text-destructive transition"
          title="Delete project"
        >
          <Trash2 class="w-4 h-4" />
        </button>
        <span :class="['font-mono text-base tabular-nums', isOverBudget ? 'text-red-400' : runningCount > 0 ? 'text-emerald-400' : '']">{{ formatMs(liveMs) }}</span>
      </div>
    </div>

    <!-- Expanded milestones -->
    <div v-if="isActive" class="border-t border-border/50">
      <div v-if="!loaded" class="py-4 px-4 text-sm text-muted-foreground animate-pulse">
        Loading milestones...
      </div>
      <template v-else>
        <MilestoneRow
          v-for="m in milestones"
          :key="m.id"
          :milestone="m"
          :is-active="activeMilestoneId === m.id"
          @toggle="activeMilestoneId = activeMilestoneId === m.id ? null : m.id"
        />
        <p v-if="milestones.length === 0" class="py-4 px-6 text-sm text-muted-foreground">
          No milestones defined.
        </p>
      </template>
    </div>
  </div>

  <ConfirmDialog
    :open="confirmOpen"
    title="Delete project?"
    :message="`'${project.name}' and all its milestones and tracked time will be permanently deleted.`"
    @confirm="emit('delete', project.id); confirmOpen = false"
    @cancel="confirmOpen = false"
  />
</template>
