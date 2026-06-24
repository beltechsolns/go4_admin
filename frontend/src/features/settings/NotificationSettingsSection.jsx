import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-[#F25C22]' : 'bg-[#E0E5F2]'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function NotificationSettingsSection({ values, onChange }) {
  const { t } = useTranslation()

  const notifications = [
    { key: 'newOrder', label: t('settings.newOrderAlert'), desc: t('settings.newOrderAlertDesc') },
    { key: 'delivery', label: t('settings.deliveryAlert'), desc: t('settings.deliveryAlertDesc') },
    { key: 'system',   label: t('settings.systemAlert'),  desc: t('settings.systemAlertDesc') },
  ]

  return (
    <section className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
          <Bell size={18} className="text-[#F25C22]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1B2559]">{t('settings.notifications')}</h3>
          <p className="text-xs text-[#A3AED0]">{t('settings.notificationsDesc')}</p>
        </div>
      </div>

      <div className="space-y-5">
        {notifications.map((n) => (
          <div key={n.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1B2559]">{n.label}</p>
              <p className="text-xs text-[#A3AED0]">{n.desc}</p>
            </div>
            <Toggle
              enabled={values[n.key]}
              onToggle={() => onChange(n.key, !values[n.key])}
            />
          </div>
        ))}
      </div>
    </section>
  )
}