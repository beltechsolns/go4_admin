import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

export function useStores({ search = '', type = '' } = {}) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [key, setKey]         = useState(0)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (type && type !== 'All') params.type = type

    api.get('/stores', { params })
      .then(r => { if (!cancelled) { setData(r.data.data); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.response?.data?.error || 'Failed to load stores') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, type, key])

  const remove = async (id) => { await api.delete(`/stores/${id}`); setKey(k => k + 1) }
  const refetch = useCallback(() => setKey(k => k + 1), [])

  return { data, loading, error, refetch, remove }
}

export function useStoreProducts(storeId, { search = '', category = '' } = {}) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [key, setKey]         = useState(0)

  useEffect(() => {
    let cancelled = false
    if (!storeId) { setLoading(false); return } // eslint-disable-line react-hooks/set-state-in-effect
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (category && category !== 'All Categories') params.category = category

    api.get(`/stores/${storeId}/products`, { params })
      .then(r => { if (!cancelled) setData(r.data.data) })
      .catch(() => { if (!cancelled) setData([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [storeId, search, category, key])

  const removeProduct = async (pid) => {
    await api.delete(`/stores/${storeId}/products/${pid}`)
    setKey(k => k + 1)
  }

  const refetch = useCallback(() => setKey(k => k + 1), [])

  return { data, loading, refetch, removeProduct }
}

export function useStoreCategories(storeId) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [key, setKey]         = useState(0)

  useEffect(() => {
    let cancelled = false
    if (!storeId) { setLoading(false); return } // eslint-disable-line react-hooks/set-state-in-effect
    setLoading(true)
    api.get(`/stores/${storeId}/categories`)
      .then(r => { if (!cancelled) setData(r.data.data) })
      .catch(() => { if (!cancelled) setData([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [storeId, key])

  const removeCategory = async (cid) => {
    await api.delete(`/stores/${storeId}/categories/${cid}`)
    setKey(k => k + 1)
  }

  const refetch = useCallback(() => setKey(k => k + 1), [])

  return { data, loading, refetch, removeCategory }
}
