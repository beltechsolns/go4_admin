import { useTranslation } from 'react-i18next'
import Card from '../../components/shared/Card'
import { useDashboardChart } from '../../hooks/useDashboard'

const W = 400, H = 220
const PL = 50, PR = 10, PT = 10, PB = 30
const CW = W - PL - PR
const CH = H - PT - PB

function BarChart({ data, loading }) {
  if (loading || !data?.length) {
    return <div className="h-48 rounded-xl bg-[#F4F7FE] animate-pulse" />
  }
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const step   = Math.ceil(maxVal / 4)
  const yLabels = [step * 4, step * 3, step * 2, step, 0]
  const barCount = data.length
  const barWidth = (CW / barCount) * 0.5
  const barGap   = CW / barCount

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {yLabels.map((v, i) => {
        const y = PT + (i / (yLabels.length - 1)) * CH
        return (
          <g key={v}>
            <text x={PL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#999">{v}</text>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
          </g>
        )
      })}
      <line x1={PL} y1={PT} x2={PL} y2={PT + CH} stroke="#ccc" strokeWidth="1" />
      <line x1={PL} y1={PT + CH} x2={W - PR} y2={PT + CH} stroke="#ccc" strokeWidth="1" />
      {data.map((item, i) => {
        const barH = (item.value / (step * 4)) * CH
        const x = PL + i * barGap + (barGap - barWidth) / 2
        const y = PT + CH - barH
        return (
          <g key={item.day ?? item.label ?? i}>
            <rect x={x} y={y} width={barWidth} height={barH} fill="#F25C22" rx="3" />
            <text x={x + barWidth / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#999">
              {item.day ?? item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ data, loading }) {
  if (loading || !data?.length) {
    return <div className="h-48 rounded-xl bg-[#F4F7FE] animate-pulse" />
  }
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const step   = Math.ceil(maxVal / 4 / 1000) * 1000 || 1
  const yLabels = [step * 4, step * 3, step * 2, step, 0]

  const pts = data.map((d, i) => ({
    x: PL + (i / (data.length - 1 || 1)) * CW,
    y: PT + CH - (d.value / (step * 4)) * CH,
    label: d.month ?? d.label,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = linePath + ` L ${pts[pts.length - 1].x} ${PT + CH} L ${pts[0].x} ${PT + CH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F25C22" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F25C22" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yLabels.map((v, i) => {
        const y = PT + (i / (yLabels.length - 1)) * CH
        return (
          <g key={v}>
            <text x={PL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#999">
              {v >= 1000 ? `${v / 1000}k` : v}
            </text>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
          </g>
        )
      })}
      <line x1={PL} y1={PT} x2={PL} y2={PT + CH} stroke="#ccc" strokeWidth="1" />
      <line x1={PL} y1={PT + CH} x2={W - PR} y2={PT + CH} stroke="#ccc" strokeWidth="1" />
      <path d={areaPath} fill="url(#revGrad)" />
      <path d={linePath} fill="none" stroke="#F25C22" strokeWidth="2.5" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="white" stroke="#F25C22" strokeWidth="2" />
          <text x={p.x} y={H - 6} textAnchor="middle" fontSize="11" fill="#999">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

export default function ChartsPanel() {
  const { t } = useTranslation()
  const { data, loading } = useDashboardChart()

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card title={t('dashboard.dailyOrders')}>
        <BarChart data={data?.daily} loading={loading} />
      </Card>
      <Card title={t('dashboard.monthlyRevenue')}>
        <LineChart data={data?.monthly} loading={loading} />
      </Card>
    </div>
  )
}