<script setup lang="ts">
type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

const props = defineProps<{
  html: string
  selectedDevice: PreviewDevice
  isRefreshing: boolean
}>()

defineEmits<{
  selectDevice: [device: PreviewDevice]
  refresh: []
}>()

const devices: Array<{ label: string, value: PreviewDevice, widthClass: string }> = [
  { label: 'Desktop', value: 'desktop', widthClass: 'w-full' },
  { label: 'Tablet', value: 'tablet', widthClass: 'mx-auto w-[820px] max-w-full' },
  { label: 'Mobile', value: 'mobile', widthClass: 'mx-auto w-[390px] max-w-full' }
]

const deviceWidthClass = computed(() => {
  return devices.find(device => device.value === props.selectedDevice)?.widthClass ?? 'w-full'
})
</script>

<template>
  <section class="panel-shell flex h-full min-h-[28rem] min-w-0 w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.08)] lg:min-h-0">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
      <div>
        <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">
          Preview
        </div>
        <div class="mt-1 flex items-center gap-3">
          <h2 class="font-display text-lg font-semibold text-slate-950">
            Live Render
          </h2>
          <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
            Sandbox
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
          <button
            v-for="device in devices"
            :key="device.value"
            type="button"
            class="tool-segment"
            :class="selectedDevice === device.value ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500'"
            @click="$emit('selectDevice', device.value)"
          >
            {{ device.label }}
          </button>
        </div>

        <button
          type="button"
          class="tool-btn tool-btn-surface"
          @click="$emit('refresh')"
        >
          <UIcon
            name="i-lucide-refresh-cw"
            class="size-4"
            :class="isRefreshing ? 'animate-spin' : ''"
          />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-2 text-xs text-slate-500">
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full bg-rose-400" />
        <span class="size-2 rounded-full bg-amber-400" />
        <span class="size-2 rounded-full bg-emerald-400" />
      </div>
      <span>Safe iframe render</span>
    </div>

    <div class="flex flex-1 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-3">
      <div class="flex flex-1 items-stretch justify-center overflow-auto rounded-[24px] border border-white bg-[#e8f0ff] p-3 shadow-inner shadow-sky-100/80">
        <div
          :class="deviceWidthClass"
          class="h-full transition-all duration-200"
        >
          <div class="h-full min-h-[22rem] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
            <div
              v-if="!html.trim()"
              class="flex h-[28rem] min-h-[22rem] flex-col items-center justify-center gap-4 px-8 text-center lg:h-full lg:min-h-0"
            >
              <div class="flex size-16 items-center justify-center rounded-[20px] bg-slate-950 text-white shadow-lg">
                <UIcon
                  name="i-lucide-code-xml"
                  class="size-7"
                />
              </div>
              <div class="max-w-md">
                <p class="text-lg font-medium text-slate-800">
                  Preview waits for a complete HTML document.
                </p>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  Paste markup on the left and inspect layout, spacing, and interactions here.
                </p>
              </div>
            </div>

            <div
              v-else
              class="relative h-[28rem] min-h-[22rem] lg:h-full lg:min-h-0"
            >
              <div
                v-if="isRefreshing"
                class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm font-medium text-slate-500 backdrop-blur-sm"
              >
                Refreshing preview...
              </div>

              <iframe
                :srcdoc="html"
                title="HTML preview"
                class="block h-full w-full border-0 bg-white"
                sandbox="allow-scripts allow-forms allow-modals"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
