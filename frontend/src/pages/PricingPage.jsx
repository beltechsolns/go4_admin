import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import PageHeader from '../components/shared/PageHeader'
import DeliveryFeesSection from '../features/pricing/DeliveryFeesSection'
import PricingSummaryCard from '../features/pricing/PricingSummaryCard'
import usePricing from '../hooks/usePricing'

export default function PricingPage() {
  const { formValues, loading, saving, error, save } = usePricing()

  const [values, setValues] = useState(null)

  // Populate form once data loads from API
  useEffect(() => {
    if (formValues) setValues(formValues)
  }, [formValues])

  const handleChange = (key, val) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    const ok = await save(values)
    if (ok) alert('Pricing saved successfully!')
  }

  if (loading || !values) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pricing Configuration" />
        <div className="h-64 rounded-2xl bg-[#F4F7FE] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Configuration"
        subtitle="Configure delivery fees and service charges for Shakiso area"
      />

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <DeliveryFeesSection values={values} onChange={handleChange} />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setValues(formValues)}
              className="rounded-xl border border-[#E0E5F2] bg-white px-6 py-2.5 text-sm font-semibold text-[#1B2559] shadow-sm hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#F25C22] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        <PricingSummaryCard values={values} />
      </div>
    </div>
  )
}
