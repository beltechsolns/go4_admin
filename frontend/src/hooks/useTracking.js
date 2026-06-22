import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'

export default function useTracking() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(() => {
    api.get('/tracking/riders')
      .then(r => setData(r.data.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch()
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetch, 10000)
    return () => clearInterval(interval)
  }, [fetch])

  return { data, loading, refetch: fetch }
}
