import { defineStore } from 'pinia'

export type TaskStatus = 'idle' | 'running' | 'paused'

export interface Task {
  id: string
  name: string
  description: string
  status: TaskStatus
  totalMs: number        // accumulated time before current session
  startedAt: number | null  // Date.now() when last started/resumed
  createdAt: number
  updatedAt: number
}

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])

  // ── Helpers ──────────────────────────────────────────────────
  function getLiveMs(task: Task): number {
    if (task.status === 'running' && task.startedAt !== null) {
      return task.totalMs + (Date.now() - task.startedAt)
    }
    return task.totalMs
  }

  // ── CRUD ──────────────────────────────────────────────────────
  async function fetchTasks() {
    const data = await $fetch<Task[]>('/api/tasks')
    tasks.value = data
  }

  async function createTask(name: string, description = '') {
    const task = await $fetch<Task>('/api/tasks', {
      method: 'POST',
      body: { name, description },
    })
    tasks.value.unshift(task)
    return task
  }

  async function deleteTask(id: string) {
    await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  // ── Timer controls ────────────────────────────────────────────
  async function startTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (!task || task.status === 'running') return

    // Patch server — returns updated task
    const updated = await $fetch<Task>(`/api/tasks/${id}/start`, { method: 'POST' })
    Object.assign(task, updated)
  }

  async function pauseTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (!task || task.status !== 'running') return

    const updated = await $fetch<Task>(`/api/tasks/${id}/pause`, { method: 'POST' })
    Object.assign(task, updated)
  }

  async function stopTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (!task || task.status === 'idle') return

    const updated = await $fetch<Task>(`/api/tasks/${id}/stop`, { method: 'POST' })
    Object.assign(task, updated)
  }

  return { tasks, getLiveMs, fetchTasks, createTask, deleteTask, startTask, pauseTask, stopTask }
})
