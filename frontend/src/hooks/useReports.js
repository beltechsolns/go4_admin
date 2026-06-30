import { useEffect, useState } from 'react'
import api from '../api/client'

export function useDeliveryTrends(from, to) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const params = {}
    if (from) params.from = from
    if (to) params.to = to
    api.get('/reports/trends', { params })
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [from, to])
  return { data, loading }
}

export function usePeakHours(from, to) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const params = {}
    if (from) params.from = from
    if (to) params.to = to
    api.get('/reports/peak-hours', { params })
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [from, to])
  return { data, loading }
}

export function useRiderPerformance(from, to) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const params = {}
    if (from) params.from = from
    if (to) params.to = to
    api.get('/reports/rider-performance', { params })
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [from, to])
  return { data, loading }
}

export function useOrdersByCategory(from, to) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const params = {}
    if (from) params.from = from
    if (to) params.to = to
    api.get('/reports/categories', { params })
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [from, to])
  return { data, loading }
}
