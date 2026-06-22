import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

export default function useDeliveries({ search = '', status = '', page = 1 } = {}) {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = { page }
    if (search) params.search = search
    if (status) params.status = status

    api.get('/deliveries', { params })
      .then(r => {
        setData(r.data.data)
        setTotal(r.data.total)
        setPages(r.data.pages)
        setError(null)
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load deliveries'))
      .finally(() => setLoading(false))
  }, [search, status, page])

  useEffect(() => { fetch() }, [fetch])

  const assignRider = async (deliveryId, riderId) => {
    await api.patch(`/deliveries/${deliveryId}/assign`, { rider_id: riderId })
    fetch()
  }

  const updateStatus = async (deliveryId, status, note = '') => {
    await api.patch(`/deliveries/${deliveryId}/status`, { status, note })
    fetch()
  }

  return { data, total, pages, loading, error, refetch: fetch, assignRider, updateStatus }
}
