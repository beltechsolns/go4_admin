import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/shared/PageHeader'
import OrdersTable from '../features/orders/OrdersTable'
import OrdersToolbar from '../features/orders/OrdersToolbar'
import useOrders from '../hooks/useOrders'

export default function OrdersPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, loading, error } = useOrders({ search, status })

  return (
    <div className="space-y-6">
      <PageHeader title={t('orders.management')} />

      <div className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm">
        <OrdersToolbar search={search} status={status} onSearch={setSearch} onStatus={setStatus} />
        <OrdersTable data={data} loading={loading} error={error} />
      </div>
    </div>
  )
}
