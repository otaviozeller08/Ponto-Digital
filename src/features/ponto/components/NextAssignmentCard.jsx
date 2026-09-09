import {
  CalendarDays,
  Construction,
  ExternalLink,
  MapPin,
  Wrench,
} from 'lucide-react'


// ============================================================
// DATA
// ============================================================

function formatDate(
  value
) {

  if (!value) {
    return '-'
  }


  const [
    year,
    month,
    day,
  ] =
    value.split('-')


  return `${day}/${month}/${year}`
}


// ============================================================
// VERIFICAR SE É AMANHÃ
// ============================================================

function isTomorrow(
  value
) {

  if (!value) {
    return false
  }


  const tomorrow =
    new Date()


  tomorrow.setDate(
    tomorrow.getDate() + 1
  )


  const year =
    tomorrow.getFullYear()

  const month =
    String(
      tomorrow.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      tomorrow.getDate()
    ).padStart(
      2,
      '0'
    )


  const tomorrowValue =
    `${year}-${month}-${day}`


  return (
    value ===
    tomorrowValue
  )
}


// ============================================================
// LINK DO MAPA
// ============================================================

function getMapUrl(
  assignment
) {

  const latitude =
    Number(
      assignment
        ?.location_latitude
    )


  const longitude =
    Number(
      assignment
        ?.location_longitude
    )


  if (
    Number.isFinite(
      latitude
    ) &&
    Number.isFinite(
      longitude
    )
  ) {

    return (
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    )
  }


  if (
    assignment
      ?.location_address
  ) {

    return (
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        assignment.location_address
      )}`
    )
  }


  return null
}


// ============================================================
// COMPONENTE
// ============================================================

export default function NextAssignmentCard({
  assignment,
  loading = false,
}) {

  if (loading) {

    return (
      <section className="today-assignment-card">

        <div className="today-assignment-card__loading">

          Carregando próxima alocação...

        </div>

      </section>
    )
  }


  if (!assignment) {

    return (
      <section className="today-assignment-card today-assignment-card--empty">

        <div className="today-assignment-card__icon">

          <CalendarDays
            size={22}
          />

        </div>


        <div className="today-assignment-card__content">

          <span className="today-assignment-card__eyebrow">

            Próxima alocação

          </span>


          <strong>

            Nenhuma alocação programada

          </strong>


          <p>

            O RH ainda não definiu
            uma próxima atividade
            para você.

          </p>

        </div>

      </section>
    )
  }


  const isObra =
    assignment
      .assignment_type ===
    'obra'


  const ActivityIcon =
    isObra
      ? Construction
      : Wrench


  const activityLabel =
    isObra
      ? 'Obra'
      : assignment
          .assignment_type ===
          'manutencao'
        ? 'Manutenção'
        : 'Atividade'


  const mapUrl =
    getMapUrl(
      assignment
    )


  const tomorrow =
    isTomorrow(
      assignment.work_date
    )


  return (
    <section className="today-assignment-card">

      <div className="today-assignment-card__header">


        <div className="today-assignment-card__icon">

          <ActivityIcon
            size={23}
          />

        </div>


        <div className="today-assignment-card__content">

          <span className="today-assignment-card__eyebrow">

            Próxima alocação

          </span>


          <strong>

            {tomorrow
              ? 'Amanhã'
              : formatDate(
                  assignment.work_date
                )
            }

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

        <CalendarDays
          size={18}
        />


        <div>

          <span>
            Data
          </span>

          <strong>
            {formatDate(
              assignment.work_date
            )}
          </strong>

        </div>

      </div>


      <div className="today-assignment-location">

        <MapPin
          size={18}
        />


        <div>

          <span>
            Local de trabalho
          </span>


          <strong>

            {assignment
              .location_name ||
              'Local não informado'}

          </strong>


          {assignment
            .location_address && (

            <small>

              {
                assignment
                  .location_address
              }

            </small>

          )}

        </div>

      </div>


      {mapUrl && (

        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="today-assignment-notes"
          style={{
            textDecoration:
              'none',

            cursor:
              'pointer',
          }}
        >

          <ExternalLink
            size={15}
          />


          <span>

            Abrir localização no Google Maps

          </span>

        </a>

      )}


      {assignment.notes && (

        <div className="today-assignment-notes">

          <span>

            {assignment.notes}

          </span>

        </div>

      )}

    </section>
  )
}