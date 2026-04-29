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
        <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', {
          'bg-emerald-400 animate-pulse': subFeature.status === 'running',
          'bg-amber-400': subFeature.status === 'paused',
          'bg-muted-foreground/40': subFeature.status === 'idle',
        }]" />
        <span class="text-sm truncate">{{ subFeature.name }}</span>
        <span v-if="estimatedLabel" class="text-xs text-muted-foreground flex-shrink-0">
          {{ estimatedLabel }}
        </span>
      </div>

      <!-- Right: controls + timer -->
      <div class="flex items-center gap-2 flex-shrink-0 ml-4">
        <!-- Start -->
        <button
          v-if="subFeature.status !== 'running'"
          @click="store.startSubFeature(subFeature)"
          class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-emerald-400 transition"
          title="Start"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
        </button>

        <!-- Pause -->
        <button
          v-if="subFeature.status === 'running'"
          @click="store.pauseSubFeature(subFeature)"
          class="p-1 rounded hover:bg-white/10 text-amber-400 transition"
          title="Pause"
        >
          <Pause class="w-3.5 h-3.5 fill-current" />
        </button>

        <!-- Stop -->
        <button
          v-if="subFeature.status !== 'idle'"
          @click="store.stopSubFeature(subFeature)"
          class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-muted-foreground transition"
          title="Stop"
        >
          <Square class="w-3.5 h-3.5 fill-current" />
        </button>

        <SubFeatureTimer :sub-feature="subFeature" :class="['text-sm', statusColor]" />
      </div>
    </div>
  </div>
</template>
