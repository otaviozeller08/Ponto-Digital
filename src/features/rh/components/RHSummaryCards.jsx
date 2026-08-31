import {
  AlertTriangle,
  Coffee,
  UserCheck,
  Users,
} from 'lucide-react'


export default function RHSummaryCards({
  employees = [],
  pendingAdjustments = 0,
}) {

  const total =
    employees.length


  const working =
    employees.filter(
      item =>
        item.current_status ===
        'working'
    ).length


  const onBreak =
    employees.filter(
      item =>
        item.current_status ===
        'on_break'
    ).length


  const alerts =
    employees.filter(
      item =>
        item.has_alert
    ).length +
    pendingAdjustments


  const cards = [
    {
      label:
        'Funcionários',

      value:
        total,

      icon:
        Users,
    },

    {
      label:
        'Trabalhando',

      value:
        working,

      icon:
        UserCheck,
    },

    {
      label:
        'Em intervalo',

      value:
        onBreak,

      icon:
        Coffee,
    },

    {
      label:
        'Pendências',

      value:
        alerts,

      icon:
        AlertTriangle,
    },
  ]


  return (
    <section className="rh-summary-grid">

      {cards.map(
        card => {

          const Icon =
            card.icon

          return (
            <article
              key={
                card.label
              }
              className="rh-summary-card"
            >

              <div className="rh-summary-card__icon">
                <Icon
                  size={22}
                />
              </div>

              <div>

                <span>
                  {card.label}
                </span>

                <strong>
                  {card.value}
                </strong>

              </div>

            </article>
          )
        }
      )}

    </section>
  )
}