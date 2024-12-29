import { create } from 'zustand'

interface AuthState {
  token: string | null
  user: any | null
  setAuth: (token: string, user: any) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuth = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  
  setAuth: (token: string, user: any) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },
  
  clearAuth: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },
  
  isAuthenticated: () => {
    return !!get().token
  }
}))