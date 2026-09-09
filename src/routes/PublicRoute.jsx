import {
  Navigate,
} from 'react-router-dom'

import {
  useAuth,
} from '../features/auth/hooks/useAuth'


export default function PublicRoute({
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
  // USUÁRIO JÁ AUTENTICADO
  // =========================================================

  if (isAuthenticated) {

    return (
      <Navigate
        to="/app"
        replace
      />
    )

  }


  // =========================================================
  // ROTA PÚBLICA LIBERADA
  // =========================================================

  return children
}