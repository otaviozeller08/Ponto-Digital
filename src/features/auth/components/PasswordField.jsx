import { useState } from 'react'

import {
  Eye,
  EyeOff,
  LockKeyhole,
} from 'lucide-react'

import Input from '../../../components/ui/Input'

export default function PasswordField({
  value,
  onChange,
  error,
  disabled,
}) {
  const [visible, setVisible] =
    useState(false)

  return (
    <Input
      id="password"
      label="Senha"
      type={
        visible
          ? 'text'
          : 'password'
      }
      icon={LockKeyhole}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      autoComplete="current-password"
      placeholder="Digite sua senha"
      rightElement={
        <button
          type="button"
          className="password-visibility"
          aria-label={
            visible
              ? 'Ocultar senha'
              : 'Mostrar senha'
          }
          onClick={() =>
            setVisible(
              current => !current
            )
          }
        >
          {visible ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>
      }
    />
  )
}