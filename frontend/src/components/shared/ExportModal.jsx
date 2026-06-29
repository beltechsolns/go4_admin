import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { utils, write } from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../../api/client'
import Modal from './Modal'

export default function ExportModal({ onClose }) {
  const { t } = useTranslation()
  const [exporting, setExporting] = useState(null)
  const [hover, setHover] = useState(null)

  const fetchAll = useCallback(async () => {
    const [summary, trends, peakHours, categories, riders] = await Promise.all([
      api.get('/reports/summary').then(r => r.data.data),
      api.get('/reports/trends').then(r => r.data.data),
      api.get('/reports/peak-hours').then(r => r.data.data),
      api.get('/reports/categories').then(r => r.data.data),
      api.get('/reports/rider-performance').then(r => r.data.data),
    ])
    return { summary, trends, peakHours, categories, riders }
  }, [])

  const exportExcel = useCallback(async () => {
    setExporting('excel')
    try {
      const { summary, trends, peakHours, categories, riders } = await fetchAll()
      const wb = utils.book_new()

      if (summary) utils.bookAppendSheet(wb, utils.json_to_sheet([summary]), 'Summary')
      if (trends?.length) utils.bookAppendSheet(wb, utils.json_to_sheet(trends), 'Delivery Trends')
      if (peakHours?.length) utils.bookAppendSheet(wb, utils.json_to_sheet(peakHours), 'Peak Hours')
      if (categories?.length) utils.bookAppendSheet(wb, utils.json_to_sheet(categories), 'Categories')
      if (riders?.length) utils.bookAppendSheet(wb, utils.json_to_sheet(riders), 'Rider Performance')

      const data = write(wb, { bookType: 'xlsx', type: 'buffer' })
      const blob = new Blob([data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'G4_Delivery_Report.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (e) { console.error('Excel export error:', e) }
    setExporting(null)
    onClose()
  }, [fetchAll, onClose])

  const exportPDF = useCallback(async () => {
    setExporting('pdf')
    try {
      const { summary, trends, peakHours, categories, riders } = await fetchAll()
      const doc = new jsPDF()

      doc.setTextColor(242, 92, 34)
      doc.setFontSize(20).text('G4 Delivery Report', 14, 20)
      doc.setTextColor(100)
      doc.setFontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)

      const brandHead = (rows) => ({
        headStyles: { fillColor: [242, 92, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
        body: rows,
        theme: 'grid',
      })

      if (summary) {
        doc.setTextColor(242, 92, 34)
        doc.setFontSize(14).text('Summary', 14, 40)
        const rows = Object.entries(summary).map(([k, v]) => [k, String(v ?? '')])
        autoTable(doc, { startY: 44, head: [['Metric', 'Value']], ...brandHead(rows) })
      }

      let y = doc.lastAutoTable.finalY + 14
      if (trends.length) {
        doc.setTextColor(242, 92, 34)
        doc.setFontSize(14).text('Delivery Trends', 14, y)
        y += 6
        autoTable(doc, {
          startY: y, head: [['Date', 'Total', 'Completed', 'Cancelled']],
          ...brandHead(trends.map(r => [r.date, r.total, r.completed, r.cancelled])),
        })
        y = doc.lastAutoTable.finalY + 14
      }

      if (peakHours.length) {
        doc.setTextColor(242, 92, 34)
        doc.setFontSize(14).text('Peak Hours', 14, y)
        y += 6
        autoTable(doc, {
          startY: y, head: [['Hour', 'Orders']],
          ...brandHead(peakHours.map(r => [`${r.hour}:00`, r.count])),
        })
        y = doc.lastAutoTable.finalY + 14
      }

      if (categories.length) {
        doc.setTextColor(242, 92, 34)
        doc.setFontSize(14).text('Orders by Category', 14, y)
        y += 6
        autoTable(doc, {
          startY: y, head: [['Category', 'Orders']],
          ...brandHead(categories.map(r => [r.type ?? r.name, r.count])),
        })
        y = doc.lastAutoTable.finalY + 14
      }

      if (riders.length) {
        doc.setTextColor(242, 92, 34)
        doc.setFontSize(14).text('Rider Performance', 14, Math.min(y, doc.internal.pageSize.height - 40))
        autoTable(doc, {
          startY: Math.min(y, doc.internal.pageSize.height - 40),
          head: [['Rider', 'Total Deliveries', 'Success Rate', 'Avg Time']],
          ...brandHead(riders.map(r => [r.full_name, r.total_deliveries, `${r.success_rate}%`, r.avg_delivery_time])),
        })
      }

      doc.save('G4_Delivery_Report.pdf')
    } catch { /* ignore */ }
    setExporting(null)
    onClose()
  }, [fetchAll, onClose])

  return (
    <Modal title={t('reports.exportReport')} onClose={onClose}>
      <p className="mb-5 text-sm text-[#A3AED0]">{t('reports.exportDesc')}</p>
      <div className="flex flex-col gap-3">
        <button onClick={exportExcel} disabled={exporting !== null}
          onMouseEnter={() => setHover('excel')} onMouseLeave={() => setHover(null)}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E0E5F2] bg-white px-4 py-3.5 text-sm font-semibold text-[#1B2559] shadow-sm transition-all hover:scale-[1.01] hover:border-[#05CD99] hover:bg-green-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hover === 'excel' ? <Download size={20} className="text-[#05CD99]" /> : <FileSpreadsheet size={20} className="text-[#05CD99]" />}
          <div className="text-left">
            <p className="font-bold">{t('reports.exportExcel')}</p>
            <p className="text-xs text-[#A3AED0]">{t('reports.exportExcelDesc')}</p>
          </div>
          {exporting === 'excel' && <span className="ml-auto text-xs text-[#05CD99]">{t('common.loading')}</span>}
        </button>
        <button onClick={exportPDF} disabled={exporting !== null}
          onMouseEnter={() => setHover('pdf')} onMouseLeave={() => setHover(null)}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E0E5F2] bg-white px-4 py-3.5 text-sm font-semibold text-[#1B2559] shadow-sm transition-all hover:scale-[1.01] hover:border-red-400 hover:bg-red-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hover === 'pdf' ? <Download size={20} className="text-red-500" /> : <FileText size={20} className="text-red-500" />}
          <div className="text-left">
            <p className="font-bold">{t('reports.exportPDF')}</p>
            <p className="text-xs text-[#A3AED0]">{t('reports.exportPDFDesc')}</p>
          </div>
          {exporting === 'pdf' && <span className="ml-auto text-xs text-red-500">{t('common.loading')}</span>}
        </button>
      </div>
    </Modal>
  )
}
