import {
  Clock3,
  Timer,
} from 'lucide-react'

function formatMinutes(
  minutes
) {
  const total =
    Number(minutes || 0)

  const hours =
    Math.floor(
      total / 60
    )

  const remaining =
    total % 60

  return `${String(
    hours
  ).padStart(
    2,
    '0'
  )}h ${String(
    remaining
  ).padStart(
    2,
    '0'
  )}min`
}

export default function WorkdaySummary({
  workedMinutes,
  schedule,
}) {
  return (
    <section className="workday-summary">
      <article>
        <div className="workday-summary__icon">
          <Timer
            size={21}
          />
        </div>

        <div>
          <span>
            Trabalhado hoje
          </span>

          <strong>
            {formatMinutes(
              workedMinutes
            )}
          </strong>
        </div>
      </article>

      <article>
        <div className="workday-summary__icon">
          <Clock3
            size={21}
          />
        </div>

        <div>
          <span>
            Jornada
          </span>

          <strong>
            {schedule?.name ||
              'Não definida'}
          </strong>
        </div>
      </article>
    </section>
  )
}