import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../api/client'

export default function useSettings() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [saved, setSaved]     = useState(false)
  const timerRef              = useRef(null)

  useEffect(() => {
    api.get('/settings')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  // Auto-hide success banner after 3s
  useEffect(() => {
    if (saved) {
      timerRef.current = setTimeout(() => setSaved(false), 3000)
      return () => clearTimeout(timerRef.current)
    }
  }, [saved])

  const save = useCallback(async ({ general, notifications, language }) => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const r = await api.put('/settings', {
        app_name:                  general.appName,
        support_email:             general.email,
        support_phone:             general.phone,
        notify_new_order:          notifications.newOrder,
        notify_delivery_complete:  notifications.delivery,
        notify_rider_offline:      notifications.system,
        language,
      })
      setData(r.data.data)
      setSaved(true)
      return true
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { data, loading, saving, error, saved, save }
}