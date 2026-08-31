import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/hooks/useAuth'

export default function PublicRoute({
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

  if (isAuthenticated) {
    return (
      <Navigate
        to="/app"
        replace
      />
    )
  }

  return children
}