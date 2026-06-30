import { Calendar } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ExportModal from '../components/shared/ExportModal'
import PageHeader from '../components/shared/PageHeader'
import ReportCharts from '../features/reports/ReportCharts'
import RiderPerformanceTable from '../features/reports/RiderPerformanceTable'

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}
function defaultTo() {
  return new Date().toISOString().split('T')[0]
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const [showExport, setShowExport] = useState(false)
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo]     = useState(defaultTo)

  return (
    <div className="space-y-6">
      {showExport &&
        <ExportModal from={from} to={to} onClose={() => setShowExport(false)} />}

      <PageHeader
        title={t('reports.title')}
        action={
          <button onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#E0E5F2] bg-white px-4 py-2 text-xs font-bold text-[#1B2559] shadow-sm hover:bg-gray-50 transition-colors">
            <Download size={14} /> {t('reports.export')}
          </button>
        }
      />

      <div className="flex items-center gap-3 rounded-2xl border border-[#E0E5F2] bg-white p-4 shadow-sm">
        <Calendar size={16} className="text-[#F25C22]" />
        <label className="text-xs font-semibold text-[#1B2559]">{t('reports.from')}</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="rounded-lg border border-[#E0E5F2] px-3 py-1.5 text-sm text-[#1B2559] outline-none focus:border-[#F25C22]" />
        <label className="text-xs font-semibold text-[#1B2559]">{t('reports.to')}</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="rounded-lg border border-[#E0E5F2] px-3 py-1.5 text-sm text-[#1B2559] outline-none focus:border-[#F25C22]" />
      </div>

      <ReportCharts from={from} to={to} />
      <RiderPerformanceTable from={from} to={to} />
    </div>
  )
}