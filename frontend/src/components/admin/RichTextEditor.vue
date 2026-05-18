<template>
  <div class="rte">
    <div class="rte-toolbar">
      <select class="format-select" @change="formatBlock($event.target.value)">
        <option value="p">Paragraaf</option>
        <option value="h2">Kop H2</option>
        <option value="h3">Kop H3</option>
        <option value="blockquote">Quote</option>
      </select>

      <span class="sep"></span>
      <button type="button" @click="exec('bold')" title="Vet"><strong>B</strong></button>
      <button type="button" @click="exec('italic')" title="Cursief"><em>I</em></button>
      <button type="button" @click="exec('underline')" title="Onderstreept"><u>U</u></button>

      <span class="sep"></span>
      <button type="button" @click="exec('insertUnorderedList')">Lijst</button>
      <button type="button" @click="exec('insertOrderedList')">Nummering</button>
      <button type="button" @click="exec('justifyLeft')">Links</button>
      <button type="button" @click="exec('justifyCenter')">Midden</button>

      <span class="sep"></span>
      <button type="button" @click="addLink">Link</button>
      <button type="button" @click="addImage">Afbeelding</button>
      <button type="button" @click="exec('removeFormat')">Opschonen</button>
      <button type="button" class="source-btn" @click="toggleSource">{{ sourceMode ? 'Editor' : 'HTML' }}</button>
    </div>

    <textarea
      v-if="sourceMode"
      class="source-area"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    ></textarea>

    <div
      v-else
      ref="editor"
      class="rte-area prose"
      contenteditable="true"
      @input="onInput"
      @blur="onInput"
      @paste="onPaste"
    ></div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { api } from '../../composables/api'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const editor = ref(null)
const sourceMode = ref(false)

function setContent(html) {
  if (!editor.value || sourceMode.value) return
  // Vervang {placeholders} in href tijdelijk door data-href zodat de browser ze niet escapet
  const safe = (html || '').replace(/href="([^"]*)"/g, (match, href) => {
    if (href.includes('{')) return `href="${href.replace(/\{/g, '%7B').replace(/\}/g, '%7D')}"`
    return match
  })
  if (editor.value.innerHTML !== safe) editor.value.innerHTML = safe
}

onMounted(() => setContent(props.modelValue))
watch(() => props.modelValue, (value) => setContent(value))

function onInput() {
  const html = editor.value?.innerHTML || ''
  emit('update:modelValue', restoreTemplatePlaceholders(html))
}

function restoreTemplatePlaceholders(html) {
  // De browser escapet { en } in href-attributen naar %7B / %7D — herstel die zodat {variabelen} werkbaar blijven
  return html.replace(/href="([^"]+)"/g, (match, href) => {
    const restored = href.replace(/%7B/gi, '{').replace(/%7D/gi, '}')
    return `href="${restored}"`
  })
}

function exec(command, value = null) {
  document.execCommand(command, false, value)
  editor.value?.focus()
  onInput()
}

function formatBlock(tag) {
  exec('formatBlock', `<${tag}>`)
}

function addLink() {
  const url = prompt('Link URL:')
  if (!url) return
  exec('createLink', url)
}

async function addImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    try {
      const result = await api.post('/api/admin/upload', { fileName: file.name, dataUrl })
      exec('insertImage', result.url)
    } catch (error) {
      alert(error.message)
    }
  }
  input.click()
}

function toggleSource() {
  sourceMode.value = !sourceMode.value
  if (!sourceMode.value) nextTick(() => setContent(props.modelValue))
}

function onPaste(event) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}
</script>

<style scoped>
.rte {
  overflow: hidden;
  border: 1px solid var(--border-strong);
  border-radius: 16px;
  background: var(--field-bg);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text) 5%, transparent);
}
.rte-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 10px;
  background: color-mix(in srgb, var(--surface) 80%, transparent);
  border-bottom: 1px solid var(--border);
}
.format-select,
.rte-toolbar button {
  min-height: 34px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: color-mix(in srgb, var(--bg) 62%, transparent);
  color: var(--text);
  font-size: 0.82rem;
}
.format-select {
  padding: 0 10px;
}
.rte-toolbar button {
  padding: 0 11px;
}
.rte-toolbar button:hover,
.source-btn {
  border-color: var(--border-strong);
  background: var(--accent-dim);
}
.sep {
  width: 1px;
  height: 26px;
  margin: 0 4px;
  background: var(--border);
}
.rte-area,
.source-area {
  width: 100%;
  min-height: 440px;
  padding: 24px;
  outline: none;
  border: 0;
  color: var(--text);
  background: transparent;
  line-height: 1.75;
}
.source-area {
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.9rem;
}
.prose :deep(h2) { margin: 1.4em 0 0.45em; font-size: 1.75rem; }
.prose :deep(h3) { margin: 1.2em 0 0.4em; font-size: 1.3rem; }
.prose :deep(p) { color: var(--text); opacity: 0.88; }
.prose :deep(a) { color: var(--accent-2); border-bottom: 1px solid currentColor; }
.prose :deep(img) { max-width: 100%; border: 1px solid var(--border); border-radius: 14px; margin: 18px 0; }
.prose :deep(blockquote) {
  margin: 22px 0;
  padding: 16px 18px;
  border-left: 3px solid var(--accent);
  border-radius: 0 12px 12px 0;
  background: var(--accent-dim);
  color: var(--text);
}
.prose :deep(ul), .prose :deep(ol) { padding-left: 24px; }
</style>
