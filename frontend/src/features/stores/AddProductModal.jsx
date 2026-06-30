import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../../components/shared/Modal'
import api from '../../api/client'

export default function AddProductModal({ storeId, categories, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm]     = useState({ name: '', price: '', category_id: '', status: 'Active' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError(t('common.required'))
      return
    }
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) {
      setError(t('stores.validPriceRequired'))
      return
    }
    const selectedCat = categories.find(c => c.id === Number(form.category_id))
    setSaving(true)
    setError('')
    try {
      await api.post(`/stores/${storeId}/products`, {
        name: form.name,
        price: Number(form.price),
        status: form.status,
        category_id: form.category_id || undefined,
        category: selectedCat?.name || undefined,
        emoji: selectedCat?.icon || '📦',
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || t('stores.failedToAdd'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('stores.addProduct')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.productName')} *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Margherita Pizza"
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.productPrice')} *</label>
          <input type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)}
            placeholder="250"
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.category')}</label>
          <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]">
            <option value="">{t('stores.noCategory')}</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-[#E0E5F2] px-5 py-2.5 text-sm font-semibold text-[#1B2559] hover:bg-gray-50 transition-colors">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving}
            className="rounded-xl bg-[#F25C22] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
            {saving ? t('stores.adding') : t('stores.addProduct')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
