<script setup lang="ts">
type BuilderStatus = 'draft' | 'preview-ready' | 'deploying' | 'deployed'
type PreviewDevice = 'desktop' | 'tablet' | 'mobile'
type MobilePanel = 'code' | 'preview'

type PageRecord = {
  id: number
  slug: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

const props = defineProps<{
  initialSlug?: string
}>()

const DEFAULT_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nova Studio</title>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Inter, Arial, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(88, 28, 135, 0.25), transparent 32%),
          radial-gradient(circle at top right, rgba(14, 165, 233, 0.18), transparent 30%),
          #09111f;
        color: #f8fafc;
      }

      .hero {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 48px 24px;
      }

      .card {
        width: min(720px, 100%);
        padding: 40px;
        border-radius: 28px;
        background: rgba(15, 23, 42, 0.82);
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 30px 80px rgba(2, 8, 23, 0.45);
      }

      .eyebrow {
        margin: 0 0 16px;
        color: #38bdf8;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: clamp(2.5rem, 7vw, 5rem);
        line-height: 0.94;
      }

      p {
        margin: 20px 0 0;
        max-width: 54ch;
        color: #cbd5e1;
        font-size: 1.05rem;
        line-height: 1.7;
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 28px;
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 14px 22px;
        font: inherit;
        font-weight: 700;
      }

      .primary {
        background: linear-gradient(135deg, #38bdf8, #8b5cf6);
        color: white;
      }

      .secondary {
        background: rgba(148, 163, 184, 0.14);
        color: #f8fafc;
        border: 1px solid rgba(148, 163, 184, 0.22);
      }

      .message {
        margin-top: 24px;
        font-size: 0.95rem;
        color: #93c5fd;
      }
    </style>
  </head>
  <body>
    <section class="hero">
      <div class="card">
        <p class="eyebrow">AI Landing Prototype</p>
        <h1 id="headline">Build a page from one HTML file.</h1>
        <p>
          This preview proves that inline styles and scripts run inside the iframe.
          Paste your own complete HTML document to replace it.
        </p>
        <div class="row">
          <button class="primary" id="cta">Generate momentum</button>
          <button class="secondary" id="secondary">Swap headline</button>
        </div>
        <div class="message" id="message">Ready for live preview.</div>
      </div>
    </section>

    <script>
      const message = document.getElementById('message');
      const headline = document.getElementById('headline');

      document.getElementById('cta').addEventListener('click', () => {
        message.textContent = 'CTA clicked. Your inline script is working.';
      });

      document.getElementById('secondary').addEventListener('click', () => {
        headline.textContent = 'Live preview reacts to your JavaScript.';
      });
    ${'</scr' + 'ipt>'}
  </body>
</html>`

const htmlCode = ref('')
const previewHtml = ref('')
const pageName = ref('Untitled page')
const baselineHtml = ref('')
const baselinePageName = ref('Untitled page')
const status = ref<BuilderStatus>('draft')
const selectedDevice = ref<PreviewDevice>('desktop')
const showDeployModal = ref(false)
const activeMobilePanel = ref<MobilePanel>('code')
const isPreviewRefreshing = ref(false)
const showLivePreview = ref(true)
const isLoadingPage = ref(false)

const toast = useToast()
const appOrigin = useRequestURL().origin

let previewTimer: number | null = null
let refreshOverlayTimer: number | null = null

const PREVIEW_DEBOUNCE_MS = 500

const hasContent = computed(() => htmlCode.value.trim().length > 0)
const currentSlug = ref(props.initialSlug?.trim() || '')
const deployLabel = computed(() => currentSlug.value ? 'Re-deploy' : 'Deploy')
const deployUrl = computed(() => currentSlug.value ? `${appOrigin}/pages/${currentSlug.value}` : '')

function extractNameFromHtml(html: string) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)
  const rawTitle = titleMatch?.[1]?.trim()
  return rawTitle || 'Untitled page'
}

function setPreviewStatus() {
  if (!htmlCode.value.trim()) {
    status.value = 'draft'
    return
  }

  if (status.value !== 'deploying') {
    status.value = 'preview-ready'
  }
}

function updatePreviewNow() {
  if (previewHtml.value !== htmlCode.value) {
    previewHtml.value = htmlCode.value
  }

  isPreviewRefreshing.value = false
  setPreviewStatus()
}

function schedulePreviewUpdate(showRefreshOverlay = false) {
  if (previewTimer) {
    clearTimeout(previewTimer)
  }

  if (refreshOverlayTimer) {
    clearTimeout(refreshOverlayTimer)
  }

  if (showRefreshOverlay) {
    isPreviewRefreshing.value = false
    refreshOverlayTimer = window.setTimeout(() => {
      isPreviewRefreshing.value = true
    }, 160)
  }

  previewTimer = window.setTimeout(() => {
    if (refreshOverlayTimer) {
      clearTimeout(refreshOverlayTimer)
      refreshOverlayTimer = null
    }

    updatePreviewNow()
  }, PREVIEW_DEBOUNCE_MS)
}

function loadExample() {
  pageName.value = extractNameFromHtml(DEFAULT_HTML)
  htmlCode.value = DEFAULT_HTML
  previewHtml.value = showLivePreview.value ? DEFAULT_HTML : ''
  activeMobilePanel.value = 'code'
  setPreviewStatus()
}

function resetToBaseline() {
  pageName.value = baselinePageName.value
  htmlCode.value = baselineHtml.value
  previewHtml.value = showLivePreview.value ? baselineHtml.value : ''
  activeMobilePanel.value = 'code'
  setPreviewStatus()
}

function initializeBlankDraft() {
  pageName.value = 'Untitled page'
  htmlCode.value = ''
  previewHtml.value = ''
  activeMobilePanel.value = 'code'
  status.value = 'draft'
}

function updateBaseline(html: string, name: string) {
  baselineHtml.value = html
  baselinePageName.value = name || 'Untitled page'
}

function ensureSeoTitle(html: string, title: string) {
  const normalizedTitle = title.trim() || 'Untitled page'
  const escapedTitle = normalizedTitle
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapedTitle}</title>`)
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, match => `${match}\n    <title>${escapedTitle}</title>`)
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapedTitle}</title>
  </head>
  <body>
