import { Edit, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/shared/PageHeader'
import { useStoreCategories } from '../../hooks/useStores'
import AddCategoryModal from '../stores/AddCategoryModal'

export default function CategoriesView() {
  const { t } = useTranslation()
  const { data: categories, loading, removeCategory, refetch } = useStoreCategories()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('sidebar.categories')}
        subtitle={t('categories.subtitle')}
        action={
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-[#F25C22] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors">
            <Plus size={15} /> {t('stores.addCategory')}
          </button>
        }
      />

      <div className="rounded-2xl border border-[#E0E5F2] bg-white p-5 shadow-sm">
        {loading
          ? <p className="py-8 text-center text-sm text-[#A3AED0]">{t('stores.loading')}</p>
          : categories.length === 0
            ? <p className="py-8 text-center text-sm text-[#A3AED0]">{t('stores.noCategories')}</p>
            : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex flex-col rounded-2xl border border-[#E0E5F2] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <span className="text-4xl">{cat.icon}</span>
                      <div className="flex gap-2 text-[#A3AED0]">
                        <button onClick={() => setEditing(cat)} className="hover:text-[#1B2559] transition-colors"><Edit size={15} /></button>
                        <button onClick={() => removeCategory(cat.id)} className="hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-[#1B2559]">{cat.name}</h4>
                    <p className="text-xs text-[#A3AED0]">{cat.product_count} {t('stores.productsCount')}</p>
                  </div>
                ))}
              </div>
            )
        }
      </div>

      {(showAdd || editing) &&
        <AddCategoryModal initial={editing}
          onClose={() => { setShowAdd(false); setEditing(null) }} onSaved={refetch} />}
    </div>
  )
}
