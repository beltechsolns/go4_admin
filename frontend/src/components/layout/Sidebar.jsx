import {
  BarChart3,
  ChevronDown,
  DollarSign,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Store,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import brandLogo from '../../assets/brand.png'

const navItems = [
  { to: ROUTES.deliveries, text: 'Deliveries', icon: Truck },
  { to: ROUTES.stores, text: 'Stores & Products', icon: Store },
  { to: ROUTES.liveTracking, text: 'Live Tracking', icon: MapPin },
  { to: ROUTES.reports, text: 'Reports & Analytics', icon: BarChart3 },
  { to: ROUTES.pricing, text: 'Pricing', icon: DollarSign },
  { to: ROUTES.settings, text: 'Settings', icon: Settings },
]

function NavContent({ userMenuOpen, onToggleUserMenu, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isUserManagementActive =
    location.pathname.startsWith(ROUTES.customers) ||
    location.pathname.startsWith(ROUTES.riders)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[#F4F7FE] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={brandLogo} alt="G4 Delivery" className="h-12 w-12 object-contain" />
            <span className="text-base font-bold text-[#1B2559]">Admin Portal</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden text-[#64748b] hover:text-[#1B2559]">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {/* Dashboard */}
        <NavLink
          to={ROUTES.dashboard}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              isActive ? 'bg-[#F25C22] text-white shadow-md' : 'text-[#64748b] hover:text-[#1B2559]'
            }`
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {/* User Management */}
        <div>
          <button
            onClick={onToggleUserMenu}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              userMenuOpen || isUserManagementActive
                ? 'bg-[#F25C22] text-white shadow-md'
                : 'text-[#64748b] hover:text-[#1B2559]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users size={18} />
              <span>User Management</span>
            </div>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {userMenuOpen && (
            <div className="mt-1 space-y-1 px-2">
              <NavLink
                to={ROUTES.customers}
                onClick={onClose}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive ? 'bg-[#F25C22] text-white shadow-md' : 'text-[#64748b] hover:text-[#1B2559]'
                  }`
                }
              >
                Customers
              </NavLink>
              <NavLink
                to={ROUTES.riders}
                onClick={onClose}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive ? 'bg-[#F25C22] text-white shadow-md' : 'text-[#64748b] hover:text-[#1B2559]'
                  }`
                }
              >
                Riders
              </NavLink>
            </div>
          )}
        </div>

        {/* Other nav items */}
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active ? 'bg-[#F25C22] text-white shadow-md' : 'text-[#64748b] hover:text-[#1B2559]'
              }`}
            >
              <Icon size={18} />
              <span>{item.text}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-[#F4F7FE] px-3 py-3">
        <button
          onClick={() => { handleLogout(); if (onClose) onClose() }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#64748b] transition-all hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ userMenuOpen, onToggleUserMenu }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-[#EEF1F7] bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <img src={brandLogo} alt="G4 Delivery" className="h-9 w-9 object-contain" />
          <span className="text-sm font-bold text-[#1B2559]">Admin Portal</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-[#64748b] hover:bg-[#F4F7FE]"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent
          userMenuOpen={userMenuOpen}
          onToggleUserMenu={onToggleUserMenu}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden w-64 shrink-0 border-r border-[#EEF1F7] bg-white md:flex md:flex-col">
        <NavContent
          userMenuOpen={userMenuOpen}
          onToggleUserMenu={onToggleUserMenu}
          onClose={null}
        />
      </aside>
    </>
  )
}
