<script setup lang="ts">
import type { Task } from '~/stores/tasks'
import { useTaskStore } from '~/stores/tasks'
import { Play, Pause, Square, Trash2 } from 'lucide-vue-next'
import Card from '~/components/ui/Card.vue'
import Badge from '~/components/ui/Badge.vue'
import Button from '~/components/ui/Button.vue'
import TaskTimer from '~/components/TaskTimer.vue'

const props = defineProps<{ task: Task }>()
const store = useTaskStore()

const statusVariant = computed(() => {
  switch (props.task.status) {
    case 'running': return 'success'
    case 'paused': return 'warning'
    default: return 'secondary'
  }
})

const statusLabel = computed(() => {
  switch (props.task.status) {
    case 'running': return 'Running'
    case 'paused': return 'Paused'
    default: return 'Idle'
  }
})
</script>

<template>
  <Card class="p-5 flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-base truncate">{{ task.name }}</h3>
        <p v-if="task.description" class="text-sm text-muted-foreground mt-0.5 line-clamp-2">
          {{ task.description }}
        </p>
      </div>
      <Badge :variant="statusVariant">{{ statusLabel }}</Badge>
    </div>

    <!-- Timer display -->
    <div class="flex items-center justify-center bg-muted/40 rounded-md py-4">
      <TaskTimer :task="task" />
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-2">
      <!-- Start / Resume -->
      <Button
        v-if="task.status !== 'running'"
        size="sm"
        class="flex-1"
        @click="store.startTask(task.id)"
      >
        <Play class="w-4 h-4 mr-1.5" />
        {{ task.status === 'paused' ? 'Resume' : 'Start' }}
      </Button>

      <!-- Pause -->
      <Button
        v-if="task.status === 'running'"
        variant="secondary"
        size="sm"
        class="flex-1"
        @click="store.pauseTask(task.id)"
      >
        <Pause class="w-4 h-4 mr-1.5" />
        Pause
      </Button>

      <!-- Stop -->
      <Button
        v-if="task.status !== 'idle'"
        variant="outline"
        size="sm"
        @click="store.stopTask(task.id)"
      >
        <Square class="w-4 h-4" />
      </Button>

      <!-- Delete -->
      <Button
        variant="ghost"
        size="icon"
        class="ml-auto text-muted-foreground hover:text-destructive"
        @click="store.deleteTask(task.id)"
      >
        <Trash2 class="w-4 h-4" />
      </Button>
    </div>
  </Card>
</template>
