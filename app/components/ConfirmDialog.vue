<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click="emit('cancel')"
      >
        <!-- Backdrop (visual only, pointer-events-none so panel buttons are always clickable) -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

        <!-- Panel -->
        <div
          class="relative z-10 w-full max-w-sm mx-4 rounded-lg border border-border bg-card shadow-xl p-5 space-y-4"
          @click.stop
        >
          <h2 class="font-semibold text-base">{{ title }}</h2>
          <p class="text-sm text-muted-foreground">{{ message }}</p>
          <div class="flex justify-end gap-2 pt-1">
            <button
              @click="emit('cancel')"
              class="px-4 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              @click="emit('confirm')"
              class="px-4 py-1.5 rounded-md text-sm bg-destructive text-destructive-foreground hover:opacity-90 transition"
            >
              {{ confirmLabel ?? 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
