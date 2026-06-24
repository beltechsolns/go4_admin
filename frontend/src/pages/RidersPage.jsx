import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/shared/PageHeader'
import RidersTable from '../features/riders/RidersTable'
import RidersToolbar from '../features/riders/RidersToolbar'
import AddRiderModal from '../features/riders/AddRiderModal'
import useRiders from '../hooks/useRiders'

export default function RidersPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data, loading, error, remove, toggleStatus, refetch } = useRiders({ search, status })

  return (
    <div className="space-y-6">
      {showAdd && (
        <AddRiderModal onClose={() => setShowAdd(false)} onSaved={refetch} />
      )}
      <PageHeader
        title={t('riders.management')}
        action={
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-[#F25C22] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition-colors">
            <Plus size={16} /> {t('riders.addRider')}
          </button>
        }
      />
      <div className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm">
        <RidersToolbar search={search} status={status} onSearch={setSearch} onStatus={setStatus} />
        <RidersTable data={data} loading={loading} error={error} onRemove={remove} onToggleStatus={toggleStatus} />
      </div>
    </div>
  )
}