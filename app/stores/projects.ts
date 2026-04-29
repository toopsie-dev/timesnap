import { defineStore } from 'pinia'

export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'cancelled'
  totalMs: number
  estimatedHours: number | null
  createdAt: number
  updatedAt: number
}

export interface Milestone {
  id: string
  projectId: string
  name: string
  description: string
  estimatedHours: number | null
  totalMs: number
  createdAt: number
  updatedAt: number
}

export interface SubFeature {
  id: string
  milestoneId: string
  name: string
  description: string
  estimatedHours: number | null
  status: 'idle' | 'running' | 'paused'
  totalMs: number
  startedAt: number | null
  notes: string
  createdAt: number
  updatedAt: number
}

export interface Log {
  id: string
  subFeatureId: string
  subFeatureName: string
  milestoneName: string
  startedAt: number
  stoppedAt: number
  durationMs: number
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const milestones = ref<Record<string, Milestone[]>>({})        // projectId → milestones
  const logs = ref<Record<string, Log[]>>({})                    // projectId → logs
  const subFeatures = ref<Record<string, SubFeature[]>>({})      // milestoneId → subFeatures

  // Live tick — updates every second whenever any sub-feature is running
  const now = ref(Date.now())
  let _ticker: ReturnType<typeof setInterval> | null = null

  function _syncTicker() {
    const anyRunning = Object.values(subFeatures.value)
      .flat()
      .some(sf => sf.status === 'running')

    if (anyRunning && !_ticker) {
      now.value = Date.now() // sync immediately before first interval
      _ticker = setInterval(() => { now.value = Date.now() }, 500)
    } else if (!anyRunning && _ticker) {
      clearInterval(_ticker)
      _ticker = null
    }
  }

  // ── Projects ───────────────────────────────────────────────────
  async function fetchProjects() {
    projects.value = await $fetch<Project[]>('/api/projects')
  }

  async function createProject(data: {
    name: string
    description?: string
    milestones: Array<{
      name: string
      description?: string
      estimatedHours?: number
      subFeatures: Array<{ name: string; description?: string; estimatedHours?: number }>
    }>
  }) {
    const p = await $fetch<Project>('/api/projects', { method: 'POST', body: data })
    projects.value.unshift(p)
    return p
  }

  async function updateProject(id: string, data: { name: string; description: string }) {
    const p = await $fetch<Project>(`/api/projects/${id}`, { method: 'PATCH', body: data })
    const idx = projects.value.findIndex(proj => proj.id === id)
    if (idx >= 0) Object.assign(projects.value[idx], p)
    return p
  }

  async function updateProjectStatus(id: string, status: 'active' | 'completed' | 'cancelled') {
    const p = await $fetch<Project>(`/api/projects/${id}/status`, { method: 'PATCH', body: { status } })
    const idx = projects.value.findIndex(proj => proj.id === id)
    if (idx >= 0) Object.assign(projects.value[idx], p)
    return p
  }

  async function deleteProject(id: string) {
    await $fetch(`/api/projects/${id}`, { method: 'DELETE' })
    projects.value = projects.value.filter(p => p.id !== id)
    delete milestones.value[id]
  }

  // ── Milestones ────────────────────────────────────────────────
  async function fetchMilestones(projectId: string) {
    const data = await $fetch<Milestone[]>(`/api/projects/${projectId}/milestones`)
    // Always keep Idle milestone last
    milestones.value[projectId] = data.sort((a, b) => {
      if (a.name === 'Idle') return 1
      if (b.name === 'Idle') return -1
      return 0
    })
  }

  async function updateMilestone(id: string, name: string) {
    const updated = await $fetch<Milestone>(`/api/milestones/${id}`, { method: 'PATCH', body: { name } })
    for (const list of Object.values(milestones.value)) {
      const idx = list.findIndex(m => m.id === id)
      if (idx >= 0) { Object.assign(list[idx], updated); break }
    }
    return updated
  }

  // ── Sub-features ──────────────────────────────────────────────
  async function fetchSubFeatures(milestoneId: string) {
    const data = await $fetch<SubFeature[]>(`/api/milestones/${milestoneId}/subfeatures`)
    subFeatures.value[milestoneId] = data
    _syncTicker()
  }

  async function fetchLogs(projectId: string) {
    const data = await $fetch<Log[]>(`/api/projects/${projectId}/logs`)
    logs.value[projectId] = data
  }

  function _patchSubFeature(sf: SubFeature) {
    const list = subFeatures.value[sf.milestoneId]
    if (list) {
      const idx = list.findIndex(s => s.id === sf.id)
      if (idx >= 0) Object.assign(list[idx], sf)
    }
    _syncTicker()
    // Refresh project total in the list
    _refreshProjectTotal(sf.milestoneId)
  }

