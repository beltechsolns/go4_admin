import { ArrowLeft, Edit, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStoreCategories, useStoreProducts } from '../../hooks/useStores'
import useApi from '../../hooks/useApi'
import api from '../../api/client'

export default function StoreDetailView({ storeId, onBack }) {
  const { t } = useTranslation()
  const [subTab, setSubTab]     = useState('products')
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState(t('stores.allCategories'))

  const { data: store } = useApi(() => api.get(`/stores/${storeId}`).then(r => r.data.data), [storeId])
  const { data: products, loading: pLoading, removeProduct } =
    useStoreProducts(storeId, { search, category: catFilter })
  const { data: categories, loading: cLoading, removeCategory } =
    useStoreCategories(storeId)

  const allCat = t('stores.allCategories')
  const productCategories = [allCat, ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]

  const typeBadgeColors = {
    Restaurant:   'bg-purple-100 text-purple-700',
    'Fast Food':  'bg-orange-100 text-orange-600',
    'Mini Market':'bg-green-100 text-green-700',
    Beverages:    'bg-blue-100 text-blue-600',
    Cafe:         'bg-amber-100 text-amber-700',
  }

  if (!store) {
    return <div className="p-8 text-center text-sm text-[#A3AED0]">{t('stores.loadingStore')}</div>
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#1B2559] transition-colors">
        <ArrowLeft size={16} /> {t('stores.backToList')}
      </button>

      <div className="flex items-center gap-5 rounded-2xl bg-[#FFF3E8] p-5">
        <img src={store.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=200&fit=crop'}
          alt={store.name} className="h-20 w-20 rounded-xl object-cover shrink-0" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#1B2559]">{store.name}</h2>
          <p className="text-sm text-[#64748b]">{store.location}</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm text-[#64748b]">
              <Phone size={13} className="text-[#64748b]" />{store.phone}
            </span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${typeBadgeColors[store.type] ?? 'bg-gray-100 text-gray-600'}`}>
              {store.type}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-[#E0E5F2]">
        {['products', 'categories'].map((tab) => (
          <button key={tab} onClick={() => setSubTab(tab)}
            className={`pb-3 text-sm font-semibold transition-colors capitalize ${subTab === tab ? 'border-b-2 border-[#F25C22] text-[#F25C22]' : 'text-[#A3AED0] hover:text-[#1B2559]'}`}>
            {tab === 'products' ? t('stores.productsTab') : t('stores.categoriesTab')} ({tab === 'products' ? products.length : categories.length})
          </button>
        ))}
      </div>

      {subTab === 'products' ? (
        <div className="rounded-2xl border border-[#E0E5F2] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
              <input type="text" placeholder={t('stores.searchProducts')} value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#E0E5F2] py-2.5 pl-9 pr-4 text-sm text-[#1B2559] outline-none focus:border-[#F25C22] placeholder:text-[#A3AED0]" />
            </div>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm font-medium text-[#1B2559] outline-none focus:border-[#F25C22]">
              {productCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="flex items-center gap-2 rounded-xl bg-[#F25C22] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors shrink-0">
              <Plus size={15} /> {t('stores.addProduct')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#F4F7FE]">
                  <th className="pb-3 text-xs font-bold text-[#1B2559]">{t('stores.product')}</th>
                  <th className="pb-3 text-xs font-bold text-[#1B2559]">{t('stores.category')}</th>
                  <th className="pb-3 text-xs font-bold text-[#1B2559]">{t('stores.price')}</th>
                  <th className="pb-3 text-xs font-bold text-[#1B2559]">{t('common.status')}</th>
                  <th className="pb-3 text-xs font-bold text-[#1B2559]">{t('stores.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F7FE]">
                {pLoading
                  ? <tr><td colSpan={5} className="p-6 text-center text-sm text-[#A3AED0]">{t('stores.loadingProducts')}</td></tr>
                  : products.length === 0
                    ? <tr><td colSpan={5} className="p-6 text-center text-sm text-[#A3AED0]">{t('stores.noProducts')}</td></tr>
                    : products.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAFAFA]">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{p.emoji}</span>
                              <span className="font-semibold text-[#1B2559]">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4 text-[#A3AED0]">{p.category ?? '—'}</td>
                          <td className="py-3.5 pr-4 font-bold text-[#1B2559]">ETB {parseFloat(p.price).toFixed(0)}</td>
                          <td className="py-3.5 pr-4">
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">{p.status}</span>
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <button className="text-[#A3AED0] hover:text-[#1B2559] transition-colors"><Edit size={15} /></button>
                              <button onClick={() => removeProduct(p.id)} className="text-[#A3AED0] hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E0E5F2] bg-white p-5 shadow-sm space-y-5">
          <button className="flex items-center gap-2 rounded-xl bg-[#F25C22] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors">
            <Plus size={15} /> {t('stores.addCategory')}
          </button>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cLoading
              ? <p className="text-sm text-[#A3AED0]">{t('stores.loading')}</p>
              : categories.map((cat) => (
                  <div key={cat.id} className="flex flex-col rounded-2xl border border-[#E0E5F2] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <span className="text-4xl">{cat.icon}</span>
                      <div className="flex gap-2 text-[#A3AED0]">
                        <button className="hover:text-[#1B2559] transition-colors"><Edit size={15} /></button>
                        <button onClick={() => removeCategory(cat.id)} className="hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-[#1B2559]">{cat.name}</h4>
                    <p className="text-xs text-[#A3AED0]">{cat.product_count} {t('stores.productsCount')}</p>
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}