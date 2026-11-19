import { useEffect, useMemo, useState } from "react";
import { clearUsers, deleteUser, getStoredUsers, createUserAdmin, updateUserAdmin } from "../../utils/userStorage";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";
import { paginateItems, sortAdminItems } from "../../utils/adminListUtils";
import { getUsersApi } from "../../utils/authApi";

const emptyUserForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  mobile: "",
  city: "Rajkot",
  gender: "Male",
};

function AdminUsers() {
  const [users, setUsers] = useState(() => getStoredUsers());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyUserForm);
  const [formErrors, setFormErrors] = useState({});
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      window.location.href = "/admin/login";
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const data = await getUsersApi();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setUsers(data.map((u) => ({ ...u, id: u.id || u._id })));
        }
      } catch {
        if (!cancelled) {
          setUsers(getStoredUsers());
        }
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = query
      ? users.filter((u) =>
          [u.name, u.username, u.email, u.city, u.gender, u.mobile]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      : users;
    return sortAdminItems(base, sortBy);
  }, [search, sortBy, users]);

  const pagedUsers = useMemo(
    () => paginateItems(filteredUsers, page, pageSize),
    [filteredUsers, page, pageSize]
  );

  const openCreate = () => {
    setEditingId("");
    setForm(emptyUserForm);
    setFormErrors({});
    setShowEditor(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id || user._id);
    setFormErrors({});
    setForm({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      password: "", // leave blank unless updating
      mobile: user.mobile || "",
      city: user.city || "Rajkot",
      gender: user.gender || "Male",
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingId("");
    setForm(emptyUserForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = "Full Name is required.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Full Name must be at least 2 characters.";
    }

    if (!form.username.trim()) {
      errors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())) {
      errors.username = "Username must be 3-20 characters (letters, numbers, underscores).";
    }

    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!editingId && (!form.password || form.password.length < 6)) {
      errors.password = "Password is required and must be at least 6 characters.";
    } else if (editingId && form.password && form.password.length < 6) {
      errors.password = "New password must be at least 6 characters.";
    }

    if (!form.mobile.trim()) {
      errors.mobile = "Mobile number is required.";
    } else if (!/^\d{10}$/.test(form.mobile.trim().replace(/\D/g, ""))) {
      errors.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (!form.city.trim()) {
      errors.city = "City is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userData = {
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      city: form.city.trim(),
      gender: form.gender,
      ...(form.password ? { password: form.password } : {}),
    };

    if (editingId) {
      const res = await updateUserAdmin(editingId, userData);
      setUsers(res.users);
      setToast(`User "${userData.name}" updated successfully.`);
    } else {
      const res = await createUserAdmin({ ...userData, password: form.password });
      setUsers(res.users);
      setToast(`User "${userData.name}" created successfully.`);
    }

    closeEditor();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id || deleteTarget._id;
    const targetName = deleteTarget.name;
    const updated = await deleteUser(targetId);
    setUsers(updated);
    setDeleteTarget(null);
    setToast(`User "${targetName}" removed successfully.`);
  };

  const handleClear = async () => {
    const updated = await clearUsers();
    setUsers(updated);
    setClearOpen(false);
    setToast("All user records have been cleared.");
  };

  return (
    <div>
      {/* Header Card */}
      <div className="admin-card">
        <div className="admin-card-header admin-card-header-centered">
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>User Management</h2>
            <p>View registered customers, create new accounts, and update customer credentials.</p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <span>+ Add User</span>
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-danger admin-btn-sm"
              onClick={() => setClearOpen(true)}
              disabled={users.length === 0}
            >
              Clear All Users
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <svg
              className="admin-search-svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="admin-search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search users by name, username, email, phone, or city..."
            />
          </div>

          <div className="admin-filters-group">
            <select
              className="admin-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="alphabetical">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {filteredUsers.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No Users Found</h3>
            <p>Try searching with another keyword or add a new customer user.</p>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate}>
              + Add User
            </button>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Username</th>
                  <th>Contact Info</th>
                  <th>City & Gender</th>
                  <th>Account Role</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.items.map((user) => (
                  <tr key={user.id || user._id}>
                    <td>
                      <div className="admin-item-cell">
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, rgb(235, 78, 98), #991b1b)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "16px",
                            flexShrink: 0,
                          }}
                        >
                          {(user.name || "U")[0].toUpperCase()}
                        </div>
                        <div className="admin-item-cell-info">
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code>@{user.username || "user"}</code>
                    </td>
                    <td>
                      <span>{user.mobile || "N/A"}</span>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-gray" style={{ marginRight: "4px" }}>
                        {user.city || "Rajkot"}
                      </span>
                      <small style={{ color: "var(--admin-text-muted)" }}>
                        {user.gender || "Other"}
                      </small>
                    </td>
                    <td>
                      {user.username === "admin" ? (
                        <span className="admin-badge admin-badge-red">Super Admin</span>
                      ) : (
                        <span className="admin-badge admin-badge-green">Customer</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="admin-actions-group" style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => openEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setDeleteTarget(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination-info">
              Showing <strong>{pagedUsers.startIndex}</strong> to <strong>{pagedUsers.endIndex}</strong> of{" "}
              <strong>{pagedUsers.totalItems}</strong> users
            </div>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              {Array.from({ length: pagedUsers.totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`admin-page-btn ${num === page ? "active" : ""}`}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="admin-page-btn"
                onClick={() => setPage((c) => Math.min(pagedUsers.totalPages, c + 1))}
                disabled={page === pagedUsers.totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Create / Edit Modal with Strict Form Validation */}
      {showEditor && (
        <AdminModal
          title={editingId ? "Edit User Account" : "Create New User Account"}
          onClose={closeEditor}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={closeEditor}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleSubmit}
              >
                {editingId ? "Save User Updates" : "Create User Account"}
              </button>
            </>
          }
        >
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Full Name <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.name ? "has-error" : ""}`}
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                  }}
                  placeholder="e.g. John Doe"
                />
                {formErrors.name && <span className="admin-field-error">{formErrors.name}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Username <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.username ? "has-error" : ""}`}
                  value={form.username}
                  onChange={(e) => {
                    setForm({ ...form, username: e.target.value });
                    if (formErrors.username) setFormErrors({ ...formErrors, username: "" });
                  }}
                  placeholder="e.g. johndoe"
                />
                {formErrors.username && (
                  <span className="admin-field-error">{formErrors.username}</span>
                )}
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Email Address <span className="admin-required-star">*</span>
                </label>
                <input
                  type="email"
                  className={`admin-input ${formErrors.email ? "has-error" : ""}`}
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                  }}
                  placeholder="e.g. john.doe@example.com"
                />
                {formErrors.email && <span className="admin-field-error">{formErrors.email}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Mobile (10 Digits) <span className="admin-required-star">*</span>
                </label>
                <input
                  type="tel"
                  className={`admin-input ${formErrors.mobile ? "has-error" : ""}`}
                  value={form.mobile}
                  onChange={(e) => {
                    setForm({ ...form, mobile: e.target.value });
                    if (formErrors.mobile) setFormErrors({ ...formErrors, mobile: "" });
                  }}
                  placeholder="e.g. 9876543210"
                />
                {formErrors.mobile && <span className="admin-field-error">{formErrors.mobile}</span>}
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Password {editingId ? "(Leave empty to keep existing)" : <span className="admin-required-star">*</span>}
                </label>
                <input
                  type="password"
                  className={`admin-input ${formErrors.password ? "has-error" : ""}`}
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (formErrors.password) setFormErrors({ ...formErrors, password: "" });
                  }}
                  placeholder={editingId ? "Enter new password if changing" : "Minimum 6 characters"}
                />
                {formErrors.password && (
                  <span className="admin-field-error">{formErrors.password}</span>
                )}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Gender <span className="admin-required-star">*</span>
                </label>
                <select
                  className="admin-input"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">
                City <span className="admin-required-star">*</span>
              </label>
              <input
                type="text"
                className={`admin-input ${formErrors.city ? "has-error" : ""}`}
                value={form.city}
                onChange={(e) => {
                  setForm({ ...form, city: e.target.value });
                  if (formErrors.city) setFormErrors({ ...formErrors, city: "" });
                }}
                placeholder="e.g. Rajkot, Ahmedabad, Mumbai"
              />
              {formErrors.city && <span className="admin-field-error">{formErrors.city}</span>}
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          title="Confirm User Account Deletion"
          size="sm"
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleDelete}
              >
                Yes, Delete User
              </button>
            </>
          }
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "15px", color: "var(--admin-text-main)", marginBottom: "10px" }}>
              Are you sure you want to permanently delete user account:
            </p>
            <strong style={{ fontSize: "17px", color: "var(--admin-red-primary)" }}>
              {deleteTarget.name} ({deleteTarget.email})
            </strong>
            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "10px" }}>
              This action cannot be undone.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Clear All Confirmation Modal */}
      {clearOpen && (
        <AdminModal
          title="Clear All Users"
          size="sm"
          onClose={() => setClearOpen(false)}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setClearOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleClear}
              >
                Confirm Clear All
              </button>
            </>
          }
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "15px", color: "var(--admin-danger)", fontWeight: "700" }}>
              Warning: You are about to clear all registered users!
            </p>
            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
              All customer logins and profiles will be erased.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Toast */}
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </div>
  );
}

export default AdminUsers;
