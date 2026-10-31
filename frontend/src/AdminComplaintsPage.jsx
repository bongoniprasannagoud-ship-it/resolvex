import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  RefreshCw,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Send,
} from 'lucide-react'
import { apiFetch } from './api'


function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString()
}


const CATEGORIES = [
  'IT',
  'INFRASTRUCTURE',
  'CLEANLINESS',
  'TRANSPORT',
  'ACADEMIC',
  'HOSTEL',
  'SAFETY',
]

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function AdminComplaintsPage() {

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
const [reviewQueue, setReviewQueue] = useState([])
const [reviewLoading, setReviewLoading] = useState(true)
const [reviewError, setReviewError] = useState('')
const [reviewMessage, setReviewMessage] = useState('')
const [reviewingId, setReviewingId] = useState(null)
const [reviewForms, setReviewForms] = useState({})
const [unassignedQueue, setUnassignedQueue] = useState([])
const [staffList, setStaffList] = useState([])
const [assignmentLoading, setAssignmentLoading] = useState(true)
const [assignmentError, setAssignmentError] = useState('')
const [assignmentMessage, setAssignmentMessage] = useState('')
const [selectedStaff, setSelectedStaff] = useState({})
const [assigningId, setAssigningId] = useState(null)
const [searchParams, setSearchParams] = useSearchParams()

const [searchText, setSearchText] = useState('')
const [departmentFilter, setDepartmentFilter] = useState('')
const [priorityFilter, setPriorityFilter] = useState('')

const statusFilter = searchParams.get('filter') || 'all'


  const loadComplaints = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiFetch('/complaints')
      setComplaints(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Could not load complaints.')
    } finally {
      setLoading(false)
    }
  }, [])

  
const loadReviewQueue = useCallback(async () => {
  setReviewLoading(true)
  setReviewError('')

  try {
    const data = await apiFetch('/admin/complaints/review-queue')
    const queue = Array.isArray(data) ? data : []

    setReviewQueue(queue)

    setReviewForms((previous) => {
      const next = { ...previous }

      queue.forEach((complaint) => {
        if (!next[complaint.id]) {
          next[complaint.id] = {
            category:
              complaint.category && complaint.category !== 'OTHER'
                ? complaint.category
                : 'IT',
            priority: complaint.priority || 'MEDIUM',
            reason: '',
          }
        }
      })

      return next
    })
  } catch (err) {
    setReviewError(err.message || 'Could not load the review queue.')
  } finally {
    setReviewLoading(false)
  }
}, [])

const loadAssignmentData = useCallback(async () => {
  setAssignmentLoading(true)
  setAssignmentError('')

  try {
    const [queueData, staffData] = await Promise.all([
      apiFetch('/admin/complaints/unassigned-queue'),
      apiFetch('/admin/staff'),
    ])

    setUnassignedQueue(Array.isArray(queueData) ? queueData : [])
    setStaffList(Array.isArray(staffData) ? staffData : [])
  } catch (err) {
    setAssignmentError(
      err.message || 'Could not load assignment data.'
    )
  } finally {
    setAssignmentLoading(false)
  }
}, [])



