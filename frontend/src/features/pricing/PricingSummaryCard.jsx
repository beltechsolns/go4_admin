import { DollarSign } from 'lucide-react'

const ORDER_VALUE = 200
const DISTANCE = 5

export default function PricingSummaryCard({ values }) {
  const base = parseFloat(values.base) || 0
  const perKm = parseFloat(values.perKm) || 0
  const servicePct = parseFloat(values.service) || 0

  const deliveryFee = base + DISTANCE * perKm
  const serviceCharge = Math.round(ORDER_VALUE * (servicePct / 100))
  const total = deliveryFee + serviceCharge

  return (
    <div className="space-y-4">
      {/* Price Calculator */}
      <aside className="rounded-2xl border border-[#FFEADA] bg-[#FFF8F4] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-[#F25C22]" />
          <h3 className="text-sm font-bold text-[#F25C22]">Price Calculator</h3>
        </div>

        {/* Example order */}
        <div className="rounded-xl border border-[#FFE8D6] bg-white p-4 space-y-1.5 text-xs text-[#A3AED0]">
          <p className="font-semibold text-[#1B2559]">Example Order:</p>
          <div className="flex justify-between">
            <span>Order Value:</span>
            <span className="font-bold text-[#1B2559]">ETB {ORDER_VALUE}</span>
          </div>
          <div className="flex justify-between">
            <span>Distance:</span>
            <span className="font-bold text-[#1B2559]">{DISTANCE} km</span>
          </div>
        </div>

        {/* Delivery fee breakdown */}
        <div className="rounded-xl border border-[#FFE8D6] bg-white p-4 space-y-1 text-xs text-[#A3AED0]">
          <p>Delivery Fee</p>
          <p className="text-[10px]">Base ({base}) + Distance ({DISTANCE} × {perKm})</p>
          <p className="text-2xl font-extrabold text-[#1B2559]">ETB {deliveryFee}</p>
        </div>

        {/* Service charge */}
        <div className="rounded-xl border border-[#FFE8D6] bg-white p-4 space-y-1 text-xs text-[#A3AED0]">
          <p>Service Charge</p>
          <p className="text-[10px]">{ORDER_VALUE} × {servicePct}%</p>
          <p className="text-xl font-extrabold text-[#1B2559]">ETB {serviceCharge}</p>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl bg-[#F25C22] px-5 py-4 text-white">
          <div>
            <p className="text-xs font-semibold opacity-80">Total Fees</p>
            <p className="text-2xl font-extrabold">ETB {total}</p>
          </div>
        </div>
      </aside>

      {/* Quick Stats */}
      <aside className="rounded-2xl border border-[#E0E5F2] bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#1B2559]">Quick Stats</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-[#A3AED0]">Avg. Delivery Fee</p>
            <p className="text-xl font-extrabold text-[#1B2559]">ETB 85</p>
          </div>
          <div>
            <p className="text-xs text-[#A3AED0]">Avg. Distance</p>
            <p className="text-xl font-extrabold text-[#1B2559]">3.2 km</p>
          </div>
          <div>
            <p className="text-xs text-[#A3AED0]">Total Revenue (Fees)</p>
            <p className="text-xl font-extrabold text-[#1B2559]">ETB 15,240</p>
            <p className="text-xs text-[#A3AED0]">This month</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
