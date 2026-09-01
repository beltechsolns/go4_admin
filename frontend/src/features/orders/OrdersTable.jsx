import { useTranslation } from 'react-i18next'
import StatusBadge from '../../components/shared/StatusBadge'
import { LoadingRows, EmptyState } from '../../components/shared/LoadingRows'

function formatStatus(status) {
  return status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '—'
}

export default function OrdersTable({ data = [], loading, error }) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[#F8F9FC] text-xs font-bold uppercase text-[#A3AED0]">
            <th className="rounded-l-xl p-4">{t('orders.orderName')}</th>
            <th className="p-4">{t('orders.customer')}</th>
            <th className="p-4">{t('orders.store')}</th>
            <th className="p-4">{t('orders.items')}</th>
            <th className="p-4">{t('orders.totalPrice')}</th>
            <th className="p-4">{t('orders.status')}</th>
            <th className="rounded-r-xl p-4">{t('orders.createdAt')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F4F7FE]">
          {loading
            ? <LoadingRows cols={7} rows={5} />
            : data.length === 0
              ? <EmptyState message={t('orders.noOrders')} />
              : data.map((o) => (
                  <tr key={o.id} className="font-medium text-[#1B2559] hover:bg-[#F8F9FC]/60">
                    <td className="p-4 font-bold">{o.order_name || o.orderName || '—'}</td>
                    <td className="p-4">
                      <div>
                        <span className="font-bold">{o.user_name || '—'}</span>
                        {o.user_phone && (
                          <span className="ml-1 text-xs text-[#A3AED0]">{o.user_phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-[#A3AED0]">{o.store_name || '—'}</td>
                    <td className="p-4 text-[#A3AED0]">{o.items_count ?? 0}</td>
                    <td className="p-4 font-bold">ETB {parseFloat(o.total_price || 0).toFixed(0)}</td>
                    <td className="p-4"><StatusBadge label={formatStatus(o.status)} /></td>
                    <td className="p-4 text-xs text-[#A3AED0]">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
          }
        </tbody>
      </table>
    </div>
  )
}
