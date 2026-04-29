<script setup lang="ts">
import type { SubFeature } from '~/stores/projects'

const props = defineProps<{ subFeature: SubFeature }>()

const display = ref('00:00:00')
let rafId: number | null = null

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function loop() {
  const sf = props.subFeature
  display.value = formatMs(
    sf.status === 'running' && sf.startedAt
      ? sf.totalMs + (Date.now() - sf.startedAt)
      : sf.totalMs
  )
  if (sf.status === 'running') {
    rafId = requestAnimationFrame(loop)
  } else {
    rafId = null
  }
}

watch(
  () => props.subFeature.status,
  () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    loop()
  },
  { immediate: true }
)

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <span class="font-mono tabular-nums">{{ display }}</span>
</template>
