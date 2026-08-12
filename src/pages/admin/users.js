import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  role: 'user',
  password: '',
  isActive: true,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editUser, setEditUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setUsers(data.users || []);
        setError(null);
      } else {
        setError(data.message || 'Unable to load users');
      }
    } catch (err) {
      console.error('Fetch users failed:', err);
      setError(err?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || (!editUser && !form.password)) {
      setError('Name, email, and password are required for a new user.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editUser ? `/api/admin/users/${editUser._id}` : '/api/admin/users';
      const method = editUser ? 'PUT' : 'POST';
      const body = editUser
        ? {
            name: form.name,
            phone: form.phone,
            role: form.role,
            isActive: form.isActive,
          }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone,
            role: form.role,
            isActive: form.isActive,
          };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        resetForm();
        setRefreshKey((prev) => prev + 1);
      } else {
        setError(data.message || 'Unable to save user');
      }
    } catch (err) {
      console.error('Save user failed:', err);
      setError(err?.message || 'Unable to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      password: '',
      isActive: user.isActive ?? true,
    });
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRefreshKey((prev) => prev + 1);
      } else {
        setError(data.message || 'Unable to delete user');
      }
    } catch (err) {
      console.error('Delete user failed:', err);
      setError(err?.message || 'Unable to delete user');
    }
  };

  const openPasswordModal = (user) => {
    setPasswordUser(user);
    setPasswordValue('');
  };

  const handlePasswordUpdate = async () => {
    if (!passwordUser || !passwordValue || passwordValue.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: passwordUser._id, newPassword: passwordValue }),
      });
      const data = await res.json();

      if (data.success) {
        setPasswordUser(null);
        setPasswordValue('');
        setError(null);
      } else {
        setError(data.message || 'Unable to update password');
      }
    } catch (err) {
      console.error('Password update failed:', err);
      setError(err?.message || 'Unable to update password');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Create, edit, delete users and reset passwords from the admin panel.
          </p>
        </div>

        {error && (
          <div className="card p-5 bg-red-50 text-red-700">{error}</div>
        )}

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editUser ? 'Edit User' : 'Add New User'}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={!!editUser}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="text"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {!editUser && (
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                id="userActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <label htmlFor="userActive" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
              </button>
              {editUser && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Users</h2>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setRefreshKey((prev) => prev + 1)}
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No users found.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.isActive ? 'Active' : 'Inactive'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{new Date(user.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openPasswordModal(user)}
                        >
                          Change Password
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDelete(user)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {passwordUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setPasswordUser(null)}
                >
                  Close
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Set a new password for {passwordUser.email}</p>
              <div className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPasswordUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePasswordUpdate}
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
