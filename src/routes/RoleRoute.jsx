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


  // =========================================================
  // CARREGANDO SESSÃO / PERFIL
  // =========================================================

  if (loading) {

    return (
      <main className="point-loading-page">

        <span className="point-loading-spinner" />

        <strong>
          Verificando permissões...
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
  // PERFIL NÃO ENCONTRADO
  //
  // Nunca liberamos uma área protegida sem saber
  // qual é a função real do usuário.
  // =========================================================

  if (!profile?.role) {

    return (
      <Navigate
        to="/app"
        replace
      />
    )

  }


  // =========================================================
  // ROLE NÃO AUTORIZADA
  // =========================================================

  if (
    !allowedRoles.includes(
      profile.role
    )
  ) {

    return (
      <Navigate
        to="/app"
        replace
      />
    )

  }


  // =========================================================
  // ACESSO AUTORIZADO
  // =========================================================

  return children
}