<script setup lang="ts">
import { ArrowLeft, Printer, FileText } from 'lucide-vue-next'

const router = useRouter()

interface CompletedProject {
  id: string
  name: string
  description: string
  totalMs: number
  estimatedHours: number | null
  updatedAt: number
}

interface SubFeatureReport {
  id: string
  name: string
  estimatedHours: number | null
  totalMs: number
  notes: string
}

interface MilestoneReport {
  id: string
  name: string
  estimatedHours: number | null
  totalMs: number
  subFeatures: SubFeatureReport[]
}

interface LogEntry {
  milestoneName: string
  taskName: string
  startedAt: number
  stoppedAt: number
  durationMs: number
}

interface ProjectReport {
  id: string
  name: string
  description: string
  estimatedHours: number | null
  totalMs: number
  milestones: MilestoneReport[]
  logs: LogEntry[]
}

const loadingList = ref(true)
const completedProjects = ref<CompletedProject[]>([])
const selectedProject = ref<ProjectReport | null>(null)
const loadingReport = ref(false)

onMounted(async () => {
  try {
    const data = await $fetch<CompletedProject[]>('/api/report')
    completedProjects.value = Array.isArray(data) ? data : []
  } catch {
    completedProjects.value = []
  } finally {
    loadingList.value = false
  }
})

async function selectProject(id: string) {
  loadingReport.value = true
  selectedProject.value = null
  try {
    const data = await $fetch<ProjectReport>(`/api/projects/${id}/report`)
    selectedProject.value = data ?? null
  } catch {
    selectedProject.value = null
  } finally {
    loadingReport.value = false
  }
}

function clearSelection() {
  selectedProject.value = null
}

function printReport() {
  window.print()
}

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function utilization(totalMs: number, estimatedHours: number | null): number | null {
  if (!estimatedHours) return null
  return Math.round((totalMs / (estimatedHours * 3600000)) * 100)
}