async function submitReview(complaint) {
  const form = reviewForms[complaint.id]

  if (!form?.category || !form?.priority || !form?.reason.trim()) {
    setReviewError('Select a category and priority, and enter a reason.')
    return
  }

  setReviewingId(complaint.id)
  setReviewError('')
  setReviewMessage('')

  try {
    await apiFetch(`/admin/complaints/${complaint.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({
        category: form.category,
        priority: form.priority,
        reason: form.reason.trim(),
      }),
    })

    setReviewMessage(`Complaint #${complaint.id} reviewed successfully.`)

    await Promise.all([loadReviewQueue(), loadComplaints()])
  } catch (err) {
    setReviewError(err.message || 'Could not submit the review.')
  } finally {
    setReviewingId(null)
  }
}

async function assignComplaint(complaint) {
  const staffId = selectedStaff[complaint.id]

  if (!staffId) {
    setAssignmentError('Select a staff member first.')
    return
  }

  setAssigningId(complaint.id)
  setAssignmentError('')
  setAssignmentMessage('')

  try {
    await apiFetch(
      `/admin/complaints/${complaint.id}/assign`,
      {
        method: 'PUT',
        body: JSON.stringify({
          staffId: Number(staffId),
        }),
      }
    )

    setAssignmentMessage(
      `Complaint #${complaint.id} assigned successfully.`
    )

    setSelectedStaff((previous) => {
      const next = { ...previous }
      delete next[complaint.id]
      return next
    })

    await Promise.all([
      loadAssignmentData(),
      loadComplaints(),
    ])
  } catch (err) {
    setAssignmentError(
      err.message || 'Could not assign the complaint.'
    )
  } finally {
    setAssigningId(null)
  }
}

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  
useEffect(() => {
  loadReviewQueue()
}, [loadReviewQueue])


useEffect(() => {
  loadAssignmentData()
}, [loadAssignmentData])



  const pendingReview = complaints.filter(
    (complaint) => complaint.manualReviewRequired
  ).length

  const unassigned = complaints.filter(
    (complaint) =>
      !complaint.assignedToName &&
      complaint.departmentCode &&
      !complaint.manualReviewRequired
  ).length

  const filteredComplaints = complaints.filter((complaint) => {
  const search = searchText.trim().toLowerCase()

  const matchesSearch =
    !search ||
    String(complaint.id).includes(search) ||
    (complaint.title || '').toLowerCase().includes(search)

  let matchesStatus = true

  if (statusFilter === 'pending-review') {
    matchesStatus = complaint.manualReviewRequired
  } else if (statusFilter === 'unassigned') {
    matchesStatus =
      !complaint.assignedToName &&
      complaint.departmentCode &&
      !complaint.manualReviewRequired
  } else if (statusFilter === 'resolved') {
    matchesStatus = ['RESOLVED', 'CLOSED'].includes(
      complaint.status
    )
  } else if (statusFilter !== 'all') {
    matchesStatus = complaint.status === statusFilter
  }

  const matchesDepartment =
    !departmentFilter ||
    complaint.departmentName === departmentFilter

  const matchesPriority =
    !priorityFilter ||
    complaint.priority === priorityFilter

  return (
    matchesSearch &&
    matchesStatus &&
    matchesDepartment &&
    matchesPriority
  )
})

const departments = [
  ...new Set(
    complaints
      .map((complaint) => complaint.departmentName)
      .filter(Boolean)
  ),
].sort()

function updateStatusFilter(value) {
  if (value === 'all') {
    setSearchParams({})
  } else {
    setSearchParams({ filter: value })
  }
}

function clearFilters() {
  setSearchText('')
  setDepartmentFilter('')
  setPriorityFilter('')
  setSearchParams({})
}

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-400">
            ADMINISTRATION
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            All complaints
          </h2>
          <p className="mt-2 text-slate-400">
            Monitor complaint status, classification, and assignment.
          </p>
        </div>

        <button
          type="button"
          onClick={loadComplaints}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}


      {statusFilter === 'all' && (
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total complaints', value: complaints.length },
          { label: 'Pending review', value: pendingReview },
          { label: 'Unassigned', value: unassigned },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>
      )}
        
