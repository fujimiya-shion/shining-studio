<script setup lang="ts">
const route = useRoute()
const slug = computed(() => {
  const raw = route.params.slug
  return typeof raw === 'string' ? raw : ''
})

const { data, error } = await useFetch<{ page: { name: string, content: string } }>(() => `/api/public/pages/${slug.value}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: error.value.statusMessage || 'Cannot load page'
  })
}

const page = computed(() => data.value?.page)

useHead(() => ({
  title: page.value?.name || 'Page'
}))

useSeoMeta({
  title: () => page.value?.name || 'Page',
  ogTitle: () => page.value?.name || 'Page',
  twitterTitle: () => page.value?.name || 'Page',
  description: () => `Public page ${page.value?.name || 'Untitled page'}`,
  ogDescription: () => `Public page ${page.value?.name || 'Untitled page'}`
})
</script>

<template>
  <div v-if="page">
    <iframe
      :srcdoc="page.content"
      title="Public page"
      class="h-screen w-full border-0"
      sandbox="allow-scripts allow-forms allow-modals"
    />
  </div>
</template>
