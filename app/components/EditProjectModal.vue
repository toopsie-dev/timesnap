<script setup lang="ts">
import { X, Check } from 'lucide-vue-next'
import type { Project } from '~/stores/projects'
import { useProjectsStore } from '~/stores/projects'

const props = defineProps<{ project: Project }>()
const emit = defineEmits<{ close: [] }>()
const store = useProjectsStore()

const editName = ref(props.project.name)
const editDesc = ref(props.project.description)
const saving = ref(false)

async function save() {
  if (!editName.value.trim() || saving.value) return
  saving.value = true
  try {
    await store.updateProject(props.project.id, {
      name: editName.value.trim(),
      description: editDesc.value.trim(),
    })
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppModal @close="emit('close')">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-border/60">
      <h2 class="font-semibold text-sm">Edit Project</h2>
      <button @click="emit('close')" class="p-1 rounded hover:bg-white/10 text-muted-foreground transition">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Body -->
    <div class="px-5 py-4 space-y-3 overflow-y-auto">
      <div>
        <label class="text-xs text-muted-foreground mb-1 block">Project name *</label>
        <input
          v-model="editName"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          @keydown.enter="save"
          @keydown.escape="emit('close')"
          autofocus
        />
      </div>
      <div>
        <label class="text-xs text-muted-foreground mb-1 block">Description</label>
        <input
          v-model="editDesc"
          placeholder="Optional"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          @keydown.enter="save"
          @keydown.escape="emit('close')"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/60">
      <button
        @click="emit('close')"
        class="px-4 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
      >Cancel</button>
      <button
        @click="save"
        :disabled="!editName.trim() || saving"
        class="px-4 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
      >{{ saving ? 'Saving…' : 'Save' }}</button>
    </div>
  </AppModal>
</template>
