import { useCallback, useEffect, useState } from 'react'

/**
 * Generic data-fetching hook.
 * @param {Function} fetcher  - async function that returns response.data.data
 * @param {Array}    deps     - dependency array (re-fetches when these change)
 */
export default function useApi(fetcher, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
