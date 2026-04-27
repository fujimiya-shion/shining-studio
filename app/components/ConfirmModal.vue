<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  icon?: string
  confirmColor?: 'error' | 'primary' | 'neutral' | 'secondary' | 'success' | 'warning' | 'info'
}>(), {
  description: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  loading: false,
  icon: '',
  confirmColor: 'error'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const resolvedIcon = computed(() => {
  if (props.icon) {
    return props.icon
  }

  if (props.confirmColor === 'warning') {
    return 'i-lucide-log-out'
  }

  if (props.confirmColor === 'error') {
    return 'i-lucide-triangle-alert'
  }

  return 'i-lucide-circle-help'
})

const iconToneClass = computed(() => {
  if (props.confirmColor === 'warning') {
    return 'bg-amber-100 text-amber-700'
  }

  if (props.confirmColor === 'error') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-sky-100 text-sky-700'
})

function onCancel() {
  emit('cancel')
  open.value = false
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <UModal
    v-model:open="open"
    :ui="{
      content: 'sm:max-w-md rounded-3xl bg-white text-black shadow-[0_20px_60px_rgba(15,23,42,0.24)]',
      header: 'p-4 pb-1 border-0',
      body: 'px-4 py-0 border-0',
      footer: 'px-4 pb-4 pt-1 border-0'
    }"
    :close="false"
  >
    <template #header>
      <div class="flex w-full items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
            :class="iconToneClass"
          >
            <UIcon
              :name="resolvedIcon"
              class="size-5"
            />
          </div>

          <p class="text-base font-semibold leading-none text-black">
            {{ title }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex size-8 items-center justify-center rounded-full text-black/60 transition hover:bg-slate-100 hover:text-black"
          @click="onCancel"
        >
          <UIcon
            name="i-lucide-x"
            class="size-4"
          />
        </button>
      </div>
    </template>

    <template #body>
      <p
        v-if="description"
        class="text-base leading-tight text-black/75"
      >
        {{ description }}
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          class="!border-slate-200 !bg-white !text-black hover:!bg-slate-100"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </UButton>
        <UButton
          :color="confirmColor"
          :loading="loading"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
