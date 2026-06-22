import { Ban, Trash2 } from 'lucide-react'
import StatusBadge from '../../components/shared/StatusBadge'
import { LoadingRows, EmptyState } from '../../components/shared/LoadingRows'

export default function CustomersTable({ data = [], loading, error, onRemove, onToggleStatus }) {
  return (
    <div className="overflow-x-auto">
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[#F8F9FC] text-xs font-bold uppercase text-[#A3AED0]">
            <th className="rounded-l-xl p-4">Name</th>
            <th className="p-4">Phone</th>
            <th className="p-4">Total Orders</th>
            <th className="p-4">Status</th>
            <th className="p-4">Joined Date</th>
            <th className="rounded-r-xl p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F4F7FE]">
          {loading
            ? <LoadingRows cols={6} rows={5} />
            : data.length === 0
              ? <EmptyState message="No customers found" />
              : data.map((c) => (
                  <tr key={c.id} className="font-medium text-[#1B2559] hover:bg-[#F8F9FC]/60">
                    <td className="p-4 font-bold">{c.full_name}</td>
                    <td className="p-4 text-[#A3AED0]">{c.phone}</td>
                    <td className="p-4 font-bold">{c.total_orders}</td>
                    <td className="p-4"><StatusBadge label={c.status} /></td>
                    <td className="p-4 text-[#A3AED0]">
                      {c.joined_date ? new Date(c.joined_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3 text-[#A3AED0]">
                        <button
                          onClick={() => onToggleStatus(c.id)}
                          title="Toggle status"
                          className="hover:text-[#1B2559]"
                        >
                          <Ban size={15} />
                        </button>
                        <button
                          onClick={() => onRemove(c.id)}
                          title="Delete customer"
                          className="hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
          }
        </tbody>
      </table>
    </div>
  )
}
