import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Construction,
  MapPin,
  Plus,
  RefreshCw,
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

  return formatter.format(now)
}


function shortTime(value) {
  if (!value) {
    return '--:--'
  }

  return String(value).slice(
    0,
    5
  )
}


function getAssignmentLabel(type) {
  if (type === 'obra') {
    return 'Obra'
  }

  if (type === 'manutencao') {
    return 'Manutenção'
  }

  return 'Outro'
}


// ============================================================
// COMPONENTE
// ============================================================

export default function RHAssignmentsPage() {
  const [
    workDate,
    setWorkDate,
  ] =
    useState(getToday())


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
    locationId,
    setLocationId,
  ] =
    useState('')


  const [
    assignmentType,
    setAssignmentType,
  ] =
    useState('obra')


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
  // CARREGAR FUNCIONÁRIOS E LOCAIS
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
  // CARREGAR ALOCAÇÕES
  // ==========================================================

  async function loadAssignments() {
    try {
      setLoading(true)

      setError('')


      const data =
        await getAssignmentsByDate(
          workDate
        )


      setAssignments(data)
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
      setLoading(false)
    }
  }


  useEffect(() => {
    loadBaseData()
  }, [])


  useEffect(() => {
    if (workDate) {
      loadAssignments()
    }
  }, [workDate])


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave(event) {
    event.preventDefault()

    setMessage('')
    setError('')


    if (!selectedEmployee) {
      setError(
        'Selecione um funcionário.'
      )

      return
    }


    if (!locationId) {
      setError(
        'Selecione o local de trabalho.'
      )

      return
    }


    try {
      setSaving(true)


      await saveAssignment({
        employee:
          selectedEmployee,

        workDate,

        assignmentType,

        locationId,

        notes,
      })


      setMessage(
        'Alocação salva com sucesso.'
      )


      setEmployeeId('')
      setLocationId('')
      setNotes('')


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
      setSaving(false)
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
        'Deseja cancelar esta alocação?'
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


        {/* HEADER */}

        <header className="assignment-header">

          <div className="assignment-header__main">

            <Link
              to="/rh"
              className="assignment-icon-button"
            >
              <ArrowLeft size={20} />
            </Link>


            <div>

              <span className="assignment-eyebrow">
                Ponto Digital • RH
              </span>

              <h1>
                Alocações do dia
              </h1>

              <p>
                Defina onde e em qual
                jornada cada funcionário
                trabalhará.
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
            <RefreshCw size={20} />
          </button>

        </header>


        {/* DATA */}

        <section className="assignment-date-card">

          <CalendarDays size={20} />

          <div>

            <span>
              Data da programação
            </span>

            <input
              type="date"
              value={workDate}
              onChange={
                event =>
                  setWorkDate(
                    event.target.value
                  )
              }
            />

          </div>

        </section>


        {/* FORMULÁRIO */}

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
              value={employeeId}
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
                    key={employee.id}
                    value={employee.id}
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


          {/* HORÁRIOS */}

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


          {/* LOCAL */}

          <label className="assignment-field">

            <span>
              Local de trabalho
            </span>

            <select
              value={locationId}
              onChange={
                event =>
                  setLocationId(
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
                    key={location.id}
                    value={location.id}
                  >
                    {location.name}
                  </option>

                )
              )}

            </select>

          </label>


          {/* OBSERVAÇÃO */}

          <label className="assignment-field">

            <span>
              Observação
            </span>

            <textarea
              value={notes}
              placeholder="Ex.: manutenção preventiva no cliente..."
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
            disabled={saving}
          >

            <Plus size={19} />

            {saving
              ? 'Salvando...'
              : 'Salvar alocação'}

          </button>

        </form>


        {/* LISTAGEM */}

        <section className="assignment-list">

          <div className="assignment-list__header">

            <h2>
              Programação do dia
            </h2>

            <span>
              {assignments.length}
              {' '}
              alocação
              {assignments.length !== 1
                ? 'ões'
                : ''}
            </span>

          </div>


          {loading ? (

            <div className="assignment-empty">
              Carregando...
            </div>

          ) : assignments.length === 0 ? (

            <div className="assignment-empty">

              <Building2 size={28} />

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
                  key={assignment.id}
                  className="assignment-item"
                >

                  <div className="assignment-item__top">

                    <div className="assignment-avatar">

                      {assignment.employee
                        ?.full_name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        '?'}

                    </div>


                    <div className="assignment-item__employee">

                      <strong>
                        {
                          assignment.employee
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
                      <Trash2 size={17} />
                    </button>

                  </div>


                  <div className="assignment-item__details">

                    <span>

                      <MapPin size={15} />

                      {assignment.location
                        ?.name ||
                        'Sem local'}

                    </span>


                    <span>

                      <Clock3 size={15} />

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