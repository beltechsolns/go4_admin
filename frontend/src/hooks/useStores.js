import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

export function useStores({ search = '', type = '' } = {}) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (type && type !== 'All') params.type = type

    api.get('/stores', { params })
      .then(r => { setData(r.data.data); setError(null) })
      .catch(err => setError(err.response?.data?.error || 'Failed to load stores'))
      .finally(() => setLoading(false))
  }, [search, type])

  useEffect(() => { fetch() }, [fetch])

  const remove = async (id) => { await api.delete(`/stores/${id}`); fetch() }

  return { data, loading, error, refetch: fetch, remove }
}

export function useStoreProducts(storeId, { search = '', category = '' } = {}) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(() => {
    if (!storeId) return
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (category && category !== 'All Categories') params.category = category

    api.get(`/stores/${storeId}/products`, { params })
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [storeId, search, category])

  useEffect(() => { fetch() }, [fetch])

  const removeProduct = async (pid) => {
    await api.delete(`/stores/${storeId}/products/${pid}`)
    fetch()
  }

  return { data, loading, refetch: fetch, removeProduct }
}

export function useStoreCategories(storeId) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(() => {
    if (!storeId) return
    api.get(`/stores/${storeId}/categories`)
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [storeId])

  useEffect(() => { fetch() }, [fetch])

  const removeCategory = async (cid) => {
    await api.delete(`/stores/${storeId}/categories/${cid}`)
    fetch()
  }

  return { data, loading, refetch: fetch, removeCategory }
}
