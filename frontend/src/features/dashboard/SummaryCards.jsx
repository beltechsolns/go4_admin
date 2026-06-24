import { useTranslation } from 'react-i18next'
import Card from '../../components/shared/Card'
import { useDashboardStats } from '../../hooks/useDashboard'

export default function SummaryCards() {
  const { t } = useTranslation()
  const { data, loading } = useDashboardStats()

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="mb-2 h-3 w-24 rounded bg-[#F4F7FE] animate-pulse" />
            <div className="h-7 w-16 rounded bg-[#F4F7FE] animate-pulse" />
          </Card>
        ))}
      </div>
    )
  }

  const cards = data?.length ? data : [
    { title: t('dashboard.totalOrders'), value: 0 },
    { title: t('dashboard.activeDeliveries'), value: 0 },
    { title: t('dashboard.availableRiders'), value: 0 },
    { title: t('dashboard.totalRevenue'), value: 'ETB 0' },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="p-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#A3AED0]">{card.title}</p>
          <p className="text-2xl font-bold text-[#1B2559]">{card.value}</p>
        </Card>
      ))}
    </div>
  )
}