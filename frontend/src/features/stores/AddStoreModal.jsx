import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../../components/shared/Modal'
import api from '../../api/client'

const TYPES = ['Restaurant', 'Fast Food', 'Mini Market', 'Beverages', 'Cafe', 'Other']
const EMPTY = { name: '', type: 'Restaurant', location: '', phone: '', image_url: '', description: '', latitude: '', longitude: '' }

export default function AddStoreModal({ onClose, onSaved, initial }) {
  const { t } = useTranslation()
  const isEdit = !!initial
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (initial) setForm({ name: initial.name, type: initial.type, location: initial.location, phone: initial.phone, image_url: initial.image_url || '', description: initial.description || '', latitude: initial.latitude || '', longitude: initial.longitude || '' })
    else setForm(EMPTY)
  }, [initial])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError(t('stores.nameRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await api.put(`/stores/${initial.id}`, form)
      } else {
        await api.post('/stores', form)
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
    <Modal title={isEdit ? t('stores.editStore') : t('stores.addStore')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.storeName')} *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Pizza Palace"
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.type')}</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]">
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.location')}</label>
          <input value={form.location} onChange={e => set('location', e.target.value)}
            placeholder="Main Street, Shakiso"
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.phone')}</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="+251 911 111 111"
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.description')}</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows="3"
            placeholder="Fresh pizza made with local ingredients, delivered hot to your door."
            className="w-full resize-none rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">{t('stores.imageUrlOptional')}</label>
          <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1B2559]">Latitude</label>
            <input value={form.latitude} onChange={e => set('latitude', e.target.value)}
              placeholder="Auto-filled from location"
              className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1B2559]">Longitude</label>
            <input value={form.longitude} onChange={e => set('longitude', e.target.value)}
              placeholder="Auto-filled from location"
              className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm outline-none focus:border-[#F25C22]" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-[#E0E5F2] px-5 py-2.5 text-sm font-semibold text-[#1B2559] hover:bg-gray-50 transition-colors">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving}
            className="rounded-xl bg-[#F25C22] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
            {saving ? (isEdit ? t('stores.saving') : t('stores.adding')) : (isEdit ? t('stores.save') : t('stores.addStore'))}
          </button>
        </div>
      </form>
    </Modal>
  )
}
