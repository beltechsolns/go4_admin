import { DollarSign, Percent } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function FieldInput({ label, description, unit, value, onChange }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-[#1B2559]">{label}</p>
      <p className="text-xs text-[#A3AED0]">{description}</p>
      <div className="relative mt-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-[#E0E5F2] bg-white px-4 py-3 text-sm text-[#1B2559] outline-none focus:border-[#F25C22]"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#A3AED0]">{unit}</span>
      </div>
    </div>
  )
}

export default function DeliveryFeesSection({ values, onChange }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
            <DollarSign size={18} className="text-[#F25C22]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1B2559]">{t('pricing.deliveryFees')}</h3>
            <p className="text-xs text-[#A3AED0]">{t('pricing.deliveryFeesDesc')}</p>
          </div>
        </div>

        <FieldInput
          label={t('pricing.baseDeliveryFee')}
          description={t('pricing.baseDeliveryFeeDesc')}
          unit="ETB"
          value={values.base}
          onChange={(v) => onChange('base', v)}
        />
        <FieldInput
          label={t('pricing.perKmFee')}
          description={t('pricing.perKmFeeDesc')}
          unit="ETB/km"
          value={values.perKm}
          onChange={(v) => onChange('perKm', v)}
        />
        <FieldInput
          label={t('pricing.serviceCharge')}
          description={t('pricing.serviceChargeDesc')}
          unit="%"
          value={values.service}
          onChange={(v) => onChange('service', v)}
        />
      </section>

      <section className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
            <Percent size={18} className="text-[#F25C22]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1B2559]">{t('pricing.additionalSettings')}</h3>
            <p className="text-xs text-[#A3AED0]">{t('pricing.additionalSettingsDesc')}</p>
          </div>
        </div>

        <FieldInput
          label={t('pricing.minOrderValue')}
          description={t('pricing.minOrderValueDesc')}
          unit="ETB"
          value={values.minOrder}
          onChange={(v) => onChange('minOrder', v)}
        />
        <FieldInput
          label={t('pricing.peakHourSurcharge')}
          description={t('pricing.peakHourSurchargeDesc')}
          unit="ETB"
          value={values.peakSurcharge}
          onChange={(v) => onChange('peakSurcharge', v)}
        />
      </section>
    </div>
  )
}