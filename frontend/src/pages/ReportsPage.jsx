import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ExportModal from '../components/shared/ExportModal'
import PageHeader from '../components/shared/PageHeader'
import ReportCharts from '../features/reports/ReportCharts'
import RiderPerformanceTable from '../features/reports/RiderPerformanceTable'

export default function ReportsPage() {
  const { t } = useTranslation()
  const [showExport, setShowExport] = useState(false)

  return (
    <div className="space-y-6">
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      <PageHeader
        title={t('reports.title')}
        action={
          <button onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#E0E5F2] bg-white px-4 py-2 text-xs font-bold text-[#1B2559] shadow-sm hover:bg-gray-50 transition-colors">
            <Download size={14} /> {t('reports.export')}
          </button>
        }
      />

      <ReportCharts />
      <RiderPerformanceTable />
    </div>
  )
}