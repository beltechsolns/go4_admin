import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import { ROUTES } from './constants/routes'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import CustomersPage from './pages/CustomersPage'
import DashboardPage from './pages/DashboardPage'
import DeliveriesPage from './pages/DeliveriesPage'
import LiveTrackingPage from './pages/LiveTrackingPage'
import PricingPage from './pages/PricingPage'
import ReportsPage from './pages/ReportsPage'
import RidersPage from './pages/RidersPage'
import SettingsPage from './pages/SettingsPage'
import StoresPage from './pages/StoresPage'
import CategoriesPage from './pages/CategoriesPage'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to={ROUTES.login} replace />
  return children
}

export default function App() {
  const pathname = useLocation().pathname
  const isAuthPage = [ROUTES.login, ROUTES.forgotPassword, ROUTES.resetPassword].includes(pathname)
  const token = localStorage.getItem('token')

  if (pathname === ROUTES.login && token) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  if (isAuthPage) {
    return (
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7FE] font-sans text-[#1B2559] antialiased selection:bg-[#F25C22] selection:text-white">
      <Sidebar />

      <main className="mx-auto w-full max-w-400 flex-1 overflow-y-auto p-4 pt-20 md:p-8">
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
          <Route path={ROUTES.dashboard} element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path={ROUTES.customers} element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path={ROUTES.riders} element={<ProtectedRoute><RidersPage /></ProtectedRoute>} />
          <Route path={ROUTES.deliveries} element={<ProtectedRoute><DeliveriesPage /></ProtectedRoute>} />
          <Route path={ROUTES.stores} element={<ProtectedRoute><StoresPage /></ProtectedRoute>} />
          <Route path={`${ROUTES.stores}/:storeSlug`} element={<ProtectedRoute><StoresPage /></ProtectedRoute>} />
          <Route path={ROUTES.categories} element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
          <Route path={ROUTES.liveTracking} element={<ProtectedRoute><LiveTrackingPage /></ProtectedRoute>} />
          <Route path={ROUTES.reports} element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path={ROUTES.pricing} element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
          <Route path={ROUTES.settings} element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
        </Routes>
      </main>
    </div>
  )
}
