import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/hooks/useAuth'

export default function ProtectedRoute({
  children,
}) {
  const {
    isAuthenticated,
    loading,
  } = useAuth()

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        Carregando...
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return children
}