import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Construction,
  MapPin,
  Timer,
  TriangleAlert,
  Wrench,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useParams,
} from 'react-router-dom'

import {
  getEmployeeMonthlyHistory,
} from '../services/employeeHistoryService'

import './RHEmployeeHistoryPage.css'


// ============================================================
// DATA / MÊS
// ============================================================

function getCurrentMonth() {
  const now = new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, '0')

  return `${year}-${month}`
}


function getMonthRange(monthValue) {
  const [
    year,
    month,
  ] =
    monthValue
      .split('-')
      .map(Number)

  const lastDay =
    new Date(
      year,
      month,
      0
    ).getDate()

  return {
    startDate:
      `${year}-${String(
        month
      ).padStart(2, '0')}-01`,

    endDate:
      `${year}-${String(
        month
      ).padStart(2, '0')}-${String(
        lastDay
      ).padStart(2, '0')}`,
  }
}


// ============================================================
// FORMATADORES
// ============================================================

function formatDate(value) {
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


function formatClock(value) {
  if (!value) {
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

      hour12:
        false,
    }
  ).format(
    new Date(value)
  )
}


function timeToMinutes(value) {
  if (!value) {
    return null
  }

  const [
    hour,
    minute,
  ] =
    String(value)
      .slice(0, 5)
      .split(':')
      .map(Number)

  return (
    hour * 60 +
    minute
  )
}


function timestampToMinutes(value) {
  if (!value) {
    return null
  }

  const parts =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        timeZone:
          'America/Sao_Paulo',

        hour:
          '2-digit',

        minute:
          '2-digit',

        hour12:
          false,
      }
    )
      .format(
        new Date(value)
      )
      .split(':')

  return (
    Number(parts[0]) * 60 +
    Number(parts[1])
  )
}


function formatMinutes(value) {
  const minutes =
    Math.max(
      0,
      Number(value) || 0
    )

  const hours =
    Math.floor(
      minutes / 60
    )

  const rest =
    minutes % 60

  return (
    `${String(hours).padStart(
      2,
      '0'
    )}h ${String(rest).padStart(
      2,
      '0'
    )}min`
  )
}


function formatBalance(value) {
  const minutes =
    Number(value) || 0

  if (minutes === 0) {
    return '00h 00min'
  }

  const signal =
    minutes > 0
      ? '+'
      : '-'

  return (
    `${signal}${formatMinutes(
      Math.abs(minutes)
    )}`
  )
}


// ============================================================
// DIFERENÇA ENTRE DOIS REGISTROS
// ============================================================

function differenceInMinutes(
  start,
  end
) {
  if (
    !start ||
    !end
  ) {
    return 0
  }

  return Math.max(
    0,

    Math.round(
      (
        new Date(end) -
        new Date(start)
      ) /
        60000
    )
  )
}


// ============================================================
// MONTAR UM DIA
// ============================================================

