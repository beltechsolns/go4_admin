import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/shared/PageHeader'
import CustomersTable from '../features/customers/CustomersTable'
import CustomersToolbar from '../features/customers/CustomersToolbar'
import AddCustomerModal from '../features/customers/AddCustomerModal'
import useCustomers from '../hooks/useCustomers'

export default function CustomersPage() {
  const { t } = useTranslation()
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data, loading, error, remove, toggleStatus, refetch } = useCustomers({ search, status })

  return (
    <div className="space-y-6">
      {showAdd && (
        <AddCustomerModal onClose={() => setShowAdd(false)} onSaved={refetch} />
      )}
      <PageHeader
        title={t('customers.management')}
        action={
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-[#F25C22] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition-colors">
            <Plus size={16} /> {t('customers.addCustomer')}
          </button>
        }
      />
      <div className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm">
        <CustomersToolbar search={search} status={status} onSearch={setSearch} onStatus={setStatus} />
        <CustomersTable data={data} loading={loading} error={error} onRemove={remove} onToggleStatus={toggleStatus} />
      </div>
    </div>
  )
}