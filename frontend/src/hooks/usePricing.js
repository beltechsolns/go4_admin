import { useEffect, useState } from 'react'
import api from '../api/client'

export default function usePricing() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get('/pricing')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load pricing'))
      .finally(() => setLoading(false))
  }, [])

  const save = async (values) => {
    setSaving(true)
    setError(null)
    try {
      const r = await api.put('/pricing', {
        base_fee:        parseFloat(values.base),
        per_km_rate:     parseFloat(values.perKm),
        service_charge:  parseFloat(values.service),
        min_order:       parseFloat(values.minOrder),
        peak_surcharge:  parseFloat(values.peakSurcharge),
      })
      setData(r.data.data)
      return true
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save pricing')
      return false
    } finally {
      setSaving(false)
    }
  }

  // Map DB fields → form field names
  const formValues = data
    ? {
        base:           String(data.base_fee),
        perKm:          String(data.per_km_rate),
        service:        String(data.service_charge),
        minOrder:       String(data.min_order),
        peakSurcharge:  String(data.peak_surcharge),
      }
    : null

  return { data, formValues, loading, saving, error, save }
}
