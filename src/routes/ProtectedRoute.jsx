import {
  Navigate,
} from 'react-router-dom'

import {
  useAuth,
} from '../features/auth/hooks/useAuth'


export default function ProtectedRoute({
  children,
}) {

  const {
    isAuthenticated,
    loading,
  } =
    useAuth()


  // =========================================================
  // CARREGANDO SESSÃO
  // =========================================================

  if (loading) {

    return (
      <main className="point-loading-page">

        <span className="point-loading-spinner" />

        <strong>
          Carregando...
        </strong>

      </main>
    )

  }


  // =========================================================
  // NÃO AUTENTICADO
  // =========================================================

  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"
        replace
      />
    )

  }


  // =========================================================
  // AUTENTICADO
  // =========================================================

  return children
}