import {
  Navigate,
} from 'react-router-dom'

import {
  useAuth,
} from '../features/auth/hooks/useAuth'


export default function RoleRoute({
  children,
  allowedRoles = [],
}) {

  const {
    profile,
    loading,
    isAuthenticated,
  } =
    useAuth()


  if (loading) {

    return (
      <main className="point-loading-page">

        <span className="point-loading-spinner" />

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


  if (
    !allowedRoles.includes(
      profile?.role
    )
  ) {

    return (
      <Navigate
        to="/app"
        replace
      />
    )

  }


  return children
}