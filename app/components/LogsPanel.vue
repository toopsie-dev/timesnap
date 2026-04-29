<script setup lang="ts">
import { useProjectsStore } from '~/stores/projects'

const props = defineProps<{ projectId: string }>()
const store = useProjectsStore()

const loading = ref(false)
const loaded = ref(false)

const logs = computed(() => store.logs[props.projectId] ?? [])

onMounted(async () => {
  if (!loaded.value) {
    loading.value = true
    await store.fetchLogs(props.projectId)
    loading.value = false
    loaded.value = true
  }
})

function formatDate(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div class="border-t border-border/50 bg-black/20">
    <!-- Loading -->
    <div v-if="loading" class="py-6 text-center text-xs text-muted-foreground animate-pulse">
      Loading history…
    </div>

    <!-- Empty -->
    <div v-else-if="logs.length === 0" class="py-6 text-center text-xs text-muted-foreground">
      No sessions logged yet. Start and stop a task to see history here.
    </div>

    <!-- Log table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-muted-foreground border-b border-border/30">
            <th class="text-left px-4 py-2 font-medium">Date</th>
            <th class="text-left px-4 py-2 font-medium">Milestone</th>
            <th class="text-left px-4 py-2 font-medium">Task</th>
            <th class="text-left px-4 py-2 font-medium">Start</th>
            <th class="text-left px-4 py-2 font-medium">End</th>
            <th class="text-right px-4 py-2 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            class="border-b border-border/20 hover:bg-white/[0.02] transition-colors"
          >
            <td class="px-4 py-2 text-muted-foreground whitespace-nowrap">{{ formatDate(log.startedAt) }}</td>
            <td class="px-4 py-2">
              <span :class="log.milestoneName === 'Idle' ? 'text-amber-400/80' : ''">
                {{ log.milestoneName }}
              </span>
            </td>
            <td class="px-4 py-2 font-medium">{{ log.subFeatureName }}</td>
            <td class="px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">{{ formatTime(log.startedAt) }}</td>
            <td class="px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">{{ formatTime(log.stoppedAt) }}</td>
            <td class="px-4 py-2 font-mono text-right whitespace-nowrap">{{ formatDuration(log.durationMs) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
