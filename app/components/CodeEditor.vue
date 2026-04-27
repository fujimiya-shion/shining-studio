<script setup lang="ts">
import type * as Monaco from 'monaco-editor'

const props = defineProps<{
  modelValue: string
  autoPreviewEnabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'loadExample': []
}>()

const lineCount = computed(() => {
  return props.modelValue ? props.modelValue.split('\n').length : 0
})

const characterCount = computed(() => props.modelValue.length)

const editorOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  theme: 'vs-dark',
  fontSize: 13,
  lineHeight: 22,
  fontLigatures: true,
  tabSize: 2,
  minimap: { enabled: false },
  padding: { top: 20, bottom: 20 },
  roundedSelection: false,
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  renderLineHighlight: 'gutter',
  glyphMargin: false,
  folding: true,
  wordWrap: 'off',
  formatOnPaste: false,
  formatOnType: false,
  bracketPairColorization: {
    enabled: true
  },
  guides: {
    bracketPairs: true,
    indentation: true
  },
  fontFamily: 'JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace'
}

const monacoEditor = shallowRef<Monaco.editor.IStandaloneCodeEditor>()

function handleEditorLoad(editor: Monaco.editor.IStandaloneCodeEditor) {
  monacoEditor.value = editor
}

async function formatDocument() {
  await monacoEditor.value?.getAction('editor.action.formatDocument')?.run()
}
</script>

<template>
  <section class="panel-shell flex h-full min-h-[28rem] min-w-0 w-full flex-col overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-[0_32px_80px_rgba(2,6,23,0.22)] lg:min-h-0">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-3">
      <div class="min-w-0">
        <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
          Editor
        </div>
        <div class="mt-1 flex items-center gap-3">
          <h2 class="font-display text-lg font-semibold text-white">
            HTML Source
          </h2>
          <span class="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-medium text-cyan-200">
            Live
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
          index.html
        </span>
        <button
          type="button"
          class="tool-btn tool-btn-editor"
          @click="emit('loadExample')"
        >
          <UIcon
            name="i-lucide-sparkles"
            class="size-4"
          />
          <span>Example</span>
        </button>
        <button
          type="button"
          class="tool-btn tool-btn-editor"
          @click="formatDocument"
        >
          <UIcon
            name="i-lucide-indent-increase"
            class="size-4"
          />
          <span>Format</span>
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between border-b border-slate-800 bg-[#0b1120] px-5 py-2 text-xs text-slate-500">
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full bg-rose-400" />
        <span class="size-2 rounded-full bg-amber-400" />
        <span class="size-2 rounded-full bg-emerald-400" />
      </div>
      <span>Monaco workspace</span>
    </div>

    <MonacoEditor
      :model-value="modelValue"
      lang="html"
      :options="editorOptions"
      class="min-h-[24rem] flex-1 overflow-hidden bg-slate-950 lg:min-h-0"
      @update:model-value="emit('update:modelValue', $event)"
      @load="handleEditorLoad"
    >
      <div class="flex min-h-[24rem] items-center justify-center bg-slate-950 text-sm text-slate-500 lg:min-h-0 lg:h-full">
        Loading editor...
      </div>
    </MonacoEditor>

    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-[#0b1120] px-5 py-2.5 text-xs text-slate-500">
      <div class="flex flex-wrap items-center gap-3">
        <span>{{ lineCount }} lines</span>
        <span>{{ characterCount.toLocaleString() }} chars</span>
        <span>UTF-8</span>
      </div>
      <span>{{ autoPreviewEnabled ? 'Auto-preview enabled' : 'Code-only mode' }}</span>
    </div>
  </section>
</template>
