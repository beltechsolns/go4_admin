export default function PageHeader({ title, subtitle, action }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2559]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs font-medium text-[#A3AED0]">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
