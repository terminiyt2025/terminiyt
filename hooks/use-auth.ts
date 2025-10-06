"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin"
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user: User) => {
        console.log("[v0] User logged in:", user)
        set({ user, isAuthenticated: true })
      },
      logout: () => {
        console.log("[v0] User logged out")
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)
