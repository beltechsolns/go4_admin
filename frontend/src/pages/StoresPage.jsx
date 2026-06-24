import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import StoresListView from '../features/stores/StoresListView'
import StoreDetailView from '../features/stores/StoreDetailView'
import { fromStoreSlug } from '../features/stores/storePath'

export default function StoresPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { storeSlug } = useParams()

  if (!storeSlug) {
    return (
      <StoresListView
        onOpenStore={(slug) => navigate(`/stores/${slug}`)}
      />
    )
  }

  const { id: storeId } = fromStoreSlug(storeSlug)

  if (!storeId) {
    return (
      <div className="rounded-2xl border border-[#E0E5F2] bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-[#1B2559]">{t('stores.notFound')}</h2>
        <button onClick={() => navigate('/stores')}
          className="mt-4 rounded-xl bg-[#F25C22] px-4 py-2 text-sm font-bold text-white">
          {t('stores.backToList')}
        </button>
      </div>
    )
  }

  return (
    <StoreDetailView
      storeId={storeId}
      onBack={() => navigate('/stores')}
    />
  )
}