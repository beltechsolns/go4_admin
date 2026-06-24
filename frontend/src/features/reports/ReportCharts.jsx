import { useTranslation } from 'react-i18next'
import Card from '../../components/shared/Card'
import { useDeliveryTrends, usePeakHours, useRiderPerformance, useOrdersByCategory } from '../../hooks/useReports'

const TW = 380, TH = 180, TPL = 40, TPR = 10, TPT = 10, TPB = 30
const TCW = TW - TPL - TPR, TCH = TH - TPT - TPB

const PW = 380, PH = 180, PPL = 38, PPR = 10, PPT = 10, PPB = 30
const PCW = PW - PPL - PPR, PCH = PH - PPT - PPB

const PIE_R = 70, PIE_CX = 120, PIE_CY = 95

function buildPieSlices(pieData) {
  let angle = -90
  return pieData.map((seg) => {
    const start = angle
    const sweep = (seg.pct / 100) * 360
    angle += sweep
    const toRad = (d) => (d * Math.PI) / 180
    const x1 = PIE_CX + PIE_R * Math.cos(toRad(start))
    const y1 = PIE_CY + PIE_R * Math.sin(toRad(start))
    const x2 = PIE_CX + PIE_R * Math.cos(toRad(start + sweep))
    const y2 = PIE_CY + PIE_R * Math.sin(toRad(start + sweep))
    const large = sweep > 180 ? 1 : 0
    const mid = start + sweep / 2
    return {
      ...seg,
      d: `M ${PIE_CX} ${PIE_CY} L ${x1} ${y1} A ${PIE_R} ${PIE_R} 0 ${large} 1 ${x2} ${y2} Z`,
      lx: PIE_CX + (PIE_R + 18) * Math.cos(toRad(mid)),
      ly: PIE_CY + (PIE_R + 18) * Math.sin(toRad(mid)),
    }
  })
}

function Skeleton() {
  return <div className="h-44 rounded-xl bg-[#F4F7FE] animate-pulse" />
}

