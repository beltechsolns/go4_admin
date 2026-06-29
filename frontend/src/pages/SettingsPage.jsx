import { Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/shared/PageHeader'
import GeneralSettingsSection from '../features/settings/GeneralSettingsSection'
import LanguageSettingsSection from '../features/settings/LanguageSettingsSection'
import NotificationSettingsSection from '../features/settings/NotificationSettingsSection'
import useSettings from '../hooks/useSettings'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { data, loading, saving, error, saved, save } = useSettings()

  const [general, setGeneral]           = useState(data ? { appName: data.app_name, email: data.support_email, phone: data.support_phone } : { appName: '', email: '', phone: '' })
  const [notifications, setNotifications] = useState(data ? { newOrder: data.notify_new_order, delivery: data.notify_delivery_complete, system: data.notify_rider_offline } : { newOrder: true, delivery: true, system: false })
  const [language, setLanguage]         = useState(data ? data.language : 'en')

  // Sync local state when settings load from API
  useEffect(() => {
    if (!data) return
    setGeneral({ appName: data.app_name, email: data.support_email, phone: data.support_phone })
    setNotifications({ newOrder: data.notify_new_order, delivery: data.notify_delivery_complete, system: data.notify_rider_offline })
    setLanguage(data.language)
  }, [data])

  // Sync frontend language state → i18n locale + localStorage
  useEffect(() => {
    i18n.changeLanguage(language)
    localStorage.setItem('language', language)
  }, [language, i18n])

  const handleGeneral      = useCallback((key, val) => setGeneral((p) => ({ ...p, [key]: val })), [])
  const handleNotification = useCallback((key, val) => setNotifications((p) => ({ ...p, [key]: val })), [])

  const handleSave = async () => {
    await save({ general, notifications, language })
  }

  const handleReset = () => {
    if (data) {
      setGeneral({ appName: data.app_name, email: data.support_email, phone: data.support_phone })
      setNotifications({ newOrder: data.notify_new_order, delivery: data.notify_delivery_complete, system: data.notify_rider_offline })
      setLanguage(data.language)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-5">
        <PageHeader title={t('settings.title')} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-[#F4F7FE] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title={t('settings.title')} />

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>}
      {saved && <p className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-600">{t('settings.saved')}</p>}

      <GeneralSettingsSection values={general} onChange={handleGeneral} />
      <NotificationSettingsSection values={notifications} onChange={handleNotification} />
      <LanguageSettingsSection value={language} onChange={setLanguage} />

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={handleReset}
          className="rounded-xl border border-[#E0E5F2] bg-white px-6 py-2.5 text-sm font-semibold text-[#1B2559] shadow-sm hover:bg-gray-50 transition-colors">
          {t('common.cancel')}
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#F25C22] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition-colors disabled:opacity-60">
          <Save size={15} /> {saving ? t('common.saving') : t('common.saveChanges')}
        </button>
      </div>
    </div>
  )
}