import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import api from '../api/client'
import brandLogo from '../assets/brand.png'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@g4delivery.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.data.token)
      navigate(ROUTES.dashboard, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || t('auth.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E0E5F2] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <img src={brandLogo} alt="G4 Delivery" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <h1 className="text-2xl font-bold text-[#1B2559]">G4 Delivery Admin</h1>
          <p className="mt-1 text-sm text-[#A3AED0]">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">{error}</p>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1B2559]">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@g4delivery.com"
              required
              className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm text-[#1B2559] outline-none transition-colors focus:border-[#F25C22]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1B2559]">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm text-[#1B2559] outline-none transition-colors focus:border-[#F25C22]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#F25C22] py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}