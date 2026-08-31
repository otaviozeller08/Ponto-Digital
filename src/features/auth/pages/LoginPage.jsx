import {
  BarChart3,
  Clock3,
  Fingerprint,
  MapPin,
} from 'lucide-react'

import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  return (
    <main className="login-page">
      <div
        className="
          login-decoration
          login-decoration--top
        "
        aria-hidden="true"
      />

      <div
        className="
          login-decoration
          login-decoration--bottom
        "
        aria-hidden="true"
      />

      <section className="login-shell">
        <header className="login-brand">
          <div
            className="login-brand__logo"
            aria-hidden="true"
          >
            <Clock3
              size={60}
              strokeWidth={2}
            />

            <span className="login-brand__dot" />
          </div>

          <h1>
            Ponto Digital
          </h1>

          <p>
            Seu ponto, com segurança
            e praticidade.
          </p>
        </header>

        <section className="login-card">
          <header className="login-card__header">
            <h2>
              Acesse sua conta
            </h2>

            <p>
              Entre com suas
              credenciais para
              continuar
            </p>
          </header>

          <LoginForm />

          <div className="login-divider">
            <span />

            <p>
              ou continue com
            </p>

            <span />
          </div>

          <button
            type="button"
            className="google-button"
            disabled
            title="Login Google será habilitado futuramente."
          >
            <span className="google-button__icon">
              G
            </span>

            Continuar com Google
          </button>
        </section>

        <section className="login-benefits">
          <article className="login-benefit">
            <div className="login-benefit__icon">
              <Fingerprint
                size={26}
                strokeWidth={1.9}
              />
            </div>

            <div>
              <strong>
                Reconhecimento Facial
              </strong>

              <span>
                Mais segurança no
                registro do seu ponto.
              </span>
            </div>
          </article>

          <article className="login-benefit">
            <div className="login-benefit__icon">
              <MapPin
                size={26}
                strokeWidth={1.9}
              />
            </div>

            <div>
              <strong>
                Geolocalização
              </strong>

              <span>
                Registro com validação
                de localização.
              </span>
            </div>
          </article>

          <article className="login-benefit">
            <div className="login-benefit__icon">
              <BarChart3
                size={26}
                strokeWidth={1.9}
              />
            </div>

            <div>
              <strong>
                Relatórios para RH
              </strong>

              <span>
                Acompanhe horários e
                registros.
              </span>
            </div>
          </article>
        </section>

        <footer className="login-footer">
          <p>
            © {new Date().getFullYear()}
            {' '}
            Ponto Digital.
            Todos os direitos reservados.
          </p>

          <a href="/privacy">
            Política de Privacidade
          </a>
        </footer>
      </section>
    </main>
  )
}