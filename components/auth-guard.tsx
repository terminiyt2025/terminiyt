"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}

export function AuthGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
  redirectTo = "/identifikohu",
}: AuthGuardProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      console.log("[v0] Auth required, redirecting to login")
      router.push(redirectTo)
      return
    }

    if (requireAdmin && (!isAuthenticated || user?.role !== "admin")) {
      console.log("[v0] Admin access required, redirecting")
      router.push("/")
      return
    }
  }, [isAuthenticated, user, requireAuth, requireAdmin, router, redirectTo])

  if (requireAuth && !isAuthenticated) {
    return <div>Redirecting to login...</div>
  }

  if (requireAdmin && (!isAuthenticated || user?.role !== "admin")) {
    return <div>Access denied. Redirecting...</div>
  }

  return <>{children}</>
}
