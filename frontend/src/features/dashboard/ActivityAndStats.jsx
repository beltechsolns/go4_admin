import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '../../components/shared/Card'
import { useDashboardActivity, useDashboardQuickStats } from '../../hooks/useDashboard'

function timeAgo(dateStr, t) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('dashboard.justNow')
  if (mins < 60) return t('dashboard.minAgo', { mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('dashboard.hrAgo', { hrs })
  return t('dashboard.daysAgo', { days: Math.floor(hrs / 24) })
}

export default function ActivityAndStats() {
  const { t } = useTranslation()
  const { data: activity, loading: aLoading } = useDashboardActivity()
  const { data: stats,    loading: sLoading } = useDashboardQuickStats()

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card title={t('dashboard.recentActivity')} className="xl:col-span-2">
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
              ? <p className="py-4 text-sm text-[#A3AED0]">{t('dashboard.noData')}</p>
              : activity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="rounded-lg bg-[#FFF3EE] p-2 text-[#F25C22]">
                      <Clock size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1B2559]">{item.m}</p>
                      <span className="text-xs text-[#A3AED0]">{timeAgo(item.t, t)}</span>
                    </div>
                  </div>
                ))
          }
        </div>
      </Card>

      <Card title={t('dashboard.quickStats')}>
        <div className="space-y-4 text-sm font-semibold">
          <div className="border-b border-[#F4F7FE] pb-2">
            <span className="block text-xs text-[#A3AED0]">{t('dashboard.todaysOrders')}</span>
            <span className="block text-base font-bold text-[#1B2559]">
              {sLoading ? '—' : stats?.today_orders ?? 0}
            </span>
          </div>
          <div className="border-b border-[#F4F7FE] pb-2">
            <span className="block text-xs text-[#A3AED0]">{t('dashboard.avgDeliveryTime')}</span>
            <span className="block text-base font-bold text-[#1B2559]">
              {sLoading ? '—' : `${stats?.avg_delivery_time ?? 28} ${t('dashboard.minutes')}`}
            </span>
          </div>
          <div className="border-b border-[#F4F7FE] pb-2">
            <span className="block text-xs text-[#A3AED0]">{t('dashboard.customerSatisfaction')}</span>
            <span className="block text-base font-bold text-[#1B2559]">
              {sLoading ? '—' : `${stats?.customer_satisfaction ?? 4.8}/5`}
            </span>
          </div>
          <div>
            <span className="block text-xs text-[#A3AED0]">{t('dashboard.activeRiders')}</span>
            <span className="block text-base font-bold text-[#1B2559]">
              {sLoading ? '—' : `${stats?.active_riders ?? 0}/${stats?.total_riders ?? 0}`}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}