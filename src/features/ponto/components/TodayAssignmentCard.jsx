import {
  AlertCircle,
  Clock3,
  Construction,
  MapPin,
  Wrench,
} from 'lucide-react'


function formatTime(value) {
  if (!value) {
    return '--:--'
  }

  return String(value).slice(
    0,
    5
  )
}


export default function TodayAssignmentCard({
  assignment,
  loading = false,
}) {
  if (loading) {
    return (
      <section className="today-assignment-card">
        <div className="today-assignment-card__loading">
          Carregando atividade de hoje...
        </div>
      </section>
    )
  }


  if (!assignment) {
    return (
      <section className="today-assignment-card today-assignment-card--empty">

        <div className="today-assignment-card__icon today-assignment-card__icon--warning">
          <AlertCircle size={22} />
        </div>

        <div className="today-assignment-card__content">

          <span className="today-assignment-card__eyebrow">
            Atividade de hoje
          </span>

          <strong>
            Nenhuma alocação definida
          </strong>

          <p>
            O RH ainda não definiu seu local
            e sua jornada para hoje.
          </p>

        </div>

      </section>
    )
  }


  const isObra =
    assignment.assignment_type ===
    'obra'


  const ActivityIcon =
    isObra
      ? Construction
      : Wrench


  const activityLabel =
    isObra
      ? 'Obra'
      : 'Manutenção'


  return (
    <section className="today-assignment-card">

      <div className="today-assignment-card__header">

        <div className="today-assignment-card__icon">
          <ActivityIcon size={23} />
        </div>


        <div className="today-assignment-card__content">

          <span className="today-assignment-card__eyebrow">
            Atividade de hoje
          </span>

          <strong>
            {activityLabel}
          </strong>

        </div>


        <span
          className={
            `today-assignment-card__badge ${
              isObra
                ? 'today-assignment-card__badge--obra'
                : 'today-assignment-card__badge--maintenance'
            }`
          }
        >
          {activityLabel}
        </span>

      </div>


      <div className="today-assignment-location">

        <MapPin size={18} />

        <div>
          <span>
            Local de trabalho
          </span>

          <strong>
            {assignment.location_name}
          </strong>

          {assignment.location_address && (
            <small>
              {assignment.location_address}
            </small>
          )}
        </div>

      </div>


      <div className="today-assignment-schedule">

        <div>
          <span>
            Entrada
          </span>

          <strong>
            {formatTime(
              assignment.expected_clock_in
            )}
          </strong>
        </div>


        <div>
          <span>
            Almoço
          </span>

          <strong>
            {formatTime(
              assignment.expected_break_start
            )}
          </strong>
        </div>


        <div>
          <span>
            Retorno
          </span>

          <strong>
            {formatTime(
              assignment.expected_break_end
            )}
          </strong>
        </div>


        <div>
          <span>
            Saída
          </span>

          <strong>
            {formatTime(
              assignment.expected_clock_out
            )}
          </strong>
        </div>

      </div>


      {assignment.notes && (
        <div className="today-assignment-notes">

          <Clock3 size={15} />

          <span>
            {assignment.notes}
          </span>

        </div>
      )}

    </section>
  )
}