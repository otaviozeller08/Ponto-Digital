import {
  CheckCircle2,
  Fingerprint,
} from 'lucide-react'

export default function PunchButton({
  disabled,
  loading,
  finished,
  onClick,
}) {
  if (finished) {
    return (
      <button
        type="button"
        className="punch-main-button punch-main-button--finished"
        disabled
      >
        <CheckCircle2
          size={24}
        />

        Jornada concluída
      </button>
    )
  }

  return (
    <button
      type="button"
      className="punch-main-button"
      disabled={
        disabled ||
        loading
      }
      onClick={onClick}
    >
      {loading ? (
        <>
          <span className="punch-button-spinner" />

          Registrando...
        </>
      ) : (
        <>
          <Fingerprint
            size={25}
          />

          Bater ponto
        </>
      )}
    </button>
  )
}