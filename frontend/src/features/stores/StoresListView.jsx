import { Edit, Eye, MapPin, Package, Phone, Plus, Search, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../../components/shared/PageHeader'
import { LoadingCards } from '../../components/shared/LoadingRows'
import AddStoreModal from './AddStoreModal'
import { useStores } from '../../hooks/useStores'
import { toStoreSlug } from './storePath'

const typeBadgeColors = {
  Restaurant:   'bg-purple-100 text-purple-700',
  'Fast Food':  'bg-orange-100 text-orange-600',
  'Mini Market':'bg-green-100 text-green-700',
  Beverages:    'bg-blue-100 text-blue-600',
  Cafe:         'bg-amber-100 text-amber-700',
}

export default function StoresListView({ onOpenStore }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)

  const { data: stores, loading, remove, refetch } = useStores({ search, type: filter })

  const types = ['All', ...Array.from(new Set(stores.map((s) => s.type)))]

  return (
    <div className="space-y-6">
      {showAdd && (
        <AddStoreModal onClose={() => setShowAdd(false)} onSaved={refetch} />
      )}
      <PageHeader
        title="Store Management"
        subtitle="Manage stores, categories, and products"
        action={
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-[#F25C22] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition-colors">
            <Plus size={16} /> Add Store
          </button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
          <input
            type="text"
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E0E5F2] bg-white py-2.5 pl-9 pr-4 text-sm text-[#1B2559] outline-none focus:border-[#F25C22] placeholder:text-[#A3AED0]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-[#E0E5F2] bg-white px-4 py-2.5 text-sm font-medium text-[#1B2559] outline-none focus:border-[#F25C22]"
        >
          {types.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? <LoadingCards count={6} />
          : stores.map((store) => (
              <article key={store.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#E0E5F2] bg-white shadow-sm">
                <div className="relative h-44 w-full overflow-hidden">
                  <img src={store.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=200&fit=crop'}
                    alt={store.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-[#1B2559]">{store.name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="text-[#A3AED0] hover:text-[#1B2559] transition-colors"><Edit size={15} /></button>
                      <button onClick={() => remove(store.id)} className="text-[#A3AED0] hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <span className={`mt-1.5 inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeBadgeColors[store.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {store.type}
                  </span>
                  <div className="mt-3 space-y-1.5 text-xs text-[#64748b]">
                    <p className="flex items-center gap-1.5"><MapPin size={12} className="text-[#F25C22]" />{store.location}</p>
                    <p className="flex items-center gap-1.5"><Phone size={12} className="text-[#F25C22]" />{store.phone}</p>
                    <p className="flex items-center gap-1.5"><Package size={12} className="text-[#F25C22]" />{store.product_count} products</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm font-bold text-[#1B2559]">
                      <Star size={14} className="fill-[#FFB800] text-[#FFB800]" />
                      {store.rating}
                    </div>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-600">Active</span>
                  </div>
                  <button
                    onClick={() => onOpenStore(toStoreSlug(store.name), store.id)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F25C22] py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
                  >
                    <Eye size={15} /> View Products
                  </button>
                </div>
              </article>
            ))
        }
      </div>
    </div>
  )
}
