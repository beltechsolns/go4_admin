import { Download } from 'lucide-react'
import PageHeader from '../components/shared/PageHeader'
import ReportCharts from '../features/reports/ReportCharts'
import RiderPerformanceTable from '../features/reports/RiderPerformanceTable'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        action={
          <button className="flex items-center gap-1.5 rounded-xl border border-[#E0E5F2] bg-white px-4 py-2 text-xs font-bold text-[#1B2559] shadow-sm">
            <Download size={14} /> Export Reports
          </button>
        }
      />

      <ReportCharts />
      <RiderPerformanceTable />
    </div>
  )
}
