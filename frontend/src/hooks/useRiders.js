import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

export default function useRiders({ search = '', status = '', page = 1 } = {}) {
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

    api.get('/riders', { params })
      .then(r => {
        setData(r.data.data)
        setTotal(r.data.total)
        setPages(r.data.pages)
        setError(null)
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load riders'))
      .finally(() => setLoading(false))
  }, [search, status, page])

  useEffect(() => { fetch() }, [fetch])

  const remove = async (id) => {
    await api.delete(`/riders/${id}`)
    fetch()
  }

  const toggleStatus = async (id) => {
    await api.patch(`/riders/${id}/status`)
    fetch()
  }

  return { data, total, pages, loading, error, refetch: fetch, remove, toggleStatus }
}
