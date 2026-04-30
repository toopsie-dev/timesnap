<script setup lang="ts">
import { ChevronRight, Trash2, History, CheckCircle, XCircle, RotateCcw } from 'lucide-vue-next'
import type { Project } from '~/stores/projects'
import { useProjectsStore } from '~/stores/projects'

const props = defineProps<{ project: Project; isActive: boolean }>()
const emit = defineEmits<{ delete: [id: string]; toggle: [] }>()

const store = useProjectsStore()

const loaded = ref(false)
const confirmOpen = ref(false)
const statusMenuOpen = ref(false)
const menuStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

function openStatusMenu(event: MouseEvent) {
  const btn = event.currentTarget as HTMLElement
  if (btn) {
    const rect = btn.getBoundingClientRect()
    menuStyle.value = {
      top: `${rect.bottom + window.scrollY + 4}px`,
      left: `${rect.right + window.scrollX - 144}px`,
    }
  }
  statusMenuOpen.value = !statusMenuOpen.value
}
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

async function setStatus(status: 'active' | 'completed' | 'cancelled') {
  statusMenuOpen.value = false
  await store.updateProjectStatus(props.project.id, status)
}

onMounted(() => {
  document.addEventListener('click', () => { statusMenuOpen.value = false })
})
onUnmounted(() => {
  document.removeEventListener('click', () => { statusMenuOpen.value = false })
})

const statusConfig = {
  active:    { label: 'Active',    classes: 'text-emerald-400 bg-emerald-500/10' },
  completed: { label: 'Completed', classes: 'text-sky-400 bg-sky-500/10' },
  cancelled: { label: 'Cancelled', classes: 'text-muted-foreground bg-white/5 line-through' },
}
</script>

<template>
  <div :class="['rounded-lg border bg-card overflow-hidden', project.status === 'cancelled' ? 'border-border/40 opacity-60' : project.status === 'completed' ? 'border-sky-900/50' : 'border-border']">
    <!-- Project header row -->
    <div
      @click="toggle"
      class="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors group"
    >
      <!-- Row 1: chevron + title + [desktop badges + actions] + time -->
      <div class="flex items-center gap-2">
        <ChevronRight
          class="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200"
          :class="{ 'rotate-90': isActive }"
        />

        <!-- Title: wraps on mobile, truncates on desktop -->
        <span
          class="font-semibold flex-1 min-w-0 break-words sm:truncate"
          :class="project.status === 'cancelled' ? 'line-through text-muted-foreground' : ''"
        >{{ project.name }}</span>

        <!-- Desktop-only: badges inline -->
        <div class="hidden sm:flex items-center gap-2 shrink-0">
          <span
            v-if="project.status !== 'active'"
            :class="['text-xs px-2 py-0.5 rounded-full', project.status === 'completed' ? 'text-sky-400 bg-sky-500/10' : 'text-muted-foreground bg-white/5']"
          >{{ project.status === 'completed' ? 'Completed' : 'Cancelled' }}</span>
          <span
            v-if="remainingMs !== null"
            :class="['text-sm font-mono tabular-nums', isOverBudget ? 'text-red-400' : 'text-muted-foreground/60']"
          >({{ formatCountdown(remainingMs) }})</span>
          <span
            v-if="runningCount > 0"
            class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full"
          >{{ runningCount }} running</span>
        </div>

        <!-- Desktop-only: action icons (hover-reveal) -->
        <div class="hidden sm:flex items-center gap-1 shrink-0" @click.stop>
          <button
            @click="openStatusMenu($event)"
            class="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-white/10 text-muted-foreground transition"
            title="Set status"
          >
            <CheckCircle class="w-4 h-4" />
          </button>
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
        </div>

        <!-- Time: always visible -->
        <span :class="['font-mono text-base tabular-nums shrink-0', isOverBudget ? 'text-red-400' : runningCount > 0 ? 'text-emerald-400' : '']">{{ formatMs(liveMs) }}</span>
      </div>

      <!-- Row 2: mobile-only — badges + always-visible action icons -->
      <div class="sm:hidden flex items-center justify-between mt-2 pl-6 gap-2" @click.stop>
        <!-- Badges -->
        <div class="flex items-center gap-1.5 flex-wrap min-w-0">
          <span
            v-if="project.status !== 'active'"
            :class="['text-xs px-2 py-0.5 rounded-full shrink-0', project.status === 'completed' ? 'text-sky-400 bg-sky-500/10' : 'text-muted-foreground bg-white/5']"
          >{{ project.status === 'completed' ? 'Completed' : 'Cancelled' }}</span>
          <span
            v-if="remainingMs !== null"
            :class="['text-xs font-mono tabular-nums shrink-0', isOverBudget ? 'text-red-400' : 'text-muted-foreground/60']"
          >({{ formatCountdown(remainingMs) }})</span>
          <span
            v-if="runningCount > 0"
            class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full shrink-0"
          >{{ runningCount }} running</span>
        </div>
        <!-- Action icons: always visible on mobile -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            @click="openStatusMenu($event)"
            class="p-2 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground transition"
            title="Set status"
          >
            <CheckCircle class="w-4 h-4" />
          </button>
          <button
            @click.stop="router.push(`/projects/${project.id}/logs`)"
            class="p-2 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground transition"
            title="View history"
          >
            <History class="w-4 h-4" />
          </button>
          <button
            @click.stop="confirmOpen = true"
            class="p-2 rounded-md bg-white/5 hover:bg-white/10 text-destructive/80 transition"
            title="Delete project"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Status dropdown (shared, teleported to body) -->
    <Teleport to="body">
      <div
        v-if="statusMenuOpen"
        class="fixed z-50 rounded-lg border border-border bg-card shadow-2xl min-w-36 py-1"
        :style="menuStyle"
        @click.stop
      >
        <button
          @click="setStatus('active')"
          :class="['flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-white/5 transition', project.status === 'active' ? 'text-emerald-400' : 'text-foreground']"
        >
          <RotateCcw class="w-3.5 h-3.5" /> Active
        </button>
        <button
          @click="setStatus('completed')"
          :class="['flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-white/5 transition', project.status === 'completed' ? 'text-sky-400' : 'text-foreground']"
        >
          <CheckCircle class="w-3.5 h-3.5" /> Completed
        </button>
        <button
          @click="setStatus('cancelled')"
          :class="['flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-white/5 transition', project.status === 'cancelled' ? 'text-muted-foreground' : 'text-foreground']"
        >
          <XCircle class="w-3.5 h-3.5" /> Cancelled
        </button>
      </div>
    </Teleport>

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
