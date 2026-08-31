import {
  useEffect,
  useState,
} from 'react'

import {
  Mail,
} from 'lucide-react'

import Button from '../../../components/ui/Button'
import Checkbox from '../../../components/ui/Checkbox'
import Input from '../../../components/ui/Input'

import PasswordField from './PasswordField'

import { useAuth } from '../hooks/useAuth'

const REMEMBER_EMAIL_KEY =
  'ponto-digital-remembered-email'

export default function LoginForm() {
  const {
    login,
    loading,
    authError,
  } = useAuth()

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [remember, setRemember] =
    useState(true)

  const [errors, setErrors] =
    useState({})

  useEffect(() => {
    const savedEmail =
      localStorage.getItem(
        REMEMBER_EMAIL_KEY
      )

    if (savedEmail) {
      setEmail(savedEmail)
      setRemember(true)
    }
  }, [])

  function validate() {
    const nextErrors = {}

    if (!email.trim()) {
      nextErrors.email =
        'Digite seu e-mail.'
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      nextErrors.email =
        'Digite um e-mail válido.'
    }

    if (!password) {
      nextErrors.password =
        'Digite sua senha.'
    }

    setErrors(nextErrors)

    return (
      Object.keys(nextErrors)
        .length === 0
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validate()) {
      return
    }

    if (remember) {
      localStorage.setItem(
        REMEMBER_EMAIL_KEY,
        email.trim()
      )
    } else {
      localStorage.removeItem(
        REMEMBER_EMAIL_KEY
      )
    }

    try {
      await login(
        email.trim(),
        password
      )
    } catch {
      // authError vem pelo contexto
    }
  }

  return (
    <form
      className="login-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <Input
        id="email"
        label="E-mail ou CPF"
        type="email"
        icon={Mail}
        value={email}
        onChange={event => {
          setEmail(
            event.target.value
          )

          if (errors.email) {
            setErrors(current => ({
              ...current,
              email: '',
            }))
          }
        }}
        error={errors.email}
        disabled={loading}
        autoComplete="email"
        placeholder="Digite seu e-mail"
      />

      <PasswordField
        value={password}
        onChange={event => {
          setPassword(
            event.target.value
          )

          if (errors.password) {
            setErrors(current => ({
              ...current,
              password: '',
            }))
          }
        }}
        error={errors.password}
        disabled={loading}
      />

      <div className="login-form__options">
        <Checkbox
          id="remember"
          checked={remember}
          onChange={event =>
            setRemember(
              event.target.checked
            )
          }
          label="Lembrar de mim"
        />

        <a
          className="login-form__forgot"
          href="/forgot-password"
        >
          Esqueci minha senha
        </a>
      </div>

      {authError && (
        <div
          className="login-form__server-error"
          role="alert"
        >
          {authError}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
      >
        Entrar
      </Button>
    </form>
  )
}