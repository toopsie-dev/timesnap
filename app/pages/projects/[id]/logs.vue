<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { useProjectsStore, type Log } from '~/stores/projects'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()

const projectId = route.params.id as string
const project = computed(() => store.projects.find(p => p.id === projectId))

const logs = computed(() => store.logs[projectId] ?? [])
const loading = ref(false)

const filterMilestone = ref('')
const filterTask = ref('')

onMounted(async () => {
  if (store.projects.length === 0) await store.fetchProjects()
  loading.value = true
  await store.fetchLogs(projectId)
  loading.value = false
})

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const milestoneOptions = computed(() => {
  const names = [...new Set(logs.value.map(l => l.milestoneName))].sort()
  return names
})

const taskOptions = computed(() => {
  const source = filterMilestone.value
    ? logs.value.filter(l => l.milestoneName === filterMilestone.value)
    : logs.value
  const names = [...new Set(source.map(l => l.subFeatureName))].sort()
  return names
})

const filteredLogs = computed(() => {
  return logs.value.filter(l => {
    if (filterMilestone.value && l.milestoneName !== filterMilestone.value) return false
    if (filterTask.value && l.subFeatureName !== filterTask.value) return false
    return true
  })
})

const totalMs = computed(() =>
  filteredLogs.value.reduce((sum, l) => sum + l.durationMs, 0)
)

// Pagination
const pageSize = ref(25)
const pageSizeOptions = [10, 25, 50, 100]
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / pageSize.value)))

const pagedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

const recordsLabel = computed(() => {
  const total = filteredLogs.value.length
  if (total === 0) return '0 records'
  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, total)
  return `${start}–${end} of ${total} record${total !== 1 ? 's' : ''}`
})

// Reset to page 1 when filters or page size change
watch([filterMilestone, filterTask, pageSize], () => { currentPage.value = 1 })

// Reset task filter when milestone changes
watch(filterMilestone, () => { filterTask.value = '' })
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Header -->
    <header class="border-b border-border/50 px-6 py-4 flex items-center gap-4">
      <button
        @click="router.back()"
        class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition text-sm"
      >
        <ArrowLeft class="w-4 h-4" />
        Back
      </button>
      <div class="flex-1 min-w-0">
        <p class="text-xs text-muted-foreground">Session History</p>
        <h1 class="font-semibold truncate">{{ project?.name ?? 'Project' }}</h1>
      </div>
      <span v-if="logs.length" class="text-xs text-muted-foreground">
        {{ filteredLogs.length }} session{{ filteredLogs.length !== 1 ? 's' : '' }} &middot; Total {{ formatDuration(totalMs) }}
      </span>
    </header>

    <!-- Content -->
    <main class="max-w-5xl mx-auto px-4 py-8">
      <!-- Loading -->
      <div v-if="loading" class="text-center text-sm text-muted-foreground animate-pulse py-16">
        Loading history…
      </div>

      <!-- Empty -->
      <div v-else-if="logs.length === 0" class="text-center py-16">
        <p class="text-muted-foreground text-sm">No sessions logged yet.</p>
        <p class="text-muted-foreground/50 text-xs mt-1">Start and stop a task to see entries here.</p>
      </div>

      <template v-else>
        <!-- Filters + records info -->
        <div class="flex items-center gap-3 mb-4 flex-wrap">
          <select
            v-model="filterMilestone"
            class="rounded-md border border-border bg-card text-sm px-3 py-1.5 text-foreground focus:outline-none focus:border-ring transition"
          >
            <option value="">All Milestones</option>
            <option v-for="m in milestoneOptions" :key="m" :value="m">{{ m }}</option>
          </select>
          <select
            v-model="filterTask"
            class="rounded-md border border-border bg-card text-sm px-3 py-1.5 text-foreground focus:outline-none focus:border-ring transition"
          >
            <option value="">All Tasks</option>
            <option v-for="t in taskOptions" :key="t" :value="t">{{ t }}</option>
          </select>
          <button
            v-if="filterMilestone || filterTask"
            @click="filterMilestone = ''; filterTask = ''"
            class="text-xs text-muted-foreground hover:text-foreground transition px-2 py-1.5 rounded border border-border/50 hover:border-border"
          >
            Clear
          </button>
          <div class="ml-auto flex items-center gap-3">
            <span class="text-xs text-muted-foreground">{{ recordsLabel }}</span>
            <select
              v-model="pageSize"
              class="rounded-md border border-border bg-card text-xs px-2 py-1.5 text-foreground focus:outline-none focus:border-ring transition"
            >
              <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }} / page</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="rounded-lg border border-border bg-card overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border/40 text-xs text-muted-foreground">
                <th class="text-left px-4 py-2.5 font-medium">Date</th>
                <th class="text-left px-4 py-2.5 font-medium">Milestone</th>
                <th class="text-left px-4 py-2.5 font-medium">Task</th>
                <th class="text-left px-4 py-2.5 font-medium">Start</th>
                <th class="text-left px-4 py-2.5 font-medium">End</th>
                <th class="text-right px-4 py-2.5 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in pagedLogs"
                :key="log.id"
                class="border-b border-border/20 last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <td class="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{{ formatDate(log.startedAt) }}</td>
                <td class="px-4 py-2.5">
                  <span :class="log.milestoneName === 'Idle' ? 'text-amber-400/80 text-xs' : 'text-muted-foreground text-xs'">
                    {{ log.milestoneName }}
                  </span>
                </td>
                <td class="px-4 py-2.5 font-medium">{{ log.subFeatureName }}</td>
                <td class="px-4 py-2.5 font-mono text-muted-foreground text-xs">{{ formatTime(log.startedAt) }}</td>
                <td class="px-4 py-2.5 font-mono text-muted-foreground text-xs">{{ formatTime(log.stoppedAt) }}</td>
                <td class="px-4 py-2.5 font-mono text-right text-xs">{{ formatDuration(log.durationMs) }}</td>
              </tr>
              <tr v-if="filteredLogs.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-sm text-muted-foreground">No results match the current filters.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 mt-4">
          <button
            @click="currentPage = 1"
            :disabled="currentPage === 1"
            class="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >«</button>
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >‹</button>
          <template v-for="p in totalPages" :key="p">
            <button
              v-if="p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2"
              @click="currentPage = p"
              :class="['px-2.5 py-1 rounded text-xs transition', p === currentPage ? 'bg-white/10 text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-white/5']"
            >{{ p }}</button>
            <span
              v-else-if="p === currentPage - 3 || p === currentPage + 3"
              class="px-1 text-xs text-muted-foreground/40"
            >…</span>
          </template>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >›</button>
          <button
            @click="currentPage = totalPages"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >»</button>
        </div>
      </template>
    </main>
  </div>
</template>
