<script setup lang="ts">
import { X, Plus, Trash2 } from 'lucide-vue-next'
import type { Milestone, SubFeature } from '~/stores/projects'
import { useProjectsStore } from '~/stores/projects'

const props = defineProps<{ milestone: Milestone }>()
const emit = defineEmits<{ close: [] }>()
const store = useProjectsStore()

// ── Load sub-features if needed ───────────────────────────────
const sfList = computed(() => store.subFeatures[props.milestone.id] ?? [])
const loading = ref(false)
onMounted(async () => {
  if (!store.subFeatures[props.milestone.id]) {
    loading.value = true
    await store.fetchSubFeatures(props.milestone.id)
    loading.value = false
  }
})

// ── Editable copies ───────────────────────────────────────────
interface SfEdit { id: string; name: string; estimatedHours: string }

const milestoneName = ref(props.milestone.name)
const sfEdits = ref<SfEdit[]>([])

watch(sfList, (list) => {
  // Populate edits once sub-features load; preserve any in-progress edits
  sfEdits.value = list.map(sf => ({
    id: sf.id,
    name: sf.name,
    estimatedHours: sf.estimatedHours != null ? String(sf.estimatedHours) : '',
  }))
}, { immediate: true })

const saving = ref(false)
const canSave = computed(() =>
  milestoneName.value.trim() !== '' &&
  sfEdits.value.every(sf => sf.name.trim() !== '')
)

async function save() {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    // Save milestone name if changed
    if (milestoneName.value.trim() !== props.milestone.name) {
      await store.updateMilestone(props.milestone.id, milestoneName.value.trim())
    }
    // Save sub-feature edits
    const original = sfList.value
    for (const edit of sfEdits.value) {
      const orig = original.find(sf => sf.id === edit.id)
      if (!orig) continue
      const newName = edit.name.trim()
      const newEh = edit.estimatedHours ? parseFloat(edit.estimatedHours) : null
      if (newName !== orig.name || newEh !== orig.estimatedHours) {
        await store.updateSubFeatureDetails(edit.id, { name: newName, estimatedHours: newEh })
      }
    }
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
      <h2 class="font-semibold text-sm">Edit Milestone</h2>
      <button @click="emit('close')" class="p-1 rounded hover:bg-white/10 text-muted-foreground transition">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Body -->
    <div class="px-5 py-4 space-y-4 overflow-y-auto flex-1">
      <!-- Milestone name -->
      <div>
        <label class="text-xs text-muted-foreground mb-1 block">Milestone name *</label>
        <input
          v-model="milestoneName"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          autofocus
        />
      </div>

      <!-- Sub-features -->
      <div>
        <p class="text-xs text-muted-foreground mb-2">Sub-features</p>
        <div v-if="loading" class="text-xs text-muted-foreground animate-pulse py-2">Loading…</div>
        <div v-else class="space-y-2">
          <div
            v-for="(sf, i) in sfEdits"
            :key="sf.id"
            class="flex items-center gap-2"
          >
            <span class="text-xs text-muted-foreground/40 w-4 text-right flex-shrink-0">{{ i + 1 }}</span>
            <input
              v-model="sf.name"
              placeholder="Sub-feature name *"
              class="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              v-model="sf.estimatedHours"
              type="number"
              min="0"
              step="0.5"
              placeholder="Est. h"
              class="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <p v-if="sfEdits.length === 0" class="text-xs text-muted-foreground/60 py-1">No sub-features.</p>
        </div>
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
        :disabled="!canSave || saving"
        class="px-4 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
      >{{ saving ? 'Saving…' : 'Save' }}</button>
    </div>
  </AppModal>
</template>
