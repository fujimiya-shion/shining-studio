<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'AI Page Builder',
  description: 'Prototype UI for editing, previewing, and mock deploying full HTML pages.'
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
