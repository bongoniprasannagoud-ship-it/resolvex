
import { useEffect, useState } from "react";
import {
    BarChart3,
    ClipboardList,
    Clock,
    CheckCircle2,
    XCircle,
    Users,
    RefreshCw
} from "lucide-react";
import { apiFetch } from "./api";

const statusColors = {
    OPEN: "bg-slate-400",
    PENDING_REVIEW: "bg-amber-500",
    ROUTED: "bg-orange-500",
    ASSIGNED: "bg-blue-500",
    IN_PROGRESS: "bg-indigo-500",
    RESOLVED: "bg-emerald-500",
    CLOSED: "bg-green-700",
    REJECTED: "bg-red-500",
    REOPENED: "bg-purple-500"
};

function StatCard({ title, value, icon: Icon, color, subtitle }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon size={20} />
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-4">
                {value ?? 0}
            </p>
            {subtitle && (
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
        </div>
    );
}

function Section({ title, subtitle, children }) {
    return (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="mb-5">
                <h2 className="font-semibold text-slate-900">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                )}
            </div>
            {children}
        </section>
    );
}

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadAnalytics() {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch("/admin/analytics");
            setAnalytics(data);
        } catch (err) {
            setError(err.message || "Failed to load analytics.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <RefreshCw className="animate-spin mx-auto text-blue-600" size={28} />
                    <p className="text-slate-500 mt-3">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <p className="text-red-700 font-medium">{error}</p>
                <button
                    onClick={loadAnalytics}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!analytics) return null;

    const overview = analytics.overview || {};
    const statuses = analytics.statusBreakdown || [];
    const departments = analytics.departmentStats || [];
    const staff = analytics.staffStats || [];
    const months = analytics.monthlyStats || [];

    const maxStatus = Math.max(1, ...statuses.map(item => item.count));
    const maxDepartment = Math.max(1, ...departments.map(item => item.total));
    const maxMonthly = Math.max(1, ...months.map(item => item.complaints));

    return (
        <div className="space-y-6">
            {/* Page heading */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Analytics & Reports
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Overview of complaint activity and departmental performance
                    </p>
                </div>

                <button
                    onClick={loadAnalytics}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <StatCard
                    title="Total Complaints"
                    value={overview.total}
                    icon={ClipboardList}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Pending"
                    value={overview.pending}
                    icon={Clock}
                    color="bg-amber-50 text-amber-600"
                    subtitle="Open, awaiting review or routing"
                />
                <StatCard
                    title="Active"
                    value={overview.active}
                    icon={Users}
                    color="bg-indigo-50 text-indigo-600"
                    subtitle="Assigned, in progress or reopened"
                />
                <StatCard
                    title="Resolved"
                    value={overview.resolved}
                    icon={CheckCircle2}
                    color="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Closed"
                    value={overview.closed}
                    icon={CheckCircle2}
                    color="bg-green-50 text-green-700"
                />
                <StatCard
                    title="Rejected"
                    value={overview.rejected}
                    icon={XCircle}
                    color="bg-red-50 text-red-600"
                />
            </div>

            {/* Status breakdown */}
            <Section
                title="Complaint Status Breakdown"
                subtitle="Distribution of complaints across their current statuses"
            >
                <div className="space-y-4">
                    {statuses.map(item => (
                        <div key={item.status}>
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-medium text-slate-700">
                                    {item.status.replaceAll("_", " ")}
                                </span>
                                <span className="text-slate-600 font-semibold">
                                    {item.count}
                                </span>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${statusColors[item.status] || "bg-blue-500"}`}
                                    style={{
                                        width: `${(item.count / maxStatus) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Department and monthly analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Section
                    title="Department Workload"
                    subtitle="Total complaints received by each department"
                >
                    {departments.length === 0 ? (
                        <p className="text-sm text-slate-500">No department data available.</p>
                    ) : (
                        <div className="space-y-5">
                            {departments.map((department, index) => (
                                <div key={`${department.departmentName}-${index}`}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-slate-700">
                                            {department.departmentName}
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {department.total}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full"
                                            style={{
                                                width: `${(department.total / maxDepartment) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                                        <span>Unassigned: {department.unassigned}</span>
                                        <span>Active: {department.active}</span>
                                        <span>Resolved: {department.resolved}</span>
                                        <span>Closed: {department.closed}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                <Section
                    title="Monthly Complaint Trends"
                    subtitle="Complaints created during the last six months"
                >
                    <div className="flex items-end gap-3 h-56 pt-4">
                        {months.map((month, index) => (
                            <div
                                key={`${month.month}-${index}`}
                                className="flex-1 h-full flex flex-col justify-end items-center gap-2"
                            >
                                <span className="text-xs font-semibold text-slate-600">
                                    {month.complaints}
                                </span>
                                <div className="w-full flex-1 flex items-end">
                                    <div
                                        className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-lg transition-colors min-h-1"
                                        style={{
                                            height: `${(month.complaints / maxMonthly) * 100}%`
                                        }}
                                        title={`${month.month}: ${month.complaints} complaints`}
                                    />
                                </div>
                                <span className="text-xs text-slate-500 text-center">
                                    {month.month}
                                </span>
                            </div>
                        ))}
                    </div>
                </Section>
            </div>

            {/* Staff performance */}
            <Section
                title="Staff Performance"
                subtitle="Complaint assignments and resolution counts by staff member"
            >
                {staff.length === 0 ? (
                    <p className="text-sm text-slate-500">No staff data available.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="py-3 pr-4 font-medium">Staff Member</th>
                                    <th className="py-3 pr-4 font-medium">Department</th>
                                    <th className="py-3 pr-4 font-medium text-center">Assigned</th>
                                    <th className="py-3 pr-4 font-medium text-center">Active</th>
                                    <th className="py-3 font-medium text-center">Resolved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map(member => (
                                    <tr key={member.staffId} className="border-b border-slate-100 last:border-0">
                                        <td className="py-3 pr-4 font-medium text-slate-800">
                                            {member.staffName}
                                        </td>
                                        <td className="py-3 pr-4 text-slate-600">
                                            {member.departmentName}
                                        </td>
                                        <td className="py-3 pr-4 text-center">
                                            {member.assigned}
                                        </td>
                                        <td className="py-3 pr-4 text-center">
                                            {member.active}
                                        </td>
                                        <td className="py-3 text-center font-semibold text-emerald-700">
                                            {member.resolved}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>
        </div>
    );
}
