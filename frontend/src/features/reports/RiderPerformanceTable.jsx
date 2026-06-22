import Card from '../../components/shared/Card'
import { useRiderPerformance } from '../../hooks/useReports'

function rateColor(rate) {
  if (rate >= 97) return 'bg-green-100 text-green-600'
  if (rate >= 95) return 'bg-yellow-100 text-yellow-600'
  return 'bg-orange-100 text-orange-500'
}

export default function RiderPerformanceTable() {
  const { data: performers, loading } = useRiderPerformance()
  const maxDeliveries = Math.max(...performers.map((p) => p.total_deliveries), 1)

  return (
    <Card title="Rider Performance Details">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#F4F7FE]">
              <th className="pb-3 text-xs font-bold text-[#1B2559]">Rider</th>
              <th className="pb-3 text-xs font-bold text-[#1B2559]">Total Deliveries</th>
              <th className="pb-3 text-xs font-bold text-[#1B2559]">Success Rate</th>
              <th className="pb-3 text-xs font-bold text-[#1B2559]">Avg. Time</th>
              <th className="pb-3 text-xs font-bold text-[#1B2559]">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F7FE]">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-[#A3AED0]">Loading...</td></tr>
            ) : performers.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-[#A3AED0]">No performance data yet</td></tr>
            ) : performers.map((item) => (
              <tr key={item.id} className="hover:bg-[#FAFAFA]">
                <td className="py-3.5 pr-4 font-semibold text-[#1B2559]">{item.full_name}</td>
                <td className="py-3.5 pr-4 text-[#1B2559]">{item.total_deliveries}</td>
                <td className="py-3.5 pr-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${rateColor(item.success_rate)}`}>
                    {item.success_rate}%
                  </span>
                </td>
                <td className="py-3.5 pr-4 text-[#1B2559]">{item.avg_delivery_time} min</td>
                <td className="py-3.5 w-36">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F4F7FE]">
                    <div
                      className="h-full rounded-full bg-[#F25C22]"
                      style={{ width: `${(item.total_deliveries / maxDeliveries) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
