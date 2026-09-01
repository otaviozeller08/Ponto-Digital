import {
  Navigate,
  createBrowserRouter,
} from 'react-router-dom'

import LoginPage from '../features/auth/pages/LoginPage'

import DashboardFuncionarioPage from '../features/ponto/pages/DashboardFuncionarioPage'

import EmployeeAdjustmentsPage from '../features/adjustments/pages/EmployeeAdjustmentsPage'

import LocaisPage from '../features/locais/pages/LocaisPage'

import RHDashboardPage from '../features/rh/pages/RHDashboardPage'

import RHAssignmentsPage from '../features/rh/pages/RHAssignmentsPage'

import RHEmployeesPage from '../features/rh/pages/RHEmployeesPage'

import RHEmployeeDetailPage from '../features/rh/pages/RHEmployeeDetailPage'

import RHEmployeeHistoryPage from '../features/rh/pages/RHEmployeeHistoryPage'

import RHAdjustmentsPage from '../features/adjustments/pages/RHAdjustmentsPage'

import PublicRoute from '../routes/PublicRoute'

import ProtectedRoute from '../routes/ProtectedRoute'

import RoleRoute from '../routes/RoleRoute'


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
      path: '/app/ajustes',

      element: (
        <ProtectedRoute>
          <EmployeeAdjustmentsPage />
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
      path: '/rh/funcionarios',

      element: (
        <RoleRoute
          allowedRoles={[
            'rh',
            'admin',
          ]}
        >
          <RHEmployeesPage />
        </RoleRoute>
      ),
    },


    {
      path:
        '/rh/funcionarios/:employeeId',

      element: (
        <RoleRoute
          allowedRoles={[
            'rh',
            'admin',
          ]}
        >
          <RHEmployeeDetailPage />
        </RoleRoute>
      ),
    },


    {
      path:
        '/rh/funcionarios/:employeeId/historico',

      element: (
        <RoleRoute
          allowedRoles={[
            'rh',
            'admin',
          ]}
        >
          <RHEmployeeHistoryPage />
        </RoleRoute>
      ),
    },


    {
      path: '/rh/alocacoes',

      element: (
        <RoleRoute
          allowedRoles={[
            'rh',
            'admin',
          ]}
        >
          <RHAssignmentsPage />
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
      path: '/rh/ajustes',

      element: (
        <RoleRoute
          allowedRoles={[
            'rh',
            'admin',
          ]}
        >
          <RHAdjustmentsPage />
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