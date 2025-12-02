import { User, api } from "@/lib/api"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await api.login({ email, password })
          api.setToken(response.token)
          set({ user: response.user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true })
        try {
          const response = await api.register({ email, password, name })
          api.setToken(response.token)
          set({ user: response.user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        api.setToken(null)
        set({ user: null, isAuthenticated: false })
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      setToken: async (token) => {
        api.setToken(token)
        set({ isAuthenticated: true, isLoading: true })
        try {
          const user = await api.getMe()
          set({ user, isLoading: false })
        } catch {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)


