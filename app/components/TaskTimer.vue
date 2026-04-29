<script setup lang="ts">
/**
 * TaskTimer — displays a live HH:MM:SS counter.
 * Uses requestAnimationFrame so it updates smoothly without drift.
 */
import type { Task } from '~/stores/tasks'
import { useTaskStore } from '~/stores/tasks'

const props = defineProps<{ task: Task }>()

const store = useTaskStore()
const display = ref('00:00:00')
let rafId: number | null = null

function format(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function tick() {
  display.value = format(store.getLiveMs(props.task))
  if (props.task.status === 'running') {
    rafId = requestAnimationFrame(tick)
  }
}

watch(
  () => props.task.status,
  (status) => {
    if (status === 'running') {
      tick()
    } else {
      if (rafId !== null) cancelAnimationFrame(rafId)
      display.value = format(store.getLiveMs(props.task))
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <span class="font-mono text-2xl tabular-nums text-foreground">{{ display }}</span>
</template>
