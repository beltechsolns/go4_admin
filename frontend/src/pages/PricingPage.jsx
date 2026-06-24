import { Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/shared/PageHeader'
import DeliveryFeesSection from '../features/pricing/DeliveryFeesSection'
import PricingSummaryCard from '../features/pricing/PricingSummaryCard'
import usePricing from '../hooks/usePricing'

export default function PricingPage() {
  const { t } = useTranslation()
  const { formValues, loading, saving, error, save } = usePricing()

  const [values, setValues] = useState(null)

  useEffect(() => {
    if (formValues) setValues(formValues)
  }, [formValues])

  const handleChange = useCallback((key, val) => setValues((prev) => ({ ...prev, [key]: val })), [])

  const handleSave = async () => {
    const ok = await save(values)
    if (ok) alert(t('pricing.savedAlert'))
  }

  if (loading || !values) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('pricing.configuration')} />
        <div className="h-64 rounded-2xl bg-[#F4F7FE] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pricing.configuration')}
        subtitle={t('pricing.subtitle')}
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
              {t('common.reset')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#F25C22] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              <Save size={15} /> {saving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </div>
        </div>
        <PricingSummaryCard values={values} />
      </div>
    </div>
  )
}