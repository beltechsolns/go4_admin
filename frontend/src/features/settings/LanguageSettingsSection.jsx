import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LanguageSettingsSection({ value, onChange }) {
  const { t } = useTranslation()

  const languages = [
    { key: 'am', label: t('settings.amharic') },
    { key: 'en', label: t('settings.english') },
  ]

  return (
    <section className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
          <Globe size={18} className="text-[#F25C22]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1B2559]">{t('settings.language')}</h3>
          <p className="text-xs text-[#A3AED0]">{t('settings.languageDesc')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {languages.map((lang) => {
          const selected = value === lang.key
          return (
            <button
              key={lang.key}
              onClick={() => onChange(lang.key)}
              className="flex w-full items-center justify-between rounded-xl border border-[#E0E5F2] px-4 py-3 transition-colors hover:border-[#F25C22]"
            >
              <span className="text-sm font-medium text-[#1B2559]">{lang.label}</span>
              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                selected ? 'border-[#F25C22]' : 'border-[#D0D5DD]'
              }`}>
                {selected && (
                  <div className="h-2.5 w-2.5 rounded-full bg-[#F25C22]" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}