import { useState } from 'react'
import Modal from '../../components/shared/Modal'
import api from '../../api/client'

const EMPTY = { full_name: '', phone: '', email: '', status: 'Active' }

export default function AddCustomerModal({ onClose, onSaved }) {
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.phone.trim()) {
      setError('Name and phone are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.post('/customers', form)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add customer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Add Customer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">Full Name *</label>
          <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
            placeholder="Abel Tesfaye"
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm text-[#1B2559] outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">Phone *</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="0911234567"
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm text-[#1B2559] outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">Email (optional)</label>
          <input value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="abel@example.com" type="email"
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm text-[#1B2559] outline-none focus:border-[#F25C22]" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1B2559]">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm text-[#1B2559] outline-none focus:border-[#F25C22]">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-[#E0E5F2] px-5 py-2.5 text-sm font-semibold text-[#1B2559] hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="rounded-xl bg-[#F25C22] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
            {saving ? 'Adding...' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
