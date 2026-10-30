
import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

import LoginPage from './LoginPage.jsx'
import StudentComplaintsPage from './StudentComplaintsPage.jsx'
import StaffComplaintsPage from './StaffComplaintsPage.jsx'
import AdminComplaintsPage from './AdminComplaintsPage.jsx'
import { apiFetch } from './api'

function ProtectedRoute({ allowedRoles }) {
  const token = sessionStorage.getItem('token')
  const role = sessionStorage.getItem('role')

  if (!token || !role) {
    return <Navigate to="/" replace />
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={`/${role.toLowerCase()}`} replace />
  }

  return <Outlet />
}

function DashboardLayout() {
  const role = sessionStorage.getItem('role')
  const navigate = useNavigate()

  const accountLabels = {
    STUDENT: 'Student',
    STAFF: 'Staff',
    ADMIN: 'Administrator',
  }

  function logout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('userId')
    navigate('/', { replace: true })
  }

  const base = {
    STUDENT: '/student',
    STAFF: '/staff',
    ADMIN: '/admin',
  }[role]

  const navigation = [
    {
      label: 'Overview',
      path: base,
      icon: LayoutDashboard,
    },
    {
      label: 'Complaints',
      path: `${base}/complaints`,
      icon: ClipboardList,
    },
    ...(role === 'ADMIN'
      ? [
          {
            label: 'Users & assignments',
            path: '/admin/assignments',
            icon: Users,
          },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      <aside className="border-b border-slate-800 bg-slate-900 p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-2">
            <ShieldCheck size={24} />
          </div>
          <span className="text-lg font-bold">CampusCare</span>
        </div>

        <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="flex flex-wrap gap-2 md:flex-col">
          {navigation.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="mt-6 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white md:mt-12"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-5 md:px-10">
          <div>
            <p className="text-sm text-slate-400">
              CampusCare workspace
            </p>
            <h1 className="mt-1 text-xl font-bold">
              {accountLabels[role]} dashboard
            </h1>
          </div>

          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
            {role}
          </span>
        </header>

        <section className="p-6 md:p-10">
          <Outlet />
        </section>
      </main>
    </div>
  )
}

function DashboardHome() {
  const role = sessionStorage.getItem('role')

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (role !== 'ADMIN') return

    async function loadComplaints() {
      setLoading(true)
      setError('')

      try {
        const data = await apiFetch('/complaints')
        setComplaints(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Could not load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    loadComplaints()
  }, [role])

  const content = {
    STUDENT: {
      title: 'Your campus, your voice.',
      description:
        'Submit a complaint and keep track of its progress.',
      cards: [
        'Submit a complaint',
        'My complaints',
        'Complaint history',
      ],
    },
    STAFF: {
      title: 'Manage your assigned complaints.',
      description:
        'Review complaints assigned to your department and update their progress.',
      cards: [
        'Assigned complaints',
        'In progress',
        'Resolved',
      ],
    },
  }

  if (role === 'ADMIN') {
    const stats = [
      {
        label: 'Total complaints',
        value: complaints.length,
      },
      {
        label: 'Pending review',
        value: complaints.filter(
          (c) => c.manualReviewRequired
        ).length,
      },
      {
        label: 'Unassigned',
        value: complaints.filter(
          (c) =>
            !c.assignedToName &&
            c.departmentCode &&
            !c.manualReviewRequired
        ).length,
      },
      {
        label: 'Assigned',
        value: complaints.filter(
          (c) => c.status === 'ASSIGNED'
        ).length,
      },
      {
        label: 'In progress',
        value: complaints.filter(
          (c) => c.status === 'IN_PROGRESS'
        ).length,
      },
      {
        label: 'Resolved',
        value: complaints.filter(
          (c) => ['RESOLVED', 'CLOSED'].includes(c.status)
        ).length,
      },
    ]

    const statusCounts = complaints.reduce(
      (counts, complaint) => {
        const status = complaint.status || 'UNKNOWN'
        counts[status] = (counts[status] || 0) + 1
        return counts
      },
      {}
    )

    const departmentCounts = complaints.reduce(
      (counts, complaint) => {
        const department =
          complaint.departmentName || 'Unassigned department'

        counts[department] = (counts[department] || 0) + 1
        return counts
      },
      {}
    )

    return (
      <div>
        <p className="text-sm font-medium text-indigo-400">
          ADMINISTRATION
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          Campus complaint overview
        </h2>

        <p className="mt-3 text-slate-400">
          Monitor complaint classification, routing, assignment,
          and resolution.
        </p>

        {error && (
          <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-slate-400">
            Loading dashboard statistics...
          </p>
        ) : (
          <>
            {/* Complaint statistics */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <p className="text-sm text-slate-400">
                    {item.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Status and department breakdowns */}
            <div className="mt-8 grid gap-6 xl:grid-cols-2">

              {/* Complaint status breakdown */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-lg font-semibold">
                  Complaint status breakdown
                </h3>

                <div className="mt-5 space-y-4">
                  {Object.entries(statusCounts).map(
                    ([status, count]) => (
                      <div key={status}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-slate-300">
                            {status.replaceAll('_', ' ')}
                          </span>

                          <span className="font-semibold">
                            {count}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${
                                complaints.length
                                  ? (count / complaints.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}

                  {complaints.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No complaint data available.
                    </p>
                  )}
                </div>
              </section>

              {/* Department workload */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-lg font-semibold">
                  Department-wise complaints
                </h3>

                <div className="mt-5 space-y-4">
                  {Object.entries(departmentCounts).map(
                    ([department, count]) => (
                      <div
                        key={department}
                        className="flex items-center justify-between border-b border-slate-800 pb-3"
                      >
                        <span className="text-sm text-slate-300">
                          {department}
                        </span>

                        <span className="rounded-lg bg-indigo-500/10 px-3 py-1 text-sm font-semibold text-indigo-300">
                          {count}
                        </span>
                      </div>
                    )
                  )}

                  {complaints.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No department data available.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    )
  }

  const dashboard = content[role]

  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">
        OVERVIEW
      </p>

      <h2 className="mt-3 text-3xl font-bold">
        {dashboard.title}
      </h2>

      <p className="mt-3 max-w-2xl leading-7 text-slate-400">
        {dashboard.description}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboard.cards.map((title, index) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-indigo-500/50"
          >
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              {index + 1}
            </div>

            <h3 className="font-semibold">{title}</h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Dashboard section ready for backend integration.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionPlaceholder({ title }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <h2 className="text-2xl font-bold">{title}</h2>

      <p className="mt-3 text-slate-400">
        This section will be connected to your existing Spring Boot APIs next.
      </p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute
              allowedRoles={['STUDENT', 'STAFF', 'ADMIN']}
            />
          }
        >
          <Route path="/student" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route
              path="complaints"
              element={<StudentComplaintsPage />}
            />
          </Route>

          <Route path="/staff" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route
              path="complaints"
              element={<StaffComplaintsPage />}
            />
          </Route>

          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route
              path="complaints"
              element={<AdminComplaintsPage />}
            />
            <Route
              path="assignments"
              element={<AdminComplaintsPage />}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
