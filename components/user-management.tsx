"use client"

import { useState, useEffect } from "react"
import { getUsers, addUser, updateUser, deleteUser, getUserActivityLogs, getLoginHistory } from "@/lib/supabase"
import type { User, UserActivityLog, LoginHistory } from "@/lib/supabase"
import { Plus, Edit, Trash2, Shield, UserIcon, Clock, Activity, X, CheckCircle, AlertCircle } from "lucide-react"

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [isLoginHistoryDialogOpen, setIsLoginHistoryDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    full_name: "",
    phone: "",
    role: "user" as "user" | "admin",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const result = await getUsers()
      if (result.success) {
        setUsers(result.data || [])
      } else {
        setError(result.error || "")
      }
    } catch (err) {
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const fetchActivityLogs = async (userId?: string) => {
    try {
      const result = await getUserActivityLogs(userId, 100)
      if (result.success) {
        setActivityLogs(result.data || [])
      }
    } catch (err) {
      console.error("Failed to load activity logs:", err)
    }
  }

  const fetchLoginHistory = async (userId?: string) => {
    try {
      const result = await getLoginHistory(userId, 100)
      if (result.success) {
        setLoginHistory(result.data || [])
      }
    } catch (err) {
      console.error("Failed to load login history:", err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchActivityLogs()
    fetchLoginHistory()
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.username.trim()) errors.username = "Username is required"
    if (!formData.email.trim()) errors.email = "Email is required"
    if (!formData.full_name.trim()) errors.full_name = "Full name is required"
    if (isAddDialogOpen && !formData.password.trim()) errors.password = "Password is required"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdd = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await addUser({
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
      })

      if (result.success) {
        await fetchUsers()
        setFormData({ username: "", password: "", email: "", full_name: "", phone: "", role: "user" })
        setFormErrors({})
        setIsAddDialogOpen(false)
        setSuccess("User added successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.error || "")
      }
    } catch (err) {
      setError("Failed to add user")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: "",
      email: user.email || "",
      full_name: user.full_name || "",
      phone: user.phone || "",
      role: user.role,
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || !selectedUser) return

    setLoading(true)
    try {
      const result = await updateUser(selectedUser.id, {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
      })

      if (result.success) {
        await fetchUsers()
        setSelectedUser(null)
        setFormData({ username: "", password: "", email: "", full_name: "", phone: "", role: "user" })
        setFormErrors({})
        setIsEditDialogOpen(false)
        setSuccess("User updated successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.error || "")
      }
    } catch (err) {
      setError("Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) return

    setLoading(true)
    try {
      const result = await deleteUser(user.id)
      if (result.success) {
        await fetchUsers()
        setSuccess("User deleted successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.error || "")
      }
    } catch (err) {
      setError("Failed to delete user")
    } finally {
      setLoading(false)
    }
  }

  const showUserActivity = async (user: User) => {
    setSelectedUser(user)
    await fetchActivityLogs(user.id)
    setIsActivityDialogOpen(true)
  }

  const showLoginHistory = async (user: User) => {
    setSelectedUser(user)
    await fetchLoginHistory(user.id)
    setIsLoginHistoryDialogOpen(true)
  }

  const closeModal = () => {
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setIsActivityDialogOpen(false)
    setIsLoginHistoryDialogOpen(false)
    setSelectedUser(null)
    setFormData({ username: "", password: "", email: "", full_name: "", phone: "", role: "user" })
    setFormErrors({})
    setError("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-4 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-4 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">User Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage system users and their permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchUsers();
              fetchActivityLogs();
              fetchLoginHistory();
            }}
            disabled={loading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19.364A9 9 0 104.582 9.582" /></svg>
          </button>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200 transition-all duration-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.full_name || user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300"
                          : "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {user.role === "admin" ? (
                        <Shield className="w-3 h-3 mr-1" />
                      ) : (
                        <UserIcon className="w-3 h-3 mr-1" />
                      )}
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_locked
                          ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                          : "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                      }`}
                    >
                      {user.is_locked ? "Locked" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.last_login ? formatDate(user.last_login) : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => showUserActivity(user)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded"
                        title="View Activity"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => showLoginHistory(user)}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded"
                        title="Login History"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 p-1 rounded"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add New User
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">User Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.username ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="Enter username"
                  />
                  {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.password ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="Enter password"
                  />
                  {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.email ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="Enter email"
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.full_name ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="e.g., John Doe"
                  />
                  {formErrors.full_name && <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., +1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "user" | "admin" })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={loading}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 flex-1 py-3 px-4 rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={loading}
                className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200 transition-all duration-200 active:scale-[0.98] flex-1 py-3 px-4 rounded-xl font-semibold text-sm disabled:opacity-50 shadow-md"
              >
                {loading
                  ? "Adding..."
                  : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit User
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">User Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.username ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="Enter username"
                  />
                  {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.password ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="Leave blank to keep current password"
                  />
                  {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.email ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="Enter email"
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.full_name ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="e.g., John Doe"
                  />
                  {formErrors.full_name && <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., +1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "user" | "admin" })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={loading}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 flex-1 py-3 px-4 rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200 transition-all duration-200 active:scale-[0.98] flex-1 py-3 px-4 rounded-xl font-semibold text-sm disabled:opacity-50 shadow-md"
              >
                {loading
                  ? "Updating..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isActivityDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Activity Log: {selectedUser.username}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2">Timestamp</th>
                    <th className="px-4 py-2">Activity Type</th>
                    <th className="px-4 py-2">Entity</th>
                    <th className="px-4 py-2">Entity ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activityLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2">{log.created_at ? formatDate(log.created_at) : "N/A"}</td>
                      <td className="px-4 py-2">{log.action}</td>
                      <td className="px-4 py-2">{log.resource_type}</td>
                      <td className="px-4 py-2">{log.resource_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isLoginHistoryDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Login History: {selectedUser.username}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2">Timestamp</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">IP Address</th>
                    <th className="px-4 py-2">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loginHistory.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2">{log.created_at ? formatDate(log.created_at) : "N/A"}</td>
                      <td className="px-4 py-2">{log.success ? "Success" : "Failed"}</td>
                      <td className="px-4 py-2">{log.ip_address}</td>
                      <td className="px-4 py-2 truncate max-w-xs">{log.user_agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
