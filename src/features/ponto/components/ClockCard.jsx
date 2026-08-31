import {
  Clock3,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

function formatTime(
  date
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',

      hour: '2-digit',

      minute: '2-digit',

      second: '2-digit',

      hour12: false,
    }
  ).format(date)
}

function formatDate(
  date
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',

      weekday: 'long',

      day: '2-digit',

      month: 'long',
    }
  ).format(date)
}

export default function ClockCard() {
  const [
    now,
    setNow,
  ] = useState(
    new Date()
  )

  useEffect(() => {
    const interval =
      setInterval(
        () => {
          setNow(
            new Date()
          )
        },
        1000
      )

    return () =>
      clearInterval(
        interval
      )
  }, [])

  return (
    <section className="point-clock-card">
      <div className="point-clock-card__icon">
        <Clock3
          size={25}
        />
      </div>

      <div className="point-clock-card__content">
        <span>
          Horário oficial
        </span>

        <strong>
          {formatTime(now)}
        </strong>

        <p>
          {formatDate(now)}
        </p>
      </div>
    </section>
  )
}