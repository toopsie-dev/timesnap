<script setup lang="ts">
useHead({
  title: 'TimeSnap — Time Tracker',
  htmlAttrs: { class: 'dark' },
  meta: [
    { name: 'description', content: 'Track time spent on tasks' },
    { name: 'color-scheme', content: 'dark' },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
  ],
})
</script>

<template>
  <NuxtPage />
</template>
