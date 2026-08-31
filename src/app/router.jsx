import {
  Navigate,
  createBrowserRouter,
} from 'react-router-dom'

import LoginPage from '../features/auth/pages/LoginPage'
import DashboardFuncionarioPage from '../features/ponto/pages/DashboardFuncionarioPage'
import LocaisPage from '../features/locais/pages/LocaisPage'
import RHDashboardPage from '../features/rh/pages/RHDashboardPage'

import PublicRoute from '../routes/PublicRoute'
import ProtectedRoute from '../routes/ProtectedRoute'
import RoleRoute from '../routes/RoleRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Navigate
        to="/login"
        replace
      />
    ),
  },

  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },

  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <DashboardFuncionarioPage />
      </ProtectedRoute>
    ),
  },

  {
    path: '/rh',
    element: (
      <RoleRoute
        allowedRoles={[
          'rh',
          'admin',
        ]}
      >
        <RHDashboardPage />
      </RoleRoute>
    ),
  },

  {
    path: '/rh/locais',
    element: (
      <RoleRoute
        allowedRoles={[
          'rh',
          'admin',
        ]}
      >
        <LocaisPage />
      </RoleRoute>
    ),
  },

  {
    path: '*',
    element: (
      <Navigate
        to="/login"
        replace
      />
    ),
  },
])