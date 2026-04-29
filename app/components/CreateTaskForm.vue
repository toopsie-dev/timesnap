<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useTaskStore } from '~/stores/tasks'
import Button from '~/components/ui/Button.vue'
import Input from '~/components/ui/Input.vue'
import Card from '~/components/ui/Card.vue'

const store = useTaskStore()
const name = ref('')
const description = ref('')
const isOpen = ref(false)
const loading = ref(false)

async function submit() {
  if (!name.value.trim()) return
  loading.value = true
  await store.createTask(name.value.trim(), description.value.trim())
  name.value = ''
  description.value = ''
  isOpen.value = false
  loading.value = false
}
</script>

<template>
  <div>
    <Button v-if="!isOpen" @click="isOpen = true" class="w-full">
      <Plus class="w-4 h-4 mr-2" />
      New Task
    </Button>

    <Card v-else class="p-5">
      <form @submit.prevent="submit" class="flex flex-col gap-3">
        <h3 class="font-semibold text-sm text-muted-foreground uppercase tracking-wider">New Task</h3>

        <Input
          v-model="name"
          placeholder="Task name"
          autofocus
          required
        />
        <Input
          v-model="description"
          placeholder="Description (optional)"
        />

        <div class="flex gap-2">
          <Button type="submit" :disabled="loading || !name.trim()" class="flex-1">
            {{ loading ? 'Creating…' : 'Create Task' }}
          </Button>
          <Button type="button" variant="ghost" @click="isOpen = false">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>
