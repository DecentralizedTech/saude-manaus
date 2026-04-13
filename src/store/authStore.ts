import { create } from 'zustand'
import { Usuario } from '../types'
import api from '../lib/api'

interface AuthState {
  usuario: Usuario | null
  token: string | null
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: (() => { try { return JSON.parse(localStorage.getItem('usuario') || 'null') } catch { return null } })(),
  token: localStorage.getItem('token'),

  loginWithGoogle: async (credential: string) => {
    const { data } = await api.post('/auth?action=social', { credential })
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    set({ token: data.token, usuario: data.usuario })
  },

  logout: () => {
    // Revoga sessão Google para forçar re-seleção de conta no próximo login
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect()
    }
    localStorage.clear()
    set({ token: null, usuario: null })
  },

  isAuthenticated: () => !!get().token,
}))
