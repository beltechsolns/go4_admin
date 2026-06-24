import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function DeliveriesToolbar({ search, status, onSearch, onStatus }) {
  const { t } = useTranslation()

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3AED0]" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('deliveries.search')}
          className="w-full rounded-xl border border-[#E0E5F2] bg-white py-2 pl-10 pr-4 text-sm text-[#1B2559] focus:border-[#F25C22] focus:outline-none"
        />
      </div>
      <select
        value={status}
        onChange={(e) => onStatus(e.target.value)}
        className="rounded-xl border border-[#E0E5F2] px-4 py-2 text-sm font-semibold text-[#1B2559] outline-none"
      >
        <option value="">{t('deliveries.allStatus')}</option>
        <option value="Pending">{t('deliveries.pending')}</option>
        <option value="Accepted">{t('deliveries.accepted')}</option>
        <option value="Picked Up">{t('deliveries.pickedUp')}</option>
        <option value="In Transit">{t('deliveries.inTransit')}</option>
        <option value="Delivered">{t('deliveries.delivered')}</option>
        <option value="Cancelled">{t('deliveries.cancelled')}</option>
        <option value="Failed">{t('deliveries.failed')}</option>
      </select>
    </div>
  )
}