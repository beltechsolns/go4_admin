import { useTranslation } from 'react-i18next'
import PageHeader from '../components/shared/PageHeader'
import ActiveRidersPanel from '../features/liveTracking/ActiveRidersPanel'
import TrackingMap from '../features/liveTracking/TrackingMap'

export default function LiveTrackingPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('liveTracking.title')}
        subtitle={t('liveTracking.subtitle')}
        action={
          <span className="flex items-center gap-1.5 rounded-full bg-[#E6F9F0] px-3 py-1.5 text-xs font-bold text-[#05CD99]">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#05CD99]" />
            {t('liveTracking.active')}
          </span>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <TrackingMap />
        <ActiveRidersPanel />
      </div>
    </div>
  )
}