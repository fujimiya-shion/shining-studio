<script setup lang="ts">
type BuilderStatus = 'draft' | 'preview-ready' | 'deploying' | 'deployed'

const props = defineProps<{
  status: BuilderStatus
}>()

const statusConfig = computed(() => {
  switch (props.status) {
    case 'preview-ready':
      return {
        label: 'Preview Ready',
        className: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
      }
    case 'deploying':
      return {
        label: 'Deploying',
        className: 'border-amber-400/20 bg-amber-400/10 text-amber-200'
      }
    case 'deployed':
      return {
        label: 'Deployed',
        className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
      }
    default:
      return {
        label: 'Draft',
        className: 'border-white/10 bg-white/5 text-slate-300'
      }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em]"
    :class="statusConfig.className"
  >
    {{ statusConfig.label }}
  </span>
</template>
