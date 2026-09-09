import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Construction,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Trash2,
  Wrench,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  ASSIGNMENT_PRESETS,
  cancelAssignment,
  getActiveEmployees,
  getActiveLocations,
  getAssignmentsByDate,
  saveAssignment,
} from '../services/assignmentService'

import './RHAssignmentsPage.css'


// ============================================================
// DATA ATUAL - SÃO PAULO
// ============================================================

function getToday() {

  const now =
    new Date()


  const formatter =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'America/Sao_Paulo',

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',
      }
    )


  return formatter.format(
    now
  )
}


// ============================================================
// HORÁRIO CURTO
// ============================================================

function shortTime(
  value
) {

  if (!value) {
    return '--:--'
  }


  return String(
    value
  ).slice(
    0,
    5
  )
}


// ============================================================
// LABEL
// ============================================================

function getAssignmentLabel(
  type
) {

  if (
    type ===
    'obra'
  ) {
    return 'Obra'
  }


  if (
    type ===
    'manutencao'
  ) {
    return 'Manutenção'
  }


  return 'Outro'
}


// ============================================================
// NOVA PARADA
// ============================================================

function createEmptyStop() {

  return {

    id:
      crypto.randomUUID(),

    locationId:
      '',

    expectedArrival:
      '',

    expectedDeparture:
      '',

    notes:
      '',

  }

}


// ============================================================
// COMPONENTE
// ============================================================

