<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const slug = computed(() => {
  const raw = route.params.slug
  return typeof raw === 'string' ? raw : ''
})
</script>

<template>
  <BuilderWorkspace :initial-slug="slug" />
</template>
