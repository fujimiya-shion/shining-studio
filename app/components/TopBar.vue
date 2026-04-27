<script setup lang="ts">
type BuilderStatus = 'draft' | 'preview-ready' | 'deploying' | 'deployed'

defineProps<{
  status: BuilderStatus
  canDeploy: boolean
  deployLabel?: string
}>()

defineEmits<{
  reset: []
  copy: []
  deploy: []
  logout: []
}>()
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/88 backdrop-blur-xl">
    <div class="mx-auto flex w-full max-w-9xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#38bdf8_0%,#8b5cf6_100%)] text-sm font-bold text-white shadow-[0_12px_30px_rgba(56,189,248,0.25)]">
          ST
        </div>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="font-display truncate text-base font-semibold tracking-tight text-white sm:text-lg">
              Shining Studio
            </h1>
            <StatusBadge :status="status" />
          </div>

          <p class="hidden text-sm text-slate-400 sm:block">
            Full-page HTML builder with Monaco and a sandbox preview.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="tool-btn tool-btn-dark"
          @click="$emit('logout')"
        >
          <UIcon
            name="i-lucide-log-out"
            class="size-4"
          />
          <span>Logout</span>
        </button>

        <button
          type="button"
          class="tool-btn tool-btn-dark hidden sm:inline-flex"
          @click="$emit('reset')"
        >
          <UIcon
            name="i-lucide-rotate-ccw"
            class="size-4"
          />
          <span>Reset</span>
        </button>

        <button
          type="button"
          class="tool-btn tool-btn-light"
          @click="$emit('copy')"
        >
          <UIcon
            name="i-lucide-copy"
            class="size-4"
          />
          <span>Copy HTML</span>
        </button>

        <button
          type="button"
          class="tool-btn tool-btn-green"
          :disabled="!canDeploy || status === 'deploying'"
          @click="$emit('deploy')"
        >
          <UIcon
            v-if="status !== 'deploying'"
            name="i-lucide-rocket"
            class="size-4"
          />
          <UIcon
            v-else
            name="i-lucide-loader-circle"
            class="size-4 animate-spin"
          />
          <span>{{ status === 'deploying' ? 'Deploying' : (deployLabel || 'Deploy') }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
