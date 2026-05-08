<template>
  <div class="upload">
    <div class="preview" v-if="modelValue">
      <img :src="modelValue" alt="" />
      <button type="button" class="remove" @click="$emit('update:modelValue', '')">×</button>
    </div>
    <label class="dropzone" :class="{ uploading }">
      <input type="file" accept="image/*" @change="onFile" hidden />
      <span v-if="uploading">Uploaden...</span>
      <span v-else>{{ modelValue ? 'Vervangen' : 'Klik om afbeelding te uploaden' }}</span>
    </label>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { api } from '../../composables/api'

defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const error = ref('')

async function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  error.value = ''
  uploading.value = true
  try {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.onerror = rej
      r.readAsDataURL(file)
    })
    const result = await api.post('/api/admin/upload', { fileName: file.name, dataUrl })
    emit('update:modelValue', result.url)
  } catch (err) { error.value = err.message }
  finally { uploading.value = false; e.target.value = '' }
}
</script>

<style scoped>
.upload { display: flex; flex-direction: column; gap: 10px; }
.preview { position: relative; border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); }
.preview img { width: 100%; height: 160px; object-fit: cover; }
.remove {
  position: absolute; top: 8px; right: 8px; width: 28px; height: 28px;
  border-radius: 50%; background: var(--overlay-bg); color: var(--text-inverse); border: 0;
  font-size: 18px; line-height: 1;
}
.dropzone {
  display: grid; place-items: center;
  padding: 24px; border: 1px dashed var(--border-strong); border-radius: var(--radius);
  background: var(--field-bg); color: var(--muted); cursor: pointer; transition: all 0.2s;
}
.dropzone:hover { border-color: var(--accent); color: var(--text); }
.dropzone.uploading { opacity: 0.6; pointer-events: none; }
.error { color: var(--danger); font-size: 0.85rem; }
</style>