  function _refreshProjectTotal(milestoneId: string) {
    // Find which project this milestone belongs to and update its totalMs reactively
    for (const [projectId, ms] of Object.entries(milestones.value)) {
      if (ms.some(m => m.id === milestoneId)) {
        const p = projects.value.find(p => p.id === projectId)
        if (p) p.totalMs = getProjectLiveMs(projectId)
        break
      }
    }
  }

  async function startSubFeature(sf: SubFeature) {
    // Stop any other currently running sub-feature first (only one can run at a time)
    const running = Object.values(subFeatures.value)
      .flat()
      .find(s => s.status === 'running' && s.id !== sf.id)
    if (running) {
      const stopped = await $fetch<SubFeature>(`/api/subfeatures/${running.id}/stop`, { method: 'POST' })
      _patchSubFeature(stopped)
    }
    const updated = await $fetch<SubFeature>(`/api/subfeatures/${sf.id}/start`, { method: 'POST' })
    _patchSubFeature(updated)
  }

  async function pauseSubFeature(sf: SubFeature) {
    const updated = await $fetch<SubFeature>(`/api/subfeatures/${sf.id}/pause`, { method: 'POST' })
    _patchSubFeature(updated)
  }

  async function stopSubFeature(sf: SubFeature) {
    const updated = await $fetch<SubFeature>(`/api/subfeatures/${sf.id}/stop`, { method: 'POST' })
    _patchSubFeature(updated)
  }

  async function deleteSubFeature(sf: SubFeature) {
    await $fetch(`/api/subfeatures/${sf.id}`, { method: 'DELETE' })
    const list = subFeatures.value[sf.milestoneId]
    if (list) {
      subFeatures.value[sf.milestoneId] = list.filter(s => s.id !== sf.id)
    }
    _syncTicker()
  }

  async function updateSubFeatureNotes(sf: SubFeature, notes: string) {
    const updated = await $fetch<SubFeature>(`/api/subfeatures/${sf.id}/notes`, {
      method: 'PATCH',
      body: { notes },
    })
    _patchSubFeature(updated)
  }

  async function updateSubFeatureDetails(id: string, data: { name: string; estimatedHours: number | null }) {
    const updated = await $fetch<SubFeature>(`/api/subfeatures/${id}`, { method: 'PATCH', body: data })
    _patchSubFeature(updated)
    return updated
  }

  async function createSubFeature(milestoneId: string, name: string) {
    const sf = await $fetch<SubFeature>(`/api/milestones/${milestoneId}/subfeatures`, {
      method: 'POST',
      body: { name },
    })
    if (!subFeatures.value[milestoneId]) subFeatures.value[milestoneId] = []
    subFeatures.value[milestoneId].push(sf)
  }

  // ── Live time helpers ─────────────────────────────────────────
  function getSubFeatureLiveMs(sf: SubFeature): number {
    if (sf.status === 'running' && sf.startedAt) {
      return sf.totalMs + Math.max(0, now.value - sf.startedAt)
    }
    return sf.totalMs
  }

  function getMilestoneLiveMs(milestoneId: string): number {
    const sfs = subFeatures.value[milestoneId]
    if (sfs === undefined) {
      // Sub-features not loaded — fall back to the milestone's server-returned total
      for (const ms of Object.values(milestones.value)) {
        const m = ms.find(m => m.id === milestoneId)
        if (m) return m.totalMs
      }
      return 0
    }
    return sfs.reduce((sum, sf) => sum + getSubFeatureLiveMs(sf), 0)
  }

  function getProjectLiveMs(projectId: string): number {
    const ms = milestones.value[projectId]
    if (!ms || ms.length === 0) {
      return projects.value.find(p => p.id === projectId)?.totalMs ?? 0
    }
    // Exclude the Idle milestone from project total
    return ms
      .filter(m => m.name !== 'Idle')
      .reduce((sum, m) => sum + getMilestoneLiveMs(m.id), 0)
  }

  return {
    projects,
    milestones,
    subFeatures,
    logs,
    now,
    fetchProjects,
    createProject,
    updateProject,
    updateProjectStatus,
    deleteProject,
    fetchMilestones,
    updateMilestone,
    fetchSubFeatures,
    fetchLogs,
    startSubFeature,
    pauseSubFeature,
    stopSubFeature,
    deleteSubFeature,
    updateSubFeatureNotes,
    updateSubFeatureDetails,
    createSubFeature,
    getSubFeatureLiveMs,
    getMilestoneLiveMs,
    getProjectLiveMs,
  }
})
