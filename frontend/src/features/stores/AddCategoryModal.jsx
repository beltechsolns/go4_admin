import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../../components/shared/Modal'
import api from '../../api/client'

const ICONS = ['🍕', '🍔', '🍲', '🥤', '☕', '🍟', '🥗', '🍰', '🥨', '🍎', '🥬', '🧃', '🧁', '🥐', '🍜', '🌯', '🥪', '🍣']

export default function AddCategoryModal({ storeId, onClose, onSaved, initial }) {
  const { t } = useTranslation()
  const isEdit = !!initial
  const [form, setForm]     = useState({ name: '', icon: '📦' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (initial) setForm({ name: initial.name, icon: initial.icon || '📦' })
    else setForm({ name: '', icon: '📦' })
  }, [initial])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError(t('common.required'))
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await api.put(`/stores/${storeId}/categories/${initial.id}`, form)
      } else {
        await api.post(`/stores/${storeId}/categories`, form)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || (isEdit ? t('stores.failedToUpdate') : t('stores.failedToAdd')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? t('stores.editCategory') : t('stores.addCategory')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.categoryName')} *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Pizzas"
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.icon')}</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(icon => (
              <button key={icon} type="button" onClick={() => set('icon', icon)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors ${form.icon === icon ? 'bg-[#FFF3E8] ring-2 ring-[#F25C22]' : 'hover:bg-gray-100'}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-[#E0E5F2] px-5 py-2.5 text-sm font-semibold text-[#1B2559] hover:bg-gray-50 transition-colors">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving}
            className="rounded-xl bg-[#F25C22] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
            {saving ? (isEdit ? t('stores.saving') : t('stores.adding')) : (isEdit ? t('stores.save') : t('stores.addCategory'))}
          </button>
        </div>
      </form>
    </Modal>
  )
}
