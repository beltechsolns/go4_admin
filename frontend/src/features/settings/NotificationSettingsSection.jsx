import { Bell } from 'lucide-react'

const notifications = [
  { key: 'newOrder',  label: 'New Order Alert',  desc: 'Get notified when a new order is placed' },
  { key: 'delivery',  label: 'Delivery Alert',   desc: 'Get notified about delivery status changes' },
  { key: 'system',    label: 'System Alert',     desc: 'Get notified about system updates' },
]

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
  return (
    <section className="rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E8]">
          <Bell size={18} className="text-[#F25C22]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1B2559]">Notification Settings</h3>
          <p className="text-xs text-[#A3AED0]">Manage your notification preferences</p>
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
