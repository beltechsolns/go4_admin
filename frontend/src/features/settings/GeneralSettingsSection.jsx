import { Mail, Phone, Settings } from 'lucide-react'

function Field({ label, value, onChange, type = 'text', icon: Icon }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-[#1B2559]">{label}</p>
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-[#E0E5F2] bg-white py-3 text-sm text-[#1B2559] outline-none focus:border-[#F25C22] ${Icon ? 'pl-9 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  )
}

export default function GeneralSettingsSection({ values, onChange }) {
  return (
    <section className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
          <Settings size={18} className="text-[#F25C22]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1B2559]">General Settings</h3>
          <p className="text-xs text-[#A3AED0]">Configure your application settings</p>
        </div>
      </div>

      <Field
        label="Application Name"
        value={values.appName}
        onChange={(v) => onChange('appName', v)}
      />
      <Field
        label="Support Email"
        value={values.email}
        onChange={(v) => onChange('email', v)}
        type="email"
        icon={Mail}
      />
      <Field
        label="Support Phone"
        value={values.phone}
        onChange={(v) => onChange('phone', v)}
        icon={Phone}
      />
    </section>
  )
}
