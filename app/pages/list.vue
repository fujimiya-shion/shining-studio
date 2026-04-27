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
const isDeleting = ref(false)
const currentPage = ref(1)
const searchInput = ref('')
const activeSearch = ref('')
const selectedIds = ref<number[]>([])
const pagination = ref<PaginationInfo>({
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1,
  hasPrev: false,
  hasNext: false
})
const toast = useToast()
const hasSelectedRows = computed(() => selectedIds.value.length > 0)
const allRowsSelected = computed(() => pages.value.length > 0 && pages.value.every(page => selectedIds.value.includes(page.id)))
const selectedCountLabel = computed(() => `${selectedIds.value.length} selected`)
const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmDescription = ref('')
const confirmLabel = ref('Confirm')
const cancelLabel = ref('Cancel')
const confirmLoading = ref(false)
let confirmResolver: ((value: boolean) => void) | null = null

function askForConfirmation(options: {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
}) {
  if (!import.meta.client) {
    return Promise.resolve(true)
  }

  confirmTitle.value = options.title
  confirmDescription.value = options.description
  confirmLabel.value = options.confirmLabel
  cancelLabel.value = options.cancelLabel || 'Cancel'
  confirmOpen.value = true

  return new Promise<boolean>((resolve) => {
    confirmResolver = resolve
  })
}

function resolveConfirmation(value: boolean) {
  if (confirmResolver) {
    confirmResolver(value)
    confirmResolver = null
  }
}

function onConfirmAction() {
  confirmOpen.value = false
  resolveConfirmation(true)
}

function onCancelAction() {
  confirmOpen.value = false
  resolveConfirmation(false)
}

async function fetchPages(page = currentPage.value) {
  if (!searchInput.value.trim()) {
    activeSearch.value = ''
  }

  isLoading.value = true

  try {
    const response = await $fetch<{ pages: PageSummary[], pagination: PaginationInfo }>('/api/pages', {
      query: {
        page,
        search: activeSearch.value || undefined
      }
    })
    pages.value = response.pages
    pagination.value = response.pagination
    currentPage.value = response.pagination.page
    const allowedIds = new Set(response.pages.map(page => page.id))
    selectedIds.value = selectedIds.value.filter(id => allowedIds.has(id))
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

function applySearch() {
  activeSearch.value = searchInput.value.trim()
  selectedIds.value = []
  void fetchPages(1)
}

function clearSearch() {
  searchInput.value = ''
  if (!activeSearch.value) {
    return
  }

  activeSearch.value = ''
  selectedIds.value = []
  void fetchPages(1)
}

watch(searchInput, (value) => {
  if (value.trim() || !activeSearch.value) {
    return
  }

  activeSearch.value = ''
  selectedIds.value = []
  void fetchPages(1)
})

function toggleSelectAll(checked: boolean) {
  if (checked) {
    selectedIds.value = pages.value.map(page => page.id)
    return
  }

  selectedIds.value = []
}

function toggleSelectPage(id: number, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
    return
  }

  selectedIds.value = selectedIds.value.filter(value => value !== id)
}

function onToggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement | null)?.checked ?? false
  toggleSelectAll(checked)
}

function onToggleSelectPage(id: number, event: Event) {
  const checked = (event.target as HTMLInputElement | null)?.checked ?? false
  toggleSelectPage(id, checked)
}

