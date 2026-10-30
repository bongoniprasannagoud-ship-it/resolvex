
import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Clock3,
  FilePlus2,
  History,
  RefreshCw,
  Send,
  X,
} from 'lucide-react'
import { apiFetch } from './api.js'

const statusStyles = {
  SUBMITTED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  ROUTED: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  ASSIGNED: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  IN_PROGRESS: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  RESOLVED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  CLOSED: 'border-slate-600 bg-slate-800 text-slate-300',
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString()
}

function StatusBadge({ status }) {
  const style =
    statusStyles[status] ||
    'border-slate-700 bg-slate-800 text-slate-300'

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${style}`}
    >
      {(status || 'UNKNOWN').replaceAll('_', ' ')}
    </span>
  )
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

export default function StudentComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedComplaint, setSelectedComplaint] = useState(null)

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiFetch('/complaints/my')
      setComplaints(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Could not load your complaints.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const cleanTitle = title.trim()
    const cleanDescription = description.trim()

    if (!cleanTitle || cleanTitle.length > 200) {
      setError('Title is required and must be at most 200 characters.')
      return
    }

    if (cleanDescription.length < 10 || cleanDescription.length > 2000) {
      setError('Description must be between 10 and 2,000 characters.')
      return
    }

    setSubmitting(true)

    try {
      const created = await apiFetch('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          title: cleanTitle,
          description: cleanDescription,
        }),
      })

      setTitle('')
      setDescription('')
      setSuccess(
        `Complaint #${created.id} submitted successfully.`,
      )

      await loadComplaints()
    } catch (err) {
      setError(err.message || 'Could not submit your complaint.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
          Student workspace
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">
          My complaints
        </h2>
        <p className="mt-3 text-slate-400">
          Submit a campus concern and follow its progress from one place.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-300">
            <FilePlus2 size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Submit a complaint</h3>
            <p className="mt-1 text-sm text-slate-400">
              Describe the issue clearly. The system will classify and route it.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="complaint-title"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Complaint title
            </label>
            <input
              id="complaint-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
              placeholder="e.g. Broken classroom ceiling fan"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {title.length}/200
            </p>
          </div>

          <div>
            <label
              htmlFor="complaint-description"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Description
            </label>
            <textarea
              id="complaint-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={10}
              maxLength={2000}
              required
              rows={5}
              placeholder="Explain what happened and where the issue is occurring…"
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {description.length}/2000 (minimum 10 characters)
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <p
              role="status"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
            >
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={17} />
            {submitting ? 'Submitting…' : 'Submit complaint'}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">Submitted complaints</h3>
            <p className="mt-1 text-sm text-slate-400">
              {complaints.length} complaint
              {complaints.length === 1 ? '' : 's'} found
            </p>
          </div>

          <button
            type="button"
            onClick={loadComplaints}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-900 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading && (
          <p className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            Loading your complaints…
          </p>
        )}

        {!loading && error && complaints.length === 0 && (
          <p className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            Your complaints could not be loaded. Check the error above and try refreshing.
          </p>
        )}

        {!loading && !error && complaints.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
            <ClipboardEmpty />
            <h4 className="mt-4 font-semibold">No complaints yet</h4>
            <p className="mt-2 text-sm text-slate-400">
              Your submitted complaints will appear here.
            </p>
          </div>
        )}

        {!loading && complaints.length > 0 && (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <article
                key={complaint.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">
                      COMPLAINT #{complaint.id}
                    </p>
                    <h4 className="mt-2 break-words text-lg font-semibold">
                      {complaint.title}
                    </h4>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                      {complaint.description}
                    </p>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>

                <div className="mt-5 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="mt-1 text-sm font-medium">
                      {complaint.category || 'Pending classification'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Priority</p>
                    <p className="mt-1 text-sm font-medium">
                      {complaint.priority || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="mt-1 text-sm font-medium">
                      {complaint.departmentName || 'Not assigned yet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Assigned to</p>
                    <p className="mt-1 text-sm font-medium">
                      {complaint.assignedToName || 'Awaiting assignment'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                      <Clock3 size={15} className="text-slate-500" />
                      {formatDate(complaint.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Classification</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {complaint.manualReviewRequired
                        ? 'Pending manual review'
                        : complaint.classificationSource || 'Processed'}
                    </p>
                  </div>
                </div>

                {complaint.classificationReason && (
                  <p className="mt-4 rounded-xl bg-slate-950 p-3 text-sm leading-6 text-slate-400">
                    <span className="font-medium text-slate-300">
                      Classification reason:{' '}
                    </span>
                    {complaint.classificationReason}
                  </p>
                )}

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(complaint)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white"
                  >
                    <History size={16} />
                    View history
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedComplaint && (
        <ComplaintHistory
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  )
}

function ClipboardEmpty() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
      <FilePlus2 size={23} />
    </div>
  )
}
