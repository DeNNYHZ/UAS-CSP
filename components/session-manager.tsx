"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "./auth-provider"
import { updateUserActivity, SESSION_TIMEOUT } from "@/lib/supabase"

export function SessionManager() {
  const { user, logout } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (user) {
        alert("Your session has expired due to inactivity. You will be logged out.")
        logout()
      }
    }, SESSION_TIMEOUT)
  }

  const handleActivity = () => {
    const now = Date.now()

    if (now - lastActivityRef.current > 30000) {
      lastActivityRef.current = now

      if (user) {
        updateUserActivity(user.id)
      }
    }

    resetTimeout()
  }

  useEffect(() => {
    if (!user) return

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
    })

    resetTimeout()

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true)
      })

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [user])

  return null
}
