import { useEffect, useState } from 'react'
import api from '../api/client'

export function useDashboardStats() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

export function useDashboardActivity() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/activity')
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

export function useDashboardChart() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/chart')
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

export function useDashboardQuickStats() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/quick-stats')
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
