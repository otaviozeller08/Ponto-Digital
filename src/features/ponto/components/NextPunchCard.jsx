import {
  Coffee,
  LogIn,
  LogOut,
  Play,
  CheckCircle2,
} from 'lucide-react'

const TYPES = {
  clock_in: {
    title: 'Entrada',

    description:
      'Iniciar jornada',

    icon: LogIn,
  },

  break_start: {
    title: 'Saída para intervalo',

    description:
      'Iniciar intervalo',

    icon: Coffee,
  },

  break_end: {
    title: 'Retorno do intervalo',

    description:
      'Retomar jornada',

    icon: Play,
  },

  clock_out: {
    title: 'Saída',

    description:
      'Encerrar jornada',

    icon: LogOut,
  },

  finished: {
    title:
      'Jornada concluída',

    description:
      'Todos os registros de hoje foram realizados',

    icon:
      CheckCircle2,
  },
}

export default function NextPunchCard({
  entryType,
}) {
  const config =
    TYPES[entryType] ||
    TYPES.clock_in

  const Icon =
    config.icon

  const finished =
    entryType ===
    'finished'

  return (
    <section
      className={[
        'next-punch-card',

        finished
          ? 'next-punch-card--finished'
          : '',
      ].join(' ')}
    >
      <span className="next-punch-card__eyebrow">
        Próximo registro
      </span>

      <div className="next-punch-card__content">
        <div className="next-punch-card__icon">
          <Icon
            size={28}
          />
        </div>

        <div>
          <strong>
            {config.title}
          </strong>

          <span>
            {
              config.description
            }
          </span>
        </div>
      </div>
    </section>
  )
}