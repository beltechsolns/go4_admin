export default function Card({ title, subtitle, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-[#E0E5F2] bg-white p-6 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h3 className="text-base font-bold text-[#1B2559]">{title}</h3>}
          {subtitle && <p className="text-xs font-medium text-[#A3AED0]">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
