<script setup lang="ts">
import { Plus, FileText, Timer } from 'lucide-vue-next'
import { useProjectsStore } from '~/stores/projects'
import ProjectRow from '~/components/ProjectRow.vue'
import CreateProjectForm from '~/components/CreateProjectForm.vue'

const router = useRouter()

const store = useProjectsStore()
const showForm = ref(false)
const activeProjectId = ref<string | null>(null)

function toggleProject(id: string) {
  activeProjectId.value = activeProjectId.value === id ? null : id
}

onMounted(() => store.fetchProjects())

const totalRunning = computed(() =>
  Object.values(store.subFeatures).flat().filter(sf => sf.status === 'running').length
)

function isProjectRunning(projectId: string): boolean {
  return Object.values(store.subFeatures)
    .flat()
    .some(sf => sf.status === 'running' && store.milestones[projectId]?.some(m => m.id === sf.milestoneId))
}

const sortedProjects = computed(() =>
  [...store.projects].sort((a, b) => {
    // Non-active projects sink to the bottom
    const aActive = a.status === 'active' ? 1 : 0
    const bActive = b.status === 'active' ? 1 : 0
    if (aActive !== bActive) return bActive - aActive
    // Among active projects, running ones float to top
    const aRunning = isProjectRunning(a.id) ? 1 : 0
    const bRunning = isProjectRunning(b.id) ? 1 : 0
    return bRunning - aRunning
  })
)
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur">
      <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 font-bold text-foreground min-w-0">
          <img src="/logo.svg" alt="TimeSnap" class="w-7 h-7 shrink-0" />
          <span class="truncate">TimeSnap</span>
          <!-- "running" badge inline with brand on mobile -->
          <span v-if="totalRunning > 0" class="sm:hidden text-xs text-emerald-400 font-normal shrink-0">
            {{ totalRunning }} running
          </span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span v-if="totalRunning > 0" class="hidden sm:block text-xs text-emerald-400 font-medium">
            {{ totalRunning }} running
          </span>
          <button
            @click="router.push('/report')"
            class="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md border border-border text-sm hover:bg-white/5 transition text-muted-foreground hover:text-foreground"
          >
            <FileText class="w-4 h-4 shrink-0" />
            <span class="hidden sm:inline">Report</span>
          </button>
          <button
            @click="showForm = !showForm"
            class="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
          >
            <Plus class="w-4 h-4 shrink-0" />
            <span class="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <!-- Create form modal -->
      <AppModal v-if="showForm" @close="showForm = false">
        <CreateProjectForm @close="showForm = false" />
      </AppModal>

      <!-- Stats -->
      <div v-if="store.projects.length" class="grid grid-cols-3 gap-3 text-center text-sm">
        <div class="rounded-lg border border-border bg-card px-3 py-2">
          <p class="text-xs text-muted-foreground">Projects</p>
          <p class="text-xl font-bold">{{ store.projects.length }}</p>
        </div>
        <div class="rounded-lg border border-border bg-card px-3 py-2">
          <p class="text-xs text-muted-foreground">Running</p>
          <p class="text-xl font-bold text-emerald-400">{{ totalRunning }}</p>
        </div>
        <div class="rounded-lg border border-border bg-card px-3 py-2">
          <p class="text-xs text-muted-foreground">Paused</p>
          <p class="text-xl font-bold text-amber-400">
            {{ Object.values(store.subFeatures).flat().filter(sf => sf.status === 'paused').length }}
          </p>
        </div>
      </div>

      <!-- Project list -->
      <div class="space-y-2">
        <ProjectRow
          v-for="project in sortedProjects"
          :key="project.id"
          :project="project"
          :is-active="activeProjectId === project.id"
          @toggle="toggleProject(project.id)"
          @delete="store.deleteProject($event)"
        />
      </div>

      <!-- Empty state -->
      <div v-if="!store.projects.length && !showForm" class="text-center py-24 text-muted-foreground">
        <Timer class="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p class="text-sm">No projects yet.</p>
        <button
          @click="showForm = true"
          class="mt-3 text-sm text-primary hover:underline"
        >
          Create your first project
        </button>
      </div>
    </main>
  </div>
</template>

