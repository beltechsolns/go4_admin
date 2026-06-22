import { DollarSign, Percent } from 'lucide-react'

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
  return (
    <div className="space-y-5">
      {/* Delivery Fees */}
      <section className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
            <DollarSign size={18} className="text-[#F25C22]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1B2559]">Delivery Fees</h3>
            <p className="text-xs text-[#A3AED0]">Set base delivery fees and distance charges</p>
          </div>
        </div>

        <FieldInput
          label="Base Delivery Fee"
          description="The minimum charge for any delivery in Shakiso"
          unit="ETB"
          value={values.base}
          onChange={(v) => onChange('base', v)}
        />
        <FieldInput
          label="Per Kilometer Fee"
          description="Additional charge for each kilometer traveled"
          unit="ETB/km"
          value={values.perKm}
          onChange={(v) => onChange('perKm', v)}
        />
        <FieldInput
          label="Service Charge"
          description="Percentage of order value charged as service fee"
          unit="%"
          value={values.service}
          onChange={(v) => onChange('service', v)}
        />
      </section>

      {/* Additional Settings */}
      <section className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
            <Percent size={18} className="text-[#F25C22]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1B2559]">Additional Settings</h3>
            <p className="text-xs text-[#A3AED0]">Minimum orders and peak hour charges</p>
          </div>
        </div>

        <FieldInput
          label="Minimum Order Value"
          description="Minimum order amount required for delivery"
          unit="ETB"
          value={values.minOrder}
          onChange={(v) => onChange('minOrder', v)}
        />
        <FieldInput
          label="Peak Hour Surcharge"
          description="Additional fee during peak hours (12–2 PM, 6–9 PM)"
          unit="ETB"
          value={values.peakSurcharge}
          onChange={(v) => onChange('peakSurcharge', v)}
        />
      </section>
    </div>
  )
}