{(statusFilter === 'all' || statusFilter === 'pending-review') && (
<section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
  <div className="border-b border-slate-800 p-5">
    <h3 className="text-lg font-semibold">Manual review queue</h3>
    <p className="mt-1 text-sm text-slate-400">
      Correct the classification of complaints requiring administrator review.
    </p>
  </div>

  {reviewError && (
    <p role="alert" className="m-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
      {reviewError}
    </p>
  )}

  {reviewMessage && (
    <p role="status" className="m-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
      <CheckCircle2 className="mr-2 inline" size={16} />
      {reviewMessage}
    </p>
  )}

  {reviewLoading ? (
    <p className="p-5 text-slate-400">Loading review queue...</p>
  ) : reviewQueue.length === 0 ? (
    <p className="p-5 text-slate-400">
      No complaints currently require manual review.
    </p>
  ) : (
    <div className="divide-y divide-slate-800">
      {reviewQueue.map((complaint) => {
        const form = reviewForms[complaint.id] || {
          category: 'IT',
          priority: 'MEDIUM',
          reason: '',
        }

        function updateField(field, value) {
          setReviewForms((previous) => ({
            ...previous,
            [complaint.id]: {
              ...form,
              [field]: value,
            },
          }))
        }

        return (
          <article key={complaint.id} className="space-y-4 p-5">
            <div>
              <p className="text-xs text-slate-500">
                Complaint #{complaint.id}
              </p>
              <h4 className="mt-1 font-semibold">{complaint.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {complaint.description}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="block text-slate-300">Category</span>
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField('category', event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="block text-slate-300">Priority</span>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    updateField('priority', event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Review reason (required)</span>
              <textarea
                value={form.reason}
                onChange={(event) =>
                  updateField('reason', event.target.value)
                }
                maxLength={1000}
                rows={3}
                placeholder="Explain why this category and priority are appropriate."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <button
              type="button"
              onClick={() => submitReview(complaint)}
              disabled={
                reviewingId === complaint.id ||
                !form.reason.trim()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
              {reviewingId === complaint.id
                ? 'Submitting...'
                : 'Submit review'}
            </button>
          </article>
        )
      })}
    </div>
  )}
</section>
)}


{(statusFilter === 'all' || statusFilter === 'unassigned') && (
<section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
  <div className="border-b border-slate-800 p-5">
    <h3 className="text-lg font-semibold">Manual assignment</h3>
    <p className="mt-1 text-sm text-slate-400">
      Assign unassigned complaints to staff in the appropriate department.
    </p>
  </div>

  {assignmentError && (
    <p
      role="alert"
      className="m-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
    >
      {assignmentError}
    </p>
  )}

  {assignmentMessage && (
    <p
      role="status"
      className="m-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
    >
      <CheckCircle2 className="mr-2 inline" size={16} />
      {assignmentMessage}
    </p>
  )}

  {assignmentLoading ? (
    <p className="p-5 text-slate-400">
      Loading assignment queue...
    </p>
  ) : unassignedQueue.length === 0 ? (
    <p className="p-5 text-slate-400">
      No complaints are waiting for assignment.
    </p>
  ) : (
    <div className="divide-y divide-slate-800">
      {unassignedQueue.map((complaint) => {
        const eligibleStaff = staffList.filter(
          (staff) =>
            staff.departmentCode === complaint.departmentCode
        )

        return (
          <article
            key={complaint.id}
            className="space-y-4 p-5"
          >
            <div>
              <p className="text-xs text-slate-500">
                Complaint #{complaint.id}
              </p>

              <h4 className="mt-1 font-semibold">
                {complaint.title}
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {complaint.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-700 px-3 py-1">
                  {complaint.category || 'Unclassified'}
                </span>

                <span className="rounded-full border border-slate-700 px-3 py-1">
                  {complaint.priority || 'No priority'}
                </span>

                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-300">
                  {complaint.departmentName || 'No department'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedStaff[complaint.id] || ''}
                onChange={(event) =>
                  setSelectedStaff((previous) => ({
                    ...previous,
                    [complaint.id]: event.target.value,
                  }))
                }
                disabled={assigningId === complaint.id}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"
              >
                <option value="">Select staff member</option>

                {eligibleStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.email})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => assignComplaint(complaint)}
                disabled={
                  assigningId === complaint.id ||
                  !selectedStaff[complaint.id] ||
                  eligibleStaff.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={16} />

                {assigningId === complaint.id
                  ? 'Assigning...'
                  : 'Assign complaint'}
              </button>
            </div>

            {eligibleStaff.length === 0 && (
              <p className="text-sm text-amber-300">
                No staff members are available for this department.
              </p>
            )}
          </article>
        )
      })}
    </div>
  )}
</section>
)}

       {/* Complaint filters */}
<section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h3 className="font-semibold">Filter complaints</h3>
      <p className="mt-1 text-sm text-slate-400">
        Search and narrow down complaint records.
      </p>
    </div>

    <button
      type="button"
      onClick={clearFilters}
      className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
    >
      Clear filters
    </button>
  </div>

  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <input
      type="text"
      value={searchText}
      onChange={(event) => setSearchText(event.target.value)}
      placeholder="Search title or complaint ID"
      className="min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
    />

    <select
      value={statusFilter}
      onChange={(event) => updateStatusFilter(event.target.value)}
      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"
    >
      <option value="all">All statuses</option>
      <option value="pending-review">Pending review</option>
      <option value="unassigned">Unassigned</option>
      <option value="OPEN">Open</option>
      <option value="ROUTED">Routed</option>
      <option value="ASSIGNED">Assigned</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="RESOLVED">Resolved</option>
      <option value="CLOSED">Closed</option>
      <option value="REOPENED">Reopened</option>
    </select>

    <select
      value={departmentFilter}
      onChange={(event) => setDepartmentFilter(event.target.value)}
      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"
    >
      <option value="">All departments</option>
      {departments.map((department) => (
        <option key={department} value={department}>
          {department}
        </option>
      ))}
    </select>

    <select
      value={priorityFilter}
      onChange={(event) => setPriorityFilter(event.target.value)}
      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"
    >
      <option value="">All priorities</option>
      {PRIORITIES.map((priority) => (
        <option key={priority} value={priority}>
          {priority}
        </option>
      ))}
    </select>
  </div>

  <p className="mt-4 text-sm text-slate-400">
    Showing{' '}
    <span className="font-semibold text-slate-100">
      {filteredComplaints.length}
    </span>{' '}
    of{' '}
    <span className="font-semibold text-slate-100">
      {complaints.length}
    </span>{' '}
    complaints
  </p>
</section>
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <ClipboardList size={20} className="text-indigo-400" />
          <h3 className="font-semibold">Complaint records</h3>
        </div>

        {loading ? (
          <p className="p-6 text-slate-400">Loading complaints...</p>
       ) : filteredComplaints.length === 0 ? (
          <p className="p-6 text-slate-400">
            No complaints match the selected filters.
            </p>
        ) : (
          <div className="divide-y divide-slate-800">
           {filteredComplaints.map((complaint) => (
              <article key={complaint.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Complaint #{complaint.id}
                    </p>
                    <h4 className="mt-1 font-semibold">
                      {complaint.title}
                    </h4>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">
                    {complaint.status?.replaceAll('_', ' ') || '—'}
                  </span>
                </div>

                <p className="text-sm leading-6 text-slate-400">
                  {complaint.description}
                </p>

                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <p>
                    <span className="text-slate-500">Category: </span>
                    {complaint.category || '—'}
                  </p>
                  <p>
                    <span className="text-slate-500">Priority: </span>
                    {complaint.priority || '—'}
                  </p>
                  <p>
                    <span className="text-slate-500">Department: </span>
                    {complaint.departmentName || 'Not routed'}
                  </p>
                  <p>
                    <span className="text-slate-500">Assigned to: </span>
                    {complaint.assignedToName || 'Unassigned'}
                  </p>
                  <p>
                    <span className="text-slate-500">Created: </span>
                    {formatDate(complaint.createdAt)}
                  </p>
                  <p>
                    <span className="text-slate-500">Classification: </span>
                    {complaint.classificationSource || '—'}
                  </p>
                </div>

                {complaint.manualReviewRequired && (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                    Manual review required
                    {complaint.classificationReason
                      ? `: ${complaint.classificationReason}`
                      : '.'}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminComplaintsPage
