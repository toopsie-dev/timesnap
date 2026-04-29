<script setup lang="ts">
defineProps<{ title?: string }>()
const emit = defineEmits<{ close: [] }>()

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      @mousedown="onBackdrop"
    >
      <div class="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
