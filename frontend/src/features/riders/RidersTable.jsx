import { Ban, MapPin, Star, Trash2 } from 'lucide-react'
import StatusBadge from '../../components/shared/StatusBadge'
import { LoadingRows, EmptyState } from '../../components/shared/LoadingRows'

export default function RidersTable({ data = [], loading, error, onRemove, onToggleStatus }) {
  return (
    <div className="overflow-x-auto">
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[#F8F9FC] text-xs font-bold uppercase text-[#A3AED0]">
            <th className="rounded-l-xl p-4">Rider</th>
            <th className="p-4">Vehicle</th>
            <th className="p-4">Zone</th>
            <th className="p-4">Deliveries</th>
            <th className="p-4">Rating</th>
            <th className="p-4">Status</th>
            <th className="rounded-r-xl p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F4F7FE]">
          {loading
            ? <LoadingRows cols={7} rows={5} />
            : data.length === 0
              ? <EmptyState message="No riders found" />
              : data.map((r) => (
                  <tr key={r.id} className="font-medium text-[#1B2559] hover:bg-[#F8F9FC]/60">
                    <td className="p-4 font-bold">{r.full_name}</td>
                    <td className="p-4 text-[#A3AED0]">{r.vehicle_type}</td>
                    <td className="p-4 text-[#A3AED0]">
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-[#F25C22]" />
                        {r.zone ?? '—'}
                      </div>
                    </td>
                    <td className="p-4 font-bold">{r.total_deliveries}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 font-bold">
                        <Star size={13} className="fill-[#FFB800] text-[#FFB800]" />
                        {r.rating}
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge label={r.status} /></td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3 text-[#A3AED0]">
                        <button onClick={() => onToggleStatus(r.id)} title="Toggle status" className="hover:text-[#1B2559]">
                          <Ban size={15} />
                        </button>
                        <button onClick={() => onRemove(r.id)} title="Remove rider" className="hover:text-red-500">
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
