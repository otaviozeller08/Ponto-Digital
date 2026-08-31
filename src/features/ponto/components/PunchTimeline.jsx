import {
  Check,
  Coffee,
  LogIn,
  LogOut,
  Play,
} from 'lucide-react'

const TIMELINE = [
  {
    type:
      'clock_in',

    label:
      'Entrada',

    Icon:
      LogIn,
  },

  {
    type:
      'break_start',

    label:
      'Intervalo',

    Icon:
      Coffee,
  },

  {
    type:
      'break_end',

    label:
      'Retorno',

    Icon:
      Play,
  },

  {
    type:
      'clock_out',

    label:
      'Saída',

    Icon:
      LogOut,
  },
]

function getEntry(
  entries,
  type
) {
  return entries.find(
    item =>
      item.entry_type ===
      type
  )
}

function formatEntryTime(
  timestamp
) {
  if (!timestamp) {
    return '--:--'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',

      hour: '2-digit',

      minute: '2-digit',

      hour12: false,
    }
  ).format(
    new Date(timestamp)
  )
}

export default function PunchTimeline({
  entries = [],
}) {
  return (
    <section className="punch-timeline-card">
      <header className="point-section-title">
        <h2>
          Jornada de hoje
        </h2>

        <span>
          {
            entries.length
          }
          /4 registros
        </span>
      </header>

      <div className="punch-timeline">
        {TIMELINE.map(
          item => {
            const entry =
              getEntry(
                entries,
                item.type
              )

            const Icon =
              item.Icon

            return (
              <div
                key={
                  item.type
                }
                className={[
                  'punch-timeline__item',

                  entry
                    ? 'punch-timeline__item--done'
                    : '',
                ].join(' ')}
              >
                <div className="punch-timeline__marker">
                  {entry ? (
                    <Check
                      size={17}
                    />
                  ) : (
                    <Icon
                      size={17}
                    />
                  )}
                </div>

                <div className="punch-timeline__text">
                  <strong>
                    {
                      item.label
                    }
                  </strong>

                  {entry?.locations?.name && (
                    <span>
                      {
                        entry
                          .locations
                          .name
                      }
                    </span>
                  )}
                </div>

                <time>
                  {formatEntryTime(
                    entry
                      ?.occurred_at
                  )}
                </time>
              </div>
            )
          }
        )}
      </div>
    </section>
  )
}