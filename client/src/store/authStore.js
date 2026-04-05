import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/axios.js'

const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            isAuthenticated: false,
            isLoading: true,
            accessToken: null,

            // Getters
            getUserRole: () => get().user?.role || null,
            getWalletBalance: () => get().user?.walletBalance || 0,
            isAdmin: () => get().user?.role === 'admin',
            isVendor: () => get().user?.role === 'vendor',
            isCustomer: () => get().user?.role === 'customer',

            // Actions
            setUser: (userData) => set({
                user: userData,
                isAuthenticated: !!userData,
            }),

            setAccessToken: (token) => {
                window.__accessToken = token
                set({ accessToken: token })
            },

            login: (userData, token) => {
                window.__accessToken = token
                set({
                    user: userData,
                    isAuthenticated: true,
                    accessToken: token,
                    isLoading: false,
                })
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout')
                } catch (err) {
                    console.error('Logout error:', err)
                } finally {
                    window.__accessToken = null
                    set({
                        user: null,
                        isAuthenticated: false,
                        accessToken: null,
                        isLoading: false,
                    })
                }
            },

            // Restore session on app mount
            restoreSession: async () => {
                set({ isLoading: true })
                try {
                    const res = await api.post('/auth/refresh-token')
                    const { accessToken, user } = res.data.data
                    window.__accessToken = accessToken
                    set({
                        user,
                        isAuthenticated: true,
                        accessToken,
                        isLoading: false,
                    })
                } catch (err) {
                    window.__accessToken = null
                    set({
                        user: null,
                        isAuthenticated: false,
                        accessToken: null,
                        isLoading: false,
                    })
                }
            },

            // Update user data (e.g., after profile update)
            updateUser: (updates) => set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null,
            })),

            // Update wallet balance
            updateWalletBalance: (amount) => set((state) => ({
                user: state.user
                    ? { ...state.user, walletBalance: (state.user.walletBalance || 0) + amount }
                    : null,
            })),

            // Set loading state
            setLoading: (loading) => set({ isLoading: loading }),

            // Clear auth state
            clearAuth: () => {
                window.__accessToken = null
                set({
                    user: null,
                    isAuthenticated: false,
                    accessToken: null,
                    isLoading: false,
                })
            },
        }),
        {
            name: 'xconnect-auth-storage',
            partialize: (state) => ({
                // Only persist these fields
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)

export default useAuthStore
