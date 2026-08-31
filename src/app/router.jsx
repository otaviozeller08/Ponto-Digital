import {
  Navigate,
  createBrowserRouter,
} from 'react-router-dom'

import LoginPage from '../features/auth/pages/LoginPage'

import DashboardFuncionarioPage from '../features/ponto/pages/DashboardFuncionarioPage'

import LocaisPage from '../features/locais/pages/LocaisPage'

import ProtectedRoute from '../routes/ProtectedRoute'
import PublicRoute from '../routes/PublicRoute'

export const router =
  createBrowserRouter([
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
      path: '/rh/locais',
      element: (
        <ProtectedRoute>
          <LocaisPage />
        </ProtectedRoute>
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