<script setup lang="ts">
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useProjectsStore } from '~/stores/projects'

const emit = defineEmits<{ close: [] }>()
const store = useProjectsStore()

interface SubFeatureForm {
  name: string
  estimatedHours: string
}

interface MilestoneForm {
  name: string
  subFeatures: SubFeatureForm[]
  collapsed: boolean
}

const projectName = ref('')
const projectDescription = ref('')
const milestoneList = ref<MilestoneForm[]>([
  { name: '', subFeatures: [{ name: '', estimatedHours: '' }], collapsed: false },
])
const loading = ref(false)

function addMilestone() {
  milestoneList.value.push({
    name: '',
    subFeatures: [{ name: '', estimatedHours: '' }],
    collapsed: false,
  })
}

function removeMilestone(i: number) {
  milestoneList.value.splice(i, 1)
}

function addSubFeature(mi: number) {
  milestoneList.value[mi]!.subFeatures.push({ name: '', estimatedHours: '' })
}

function removeSubFeature(mi: number, si: number) {
  milestoneList.value[mi]!.subFeatures.splice(si, 1)
}

const canSubmit = computed(() =>
  projectName.value.trim() !== '' &&
  milestoneList.value.every(m =>
    m.name.trim() !== '' &&
    m.subFeatures.every(sf => sf.name.trim() !== '')
  )
)

async function submit() {
  if (!canSubmit.value || loading.value) return
  loading.value = true
  try {
    await store.createProject({
      name: projectName.value.trim(),
      description: projectDescription.value.trim(),
      milestones: milestoneList.value.map(m => ({
        name: m.name.trim(),
        subFeatures: m.subFeatures
          .filter(sf => sf.name.trim())
          .map(sf => ({
            name: sf.name.trim(),
            estimatedHours: sf.estimatedHours ? parseFloat(sf.estimatedHours) : undefined,
          })),
      })),
    })
    emit('close')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Header -->
  <div class="flex items-center justify-between px-5 py-4 border-b border-border/60">
    <h2 class="font-semibold text-sm">New Project</h2>
    <button @click="emit('close')" class="p-1 rounded hover:bg-white/10 text-muted-foreground transition">
      <X class="w-4 h-4" />
    </button>
  </div>

  <!-- Body -->
  <div class="px-5 py-4 space-y-5 overflow-y-auto flex-1">
    <!-- Project fields -->
    <div class="space-y-3">
      <div>
        <label class="text-xs text-muted-foreground mb-1 block">Project name *</label>
        <input
          v-model="projectName"
          placeholder="e.g. Automated DPR Improvement"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div>
        <label class="text-xs text-muted-foreground mb-1 block">Description</label>
        <input
          v-model="projectDescription"
          placeholder="Optional description"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>

    <!-- Milestones -->
    <div class="space-y-3">
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Milestones</p>

      <div
        v-for="(m, mi) in milestoneList"
        :key="mi"
        class="rounded-md border border-border/60 bg-background/40 overflow-hidden"
      >
        <!-- Milestone header -->
        <div class="flex items-center gap-2 px-3 py-2 bg-white/3">
          <button
            type="button"
            @click="m.collapsed = !m.collapsed"
            class="text-muted-foreground hover:text-foreground transition"
          >
            <ChevronDown v-if="!m.collapsed" class="w-3.5 h-3.5" />
            <ChevronUp v-else class="w-3.5 h-3.5" />
          </button>
          <input
            v-model="m.name"
            :placeholder="`Milestone ${mi + 1} name *`"
            class="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            @click="removeMilestone(mi)"
            :disabled="milestoneList.length === 1"
            class="text-muted-foreground hover:text-destructive disabled:opacity-30 transition"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Sub-features -->
        <div v-if="!m.collapsed" class="px-3 pb-2 space-y-1 pt-1">
          <p class="text-[11px] text-muted-foreground mb-2">Sub-features</p>

          <div
            v-for="(sf, si) in m.subFeatures"
            :key="si"
            class="flex items-center gap-2 group"
          >
            <span class="text-muted-foreground/40 text-xs w-4 text-right shrink-0">{{ si + 1 }}</span>
            <input
              v-model="sf.name"
              :placeholder="`Sub-feature name *`"
              class="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50 border-b border-transparent focus:border-border/60 transition py-1"
            />
            <input
              v-model="sf.estimatedHours"
              type="number"
              min="0"
              step="0.5"
              placeholder="Est. h"
              class="w-16 bg-transparent text-sm text-right focus:outline-none placeholder:text-muted-foreground/50 border-b border-transparent focus:border-border/60 transition py-1"
            />
            <button
              type="button"
              @click="removeSubFeature(mi, si)"
              :disabled="m.subFeatures.length === 1"
              class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive disabled:opacity-20 transition"
            >
              <X class="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            @click="addSubFeature(mi)"
            class="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <Plus class="w-3 h-3" /> Add sub-feature
          </button>
        </div>
      </div>

      <button
        type="button"
        @click="addMilestone"
        class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <Plus class="w-3.5 h-3.5" /> Add milestone
      </button>
    </div>
  </div>

  <!-- Footer -->
  <div class="flex items-center justify-end gap-3 px-5 py-3 border-t border-border/60">
    <button
      type="button"
      @click="emit('close')"
      class="px-4 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
    >
      Cancel
    </button>
    <button
      type="button"
      @click="submit"
      :disabled="!canSubmit || loading"
      class="px-4 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
    >
      {{ loading ? 'Creating...' : 'Create Project' }}
    </button>
  </div>
</template>