${html}
  </body>
</html>`
}

function resetBuilder() {
  resetToBaseline()
}

async function copyToClipboard(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.add({
      title: successMessage,
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Clipboard copy failed',
      description: 'Your browser blocked the copy action.',
      color: 'error'
    })
  }
}

async function copyHtml() {
  if (!hasContent.value) {
    toast.add({
      title: 'Editor is empty',
      description: 'Paste or load HTML before copying.',
      color: 'error'
    })
    return
  }

  await copyToClipboard(htmlCode.value, 'HTML copied')
}

async function loadPageBySlug(slug: string) {
  isLoadingPage.value = true

  try {
    const response = await $fetch<{ page: PageRecord }>(`/api/pages/${slug}`)
    const resolvedContent = response.page.content || ''
    const resolvedName = response.page.name || 'Untitled page'

    currentSlug.value = response.page.slug
    pageName.value = resolvedName
    htmlCode.value = resolvedContent
    previewHtml.value = showLivePreview.value ? htmlCode.value : ''
    status.value = 'deployed'
    activeMobilePanel.value = 'code'
    updateBaseline(resolvedContent, resolvedName)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load page.'
    toast.add({
      title: 'Cannot load page',
      description: message,
      color: 'error'
    })
  } finally {
    isLoadingPage.value = false
  }
}

async function deployPage() {
  if (!hasContent.value) {
    toast.add({
      title: 'Cannot deploy empty HTML',
      description: 'Paste or load a page before deploying.',
      color: 'error'
    })
    return
  }

  status.value = 'deploying'

  const normalizedName = pageName.value.trim() || extractNameFromHtml(htmlCode.value)
  const normalizedContent = ensureSeoTitle(htmlCode.value, normalizedName)

  try {
    let response: { page: PageRecord }

    if (currentSlug.value) {
      response = await $fetch(`/api/pages/${currentSlug.value}/redeploy`, {
        method: 'PUT',
        body: {
          name: normalizedName,
          content: normalizedContent
        }
      })
    } else {
      response = await $fetch('/api/pages/deploy', {
        method: 'POST',
        body: {
          name: normalizedName,
          content: normalizedContent
        }
      })
    }

    currentSlug.value = response.page.slug
    pageName.value = response.page.name
    htmlCode.value = response.page.content
    previewHtml.value = showLivePreview.value ? htmlCode.value : ''
    status.value = 'deployed'
    showDeployModal.value = true
    updateBaseline(response.page.content, response.page.name)
  } catch (error) {
    status.value = 'preview-ready'
    const message = error instanceof Error ? error.message : 'Deploy failed.'
    toast.add({
      title: 'Deploy failed',
      description: message,
      color: 'error'
    })
  }
}

async function logout() {
  if (import.meta.client && !window.confirm('Sign out from Shining Studio?')) {
    return
  }

  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

function refreshPreview() {
  if (!showLivePreview.value) {
    return
  }

  schedulePreviewUpdate(true)
}

onMounted(async () => {
  if (props.initialSlug?.trim()) {
    await loadPageBySlug(props.initialSlug.trim())
    return
  }

  initializeBlankDraft()
  updateBaseline('', 'Untitled page')
})

watch(() => props.initialSlug, async (slug) => {
  const normalized = slug?.trim() || ''

  if (!normalized) {
    initializeBlankDraft()
    updateBaseline('', 'Untitled page')
    return
  }

  if (normalized === currentSlug.value) {
    return
  }

  await loadPageBySlug(normalized)
})

watch(htmlCode, () => {
  if (!import.meta.client || isLoadingPage.value) {
    return
  }

  if (!htmlCode.value.trim()) {
    previewHtml.value = ''
    isPreviewRefreshing.value = false
    setPreviewStatus()
    return
  }

  if (!showLivePreview.value) {
    setPreviewStatus()
    return
  }

  schedulePreviewUpdate()
})

watch(showLivePreview, (visible) => {
  if (!import.meta.client) {
    return
  }

  if (!visible) {
    if (previewTimer) {
      clearTimeout(previewTimer)
      previewTimer = null
    }

    if (refreshOverlayTimer) {
      clearTimeout(refreshOverlayTimer)
      refreshOverlayTimer = null
    }

    isPreviewRefreshing.value = false
    activeMobilePanel.value = 'code'
    return
  }

  if (htmlCode.value.trim()) {
    schedulePreviewUpdate()
  } else {
    previewHtml.value = ''
  }
})

onBeforeUnmount(() => {
  if (previewTimer) {
    clearTimeout(previewTimer)
  }

  if (refreshOverlayTimer) {
    clearTimeout(refreshOverlayTimer)
  }
})
</script>

<template>
  <div class="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_20%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_24%),linear-gradient(180deg,#eff4ff_0%,#f8fafc_32%,#eef2ff_100%)] lg:flex lg:flex-col">
    <TopBar
      :status="status"
      :can-deploy="hasContent"
      :deploy-label="deployLabel"
      @reset="resetBuilder"
      @copy="copyHtml"
      @deploy="deployPage"
      @logout="logout"
    />

    <main class="mx-auto w-full max-w-9xl px-4 py-4 sm:px-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-8 lg:py-6">
      <section class="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/70 bg-white/70 px-5 py-3.5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">
            Builder workspace
          </p>
          <h2 class="font-display mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            Cleaner editor. Cleaner preview.
          </h2>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-sm">
          <input
            v-model="pageName"
            type="text"
            class="h-9 min-w-44 rounded-full border border-slate-200 bg-white px-3 text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            placeholder="Page name"
          >

          <NuxtLink
            to="/list"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <UIcon
              name="i-lucide-list"
              class="size-4"
            />
            <span>List</span>
          </NuxtLink>

          <NuxtLink
            v-if="currentSlug"
            :to="`/pages/${currentSlug}`"
            target="_blank"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <UIcon
              name="i-lucide-square-arrow-out-up-right"
              class="size-4"
            />
            <span>Open page</span>
          </NuxtLink>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            @click="showLivePreview = !showLivePreview"
          >
            <UIcon
              :name="showLivePreview ? 'i-lucide-eye' : 'i-lucide-eye-off'"
              class="size-4"
            />
            <span>{{ showLivePreview ? 'Hide preview' : 'Show preview' }}</span>
          </button>
        </div>
      </section>

      <div
        v-if="showLivePreview"
        class="mb-4 flex shrink-0 lg:hidden"
      >
        <div class="grid w-full grid-cols-2 rounded-2xl border border-white/70 bg-white/80 p-1 shadow-sm backdrop-blur">
          <button
            class="rounded-xl px-4 py-2 text-sm font-medium transition"
            :class="activeMobilePanel === 'code' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500'"
            @click="activeMobilePanel = 'code'"
          >
            Code
          </button>
          <button
            class="rounded-xl px-4 py-2 text-sm font-medium transition"
            :class="activeMobilePanel === 'preview' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500'"
            @click="activeMobilePanel = 'preview'"
          >
            Preview
          </button>
        </div>
      </div>

      <div :class="showLivePreview ? 'grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-5' : 'grid gap-4 lg:min-h-0 lg:flex-1'">
        <div :class="showLivePreview && activeMobilePanel === 'preview' ? 'hidden min-w-0 lg:block' : 'block min-w-0 h-full'">
          <CodeEditor
            v-model="htmlCode"
            :auto-preview-enabled="showLivePreview"
            @load-example="loadExample"
          />
        </div>

        <div
          v-if="showLivePreview"
          :class="activeMobilePanel === 'code' ? 'hidden min-w-0 lg:block h-full' : 'block min-w-0 h-full'"
        >
          <PreviewFrame
            :html="previewHtml"
            :selected-device="selectedDevice"
            :is-refreshing="isPreviewRefreshing"
            @select-device="selectedDevice = $event"
            @refresh="refreshPreview"
          />
        </div>
      </div>
    </main>

    <DeployModal
      v-model="showDeployModal"
      :deploy-url="deployUrl"
      @copy-url="copyToClipboard(deployUrl, 'Page URL copied')"
    />
  </div>
</template>
