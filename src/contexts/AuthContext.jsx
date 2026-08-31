import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

import {
  getProfile,
  signIn as signInService,
  signOut as signOutService,
} from '../features/auth/services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const loadProfile = useCallback(
    async currentUser => {
      if (!currentUser?.id) {
        setProfile(null)

        return null
      }

      const profileData =
        await getProfile(currentUser.id)

      setProfile(profileData)

      return profileData
    },
    []
  )

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        setLoading(true)
        setAuthError(null)

        const {
          data,
          error,
        } =
          await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!mounted) {
          return
        }

        const currentSession =
          data.session

        setSession(currentSession)

        setUser(
          currentSession?.user ?? null
        )

        if (currentSession?.user) {
          await loadProfile(
            currentSession.user
          )
        }
      } catch (error) {
        console.error(
          'Erro ao inicializar autenticação:',
          error
        )

        if (mounted) {
          setAuthError(
            'Não foi possível carregar sua sessão.'
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          currentSession
        ) => {
          if (!mounted) {
            return
          }

          setSession(currentSession)

          setUser(
            currentSession?.user ??
              null
          )

          if (currentSession?.user) {
            try {
              await loadProfile(
                currentSession.user
              )
            } catch (error) {
              console.error(
                'Erro ao carregar profile:',
                error
              )
            }
          } else {
            setProfile(null)
          }

          setLoading(false)
        }
      )

    return () => {
      mounted = false

      subscription.unsubscribe()
    }
  }, [loadProfile])

  async function login(
    email,
    password
  ) {
    try {
      setLoading(true)
      setAuthError(null)

      const data =
        await signInService(
          email,
          password
        )

      setSession(data.session)
      setUser(data.user)

      if (data.user) {
        await loadProfile(data.user)
      }

      return data
    } catch (error) {
      console.error(
        'Erro no login:',
        error
      )

      let message =
        'Não foi possível entrar.'

      if (
        error.message ===
        'Invalid login credentials'
      ) {
        message =
          'E-mail ou senha incorretos.'
      }

      if (
        error.message ===
        'Email not confirmed'
      ) {
        message =
          'Seu e-mail ainda não foi confirmado.'
      }

      setAuthError(message)

      throw error
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      setLoading(true)

      await signOutService()

      setSession(null)
      setUser(null)
      setProfile(null)
      setAuthError(null)
    } catch (error) {
      console.error(
        'Erro ao sair:',
        error
      )

      throw error
    } finally {
      setLoading(false)
    }
  }

  const isAuthenticated =
    Boolean(session?.user)

  const isAdmin =
    profile?.role === 'admin'

  const isRH =
    profile?.role === 'rh' ||
    profile?.role === 'admin'

  const isEmployee =
    profile?.role === 'employee'

  const value = useMemo(
    () => ({
      user,
      session,
      profile,

      loading,
      authError,

      isAuthenticated,
      isAdmin,
      isRH,
      isEmployee,

      login,
      logout,
      loadProfile,
    }),
    [
      user,
      session,
      profile,
      loading,
      authError,
      isAuthenticated,
      isAdmin,
      isRH,
      isEmployee,
      loadProfile,
    ]
  )

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}