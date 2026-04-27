<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

type PageSummary = {
  id: number
  slug: string
  name: string
  created_at: string
  updated_at: string
}

type PaginationInfo = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
}

const pages = ref<PageSummary[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const pagination = ref<PaginationInfo>({
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1,
  hasPrev: false,
  hasNext: false
})
const toast = useToast()

async function fetchPages(page = currentPage.value) {
  isLoading.value = true

  try {
    const response = await $fetch<{ pages: PageSummary[], pagination: PaginationInfo }>('/api/pages', {
      query: { page }
    })
    pages.value = response.pages
    pagination.value = response.pagination
    currentPage.value = response.pagination.page
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load pages.'
    toast.add({
      title: 'Cannot load pages',
      description: message,
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

async function goToPreviousPage() {
  if (isLoading.value || !pagination.value.hasPrev) {
    return
  }

  await fetchPages(currentPage.value - 1)
}

async function goToNextPage() {
  if (isLoading.value || !pagination.value.hasNext) {
    return
  }

  await fetchPages(currentPage.value + 1)
}

async function logout() {
  if (import.meta.client && !window.confirm('Sign out from Shining Studio?')) {
    return
  }

  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

onMounted(fetchPages)
</script>

<template>
  <main class="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_26%),linear-gradient(180deg,#eff4ff_0%,#f8fafc_40%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-6xl rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">
            Pages
          </p>
          <h1 class="font-display mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Your pages
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink
            to="/create"
            class="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white"
          >
            <UIcon
              name="i-lucide-plus"
              class="size-4"
            />
            <span>Create page</span>
          </NuxtLink>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            :disabled="isLoading"
            @click="fetchPages(currentPage)"
          >
            <UIcon
              name="i-lucide-refresh-cw"
              class="size-4"
              :class="isLoading ? 'animate-spin' : ''"
            />
            <span>Reload</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            @click="logout"
          >
            <UIcon
              name="i-lucide-log-out"
              class="size-4"
            />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div class="grid grid-cols-[1.3fr_1fr_auto] border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span>Name</span>
          <span>Updated</span>
          <span class="text-right">Actions</span>
        </div>

        <div
          v-if="!isLoading && pages.length === 0"
          class="px-4 py-10 text-center text-sm text-slate-500"
        >
          No pages yet. Create one to get started.
        </div>

        <div
          v-for="page in pages"
          :key="page.slug"
          class="grid grid-cols-[1.3fr_1fr_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
        >
          <div class="min-w-0">
            <p class="truncate font-medium text-slate-900">
              {{ page.name }}
            </p>
            <p class="truncate text-xs text-slate-500">
              {{ page.slug }}
            </p>
          </div>

          <p class="text-slate-500">
            {{ new Date(page.updated_at).toLocaleString() }}
          </p>

          <div class="flex items-center justify-end gap-2">
            <NuxtLink
              :to="`/pages/${page.slug}`"
              target="_blank"
              class="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700"
            >
              View
            </NuxtLink>
            <NuxtLink
              :to="`/edit/${page.slug}`"
              class="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700"
            >
              Edit
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-500">
          Showing page {{ pagination.page }} / {{ pagination.totalPages }} · {{ pagination.totalItems }} items
        </p>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isLoading || !pagination.hasPrev"
            @click="goToPreviousPage"
          >
            Previous
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isLoading || !pagination.hasNext"
            @click="goToNextPage"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