async function softDeleteSelected() {
  if (!hasSelectedRows.value || isDeleting.value) {
    return
  }

  const confirmed = await askForConfirmation({
    title: 'Delete selected pages',
    description: `Move ${selectedIds.value.length} selected page(s) to trash?`,
    confirmLabel: 'Delete selected'
  })

  if (!confirmed) {
    return
  }

  isDeleting.value = true
  confirmLoading.value = true

  try {
    const response = await $fetch<{ deletedIds: number[] }>('/api/pages/bulk-delete', {
      method: 'POST',
      body: {
        ids: selectedIds.value
      }
    })

    const deletedCount = response.deletedIds.length
    selectedIds.value = []
    await fetchPages(currentPage.value)

    toast.add({
      title: 'Pages moved to trash',
      description: `${deletedCount} page(s) soft deleted.`,
      color: 'success'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to soft delete selected pages.'
    toast.add({
      title: 'Cannot delete pages',
      description: message,
      color: 'error'
    })
  } finally {
    isDeleting.value = false
    confirmLoading.value = false
  }
}

async function softDeleteOne(pageId: number) {
  if (isDeleting.value) {
    return
  }

  const confirmed = await askForConfirmation({
    title: 'Delete page',
    description: 'Move this page to trash?',
    confirmLabel: 'Delete'
  })

  if (!confirmed) {
    return
  }

  isDeleting.value = true
  confirmLoading.value = true

  try {
    const response = await $fetch<{ deletedIds: number[] }>('/api/pages/bulk-delete', {
      method: 'POST',
      body: {
        ids: [pageId]
      }
    })

    const deletedCount = response.deletedIds.length
    selectedIds.value = selectedIds.value.filter(id => id !== pageId)
    await fetchPages(currentPage.value)

    toast.add({
      title: 'Page moved to trash',
      description: `${deletedCount} page(s) soft deleted.`,
      color: 'success'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to soft delete page.'
    toast.add({
      title: 'Cannot delete page',
      description: message,
      color: 'error'
    })
  } finally {
    isDeleting.value = false
    confirmLoading.value = false
  }
}

async function logout() {
  const confirmed = await askForConfirmation({
    title: 'Sign out',
    description: 'Sign out from Shining Studio?',
    confirmLabel: 'Sign out'
  })

  if (!confirmed) {
    return
  }

  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

watch(confirmOpen, (value) => {
  if (!value) {
    resolveConfirmation(false)
  }
})

onMounted(fetchPages)
</script>

<template>
  <div>
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

        <div class="mb-4 flex flex-wrap items-center gap-2">
          <div class="flex flex-1 min-w-[260px] items-center gap-2">
            <input
              v-model="searchInput"
              type="search"
              placeholder="Search by page name or slug..."
              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300"
              @keydown.enter.prevent="applySearch"
            >
            <button
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              :disabled="isLoading"
              @click="applySearch"
            >
              Search
            </button>
            <button
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              :disabled="isLoading || !activeSearch"
              @click="clearSearch"
            >
              Clear
            </button>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!hasSelectedRows || isDeleting"
            @click="softDeleteSelected"
          >
            <UIcon
              name="i-lucide-trash-2"
              class="size-4"
            />
            <span>{{ isDeleting ? 'Deleting...' : 'Delete selected' }}</span>
          </button>

          <p
            v-if="hasSelectedRows"
            class="text-xs font-medium text-slate-500"
          >
            {{ selectedCountLabel }}
          </p>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div class="grid grid-cols-[32px_1.3fr_1fr_auto] items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <input
              type="checkbox"
              class="light-checkbox size-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              :checked="allRowsSelected"
              :disabled="pages.length === 0"
              @change="onToggleSelectAll"
            >
            <span>Name</span>
            <span>Updated</span>
            <span class="text-right">Actions</span>
          </div>

          <div
            v-if="!isLoading && pages.length === 0"
            class="px-4 py-10 text-center text-sm text-slate-500"
          >
            No pages found.
          </div>

          <div
            v-for="page in pages"
            :key="page.slug"
            class="grid grid-cols-[32px_1.3fr_1fr_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
          >
            <input
              type="checkbox"
              class="light-checkbox size-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              :checked="selectedIds.includes(page.id)"
              @change="event => onToggleSelectPage(page.id, event)"
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
              <button
                type="button"
                class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isDeleting"
                @click="softDeleteOne(page.id)"
              >
                Delete
              </button>
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

    <ConfirmModal
      v-model="confirmOpen"
      :title="confirmTitle"
      :description="confirmDescription"
      :confirm-label="confirmLabel"
      :cancel-label="cancelLabel"
      :loading="confirmLoading"
      confirm-color="error"
      @confirm="onConfirmAction"
      @cancel="onCancelAction"
    />
  </div>
</template>
