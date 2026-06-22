const styles = {
  Active: 'bg-[#E6F9F0] text-[#05CD99]',
  Inactive: 'bg-[#F4F7FE] text-[#A3AED0]',
  Online: 'bg-[#E6F9F0] text-[#05CD99]',
  Offline: 'bg-[#F4F7FE] text-[#A3AED0]',
  Busy: 'bg-[#FFF9E6] text-[#FFB800]',
  Delivered: 'bg-[#E6F9F0] text-[#05CD99]',
  Pending: 'bg-[#FFF9E6] text-[#FFB800]',
  'Picked Up': 'bg-[#F2EBF9] text-[#A65EE3]',
  'In Transit': 'bg-[#E6EFFA] text-[#3377FF]',
}

export default function StatusBadge({ label }) {
  const className = styles[label] ?? 'bg-[#F4F7FE] text-[#A3AED0]'

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  )
}
