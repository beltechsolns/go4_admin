import { useTranslation } from 'react-i18next'
import ActivityAndStats from '../features/dashboard/ActivityAndStats'
import ChartsPanel from '../features/dashboard/ChartsPanel'
import SummaryCards from '../features/dashboard/SummaryCards'
import DashboardExtraCharts from '../features/dashboard/DashboardExtraCharts'

export default function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#1B2559]">{t('dashboard.overview')}</h1>
      </header>

      <SummaryCards />
      <ChartsPanel />
      <DashboardExtraCharts />
      <ActivityAndStats />
    </div>
  )
}