function buildDay({
  workDate,
  entries,
  assignment,
  locations,
}) {
  const getEntry =
    type =>
      entries.find(
        item =>
          item.entry_type ===
          type
      ) ?? null


  const clockIn =
    getEntry(
      'clock_in'
    )

  const breakStart =
    getEntry(
      'break_start'
    )

  const breakEnd =
    getEntry(
      'break_end'
    )

  const clockOut =
    getEntry(
      'clock_out'
    )


  // ==========================================================
  // JORNADA COMPLETA
  // ==========================================================

  const complete =
    Boolean(
      clockIn &&
      breakStart &&
      breakEnd &&
      clockOut
    )


  // ==========================================================
  // TEMPO TRABALHADO
  // ==========================================================

  const beforeLunch =
    differenceInMinutes(
      clockIn?.occurred_at,
      breakStart?.occurred_at
    )

  const afterLunch =
    differenceInMinutes(
      breakEnd?.occurred_at,
      clockOut?.occurred_at
    )

  const workedMinutes =
    beforeLunch +
    afterLunch


  // ==========================================================
  // TEMPO PREVISTO
  // ==========================================================

  let expectedMinutes = 0

  if (assignment) {
    const expectedIn =
      timeToMinutes(
        assignment.expected_clock_in
      )

    const expectedBreakStart =
      timeToMinutes(
        assignment.expected_break_start
      )

    const expectedBreakEnd =
      timeToMinutes(
        assignment.expected_break_end
      )

    const expectedOut =
      timeToMinutes(
        assignment.expected_clock_out
      )


    if (
      expectedIn !== null &&
      expectedBreakStart !== null
    ) {
      expectedMinutes +=
        Math.max(
          0,
          expectedBreakStart -
            expectedIn
        )
    }


    if (
      expectedBreakEnd !== null &&
      expectedOut !== null
    ) {
      expectedMinutes +=
        Math.max(
          0,
          expectedOut -
            expectedBreakEnd
        )
    }
  }


  // ==========================================================
  // ATRASO
  // ==========================================================

  let delayMinutes = 0

  if (
    assignment &&
    clockIn
  ) {
    const expected =
      timeToMinutes(
        assignment.expected_clock_in
      )

    const real =
      timestampToMinutes(
        clockIn.occurred_at
      )

    if (
      expected !== null &&
      real !== null
    ) {
      delayMinutes =
        Math.max(
          0,
          real -
            expected
        )
    }
  }


  // ==========================================================
  // SAÍDA ANTECIPADA
  // ==========================================================

  let earlyLeaveMinutes = 0

  if (
    complete &&
    assignment &&
    clockOut
  ) {
    const expected =
      timeToMinutes(
        assignment.expected_clock_out
      )

    const real =
      timestampToMinutes(
        clockOut.occurred_at
      )

    if (
      expected !== null &&
      real !== null
    ) {
      earlyLeaveMinutes =
        Math.max(
          0,
          expected -
            real
        )
    }
  }


  // ==========================================================
  // SALDO
  //
  // SOMENTE DEFINITIVO DEPOIS DA SAÍDA
  // ==========================================================

  const balanceMinutes =
    complete
      ? workedMinutes -
        expectedMinutes
      : null


  // ==========================================================
  // LOCAL
  // ==========================================================

  const locationId =
    assignment?.location_id ||
    clockIn?.location_id ||
    entries[0]?.location_id ||
    null

  const location =
    locations.find(
      item =>
        item.id ===
        locationId
    ) ?? null


  return {
    workDate,

    assignment,

    location,

    clockIn,

    breakStart,

    breakEnd,

    clockOut,

    complete,

    workedMinutes,

    expectedMinutes,

    delayMinutes,

    earlyLeaveMinutes,

    balanceMinutes,
  }
}


// ============================================================
// COMPONENTE
// ============================================================