function utilizationColor(pct: number): string {
  if (pct > 110) return 'text-red-400'
  if (pct > 90) return 'text-amber-400'
  return 'text-emerald-400'
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <header class="border-b border-border/50 sticky top-0 z-10 bg-background/80 backdrop-blur print:hidden">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <!-- Back -->
        <button
          @click="selectedProject ? clearSelection() : router.back()"
          class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition text-sm shrink-0"
        >
          <ArrowLeft class="w-4 h-4" />
          <span class="hidden sm:inline">{{ selectedProject ? 'Back to Project List' : 'Back' }}</span>
        </button>

        <!-- Title block -->
        <div class="flex-1 min-w-0">
          <p class="text-xs text-muted-foreground leading-none mb-0.5">
            {{ selectedProject ? formatDate(Date.now()) : 'Select a project' }}
          </p>
          <h1 class="font-semibold text-sm sm:text-base leading-snug truncate">
            {{ selectedProject ? selectedProject.name : 'Project Report' }}
          </h1>
        </div>

        <!-- Print -->
        <button
          v-if="selectedProject"
          @click="printReport()"
          class="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md border border-border text-sm hover:bg-white/5 transition shrink-0"
        >
          <Printer class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline">Print / Export PDF</span>
        </button>
      </div>
    </header>

    <!-- Print-only title block -->
    <div v-if="selectedProject" class="hidden print:block px-8 pt-8 pb-4">
      <h1 class="text-2xl font-bold">{{ selectedProject.name }}</h1>
      <p class="text-sm text-muted-foreground mt-1">Report generated {{ formatDate(Date.now()) }}</p>
    </div>

    <main class="max-w-5xl mx-auto px-4 py-6 sm:py-8 print:px-8 print:py-4">

      <!-- ── Project list ──────────────────────────────────────────────── -->
      <template v-if="!selectedProject">
        <div v-if="loadingList" class="text-center py-16 text-muted-foreground text-sm animate-pulse">
          Loading completed projects…
        </div>
        <div v-else-if="completedProjects.length === 0" class="text-center py-16">
          <FileText class="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p class="text-muted-foreground text-sm">No completed projects found.</p>
          <p class="text-muted-foreground/50 text-xs mt-1">Mark a project as Completed to generate a report.</p>
        </div>
        <div v-else class="space-y-3">
          <p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">Completed Projects</p>
          <button
            v-for="p in completedProjects"
            :key="p.id"
            @click="selectProject(p.id)"
            class="w-full rounded-lg border border-border bg-card hover:bg-white/5 hover:border-sky-900/60 transition text-left group px-4 py-4"
          >
            <!-- Top row: name + time -->
            <div class="flex items-start justify-between gap-3">
              <p class="font-semibold group-hover:text-sky-400 transition leading-snug break-words min-w-0">{{ p.name }}</p>
              <p class="font-mono font-bold tabular-nums text-sm shrink-0">{{ formatMs(p.totalMs) }}</p>
            </div>
            <!-- Bottom row: meta -->
            <div class="flex items-center justify-between gap-2 mt-2 flex-wrap">
              <div class="min-w-0">
                <p v-if="p.description" class="text-xs text-muted-foreground truncate">{{ p.description }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">Completed {{ formatDate(p.updatedAt) }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <p v-if="p.estimatedHours" class="text-xs text-muted-foreground">Est. {{ p.estimatedHours }}h</p>
                <span class="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">Completed</span>
              </div>
            </div>
          </button>
        </div>

        <div v-if="loadingReport" class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <p class="text-sm text-muted-foreground animate-pulse">Generating report…</p>
        </div>
      </template>

      <!-- ── Report detail ─────────────────────────────────────────────── -->
      <template v-else>
        <section class="space-y-8">

          <!-- Summary card -->
          <div class="rounded-lg border border-border bg-card px-4 py-4 sm:px-6">
            <div class="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
              <!-- Left: status + name + description -->
              <div class="min-w-0">
                <span class="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">Completed</span>
                <h2 class="text-lg sm:text-xl font-bold mt-2 leading-snug">{{ selectedProject.name }}</h2>
                <p v-if="selectedProject.description" class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ selectedProject.description }}</p>
              </div>
              <!-- Right: time stats -->
              <div class="shrink-0 sm:text-right">
                <p class="text-2xl sm:text-3xl font-mono font-bold tabular-nums">{{ formatMs(selectedProject.totalMs) }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">Total Time</p>
                <p v-if="selectedProject.estimatedHours" class="text-xs mt-1">
                  Est. {{ selectedProject.estimatedHours }}h &middot;
                  <span :class="utilizationColor(utilization(selectedProject.totalMs, selectedProject.estimatedHours)!)">
                    {{ utilization(selectedProject.totalMs, selectedProject.estimatedHours) }}% utilization
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Milestone Breakdown -->
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Milestone Breakdown</h3>
            <div class="rounded-lg border border-border overflow-x-auto">
              <table class="w-full text-sm min-w-[480px]">
                <thead>
                  <tr class="border-b border-border/40 text-xs text-muted-foreground bg-white/[0.02]">
                    <th class="text-left px-4 py-2.5 font-medium">Milestone</th>
                    <th class="text-left px-4 py-2.5 font-medium">Task</th>
                    <th class="text-right px-4 py-2.5 font-medium">Est.</th>
                    <th class="text-right px-4 py-2.5 font-medium">Actual</th>
                    <th class="text-right px-4 py-2.5 font-medium">Util.</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="m in selectedProject.milestones" :key="m.id">
                    <!-- Milestone row -->
                    <tr class="border-b border-border/20 bg-white/[0.015]">
                      <td class="px-4 py-2 font-semibold text-sm" colspan="1">{{ m.name }}</td>
                      <td class="px-4 py-2 text-xs text-muted-foreground"></td>
                      <td class="px-4 py-2 text-right text-xs text-muted-foreground">{{ m.estimatedHours ? `${m.estimatedHours}h` : '—' }}</td>
                      <td class="px-4 py-2 text-right font-mono text-xs font-semibold">{{ formatMs(m.totalMs) }}</td>
                      <td class="px-4 py-2 text-right text-xs">
                        <span v-if="utilization(m.totalMs, m.estimatedHours) !== null" :class="utilizationColor(utilization(m.totalMs, m.estimatedHours)!)">{{ utilization(m.totalMs, m.estimatedHours) }}%</span>
                        <span v-else class="text-muted-foreground">—</span>
                      </td>
                    </tr>
                    <!-- Sub-feature rows -->
                    <tr v-for="sf in m.subFeatures" :key="sf.id" class="border-b border-border/10 last:border-0">
                      <td class="px-4 py-1.5 text-xs text-muted-foreground"></td>
                      <td class="px-4 py-1.5 text-xs pl-6">{{ sf.name }}</td>
                      <td class="px-4 py-1.5 text-right text-xs text-muted-foreground">{{ sf.estimatedHours ? `${sf.estimatedHours}h` : '—' }}</td>
                      <td class="px-4 py-1.5 text-right font-mono text-xs">{{ formatMs(sf.totalMs) }}</td>
                      <td class="px-4 py-1.5 text-right text-xs">
                        <span v-if="utilization(sf.totalMs, sf.estimatedHours) !== null" :class="utilizationColor(utilization(sf.totalMs, sf.estimatedHours)!)">{{ utilization(sf.totalMs, sf.estimatedHours) }}%</span>
                        <span v-else class="text-muted-foreground">—</span>
                      </td>
                    </tr>
                  </template>
                  <!-- Total row -->
                  <tr class="border-t border-border/40 bg-white/[0.02]">
                    <td class="px-4 py-2.5 font-bold text-sm" colspan="3">Total</td>
                    <td class="px-4 py-2.5 text-right font-mono font-bold text-sm">{{ formatMs(selectedProject.totalMs) }}</td>
                    <td class="px-4 py-2.5 text-right text-sm">
                      <span v-if="utilization(selectedProject.totalMs, selectedProject.estimatedHours) !== null" :class="['font-semibold', utilizationColor(utilization(selectedProject.totalMs, selectedProject.estimatedHours)!)]">{{ utilization(selectedProject.totalMs, selectedProject.estimatedHours) }}%</span>
                      <span v-else class="text-muted-foreground">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Session Log -->
          <div v-if="selectedProject.logs.length > 0">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Session Log</h3>

            <!-- Desktop table -->
            <div class="hidden sm:block rounded-lg border border-border overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border/40 text-xs text-muted-foreground bg-white/[0.02]">
                    <th class="text-left px-4 py-2.5 font-medium">Date</th>
                    <th class="text-left px-4 py-2.5 font-medium">Milestone</th>
                    <th class="text-left px-4 py-2.5 font-medium">Task</th>
                    <th class="text-left px-4 py-2.5 font-medium">Start</th>
                    <th class="text-left px-4 py-2.5 font-medium">End</th>
                    <th class="text-right px-4 py-2.5 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, li) in selectedProject.logs" :key="li" class="border-b border-border/20 last:border-0">
                    <td class="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{{ formatDate(log.startedAt) }}</td>
                    <td class="px-4 py-2 text-xs text-muted-foreground">{{ log.milestoneName }}</td>
                    <td class="px-4 py-2 text-xs font-medium">{{ log.taskName }}</td>
                    <td class="px-4 py-2 font-mono text-xs text-muted-foreground">{{ formatTime(log.startedAt) }}</td>
                    <td class="px-4 py-2 font-mono text-xs text-muted-foreground">{{ formatTime(log.stoppedAt) }}</td>
                    <td class="px-4 py-2 font-mono text-xs text-right">{{ formatMs(log.durationMs) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile cards -->
            <div class="sm:hidden space-y-2">
              <div
                v-for="(log, li) in selectedProject.logs"
                :key="li"
                class="rounded-lg border border-border bg-card px-4 py-3 space-y-1"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs text-muted-foreground">{{ formatDate(log.startedAt) }}</span>
                  <span class="font-mono text-xs font-semibold">{{ formatMs(log.durationMs) }}</span>
                </div>
                <p class="text-sm font-medium leading-snug">{{ log.taskName }}</p>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs text-muted-foreground">{{ log.milestoneName }}</span>
                  <span class="font-mono text-xs text-muted-foreground">{{ formatTime(log.startedAt) }} – {{ formatTime(log.stoppedAt) }}</span>
                </div>
              </div>
            </div>
          </div>

        </section>
      </template>
    </main>
  </div>
</template>

<style>
@media print {
  body { background: white !important; color: black !important; }
  .border-border { border-color: #ddd !important; }
  .text-muted-foreground { color: #666 !important; }
  .bg-card, .bg-white\/\[0\.02\], .bg-white\/\[0\.015\] { background: #f9f9f9 !important; }
}
</style>
