import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
  const read = useCallback(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  }, [key, initialValue])

  const [value, setValue] = useState(read)

  // Persist to localStorage whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // quota exceeded or private mode — silently degrade to in-memory
    }
  }, [key, value])

  // Sync across tabs — when another tab writes the same key, update this tab
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== key || e.storageArea !== localStorage) return
      try {
        const next = e.newValue ? JSON.parse(e.newValue) : initialValue
        setValue(next)
      } catch {
        // malformed JSON from another tab — ignore
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, initialValue])

  return [value, setValue]
}