export default function RHEmployeeHistoryPage() {
  const {
    employeeId,
  } =
    useParams()


  const [
    selectedMonth,
    setSelectedMonth,
  ] =
    useState(
      getCurrentMonth()
    )


  const [
    employee,
    setEmployee,
  ] =
    useState(null)


  const [
    entries,
    setEntries,
  ] =
    useState([])


  const [
    assignments,
    setAssignments,
  ] =
    useState([])


  const [
    locations,
    setLocations,
  ] =
    useState([])


  const [
    loading,
    setLoading,
  ] =
    useState(true)


  const [
    error,
    setError,
  ] =
    useState('')


  // ==========================================================
  // CARREGAR HISTÓRICO
  // ==========================================================

  async function loadHistory() {
    try {
      setLoading(true)

      setError('')


      const {
        startDate,
        endDate,
      } =
        getMonthRange(
          selectedMonth
        )


      const result =
        await getEmployeeMonthlyHistory({
          employeeId,
          startDate,
          endDate,
        })


      setEmployee(
        result.employee
      )

      setEntries(
        result.entries ||
        []
      )

      setAssignments(
        result.assignments ||
        []
      )

      setLocations(
        result.locations ||
        []
      )
    } catch (err) {
      console.error(
        'Erro ao carregar espelho de ponto:',
        err
      )

      setError(
        err?.message ||
        'Não foi possível carregar o espelho de ponto.'
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadHistory()
  }, [
    employeeId,
    selectedMonth,
  ])


  // ==========================================================
  // AGRUPAR DIAS
  // ==========================================================

  const days =
    useMemo(
      () => {
        const dates =
          new Set()


        entries.forEach(
          entry => {
            if (
              entry.work_date
            ) {
              dates.add(
                entry.work_date
              )
            }
          }
        )


        assignments.forEach(
          assignment => {
            if (
              assignment.work_date
            ) {
              dates.add(
                assignment.work_date
              )
            }
          }
        )


        return Array
          .from(dates)
          .sort()
          .reverse()
          .map(
            workDate => {

              const dayEntries =
                entries.filter(
                  entry =>
                    entry.work_date ===
                    workDate
                )


              const assignment =
                assignments.find(
                  item =>
                    item.work_date ===
                    workDate
                ) ?? null


              return buildDay({
                workDate,

                entries:
                  dayEntries,

                assignment,

                locations,
              })
            }
          )
      },
      [
        entries,
        assignments,
        locations,
      ]
    )


  // ==========================================================
  // RESUMO DO MÊS
  // ==========================================================

  const monthlySummary =
    useMemo(
      () => {
        return days.reduce(
          (
            total,
            day
          ) => {

            total.worked +=
              day.workedMinutes

            total.expected +=
              day.expectedMinutes

            total.delay +=
              day.delayMinutes


            if (
              day.complete &&
              day.balanceMinutes !==
                null
            ) {
              total.balance +=
                day.balanceMinutes

              total.closedDays += 1
            }


            if (
              !day.complete
            ) {
              total.pendingDays += 1
            }


            return total
          },
          {
            worked: 0,
            expected: 0,
            delay: 0,
            balance: 0,
            closedDays: 0,
            pendingDays: 0,
          }
        )
      },
      [
        days,
      ]
    )


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="rh-history-page">

      <div className="rh-history-container">


        {/* HEADER */}

        <header className="rh-history-header">

          <div className="rh-history-header__left">

            <Link
              to={
                `/rh/funcionarios/${employeeId}`
              }
              className="rh-history-back"
            >
              <ArrowLeft
                size={20}
              />
            </Link>


            <div>

              <span>
                Ponto Digital • RH
              </span>

              <h1>
                Espelho de ponto
              </h1>

              <p>
                {employee?.full_name ||
                  'Funcionário'}
              </p>

            </div>

          </div>

        </header>


        {/* MÊS */}

        <section className="rh-history-filter">

          <CalendarDays
            size={20}
          />


          <div>

            <span>
              Mês de referência
            </span>


            <input
              type="month"
              value={
                selectedMonth
              }
              onChange={
                event =>
                  setSelectedMonth(
                    event.target.value
                  )
              }
            />

          </div>

        </section>


        {/* ERRO */}

        {error && (

          <div className="point-message point-message--error">
            {error}
          </div>

        )}


        {/* RESUMO */}

        <section className="rh-history-summary">

          <div>

            <Clock3
              size={18}
            />

            <span>
              Trabalhado
            </span>

            <strong>
              {formatMinutes(
                monthlySummary.worked
              )}
            </strong>

          </div>


          <div>

            <Timer
              size={18}
            />

            <span>
              Previsto
            </span>

            <strong>
              {formatMinutes(
                monthlySummary.expected
              )}
            </strong>

          </div>


          <div>

            <TriangleAlert
              size={18}
            />

            <span>
              Atrasos
            </span>

            <strong>
              {formatMinutes(
                monthlySummary.delay
              )}
            </strong>

          </div>


          <div>

            <CheckCircle2
              size={18}
            />

            <span>
              Saldo
            </span>

            <strong>

              {monthlySummary.closedDays >
              0
                ? formatBalance(
                    monthlySummary.balance
                  )
                : 'Em andamento'}

            </strong>

          </div>

        </section>


        {/* LISTA */}

        <section className="rh-history-days">

          <div className="rh-history-days__title">

            <h2>
              Registros do mês
            </h2>


            <span>
              {days.length}
              {' '}
              {days.length === 1
                ? 'dia'
                : 'dias'}
            </span>

          </div>


          {loading && (

            <div className="rh-history-empty">

              <CalendarDays
                size={30}
              />

              <strong>
                Carregando histórico...
              </strong>

            </div>

          )}


          {!loading &&
            days.length ===
              0 && (

            <div className="rh-history-empty">

              <CalendarDays
                size={30}
              />

              <strong>
                Nenhum registro neste mês
              </strong>

              <span>
                Não existem pontos ou
                alocações nesse período.
              </span>

            </div>

          )}


          {!loading &&
            days.length >
              0 &&
            days.map(
              day => {

                const isObra =
                  day.assignment
                    ?.assignment_type ===
                  'obra'


                const ActivityIcon =
                  isObra
                    ? Construction
                    : Wrench


                return (
                  <article
                    key={
                      day.workDate
                    }
                    className="rh-history-day-card"
                  >

                    {/* CABEÇALHO */}

                    <div className="rh-history-day-header">

                      <div>

                        <strong>
                          {formatDate(
                            day.workDate
                          )}
                        </strong>


                        {day.assignment && (

                          <span>

                            <ActivityIcon
                              size={14}
                            />

                            {isObra
                              ? 'Obra'
                              : 'Manutenção'}

                          </span>

                        )}

                      </div>


                      <span
                        className={
                          `rh-history-status ${
                            day.complete
                              ? 'rh-history-status--complete'
                              : 'rh-history-status--pending'
                          }`
                        }
                      >
                        {day.complete
                          ? 'Completo'
                          : 'Pendente'}
                      </span>

                    </div>


                    {/* LOCAL */}

                    {day.location && (

                      <div className="rh-history-location">

                        <MapPin
                          size={15}
                        />

                        <span>
                          {day.location.name}
                        </span>

                      </div>

                    )}


                    {/* BATIDAS */}

                    <div className="rh-history-punches">

                      <div>
                        <span>
                          Entrada
                        </span>

                        <strong>
                          {formatClock(
                            day.clockIn
                              ?.occurred_at
                          )}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Intervalo
                        </span>

                        <strong>
                          {formatClock(
                            day.breakStart
                              ?.occurred_at
                          )}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Retorno
                        </span>

                        <strong>
                          {formatClock(
                            day.breakEnd
                              ?.occurred_at
                          )}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Saída
                        </span>

                        <strong>
                          {formatClock(
                            day.clockOut
                              ?.occurred_at
                          )}
                        </strong>
                      </div>

                    </div>


                    {/* CÁLCULOS */}

                    <div className="rh-history-calculation">

                      <div>
                        <span>
                          Previsto
                        </span>

                        <strong>
                          {formatMinutes(
                            day.expectedMinutes
                          )}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Trabalhado
                        </span>

                        <strong>
                          {formatMinutes(
                            day.workedMinutes
                          )}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Atraso
                        </span>

                        <strong>
                          {day.delayMinutes >
                          0
                            ? `${day.delayMinutes} min`
                            : '0 min'}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Saldo
                        </span>

                        <strong>
                          {day.complete
                            ? formatBalance(
                                day.balanceMinutes
                              )
                            : 'Em andamento'}
                        </strong>
                      </div>

                    </div>


                    {/* SAÍDA ANTECIPADA */}

                    {day.complete &&
                      day.earlyLeaveMinutes >
                        0 && (

                      <div className="rh-history-warning">

                        <TriangleAlert
                          size={15}
                        />

                        Saída antecipada:
                        {' '}
                        {
                          day.earlyLeaveMinutes
                        }
                        {' '}
                        min

                      </div>

                    )}

                  </article>
                )
              }
            )}

        </section>

      </div>

    </main>
  )
}