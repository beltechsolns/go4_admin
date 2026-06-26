import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

export default function useRiders({ search = '', status = '', page = 1 } = {}) {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [key, setKey]         = useState(0)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const params = { page }
    if (search) params.search = search
    if (status) params.status = status

    api.get('/riders', { params })
      .then(r => {
        if (cancelled) return
        setData(r.data.data)
        setTotal(r.data.total)
        setPages(r.data.pages)
        setError(null)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.response?.data?.error || 'Failed to load riders')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, status, page, key])

  const remove = async (id) => {
    await api.delete(`/riders/${id}`)
    setKey(k => k + 1)
  }

  const toggleStatus = async (id) => {
    await api.patch(`/riders/${id}/status`)
    setKey(k => k + 1)
  }

  const refetch = useCallback(() => setKey(k => k + 1), [])

  return { data, total, pages, loading, error, refetch, remove, toggleStatus }
}
