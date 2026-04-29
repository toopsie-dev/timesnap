import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // SPA mode — no SSR, avoids vite-node issues with the Vue component tree
  ssr: false,

  modules: ['@pinia/nuxt'],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        'lucide-vue-next',
        'pinia',
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ],
    },
  },

  css: ['./app/assets/css/main.css'],

  nitro: {
    externals: {
      external: ['better-sqlite3'],
    },
  },
})
