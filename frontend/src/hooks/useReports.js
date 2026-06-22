import { useEffect, useState } from 'react'
import api from '../api/client'

export function useDeliveryTrends() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/reports/trends')
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])
  return { data, loading }
}

export function usePeakHours() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/reports/peak-hours')
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])
  return { data, loading }
}

export function useRiderPerformance() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/reports/rider-performance')
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])
  return { data, loading }
}

export function useOrdersByCategory() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/reports/categories')
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])
  return { data, loading }
}
