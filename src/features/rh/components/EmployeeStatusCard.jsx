import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Coffee,
  MapPin,
  UserRoundX,
} from 'lucide-react'


const STATUS = {

  working: {
    label:
      'Trabalhando',

    className:
      'working',

    icon:
      CheckCircle2,
  },


  on_break: {
    label:
      'Em intervalo',

    className:
      'break',

    icon:
      Coffee,
  },


  finished: {
    label:
      'Jornada concluída',

    className:
      'finished',

    icon:
      CheckCircle2,
  },


  no_record: {
    label:
      'Sem registro',

    className:
      'missing',

    icon:
      UserRoundX,
  },

}


function formatTime(
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

      hour:
        '2-digit',

      minute:
        '2-digit',
    }
  ).format(
    new Date(timestamp)
  )
}


function formatMinutes(
  minutes
) {

  const total =
    Number(
      minutes ?? 0
    )


  const hours =
    Math.floor(
      total / 60
    )


  const remaining =
    total % 60


  return `${hours}h ${String(
    remaining
  ).padStart(
    2,
    '0'
  )}min`
}


export default function EmployeeStatusCard({
  employee,
}) {

  const config =
    STATUS[
      employee.current_status
    ] ??
    STATUS.no_record


  const StatusIcon =
    config.icon


  return (
    <article className="rh-employee-card">

      <div className="rh-employee-card__top">

        <div className="rh-employee-avatar">

          {employee.full_name
            ?.charAt(0)
            ?.toUpperCase()}

        </div>


        <div className="rh-employee-main">

          <strong>
            {employee.full_name}
          </strong>

          <span>
            {employee.job_title ||
              'Funcionário'}
          </span>

        </div>


        <span
          className={
            `rh-status rh-status--${config.className}`
          }
        >

          <StatusIcon
            size={14}
          />

          {config.label}

        </span>

      </div>


      <div className="rh-employee-info">

        <div>

          <span>
            Entrada
          </span>

          <strong>
            {formatTime(
              employee.clock_in
            )}
          </strong>

        </div>


        <div>

          <span>
            Trabalhado
          </span>

          <strong>
            {formatMinutes(
              employee.worked_minutes
            )}
          </strong>

        </div>


        <div>

          <span>
            Atraso
          </span>

          <strong>
            {employee.late_minutes
              ? `${employee.late_minutes} min`
              : '—'}
          </strong>

        </div>

      </div>


      <footer className="rh-employee-card__footer">

        <span>

          <MapPin
            size={15}
          />

          {employee.location_name ||
            'Sem localização'}

        </span>


        {employee.has_alert && (

          <span className="rh-employee-alert">

            <AlertTriangle
              size={15}
            />

            Revisar ponto

          </span>

        )}


        {!employee.has_alert &&
          employee.clock_in && (

            <span>

              <Clock3
                size={15}
              />

              Registro normal

            </span>

          )}

      </footer>

    </article>
  )
}