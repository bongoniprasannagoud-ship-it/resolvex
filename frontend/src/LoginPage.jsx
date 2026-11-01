
import { useState } from 'react'
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid email or password.')
        }

        if (response.status === 400) {
          throw new Error('Please check your email and password.')
        }

        throw new Error(
          `Login failed (${response.status}). Please try again.`,
        )
      }

      const data = await response.json()

      if (!data.token || !data.role || data.userId == null) {
        throw new Error(
          'The server returned an unexpected login response.',
        )
      }

      const role = String(data.role).trim().toUpperCase()

      const destinations = {
        STUDENT: '/student',
        STAFF: '/staff',
        ADMIN: '/admin',
      }

      const destination = destinations[role]

      if (!destination) {
        throw new Error(`Unsupported account role: ${data.role}`)
      }

      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('role', role)
      sessionStorage.setItem('userId', String(data.userId))

      window.location.href = destination
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Cannot connect to the server. Check that Spring Boot is running on port 8080.'
          : err.message || 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 p-12 lg:flex">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/20">
              <ShieldCheck size={28} />
            </div>
            <span className="text-lg font-semibold tracking-wide">
              ResolveX
            </span>
          </div>

          <div className="relative max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">
              Your campus. Your voice.
            </p>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Better campus life starts with being heard.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-indigo-100/80">
              Submit concerns, follow progress, and help make your campus
              a better place for everyone.
            </p>
          </div>

          <p className="relative text-sm text-indigo-200/70">
            Campus complaint management system
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="mb-4 inline-flex rounded-xl bg-indigo-500/15 p-3 text-indigo-300">
                <ShieldCheck size={28} />
              </div>
              <h1 className="text-2xl font-bold">ResolveX</h1>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold text-indigo-400">
                WELCOME BACK
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sign in to your account
              </h2>
              <p className="mt-3 text-slate-400">
                Access your campus complaint dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <Mail size={19} className="shrink-0 text-slate-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@college.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <LockKeyhole
                    size={19}
                    className="shrink-0 text-slate-500"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="text-xs font-medium text-slate-400 hover:text-white"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-500">
              Sign in using the account provided by your campus.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
