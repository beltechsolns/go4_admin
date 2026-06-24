import { Eye, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import StatusBadge from '../../components/shared/StatusBadge'
import { LoadingRows, EmptyState } from '../../components/shared/LoadingRows'

export default function DeliveriesTable({ data = [], loading, error, onAssignRider }) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[#F8F9FC] text-xs font-bold uppercase text-[#A3AED0]">
            <th className="rounded-l-xl p-4">{t('deliveries.orderId')}</th>
            <th className="p-4">{t('deliveries.customer')}</th>
            <th className="p-4">{t('deliveries.rider')}</th>
            <th className="p-4">{t('deliveries.location')}</th>
            <th className="p-4">{t('deliveries.amount')}</th>
            <th className="p-4">{t('deliveries.status')}</th>
            <th className="rounded-r-xl p-4 text-center">{t('deliveries.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F4F7FE]">
          {loading
            ? <LoadingRows cols={7} rows={5} />
            : data.length === 0
              ? <EmptyState message={t('deliveries.noDeliveries')} />
              : data.map((d) => (
                  <tr key={d.id} className="font-medium text-[#1B2559] hover:bg-[#F8F9FC]/60">
                    <td className="p-4 font-bold">{d.order_number}</td>
                    <td className="p-4 font-bold">{d.customer_name ?? '—'}</td>
                    <td className="p-4">
                      {!d.rider_name
                        ? (
                          <button
                            onClick={() => {
                              const rid = prompt(t('deliveries.assignRiderPrompt'))
                              if (rid) onAssignRider(d.id, parseInt(rid))
                            }}
                            className="rounded-lg border border-dashed border-[#F25C22] bg-[#FFF3EE] px-2.5 py-1 text-xs font-bold text-[#F25C22] transition-colors hover:bg-[#F25C22] hover:text-white"
                          >
                            {t('deliveries.assignRider')}
                          </button>
                        )
                        : <span className="text-[#A3AED0]">{d.rider_name}</span>
                      }
                    </td>
                    <td className="p-4 text-[#A3AED0]">
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-[#F25C22]/60" />
                        {d.location}
                      </div>
                    </td>
                    <td className="p-4 font-bold">ETB {parseFloat(d.amount).toFixed(0)}</td>
                    <td className="p-4"><StatusBadge label={d.status} /></td>
                    <td className="p-4">
                      <div className="flex justify-center text-[#A3AED0]">
                        <button className="hover:text-[#1B2559]"><Eye size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
          }
        </tbody>
      </table>
    </div>
  )
}