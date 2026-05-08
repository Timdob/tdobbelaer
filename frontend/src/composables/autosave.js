import { onBeforeUnmount, ref } from 'vue'

export function useAutosave(saveFn, delay = 700) {
  const savingKey = ref(null)
  const savedAt = ref('')
  const error = ref('')
  const timers = new Map()

  function markSaved() {
    savedAt.value = new Date().toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function queue(key, payload) {
    error.value = ''
    if (timers.has(key)) clearTimeout(timers.get(key))
    timers.set(key, setTimeout(() => flush(key, payload), delay))
  }

  async function flush(key, payload) {
    if (timers.has(key)) {
      clearTimeout(timers.get(key))
      timers.delete(key)
    }
    savingKey.value = key
    try {
      const result = await saveFn(payload)
      markSaved()
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      savingKey.value = null
    }
  }

  function cancelAll() {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  }

  onBeforeUnmount(cancelAll)

  return { savingKey, savedAt, error, queue, flush, cancelAll }
}
