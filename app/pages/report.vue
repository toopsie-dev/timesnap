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
    <header class="border-b border-border/50 px-6 py-4 flex items-center gap-4 print:hidden">
      <button @click="selectedProject ? clearSelection() : router.back()" class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition text-sm">
        <ArrowLeft class="w-4 h-4" />
        {{ selectedProject ? 'Back to Project List' : 'Back' }}
      </button>
      <div class="flex-1">
        <p class="text-xs text-muted-foreground">{{ selectedProject ? formatDate(Date.now()) : 'Select a project to generate a report' }}</p>
        <h1 class="font-semibold">{{ selectedProject ? selectedProject.name : 'Project Report' }}</h1>
      </div>
      <button v-if="selectedProject" @click="printReport()" class="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-white/5 transition">
        <Printer class="w-4 h-4" />
        Print / Export PDF
      </button>
    </header>

    <div v-if="selectedProject" class="hidden print:block px-8 pt-8 pb-4">
      <h1 class="text-2xl font-bold">{{ selectedProject.name }}</h1>
      <p class="text-sm text-muted-foreground mt-1">Report generated {{ formatDate(Date.now()) }}</p>
    </div>

    <main class="max-w-5xl mx-auto px-4 py-8 print:px-8 print:py-4">
      <template v-if="!selectedProject">
        <div v-if="loadingList" class="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading completed projects...</div>
        <div v-else-if="completedProjects.length === 0" class="text-center py-16">
          <FileText class="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p class="text-muted-foreground text-sm">No completed projects found.</p>
          <p class="text-muted-foreground/50 text-xs mt-1">Mark a project as Completed to generate a report.</p>
        </div>
        <div v-else class="space-y-3">
          <p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">Completed Projects</p>
          <button v-for="p in completedProjects" :key="p.id" @click="selectProject(p.id)" class="w-full flex items-center justify-between px-5 py-4 rounded-lg border border-border bg-card hover:bg-white/5 hover:border-sky-900/60 transition text-left group">
            <div class="min-w-0">
              <p class="font-semibold truncate group-hover:text-sky-400 transition">{{ p.name }}</p>
              <p v-if="p.description" class="text-xs text-muted-foreground mt-0.5 truncate">{{ p.description }}</p>
              <p class="text-xs text-muted-foreground mt-1">Completed {{ formatDate(p.updatedAt) }}</p>
            </div>
            <div class="text-right shrink-0 ml-4">
              <p class="font-mono font-bold tabular-nums">{{ formatMs(p.totalMs) }}</p>
              <p v-if="p.estimatedHours" class="text-xs text-muted-foreground mt-0.5">Est. {{ p.estimatedHours }}h</p>
              <span class="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">Completed</span>
            </div>
          </button>
        </div>
        <div v-if="loadingReport" class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <p class="text-sm text-muted-foreground animate-pulse">Generating report...</p>
        </div>
      </template>

      <template v-else>
        <section>
          <div class="flex items-start justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">Completed</span>
              </div>
              <h2 class="text-xl font-bold">{{ selectedProject.name }}</h2>
              <p v-if="selectedProject.description" class="text-sm text-muted-foreground mt-1">{{ selectedProject.description }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-2xl font-mono font-bold">{{ formatMs(selectedProject.totalMs) }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">Total Time</p>
              <p v-if="selectedProject.estimatedHours" class="text-xs mt-1">
                Est. {{ selectedProject.estimatedHours }}h &middot;
                <span :class="utilizationColor(utilization(selectedProject.totalMs, selectedProject.estimatedHours)!)">{{ utilization(selectedProject.totalMs, selectedProject.estimatedHours) }}% utilization</span>
              </p>
            </div>
          </div>

          <div class="mb-8">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Milestone Breakdown</h3>
            <div class="rounded-lg border border-border overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border/40 text-xs text-muted-foreground bg-white/[0.02]">
                    <th class="text-left px-4 py-2.5 font-medium">Milestone</th>
                    <th class="text-left px-4 py-2.5 font-medium">Task</th>
                    <th class="text-right px-4 py-2.5 font-medium">Est.</th>
                    <th class="text-right px-4 py-2.5 font-medium">Actual</th>
                    <th class="text-right px-4 py-2.5 font-medium">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="m in selectedProject.milestones" :key="m.id">
                    <tr class="border-b border-border/20 bg-white/[0.015]">
                      <td class="px-4 py-2 font-semibold text-sm">{{ m.name }}</td>
                      <td class="px-4 py-2 text-xs text-muted-foreground"></td>
                      <td class="px-4 py-2 text-right text-xs text-muted-foreground">{{ m.estimatedHours ? `${m.estimatedHours}h` : '—' }}</td>
                      <td class="px-4 py-2 text-right font-mono text-xs font-semibold">{{ formatMs(m.totalMs) }}</td>
                      <td class="px-4 py-2 text-right text-xs">
                        <span v-if="utilization(m.totalMs, m.estimatedHours) !== null" :class="utilizationColor(utilization(m.totalMs, m.estimatedHours)!)">{{ utilization(m.totalMs, m.estimatedHours) }}%</span>
                        <span v-else class="text-muted-foreground">—</span>
                      </td>
                    </tr>
                    <tr v-for="sf in m.subFeatures" :key="sf.id" class="border-b border-border/10 last:border-0">
                      <td class="px-4 py-1.5 pl-8 text-xs text-muted-foreground"></td>
                      <td class="px-4 py-1.5 text-xs">{{ sf.name }}</td>
                      <td class="px-4 py-1.5 text-right text-xs text-muted-foreground">{{ sf.estimatedHours ? `${sf.estimatedHours}h` : '—' }}</td>
                      <td class="px-4 py-1.5 text-right font-mono text-xs">{{ formatMs(sf.totalMs) }}</td>
                      <td class="px-4 py-1.5 text-right text-xs">
                        <span v-if="utilization(sf.totalMs, sf.estimatedHours) !== null" :class="utilizationColor(utilization(sf.totalMs, sf.estimatedHours)!)">{{ utilization(sf.totalMs, sf.estimatedHours) }}%</span>
                        <span v-else class="text-muted-foreground">—</span>
                      </td>
                    </tr>
                  </template>
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

          <div v-if="selectedProject.logs.length > 0">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Session Log</h3>
            <div class="rounded-lg border border-border overflow-hidden">
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
