import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { ROUTES } from '../constants/routes'
import brandLogo from '../assets/brand.png'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Reset link is invalid or missing token.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/reset-password', { token, password })
      setSuccess(res.data?.data?.message || 'Password reset successfully. Redirecting to login...')
      setTimeout(() => {
        navigate(ROUTES.login, { replace: true })
      }, 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to reset password. Please request a new link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E0E5F2] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <img src={brandLogo} alt="G4 Delivery" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <h1 className="text-2xl font-bold text-[#1B2559]">Reset Password</h1>
          <p className="mt-1 text-sm text-[#A3AED0]">Set a new password for your admin account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">{error}</p>}
          {success && (
            <p className="rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-600">{success}</p>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1B2559]">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm text-[#1B2559] outline-none transition-colors focus:border-[#F25C22]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1B2559]">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <p className="text-center text-sm text-[#64748b]">
            <Link to={ROUTES.login} className="font-semibold text-[#F25C22] hover:text-orange-600">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
