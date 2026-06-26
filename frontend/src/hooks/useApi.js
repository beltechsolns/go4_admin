import { useCallback, useEffect, useState } from 'react'

export default function useApi(fetcher, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [key, setKey]         = useState(0)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fetcher()
      .then(result => { if (!cancelled) setData(result) })
      .catch(err => { if (!cancelled) setError(err.response?.data?.error || 'Something went wrong') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, key])

  const refetch = useCallback(() => setKey(k => k + 1), [])

  return { data, loading, error, refetch }
}