export default function RHAssignmentsPage() {

  const [
    workDate,
    setWorkDate,
  ] =
    useState(
      getToday()
    )


  const [
    employees,
    setEmployees,
  ] =
    useState([])


  const [
    locations,
    setLocations,
  ] =
    useState([])


  const [
    assignments,
    setAssignments,
  ] =
    useState([])


  const [
    employeeId,
    setEmployeeId,
  ] =
    useState('')


  const [
    assignmentType,
    setAssignmentType,
  ] =
    useState(
      'obra'
    )


  const [
    stops,
    setStops,
  ] =
    useState([
      createEmptyStop(),
    ])


  const [
    notes,
    setNotes,
  ] =
    useState('')


  const [
    loading,
    setLoading,
  ] =
    useState(true)


  const [
    saving,
    setSaving,
  ] =
    useState(false)


  const [
    message,
    setMessage,
  ] =
    useState('')


  const [
    error,
    setError,
  ] =
    useState('')


  const preset =
    ASSIGNMENT_PRESETS[
      assignmentType
    ]


  const selectedEmployee =
    useMemo(
      () =>
        employees.find(
          employee =>
            employee.id ===
            employeeId
        ),
      [
        employees,
        employeeId,
      ]
    )


  // ==========================================================
  // BASE
  // ==========================================================

  async function loadBaseData() {

    try {

      setError('')


      const [
        employeeData,
        locationData,
      ] =
        await Promise.all([

          getActiveEmployees(),

          getActiveLocations(),

        ])


      setEmployees(
        employeeData
      )


      setLocations(
        locationData
      )

    } catch (err) {

      console.error(
        'Erro ao carregar dados:',
        err
      )


      setError(
        err.message ||
        'Não foi possível carregar os dados.'
      )

    }

  }


  // ==========================================================
  // ALOCAÇÕES
  // ==========================================================

  async function loadAssignments() {

    try {

      setLoading(
        true
      )

      setError('')


      const data =
        await getAssignmentsByDate(
          workDate
        )


      setAssignments(
        data
      )

    } catch (err) {

      console.error(
        'Erro ao carregar alocações:',
        err
      )


      setError(
        err.message ||
        'Não foi possível carregar as alocações.'
      )

    } finally {

      setLoading(
        false
      )

    }

  }


  useEffect(
    () => {

      loadBaseData()

    },
    []
  )


  useEffect(
    () => {

      if (workDate) {
        loadAssignments()
      }

    },
    [
      workDate,
    ]
  )


  // ==========================================================
  // PARADAS
  // ==========================================================

  function updateStop(
    stopId,
    field,
    value
  ) {

    setStops(
      current =>
        current.map(
          stop =>
            stop.id ===
            stopId
              ? {
                  ...stop,
                  [field]:
                    value,
                }
              : stop
        )
    )

  }


  function addStop() {

    setStops(
      current => [
        ...current,
        createEmptyStop(),
      ]
    )

  }


  function removeStop(
    stopId
  ) {

    setStops(
      current => {

        if (
          current.length ===
          1
        ) {
          return current
        }


        return current.filter(
          stop =>
            stop.id !==
            stopId
        )

      }
    )

  }


  function moveStop(
    index,
    direction
  ) {

    setStops(
      current => {

        const targetIndex =
          direction ===
          'up'
            ? index - 1
            : index + 1


        if (
          targetIndex < 0 ||
          targetIndex >=
            current.length
        ) {
          return current
        }


        const next =
          [
            ...current,
          ]


        const [
          moved,
        ] =
          next.splice(
            index,
            1
          )


        next.splice(
          targetIndex,
          0,
          moved
        )


        return next

      }
    )

  }


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave(
    event
  ) {

    event.preventDefault()


    setMessage('')
    setError('')


    if (!selectedEmployee) {

      setError(
        'Selecione um funcionário.'
      )

      return

    }


    if (
      stops.some(
        stop =>
          !stop.locationId
      )
    ) {

      setError(
        'Selecione o local de todas as paradas.'
      )

      return

    }


    const uniqueLocations =
      new Set(
        stops.map(
          stop =>
            stop.locationId
        )
      )


    if (
      uniqueLocations.size !==
      stops.length
    ) {

      setError(
        'O mesmo local não pode aparecer duas vezes no roteiro.'
      )

      return

    }


    try {

      setSaving(
        true
      )


      await saveAssignment({

        employee:
          selectedEmployee,

        workDate,

        assignmentType,

        stops,

        notes,

      })


      setMessage(
        stops.length ===
          1
          ? 'Alocação salva com sucesso.'
          : `Alocação salva com ${stops.length} paradas no roteiro.`
      )


      setEmployeeId('')

      setNotes('')

      setStops([
        createEmptyStop(),
      ])


      await loadAssignments()

    } catch (err) {

      console.error(
        'Erro ao salvar:',
        err
      )


      setError(
        err.message ||
        'Não foi possível salvar a alocação.'
      )

    } finally {

      setSaving(
        false
      )

    }

  }


  // ==========================================================
  // CANCELAR
  // ==========================================================

  async function handleCancel(
    assignmentId
  ) {

    const confirmed =
      window.confirm(
        'Deseja cancelar esta alocação e todo o roteiro deste funcionário?'
      )


    if (!confirmed) {
      return
    }


    try {

      setMessage('')
      setError('')


      await cancelAssignment(
        assignmentId
      )


      setMessage(
        'Alocação cancelada.'
      )


      await loadAssignments()

    } catch (err) {

      console.error(
        'Erro ao cancelar:',
        err
      )


      setError(
        err.message ||
        'Não foi possível cancelar a alocação.'
      )

    }

  }


  return (
    <main className="assignment-page">

      <div className="assignment-page__container">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="assignment-header">

          <div className="assignment-header__main">

            <Link
              to="/rh"
              className="assignment-icon-button"
            >

              <ArrowLeft
                size={20}
              />

            </Link>


            <div>

              <span className="assignment-eyebrow">

                Ponto Digital • RH

              </span>


              <h1>

                Alocações do dia

              </h1>


              <p>

                Defina a jornada e o
                roteiro de cada funcionário.

              </p>

            </div>

          </div>


          <button
            type="button"
            className="assignment-icon-button"
            onClick={
              loadAssignments
            }
            title="Atualizar"
          >

            <RefreshCw
              size={20}
            />

          </button>

        </header>


        {/* ====================================================
            DATA
        ==================================================== */}

        <section className="assignment-date-card">

          <CalendarDays
            size={20}
          />


          <div>

            <span>
              Data da programação
            </span>


            <input
              type="date"
              value={
                workDate
              }
              onChange={
                event =>
                  setWorkDate(
                    event.target.value
                  )
              }
            />

          </div>

        </section>


        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          className="assignment-form"
          onSubmit={
            handleSave
          }
        >

          <div className="assignment-form__title">

            <div>

              <BriefcaseBusiness
                size={21}
              />

              <h2>
                Nova alocação
              </h2>

            </div>


            <span>
              {workDate}
            </span>

          </div>


          {/* FUNCIONÁRIO */}

          <label className="assignment-field">

            <span>
              Funcionário
            </span>


            <select
              value={
                employeeId
              }
              disabled={
                saving
              }
              onChange={
                event =>
                  setEmployeeId(
                    event.target.value
                  )
              }
            >

              <option value="">

                Selecione o funcionário

              </option>


              {employees.map(
                employee => (

                  <option
                    key={
                      employee.id
                    }
                    value={
                      employee.id
                    }
                  >

                    {employee.full_name}

                  </option>

                )
              )}

            </select>

          </label>


          {/* TIPO */}

          <div className="assignment-type-grid">

            <button
              type="button"
              disabled={
                saving
              }
              className={
                `assignment-type-card ${
                  assignmentType ===
                  'obra'
                    ? 'assignment-type-card--active'
                    : ''
                }`
              }
              onClick={() =>
                setAssignmentType(
                  'obra'
                )
              }
            >

              <Construction
                size={23}
              />

              <strong>
                Obra
              </strong>

              <span>
                07:00 às 17:00
              </span>

            </button>


            <button
              type="button"
              disabled={
                saving
              }
              className={
                `assignment-type-card ${
                  assignmentType ===
                  'manutencao'
                    ? 'assignment-type-card--active'
                    : ''
                }`
              }
              onClick={() =>
                setAssignmentType(
                  'manutencao'
                )
              }
            >

              <Wrench
                size={23}
              />

              <strong>
                Manutenção
              </strong>

              <span>
                08:00 às 18:00
              </span>

            </button>

          </div>


          {/* JORNADA */}

          <div className="assignment-schedule-preview">

            <div>
              <span>
                Entrada
              </span>

              <strong>
                {preset.clockIn}
              </strong>
            </div>


            <div>
              <span>
                Almoço
              </span>

              <strong>
                {preset.breakStart}
              </strong>
            </div>


            <div>
              <span>
                Retorno
              </span>

              <strong>
                {preset.breakEnd}
              </strong>
            </div>


            <div>
              <span>
                Saída
              </span>

              <strong>
                {preset.clockOut}
              </strong>
            </div>

          </div>


          {/* ==================================================
              ROTEIRO
          ================================================== */}

          <section className="assignment-route">

            <div className="assignment-route__header">

              <div>

                <Route
                  size={21}
                />


                <div>

                  <strong>
                    Roteiro do dia
                  </strong>

                  <span>
                    Adicione os clientes na ordem da visita.
                  </span>

                </div>

              </div>


              <span className="assignment-route__count">

                {stops.length}

                {' '}

                parada
                {stops.length !==
                1
                  ? 's'
                  : ''
                }

              </span>

            </div>


            <div className="assignment-route__list">

              {stops.map(
                (
                  stop,
                  index
                ) => (

                  <article
                    key={
                      stop.id
                    }
                    className="assignment-stop"
                  >

                    <div className="assignment-stop__top">

                      <div className="assignment-stop__number">

                        {index + 1}

                      </div>


                      <div className="assignment-stop__title">

                        <strong>

                          {index === 0
                            ? 'Primeiro destino'
                            : `Destino ${index + 1}`
                          }

                        </strong>


                        <span>

                          {index === 0
                            ? 'Local inicial da jornada'
                            : 'Próxima visita do roteiro'
                          }

                        </span>

                      </div>


                      <div className="assignment-stop__controls">

                        <button
                          type="button"
                          title="Mover para cima"
                          disabled={
                            saving ||
                            index === 0
                          }
                          onClick={() =>
                            moveStop(
                              index,
                              'up'
                            )
                          }
                        >

                          <ArrowUp
                            size={15}
                          />

                        </button>


                        <button
                          type="button"
                          title="Mover para baixo"
                          disabled={
                            saving ||
                            index ===
                              stops.length - 1
                          }
                          onClick={() =>
                            moveStop(
                              index,
                              'down'
                            )
                          }
                        >

                          <ArrowDown
                            size={15}
                          />

                        </button>


                        <button
                          type="button"
                          title="Remover parada"
                          className="assignment-stop__remove"
                          disabled={
                            saving ||
                            stops.length ===
                              1
                          }
                          onClick={() =>
                            removeStop(
                              stop.id
                            )
                          }
                        >

                          <Trash2
                            size={15}
                          />

                        </button>

                      </div>

                    </div>


                    <label className="assignment-field">

                      <span>
                        Cliente / local
                      </span>


                      <select
                        value={
                          stop.locationId
                        }
                        disabled={
                          saving
                        }
                        onChange={
                          event =>
                            updateStop(
                              stop.id,
                              'locationId',
                              event.target.value
                            )
                        }
                      >

                        <option value="">

                          Selecione o local

                        </option>


                        {locations.map(
                          location => (

                            <option
                              key={
                                location.id
                              }
                              value={
                                location.id
                              }
                            >

                              {location.name}

                            </option>

                          )
                        )}

                      </select>

                    </label>


                    <div className="assignment-stop__times">

                      <label className="assignment-field">

                        <span>
                          Chegada prevista
                        </span>

                        <input
                          type="time"
                          value={
                            stop.expectedArrival
                          }
                          disabled={
                            saving
                          }
                          onChange={
                            event =>
                              updateStop(
                                stop.id,
                                'expectedArrival',
                                event.target.value
                              )
                          }
                        />

                      </label>


                      <label className="assignment-field">

                        <span>
                          Saída prevista
                        </span>

                        <input
                          type="time"
                          value={
                            stop.expectedDeparture
                          }
                          disabled={
                            saving
                          }
                          onChange={
                            event =>
                              updateStop(
                                stop.id,
                                'expectedDeparture',
                                event.target.value
                              )
                          }
                        />

                      </label>

                    </div>


                    <label className="assignment-field assignment-field--last">

                      <span>
                        Observação da parada
                      </span>


                      <input
                        type="text"
                        value={
                          stop.notes
                        }
                        disabled={
                          saving
                        }
                        placeholder="Ex.: manutenção preventiva no 12º andar"
                        onChange={
                          event =>
                            updateStop(
                              stop.id,
                              'notes',
                              event.target.value
                            )
                        }
                      />

                    </label>

                  </article>

                )
              )}

            </div>


            <button
              type="button"
              className="assignment-add-stop"
              disabled={
                saving
              }
              onClick={
                addStop
              }
            >

              <Plus
                size={18}
              />

              Adicionar outro cliente

            </button>

          </section>


          {/* OBSERVAÇÃO GERAL */}

          <label className="assignment-field">

            <span>
              Observação geral do dia
            </span>


            <textarea
              value={
                notes
              }
              disabled={
                saving
              }
              placeholder="Ex.: roteiro de manutenções preventivas..."
              onChange={
                event =>
                  setNotes(
                    event.target.value
                  )
              }
            />

          </label>


          {error && (

            <div className="point-message point-message--error">

              {error}

            </div>

          )}


          {message && (

            <div className="point-message point-message--success">

              {message}

            </div>

          )}


          <button
            type="submit"
            className="assignment-save-button"
            disabled={
              saving
            }
          >

            <Plus
              size={19}
            />


            {saving
              ? 'Salvando...'
              : 'Salvar alocação e roteiro'
            }

          </button>

        </form>


        {/* ====================================================
            LISTA
        ==================================================== */}

        <section className="assignment-list">

          <div className="assignment-list__header">

            <h2>
              Programação do dia
            </h2>


            <span>

              {assignments.length}

              {' '}

              alocação
              {assignments.length !==
              1
                ? 'ões'
                : ''
              }

            </span>

          </div>


          {loading ? (

            <div className="assignment-empty">

              Carregando...

            </div>

          ) : assignments.length ===
            0 ? (

            <div className="assignment-empty">

              <Building2
                size={28}
              />

              <strong>
                Nenhuma alocação
              </strong>

              <span>

                Ainda não existe programação
                para esta data.

              </span>

            </div>

          ) : (

            assignments.map(
              assignment => (

                <article
                  key={
                    assignment.id
                  }
                  className="assignment-item"
                >

                  <div className="assignment-item__top">

                    <div className="assignment-avatar">

                      {assignment.employee
                        ?.full_name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        '?'
                      }

                    </div>


                    <div className="assignment-item__employee">

                      <strong>

                        {assignment.employee
                          ?.full_name ||
                          'Funcionário'
                        }

                      </strong>

                      <span>

                        {getAssignmentLabel(
                          assignment.assignment_type
                        )}

                      </span>

                    </div>


                    <button
                      type="button"
                      className="assignment-delete"
                      title="Cancelar alocação"
                      onClick={() =>
                        handleCancel(
                          assignment.id
                        )
                      }
                    >

                      <Trash2
                        size={17}
                      />

                    </button>

                  </div>


                  <div className="assignment-item__details">

                    <span>

                      <Route
                        size={15}
                      />

                      {assignment.stops
                        ?.length ||
                        0
                      }

                      {' '}

                      parada
                      {assignment.stops
                        ?.length !==
                        1
                        ? 's'
                        : ''
                      }

                    </span>


                    <span>

                      <Clock3
                        size={15}
                      />

                      {shortTime(
                        assignment.expected_clock_in
                      )}

                      {' — '}

                      {shortTime(
                        assignment.expected_clock_out
                      )}

                    </span>

                  </div>


                  <div className="assignment-item__schedule">

                    <span>
                      Entrada
                      <strong>
                        {shortTime(
                          assignment.expected_clock_in
                        )}
                      </strong>
                    </span>

                    <span>
                      Almoço
                      <strong>
                        {shortTime(
                          assignment.expected_break_start
                        )}
                      </strong>
                    </span>

                    <span>
                      Retorno
                      <strong>
                        {shortTime(
                          assignment.expected_break_end
                        )}
                      </strong>
                    </span>

                    <span>
                      Saída
                      <strong>
                        {shortTime(
                          assignment.expected_clock_out
                        )}
                      </strong>
                    </span>

                  </div>


                  {/* ROTEIRO SALVO */}

                  <div className="assignment-item__route">

                    <div className="assignment-item__route-title">

                      <Route
                        size={16}
                      />

                      <strong>
                        Roteiro
                      </strong>

                    </div>


                    {assignment.stops
                      ?.map(
                        stop => (

                          <div
                            key={
                              stop.id
                            }
                            className="assignment-item__stop"
                          >

                            <div className="assignment-item__stop-number">

                              {stop.sequence}

                            </div>


                            <div className="assignment-item__stop-content">

                              <strong>

                                {stop.location
                                  ?.name ||
                                  'Local não informado'
                                }

                              </strong>


                              {stop.location
                                ?.address && (

                                <span>

                                  <MapPin
                                    size={12}
                                  />

                                  {
                                    stop.location.address
                                  }

                                </span>

                              )}


                              {(stop.expected_arrival ||
                                stop.expected_departure) && (

                                <span>

                                  <Clock3
                                    size={12}
                                  />

                                  {shortTime(
                                    stop.expected_arrival
                                  )}

                                  {' — '}

                                  {shortTime(
                                    stop.expected_departure
                                  )}

                                </span>

                              )}


                              {stop.notes && (

                                <small>

                                  {stop.notes}

                                </small>

                              )}

                            </div>

                          </div>

                        )
                      )}

                  </div>


                  {assignment.notes && (

                    <p className="assignment-item__notes">

                      {assignment.notes}

                    </p>

                  )}

                </article>

              )
            )

          )}

        </section>

      </div>

    </main>
  )
}