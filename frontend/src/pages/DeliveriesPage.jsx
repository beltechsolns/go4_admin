import { useState } from 'react'
import PageHeader from '../components/shared/PageHeader'
import DeliveriesTable from '../features/deliveries/DeliveriesTable'
import DeliveriesToolbar from '../features/deliveries/DeliveriesToolbar'
import useDeliveries from '../hooks/useDeliveries'

export default function DeliveriesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, loading, error, assignRider } = useDeliveries({ search, status })

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery Management" />

      <div className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm">
        <DeliveriesToolbar search={search} status={status} onSearch={setSearch} onStatus={setStatus} />
        <DeliveriesTable data={data} loading={loading} error={error} onAssignRider={assignRider} />
      </div>
    </div>
  )
}
