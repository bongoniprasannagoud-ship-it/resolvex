
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, X, RefreshCw, Users } from "lucide-react";
import { apiFetch } from "./api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  departmentId: "",
};

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [staffData, departmentData] = await Promise.all([
        apiFetch("/admin/staff"),
        apiFetch("/admin/departments"),
      ]);

      setStaff(Array.isArray(staffData) ? staffData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
    } catch (err) {
      setError(err.message || "Unable to load staff information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStaff = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return staff;

    return staff.filter((member) =>
      [member.name, member.email, member.departmentName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [staff, searchText]);

  function openAddForm() {
    setEditingStaff(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(member) {
    setEditingStaff(member);
    setForm({
      name: member.name || "",
      email: member.email || "",
      password: "",
      departmentId: member.departmentId
        ? String(member.departmentId)
        : "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingStaff(null);
    setForm(emptyForm);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.departmentId) {
      setError("Name and department are required.");
      return;
    }

    if (
      !editingStaff &&
      (!form.email.trim() || !form.password.trim())
    ) {
      setError("Email and password are required.");
      return;
    }

    setSaving(true);

    try {
      if (editingStaff) {
        await apiFetch(`/admin/staff/${editingStaff.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name.trim(),
            departmentId: Number(form.departmentId),
          }),
        });

        setSuccess("Staff details updated successfully.");
      } else {
        await apiFetch("/admin/staff", {
          method: "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            departmentId: Number(form.departmentId),
          }),
        });

        setSuccess("Staff account created successfully.");
      }

      setShowForm(false);
      setEditingStaff(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save staff details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage staff accounts and department assignments.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && !showForm && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Staff accounts ({staff.length})
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredStaff.length} result(s)
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search name, email, department..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh"
              className="rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading staff...
          </p>
        ) : filteredStaff.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-3 text-slate-300" size={32} />
            <p className="font-medium text-slate-700">No staff found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or add a staff account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Staff member</th>
                  <th className="px-3 py-3 font-semibold">Email</th>
                  <th className="px-3 py-3 font-semibold">Department</th>
                  <th className="px-3 py-3 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                          {member.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Staff ID: {member.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {member.email}
                    </td>

                    <td className="px-3 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                        {member.departmentName || "Not assigned"}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-right">
                      <button
                        onClick={() => openEditForm(member)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingStaff ? "Edit staff member" : "Add staff member"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingStaff
                    ? "Update the name or department."
                    : "Create a new staff login account."}
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  placeholder="Enter staff name"
                />
              </div>

              {!editingStaff && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      maxLength={255}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Initial password
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      maxLength={100}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      placeholder="Set initial password"
                    />
                  </div>
                </>
              )}

              {editingStaff && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    value={form.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingStaff
                      ? "Save changes"
                      : "Create staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
