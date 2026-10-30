
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api'
import {
  RefreshCw,
  ClipboardList,
  Clock,
  AlertCircle,
  History,
  X,
} from 'lucide-react'

const ALLOWED_STAFF_TRANSITIONS = {
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  REOPENED: ['ASSIGNED', 'IN_PROGRESS'],
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}




function ComplaintHistory({ complaint, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadHistory() {
      try {
        const data = await apiFetch(
          `/complaints/${complaint.id}/history`,
        )

        if (active) setHistory(Array.isArray(data) ? data : [])
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadHistory()

    return () => {
      active = false
    }
  }, [complaint.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Complaint #{complaint.id}
            </p>
            <h2 id="history-title" className="mt-2 text-xl font-bold">
              Complaint history
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {complaint.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {loading && (
          <p className="py-8 text-sm text-slate-400">
            Loading complaint history…
          </p>
        )}

        {error && (
          <p role="alert" className="mt-5 text-sm text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && history.length === 0 && (
          <p className="py-8 text-sm text-slate-400">
            No history entries are available for this complaint yet.
          </p>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="mt-6 space-y-5">
            {history.map((entry, index) => (
              <div key={entry.id ?? index} className="flex gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-200">
                    {entry.action ||
                      entry.description ||
                      entry.status ||
                      entry.eventType ||
                      'Complaint updated'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(
                      entry.createdAt ||
                      entry.timestamp ||
                      entry.changedAt,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-7 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Close
        </button>
      </section>
    </div>
  )
}
function StaffComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedStatuses, setSelectedStatuses] = useState({})
  const [historyComplaint, setHistoryComplaint] = useState(null)

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiFetch('/complaints/assigned')
      setComplaints(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Could not load assigned complaints.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  async function updateStatus(complaint) {
    const nextStatus = selectedStatuses[complaint.id]

    if (!nextStatus || nextStatus === complaint.status) {
      setMessage('Select a different status first.')
      return
    }

    setUpdatingId(complaint.id)
    setError('')
    setMessage('')

    try {
      await apiFetch(`/complaints/${complaint.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })

      setMessage(`Complaint #${complaint.id} status updated to ${nextStatus}.`)
      await loadComplaints()
    } catch (err) {
      setError(err.message || 'Could not update complaint status.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Assigned Complaints
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review complaints assigned to you and update their progress.
          </p>
        </div>

        <button
          type="button"
          onClick={loadComplaints}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <ClipboardList className="mb-3 text-indigo-600" size={22} />
          <p className="text-sm text-slate-500">Assigned to you</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {complaints.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Clock className="mb-3 text-amber-600" size={22} />
          <p className="text-sm text-slate-500">In progress</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {complaints.filter(c => c.status === 'IN_PROGRESS').length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <AlertCircle className="mb-3 text-emerald-600" size={22} />
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {complaints.filter(c => c.status === 'RESOLVED').length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading assigned complaints...
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ClipboardList className="mx-auto mb-3 text-slate-400" size={34} />
          <h3 className="font-semibold text-slate-800">
            No assigned complaints
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Complaints assigned to your account will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(complaint => (
            <article
              key={complaint.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Complaint #{complaint.id}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {complaint.title}
                  </h3>
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {(complaint.status || 'UNKNOWN').replaceAll('_', ' ')}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {complaint.description}
              </p>
              
              
                <button
                type="button"
                onClick={() => setHistoryComplaint(complaint)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                View history
                </button>


              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {complaint.category || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Priority</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {complaint.priority || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {complaint.departmentName || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(complaint.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                {(() => {
                    <button
  type="button"
  onClick={() => setHistoryComplaint(complaint)}
  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
>
  <History size={16} />
  View history
</button>
  const allowedStatuses =
    ALLOWED_STAFF_TRANSITIONS[complaint.status] || []

  return (
    <select
      value={selectedStatuses[complaint.id] ?? ''}
      onChange={(event) => {
        setSelectedStatuses((previous) => ({
          ...previous,
          [complaint.id]: event.target.value,
        }))
        setMessage('')
        setError('')
      }}
      disabled={
        updatingId === complaint.id ||
        allowedStatuses.length === 0
      }
      className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={`New status for complaint ${complaint.id}`}
    >
      <option value="">Select next status</option>

      {allowedStatuses.map((status) => (
        <option key={status} value={status}>
          {status.replaceAll('_', ' ')}
        </option>
      ))}
    </select>
  )
})()}

                <button
                  type="button"
                  onClick={() => updateStatus(complaint)}
                  disabled={
  updatingId === complaint.id ||
  !selectedStatuses[complaint.id] ||
  selectedStatuses[complaint.id] === complaint.status
}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === complaint.id ? 'Updating...' : 'Update status'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {historyComplaint && (
  <ComplaintHistory
    complaint={historyComplaint}
    onClose={() => setHistoryComplaint(null)}
  />
)}
    </div>
  )
}

export default StaffComplaintsPage
