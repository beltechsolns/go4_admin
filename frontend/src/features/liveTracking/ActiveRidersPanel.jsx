import { ChevronRight, Clock } from 'lucide-react'
import useTracking from '../../hooks/useTracking'

const statusColor = {
  Online:  'bg-green-100 text-green-600',
  Busy:    'bg-blue-100 text-blue-600',
  Offline: 'bg-gray-100 text-gray-500',
}

export default function ActiveRidersPanel() {
  const { data: riders, loading } = useTracking()

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[#E0E5F2] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1B2559]">Active Riders</h3>
          <span className="rounded-md bg-[#FFF3E8] px-2.5 py-0.5 text-sm font-bold text-[#F25C22]">
            {riders.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-[#F4F7FE] animate-pulse" />
            ))}
          </div>
        ) : riders.length === 0 ? (
          <p className="py-4 text-sm text-center text-[#A3AED0]">No active riders</p>
        ) : (
          <div className="space-y-3">
            {riders.map((rider) => (
              <div key={rider.id} className="rounded-xl border border-[#F4F7FE] p-3.5 text-xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-[#1B2559] leading-tight">{rider.full_name}</p>
                    <p className="text-[#A3AED0] mt-0.5">
                      {rider.current_order?.order_number ?? 'No active order'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor[rider.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {rider.status}
                  </span>
                </div>
                <div className="space-y-1 text-[#A3AED0]">
                  <div className="flex justify-between">
                    <span>Customer</span>
                    <span className="font-semibold text-[#1B2559]">
                      {rider.current_order?.customer_name ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone</span>
                    <span className="font-semibold text-[#1B2559]">{rider.zone ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vehicle</span>
                    <span className="font-semibold text-[#1B2559]">{rider.vehicle_type}</span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-[#F4F7FE] pt-2.5">
                  <span className="text-[#F25C22] font-semibold">⭐ {rider.rating}</span>
                  <ChevronRight size={14} className="text-[#A3AED0]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#FFEADA] bg-[#FFF8F4] p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={15} className="text-[#F25C22]" />
          <h3 className="text-sm font-bold text-[#1B2559]">Live Updates</h3>
        </div>
        <p className="text-xs text-[#A3AED0]">Rider locations refresh every 10 seconds automatically.</p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-2 w-2 animate-ping rounded-full bg-[#05CD99]" />
          <span className="text-xs font-semibold text-[#05CD99]">Tracking Active</span>
        </div>
      </div>
    </div>
  )
}
