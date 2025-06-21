"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseStatus } from "@/lib/supabase"
import { ThemeToggle } from "@/components/theme-toggle"
import { Eye, EyeOff, Lock, User, AlertCircle, Database, ArrowRight, Shield } from "lucide-react"

export default function SignInPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState({ configured: false })
  const { login, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
    setSupabaseStatus(getSupabaseStatus())
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setRemainingAttempts(null)

    if (!username.trim()) {
      setError("Username tidak boleh kosong")
      return
    }

    if (!password.trim()) {
      setError("Password tidak boleh kosong")
      return
    }

    if (username.length < 3) {
      setError("Username minimal 3 karakter")
      return
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter")
      return
    }

    setLoading(true)

    try {
      const result = await login(username.trim(), password)
      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Login failed")
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts)
        }
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Terjadi kesalahan saat login. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        {!supabaseStatus.configured && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
              <Database className="h-4 w-4 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium">Demo Mode</h3>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Using mock data. Configure Supabase for full functionality.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 dark:bg-gray-100 rounded-lg mb-4">
            <Lock className="w-6 h-6 text-white dark:text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Sign in to your account to continue</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2.5 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 px-4 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-gray-900 border-t-transparent"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
