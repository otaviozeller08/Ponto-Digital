import { LogOut, ShieldCheck } from 'lucide-react'

import { useAuth } from '../../auth/hooks/useAuth'

export default function DashboardFuncionarioPage() {
  const {
    profile,
    user,
    logout,
  } = useAuth()

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#f8fafc',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '32px',
          background: '#ffffff',
          borderRadius: '24px',
          textAlign: 'center',
          boxShadow:
            '0 20px 60px rgba(15,23,42,.08)',
        }}
      >
        <ShieldCheck
          size={54}
          color="#16a34a"
          style={{
            margin: '0 auto 16px',
          }}
        />

        <h1>
          Sistema conectado 🔥
        </h1>

        <p>
          {profile?.full_name ||
            'Usuário'}
        </p>

        <p>
          {user?.email}
        </p>

        <p>
          Permissão:{' '}
          <strong>
            {profile?.role}
          </strong>
        </p>

        <button
          type="button"
          onClick={logout}
          style={{
            width: '100%',
            minHeight: '48px',
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: 0,
            borderRadius: '14px',
            cursor: 'pointer',
          }}
        >
          <LogOut size={19} />
          Sair
        </button>
      </section>
    </main>
  )
}