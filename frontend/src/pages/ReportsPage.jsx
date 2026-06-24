import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/shared/PageHeader'
import ReportCharts from '../features/reports/ReportCharts'
import RiderPerformanceTable from '../features/reports/RiderPerformanceTable'

export default function ReportsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reports.title')}
        action={
          <button className="flex items-center gap-1.5 rounded-xl border border-[#E0E5F2] bg-white px-4 py-2 text-xs font-bold text-[#1B2559] shadow-sm">
            <Download size={14} /> {t('reports.export')}
          </button>
        }
      />

      <ReportCharts />
      <RiderPerformanceTable />
    </div>
  )
}