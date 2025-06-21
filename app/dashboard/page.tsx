"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { ProductTable } from "@/components/product-table"
import { UserManagement } from "@/components/user-management"
import { StockMovementHistory } from "@/components/stock-movement-history"
import { ThemeToggle } from "@/components/theme-toggle"
import { PWAInstall } from "@/components/pwa-install"
import { getProducts, getSupabaseStatus, getLowStockProducts, logUserActivity, getUsers } from "@/lib/supabase"
import {
  LogOut,
  User,
  Shield,
  Package,
  DollarSign,
  Users,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  History,
  UserCheck,
} from "lucide-react"

type Statistics = {
  totalProducts: number
  totalRevenue: number
  activeUsers: number
  lowStockProducts: number
  averagePrice: number
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [stats, setStats] = useState<Statistics>({
    totalProducts: 0,
    totalRevenue: 0,
    activeUsers: 0,
    lowStockProducts: 0,
    averagePrice: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [supabaseStatus, setSupabaseStatus] = useState({ configured: false })
  const [lowStockCount, setLowStockCount] = useState(0)

  const fetchStatistics = async () => {
    setLoading(true)
    setError("")

    try {
      const result = await getProducts()
      const usersResult = await getUsers()
      let usersCount = 0
      if (usersResult.success) {
        usersCount = usersResult.data.length
      }

      if (result.success) {
        const products = result.data ?? []

        const totalProducts = products.length
        const totalRevenue = products.reduce((sum, product) => sum + product.harga_satuan * product.quantity, 0)
        const lowStockProducts = getLowStockProducts(products)
        const lowStockCount = lowStockProducts.length
        const totalItems = products.reduce((sum, product) => sum + product.quantity, 0)
        const averagePrice = totalItems > 0 ? totalRevenue / totalItems : 0

        setStats({
          totalProducts,
          totalRevenue,
          activeUsers: usersCount,
          lowStockProducts: lowStockCount,
          averagePrice,
        })
        setLowStockCount(lowStockCount)
      } else {
        setError(result.error ?? "Unknown error")
      }
    } catch (err) {
      setError("Failed to load statistics")
      console.error("Statistics error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSupabaseStatus(getSupabaseStatus())
    fetchStatistics()

    if (user) {
      logUserActivity(user.id, user.username, "DASHBOARD_ACCESS", "DASHBOARD")
    }
  }, [user])

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const statsData = [
    ...(user?.role === "admin"
      ? [
          {
            title: "Total Products",
            value: loading ? "..." : stats.totalProducts.toString(),
            icon: Package,
            description: "Products in inventory",
            color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
          },
          {
            title: "Total Revenue",
            value: loading ? "..." : formatCurrency(stats.totalRevenue),
            icon: DollarSign,
            description: "Total inventory value",
            color: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
          },
          {
            title: "Total Users",
            value: loading ? "..." : stats.activeUsers.toString(),
            icon: Users,
            description: "Registered users",
            color: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
          },
          {
            title: "Warning Stock Items",
            value: loading ? "..." : stats.lowStockProducts.toString(),
            icon: AlertTriangle,
            change: "< 10 units",
            changeIcon: AlertTriangle,
            changeColor: "text-orange-600 dark:text-orange-400",
            description: "Items need restocking",
            color: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
          },
        ]
      : []),
  ]

  const adminTabs = [
    { id: "dashboard", label: "Dashboard", icon: Package },
    { id: "users", label: "User Management", icon: UserCheck },
    { id: "stock-history", label: "Stock History", icon: History },
  ]

  const userTabs = [{ id: "dashboard", label: "Dashboard", icon: Package }]

  const tabs = user?.role === "admin" ? adminTabs : userTabs

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${user?.role === "admin" ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"}`}
                >
                  {user?.role === "admin" ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Welcome, {user?.username}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user?.role === "admin" ? "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300" : "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"}`}
                    >
                      {user?.role?.toUpperCase()}
                    </span>
                    {user?.role === "admin"
                      ? "Product Management Dashboard"
                      : "Product Dashboard"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {activeTab === "dashboard" && (
                  <button
                    onClick={fetchStatistics}
                    disabled={loading}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh data"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>

            <div className="flex space-x-8 -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
          {activeTab === "dashboard" && (
            <>
              {!supabaseStatus.configured && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Configuration Required</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Please configure your Supabase environment variables for full functionality.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-700 dark:text-red-300">Error loading statistics: {error}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg group-hover:scale-105 transition-transform ${stat.color}`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                      <TrendingUp className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.title}</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1 break-all">
                        {loading ? (
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded loading-shimmer animate-pulse"></div>
                        ) : (
                          stat.value
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {!loading && user?.role === "admin" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-200 dark:bg-blue-800 rounded-full">
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Pemberitahuan</h3>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                      <p>
                          • <strong>Warning Stock Items:</strong> Peringatan stok diberikan dengan kriteria berikut:
                        </p>
                        <ul className="ml-4 list-disc text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                          <li><strong>Out of stock</strong>: = 0</li>
                          <li><strong>Critical low stock</strong>: &lt;= 3</li>
                          <li><strong>Low stock warning</strong>: &lt;= 5</li>
                          <li><strong>Stock running low</strong>: &lt;= 10</li>
                          <li><strong>Tidak ada peringatan</strong>: &gt;= 10</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {user?.role === "admin" ? "Product Management" : "Product Catalog"}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {user?.role === "admin"
                          ? "Manage your products with full CRUD operations"
                          : "Browse and view available products"}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ProductTable onDataChange={fetchStatistics} />
                </div>
              </div>
            </>
          )}

          {activeTab === "users" && user?.role === "admin" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Management</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Manage system users, view activity logs, and monitor login history
                    </p>
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <UserCheck className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <UserManagement />
              </div>
            </div>
          )}

          {activeTab === "stock-history" && user?.role === "admin" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Stock Movement History</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Track all inventory changes and stock movements
                    </p>
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <StockMovementHistory />
              </div>
            </div>
          )}
        </main>

        <PWAInstall />
      </div>
    </ProtectedRoute>
  )
}
