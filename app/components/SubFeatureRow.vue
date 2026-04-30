<script setup lang="ts">
import { Play, Pause, Square } from 'lucide-vue-next'
import type { SubFeature } from '~/stores/projects'
import { useProjectsStore } from '~/stores/projects'

const props = defineProps<{ subFeature: SubFeature }>()
const store = useProjectsStore()

const statusColor = computed(() => {
  store.now // reactive dependency for live update
  const liveMs = store.getSubFeatureLiveMs(props.subFeature)
  const estimatedMs = props.subFeature.estimatedHours ? props.subFeature.estimatedHours * 3600 * 1000 : null
  if (estimatedMs && liveMs >= estimatedMs) return 'text-red-400'
  return ({
    running: 'text-emerald-400',
    paused:  'text-amber-400',
    idle:    'text-muted-foreground',
  })[props.subFeature.status]
})

const estimatedLabel = computed(() => {
  const h = props.subFeature.estimatedHours
  if (!h) return null
  return h < 1 ? `${Math.round(h * 60)}m est.` : `${h}h est.`
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between py-2 px-3 rounded-md hover:bg-white/5 group transition-colors">
      <!-- Left: dot + name + estimate -->
      <div class="flex items-center gap-2 min-w-0">
        <span :class="['w-1.5 h-1.5 rounded-full shrink-0', {
          'bg-emerald-400 animate-pulse': subFeature.status === 'running',
          'bg-amber-400': subFeature.status === 'paused',
          'bg-muted-foreground/40': subFeature.status === 'idle',
        }]" />
        <span class="text-sm truncate">{{ subFeature.name }}</span>
        <span v-if="estimatedLabel" class="hidden sm:inline text-xs text-muted-foreground shrink-0">
          {{ estimatedLabel }}
        </span>
      </div>

      <!-- Right: controls + timer -->
      <div class="flex items-center gap-1.5 shrink-0 ml-2">
        <!-- Start — always visible on mobile, hover-reveal on desktop -->
        <button
          v-if="subFeature.status !== 'running'"
          @click="store.startSubFeature(subFeature)"
          class="p-1.5 rounded hover:bg-white/10 text-emerald-400 transition sm:opacity-0 sm:group-hover:opacity-100"
          title="Start"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
        </button>

        <!-- Pause — always visible when running -->
        <button
          v-if="subFeature.status === 'running'"
          @click="store.pauseSubFeature(subFeature)"
          class="p-1.5 rounded hover:bg-white/10 text-amber-400 transition"
          title="Pause"
        >
          <Pause class="w-3.5 h-3.5 fill-current" />
        </button>

        <!-- Stop — always visible on mobile, hover-reveal on desktop -->
        <button
          v-if="subFeature.status !== 'idle'"
          @click="store.stopSubFeature(subFeature)"
          class="p-1.5 rounded hover:bg-white/10 text-muted-foreground transition sm:opacity-0 sm:group-hover:opacity-100"
          title="Stop"
        >
          <Square class="w-3.5 h-3.5 fill-current" />
        </button>

        <SubFeatureTimer :sub-feature="subFeature" :class="['text-sm font-mono tabular-nums', statusColor]" />
      </div>
    </div>
  </div>
</template>
