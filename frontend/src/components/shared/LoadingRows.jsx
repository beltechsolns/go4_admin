export function LoadingRows({ cols = 5, rows = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="p-4">
          <div className="h-4 rounded bg-[#F4F7FE] animate-pulse" />
        </td>
      ))}
    </tr>
  ))
}

export function LoadingCards({ count = 6 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="h-64 rounded-2xl bg-[#F4F7FE] animate-pulse" />
  ))
}

export function EmptyState({ message = 'No data found' }) {
  return (
    <tr>
      <td colSpan={20} className="p-10 text-center text-sm text-[#A3AED0]">
        {message}
      </td>
    </tr>
  )
}
