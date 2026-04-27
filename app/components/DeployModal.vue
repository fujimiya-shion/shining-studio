<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  deployUrl: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'copyUrl': []
}>()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
</script>

<template>
  <UModal
    v-model:open="open"
    title="Page deployed successfully"
    :ui="{ content: 'sm:max-w-lg rounded-3xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Your mock deployment is ready. No real API call was made.
        </p>

        <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Preview URL
          </p>
          <p class="mt-2 break-all text-sm font-medium text-gray-950">
            {{ deployUrl }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          @click="$emit('copyUrl')"
        >
          Copy URL
        </UButton>
        <UButton
          color="primary"
          @click="open = false"
        >
          Close
        </UButton>
      </div>
    </template>
  </UModal>
</template>
