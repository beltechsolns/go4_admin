import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

export default function useOrders({ search = '', status = '', page = 1 } = {}) {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [key, setKey]         = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = { page }
    if (search) params.search = search
    if (status) params.status = status

    api.get('/orders', { params })
      .then(r => {
        if (cancelled) return
        setData(r.data.data)
        setTotal(r.data.pagination.total)
        setPages(r.data.pagination.pages)
        setError(null)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.response?.data?.message || 'Failed to load orders')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, status, page, key])

  const refetch = useCallback(() => setKey(k => k + 1), [])

  return { data, total, pages, loading, error, refetch }
}
