import { Search } from 'lucide-react'

export default function DeliveriesToolbar({ search, status, onSearch, onStatus }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3AED0]" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by order ID or customer..."
          className="w-full rounded-xl border border-[#E0E5F2] bg-white py-2 pl-10 pr-4 text-sm text-[#1B2559] focus:border-[#F25C22] focus:outline-none"
        />
      </div>
      <select
        value={status}
        onChange={(e) => onStatus(e.target.value)}
        className="rounded-xl border border-[#E0E5F2] px-4 py-2 text-sm font-semibold text-[#1B2559] outline-none"
      >
        <option value="">All Status</option>
        <option value="Pending">Pending</option>
        <option value="Accepted">Accepted</option>
        <option value="Picked Up">Picked Up</option>
        <option value="In Transit">In Transit</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
        <option value="Failed">Failed</option>
      </select>
    </div>
  )
}
