"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { signInUser, logUserActivity } from "@/lib/supabase"
import type { User } from "@/lib/supabase"
import { SessionManager } from "./session-manager"

type AuthContextType = {
  user: User | null
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; remainingAttempts?: number }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const result = await signInUser(username, password)

      if (result.success) {
        const userSession: User = {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          full_name: result.user.full_name,
          phone: result.user.phone,
          role: result.user.role,
        }
        setUser(userSession)
        localStorage.setItem("user", JSON.stringify(userSession))
        return { success: true }
      } else {
        return {
          success: false,
          error: result.error,
          remainingAttempts: result.remainingAttempts,
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Authentication service unavailable" }
    }
  }

  const logout = () => {
    if (user) {
      logUserActivity(user.id, user.username, "LOGOUT", "AUTH", user.id)
    }
    setUser(null)
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <SessionManager />
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