export default function ReportCharts() {
  const { t } = useTranslation()
  const { data: trends,     loading: tL } = useDeliveryTrends()
  const { data: peakHours,  loading: pL } = usePeakHours()
  const { data: performers, loading: rL } = useRiderPerformance()
  const { data: categories, loading: cL } = useOrdersByCategory()

  const tMax = Math.max(...trends.map(d => d.total), 1)
  const tStep = Math.ceil(tMax / 4) || 1
  const yTLabels = [tStep*4, tStep*3, tStep*2, tStep, 0]
  const tY = (val) => TPT + TCH - (val / (tStep * 4)) * TCH
  const tX = (i)   => TPL + (i / (Math.max(trends.length - 1, 1))) * TCW
  const buildLine = (key) => trends.map((d, i) => `${i === 0 ? 'M' : 'L'} ${tX(i)} ${tY(d[key])}`).join(' ')

  const pMax  = Math.max(...peakHours.map(h => h.value), 1)
  const pStep = Math.ceil(pMax / 4) || 1
  const yPLabels = [pStep*4, pStep*3, pStep*2, pStep, 0]
  const visiblePeak = peakHours.filter((_, i) => i % 4 === 0 || peakHours.length <= 8
    ? true : [0,3,6,9,12,15,18,21,23].includes(parseInt(_.label)))
  const pBarW  = (PCW / Math.max(peakHours.length, 1)) * 0.6
  const pBarGap = PCW / Math.max(peakHours.length, 1)
  const pY = (val) => PPT + PCH - (val / (pStep * 4)) * PCH

  const slices = buildPieSlices(
    categories.length
      ? categories.map(c => ({ ...c, label: `${c.label} ${c.pct}%` }))
      : [{ label: 'No data', pct: 100, color: '#E0E5F2' }]
  )

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

      <Card title={t('reports.deliveryTrends')}>
        {tL ? <Skeleton /> : trends.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#A3AED0]">{t('reports.noDeliveryData')}</p>
        ) : (
          <>
            <svg viewBox={`0 0 ${TW} ${TH}`} className="w-full h-auto">
              {yTLabels.map((v, i) => {
                const y = TPT + (i / (yTLabels.length - 1)) * TCH
                return (
                  <g key={v}>
                    <text x={TPL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#999">{v}</text>
                    <line x1={TPL} y1={y} x2={TW - TPR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                  </g>
                )
              })}
              <line x1={TPL} y1={TPT} x2={TPL} y2={TPT + TCH} stroke="#ddd" strokeWidth="1" />
              <line x1={TPL} y1={TPT + TCH} x2={TW - TPR} y2={TPT + TCH} stroke="#ddd" strokeWidth="1" />
              <path d={buildLine('total')}     fill="none" stroke="#F25C22" strokeWidth="2" />
              <path d={buildLine('completed')} fill="none" stroke="#05CD99" strokeWidth="1.5" />
              <path d={buildLine('cancelled')} fill="none" stroke="#FF4D4D" strokeWidth="1.5" strokeDasharray="4 3" />
              {trends.map((d, i) => (
                <circle key={i} cx={tX(i)} cy={tY(d.total)} r="3" fill="white" stroke="#F25C22" strokeWidth="2" />
              ))}
              {trends.map((d, i) => (
                <text key={i} x={tX(i)} y={TH - 6} textAnchor="middle" fontSize="10" fill="#999">{d.label}</text>
              ))}
            </svg>
            <div className="mt-2 flex items-center gap-4 text-xs font-medium text-[#64748b]">
              <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded bg-[#F25C22] inline-block" /> {t('reports.total')}</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded bg-[#05CD99] inline-block" /> {t('reports.completed')}</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded bg-[#FF4D4D] inline-block" /> {t('reports.cancelled')}</span>
            </div>
          </>
        )}
      </Card>

      <Card title={t('reports.ordersByCategory')}>
        {cL ? <Skeleton /> : (
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 260 190" className="w-48 h-auto shrink-0">
              {slices.map((s, i) => (
                <g key={i}>
                  <path d={s.d} fill={s.color} />
                  {s.pct > 5 && (
                    <text x={s.lx} y={s.ly} textAnchor="middle" fontSize="9" fontWeight="600" fill={s.color}>
                      {s.pct}%
                    </text>
                  )}
                </g>
              ))}
            </svg>
            <div className="space-y-2 text-xs">
              {categories.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="text-[#1B2559] font-medium">{c.label}</span>
                  <span className="text-[#A3AED0]">{c.pct}%</span>
                </div>
              ))}
              {categories.length === 0 && <p className="text-[#A3AED0]">{t('reports.noDataYet')}</p>}
            </div>
          </div>
        )}
      </Card>

      <Card title={t('reports.peakOrderingHours')}>
        {pL ? <Skeleton /> : peakHours.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#A3AED0]">{t('reports.noOrderData')}</p>
        ) : (
          <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full h-auto">
            {yPLabels.map((v, i) => {
              const y = PPT + (i / (yPLabels.length - 1)) * PCH
              return (
                <g key={v}>
                  <text x={PPL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#999">{v}</text>
                  <line x1={PPL} y1={y} x2={PW - PPR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                </g>
              )
            })}
            <line x1={PPL} y1={PPT} x2={PPL} y2={PPT + PCH} stroke="#ddd" strokeWidth="1" />
            <line x1={PPL} y1={PPT + PCH} x2={PW - PPR} y2={PPT + PCH} stroke="#ddd" strokeWidth="1" />
            {peakHours.map((h, i) => {
              const barH = (h.value / (pStep * 4)) * PCH
              const x = PPL + i * pBarGap + (pBarGap - pBarW) / 2
              const y = PPT + PCH - barH
              const showLabel = peakHours.length <= 8 || i % 3 === 0
              return (
                <g key={i}>
                  <rect x={x} y={y} width={pBarW} height={Math.max(barH, 0)} fill="#F25C22" rx="2" />
                  {showLabel && (
                    <text x={x + pBarW / 2} y={PH - 6} textAnchor="middle" fontSize="9" fill="#999">
                      {h.label.replace(':00', '')}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        )}
      </Card>

      <Card title={t('reports.riderPerformance')}>
        {rL ? <Skeleton /> : performers.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#A3AED0]">{t('reports.noPerformanceData')}</p>
        ) : (
          <div className="space-y-3">
            {performers.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F25C22] text-xs font-bold text-white">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1B2559] leading-tight">{p.full_name}</p>
                  <p className="text-xs text-[#A3AED0]">
                    {p.total_deliveries} {t('reports.deliveries')}&nbsp;
                    <span className="text-[#05CD99] font-semibold">{p.success_rate}% {t('reports.success')}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#A3AED0]">{t('reports.avgTime')}</p>
                  <p className="text-sm font-bold text-[#1B2559]">{p.avg_delivery_time} {t('dashboard.minutes')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}