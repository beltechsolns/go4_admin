import { Clock } from 'lucide-react'
import Card from '../../components/shared/Card'
import { useDashboardActivity, useDashboardQuickStats } from '../../hooks/useDashboard'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} days ago`
}

export default function ActivityAndStats() {
  const { data: activity, loading: aLoading } = useDashboardActivity()
  const { data: stats,    loading: sLoading } = useDashboardQuickStats()

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card title="Recent Activity" className="xl:col-span-2">
        <div className="divide-y divide-[#F4F7FE]">
          {aLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="h-8 w-8 rounded-lg bg-[#F4F7FE] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-48 rounded bg-[#F4F7FE] animate-pulse" />
                    <div className="h-2 w-20 rounded bg-[#F4F7FE] animate-pulse" />
                  </div>
                </div>
              ))
            : activity.length === 0
              ? <p className="py-4 text-sm text-[#A3AED0]">No recent activity</p>
              : activity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="rounded-lg bg-[#FFF3EE] p-2 text-[#F25C22]">
                      <Clock size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1B2559]">{item.m}</p>
                      <span className="text-xs text-[#A3AED0]">{timeAgo(item.t)}</span>
                    </div>
                  </div>
                ))
          }
        </div>
      </Card>

      <Card title="Quick Stats">
        <div className="space-y-4 text-sm font-semibold">
          <div className="border-b border-[#F4F7FE] pb-2">
            <span className="block text-xs text-[#A3AED0]">Today's Orders</span>
            <span className="block text-base font-bold text-[#1B2559]">
              {sLoading ? '—' : stats?.today_orders ?? 0}
            </span>
          </div>
          <div className="border-b border-[#F4F7FE] pb-2">
            <span className="block text-xs text-[#A3AED0]">Avg. Delivery Time</span>
            <span className="block text-base font-bold text-[#1B2559]">
              {sLoading ? '—' : `${stats?.avg_delivery_time ?? 28} min`}
            </span>
          </div>
          <div className="border-b border-[#F4F7FE] pb-2">
            <span className="block text-xs text-[#A3AED0]">Customer Satisfaction</span>
            <span className="block text-base font-bold text-[#1B2559]">
              {sLoading ? '—' : `${stats?.customer_satisfaction ?? 4.8}/5`}
            </span>
          </div>
          <div>
            <span className="block text-xs text-[#A3AED0]">Active Riders</span>
            <span className="block text-base font-bold text-[#1B2559]">
              {sLoading ? '—' : `${stats?.active_riders ?? 0}/${stats?.total_riders ?? 0}`}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
