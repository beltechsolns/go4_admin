import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { ROUTES } from '../constants/routes'
import brandLogo from '../assets/brand.png'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await api.post('/auth/forgot-password', { email })
      setSuccess(
        res.data?.data?.message ||
          'If this email exists, a password reset link has been sent.'
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E0E5F2] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <img src={brandLogo} alt="G4 Delivery" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <h1 className="text-2xl font-bold text-[#1B2559]">Forgot Password</h1>
          <p className="mt-1 text-sm text-[#A3AED0]">
            Enter your admin email and we will send a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">{error}</p>}
          {success && (
            <p className="rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-600">{success}</p>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1B2559]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@g4delivery.com"
              required
              className="w-full rounded-xl border border-[#E0E5F2] px-4 py-2.5 text-sm text-[#1B2559] outline-none transition-colors focus:border-[#F25C22]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#F25C22] py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <p className="text-center text-sm text-[#64748b]">
            Remembered your password?{' '}
            <Link to={ROUTES.login} className="font-semibold text-[#F25C22] hover:text-orange-600">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
