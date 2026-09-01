import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Construction,
  MapPin,
  Pencil,
  Power,
  Save,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useParams,
} from 'react-router-dom'

import {
  getEmployeeAssignment,
  getEmployeeById,
  setEmployeeStatus,
  updateEmployee,
} from '../services/employeeService'

import './RHEmployeeDetailPage.css'


// ============================================================
// DATA DE HOJE
// ============================================================

function getToday() {
  return new Intl.DateTimeFormat(
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
  ).format(
    new Date()
  )
}


// ============================================================
// FORMATAR HORÁRIO
// ============================================================

function shortTime(value) {
  if (!value) {
    return '--:--'
  }

  return String(value).slice(
    0,
    5
  )
}


// ============================================================
// LABEL DO PERFIL
// ============================================================

function roleLabel(role) {
  if (role === 'admin') {
    return 'Administrador'
  }

  if (role === 'rh') {
    return 'RH'
  }

  return 'Funcionário'
}


// ============================================================
// COMPONENTE
// ============================================================

export default function RHEmployeeDetailPage() {
  const {
    employeeId,
  } = useParams()


  const [
    employee,
    setEmployee,
  ] = useState(null)


  const [
    assignment,
    setAssignment,
  ] = useState(null)


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    saving,
    setSaving,
  ] = useState(false)


  const [
    editing,
    setEditing,
  ] = useState(false)


  const [
    error,
    setError,
  ] = useState('')


  const [
    success,
    setSuccess,
  ] = useState('')


  const [
    form,
    setForm,
  ] = useState({
    fullName: '',
    jobTitle: '',
  })


  // ==========================================================
  // CARREGAR FUNCIONÁRIO
  // ==========================================================

  async function loadEmployee() {
    try {
      setLoading(true)
      setError('')


      const [
        employeeData,
        assignmentData,
      ] =
        await Promise.all([
          getEmployeeById(
            employeeId
          ),

          getEmployeeAssignment(
            employeeId,
            getToday()
          ),
        ])


      setEmployee(
        employeeData
      )


      setAssignment(
        assignmentData
      )


      setForm({
        fullName:
          employeeData.full_name ||
          '',

        jobTitle:
          employeeData.job_title ||
          '',
      })
    } catch (err) {
      console.error(
        'Erro ao carregar funcionário:',
        err
      )


      setError(
        err.message ||
        'Não foi possível carregar o funcionário.'
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadEmployee()
  }, [employeeId])


  // ==========================================================
  // SALVAR ALTERAÇÕES
  // ==========================================================

  async function handleSave(
    event
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')


    if (
      !form.fullName.trim()
    ) {
      setError(
        'Informe o nome do funcionário.'
      )

      return
    }


    try {
      setSaving(true)


      await updateEmployee({
        employeeId:
          employee.id,

        userId:
          employee.user_id,

        fullName:
          form.fullName,

        jobTitle:
          form.jobTitle,
      })


      setEditing(false)


      await loadEmployee()


      setSuccess(
        'Dados atualizados com sucesso.'
      )
    } catch (err) {
      console.error(
        'Erro ao atualizar funcionário:',
        err
      )


      setError(
        err.message ||
        'Não foi possível atualizar o funcionário.'
      )
    } finally {
      setSaving(false)
    }
  }


  // ==========================================================
  // ATIVAR / DESATIVAR
  // ==========================================================

  async function handleStatus() {
    const isActive =
      employee.status ===
      'active'


    const action =
      isActive
        ? 'desativar'
        : 'reativar'


    const confirmed =
      window.confirm(
        `Deseja realmente ${action} este funcionário?`
      )


    if (!confirmed) {
      return
    }


    try {
      setSaving(true)
      setError('')
      setSuccess('')


      await setEmployeeStatus({
        employeeId:
          employee.id,

        userId:
          employee.user_id,

        active:
          !isActive,
      })


      await loadEmployee()


      setSuccess(
        isActive
          ? 'Funcionário desativado.'
          : 'Funcionário reativado.'
      )
    } catch (err) {
      console.error(
        'Erro ao alterar status:',
        err
      )


      setError(
        err.message ||
        'Não foi possível alterar o status.'
      )
    } finally {
      setSaving(false)
    }
  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="point-loading-page">

        <span className="point-loading-spinner" />

        <strong>
          Carregando funcionário...
        </strong>

      </main>
    )
  }


  // ==========================================================
  // ERRO
  // ==========================================================

  if (
    error &&
    !employee
  ) {
    return (
      <main className="point-loading-page">

        <div className="point-message point-message--error">
          {error}
        </div>

      </main>
    )
  }


  if (!employee) {
    return (
      <main className="point-loading-page">

        <div className="point-message point-message--error">
          Funcionário não encontrado.
        </div>

      </main>
    )
  }


  const active =
    employee.status ===
    'active'


  const isObra =
    assignment?.assignment_type ===
    'obra'


  const AssignmentIcon =
    isObra
      ? Construction
      : Wrench


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="rh-employee-detail-page">

      <div className="rh-employee-detail-container">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="rh-detail-header">

          <div className="rh-detail-header__left">

            <Link
              to="/rh/funcionarios"
              className="rh-detail-icon-button"
              title="Voltar"
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
                Funcionário
              </h1>


              <p>
                Dados, acesso e jornada.
              </p>

            </div>

          </div>

        </header>


        {/* ====================================================
            PERFIL
        ==================================================== */}

        <section className="rh-detail-profile-card">

          <div className="rh-detail-avatar">

            {employee.full_name
              ?.charAt(0)
              ?.toUpperCase() ||
              '?'}

          </div>


          <div className="rh-detail-profile-main">

            <h2>
              {employee.full_name}
            </h2>


            <span>

              <BriefcaseBusiness
                size={14}
              />

              {employee.job_title ||
                'Cargo não informado'}

            </span>

          </div>


          <div className="rh-detail-badges">

            <span
              className={
                `rh-detail-status ${
                  active
                    ? 'rh-detail-status--active'
                    : 'rh-detail-status--inactive'
                }`
              }
            >

              <CheckCircle2
                size={13}
              />

              {active
                ? 'Ativo'
                : 'Inativo'}

            </span>


            <span className="rh-detail-role">

              <ShieldCheck
                size={13}
              />

              {roleLabel(
                employee.profile?.role
              )}

            </span>

          </div>

        </section>


        {/* ====================================================
            MENSAGENS
        ==================================================== */}

        {error && (

          <div className="point-message point-message--error">
            {error}
          </div>

        )}


        {success && (

          <div className="point-message point-message--success">
            {success}
          </div>

        )}


        {/* ====================================================
            DADOS
        ==================================================== */}

        <section className="rh-detail-section">

          <div className="rh-detail-section__header">

            <div>

              <h2>
                Dados do funcionário
              </h2>


              <span>
                Informações principais
                do cadastro.
              </span>

            </div>


            {!editing ? (

              <button
                type="button"
                className="rh-detail-secondary-button"
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setEditing(true)
                }}
              >

                <Pencil
                  size={16}
                />

                Editar

              </button>

            ) : (

              <button
                type="button"
                className="rh-detail-icon-button"
                onClick={() => {

                  setEditing(false)

                  setForm({
                    fullName:
                      employee.full_name ||
                      '',

                    jobTitle:
                      employee.job_title ||
                      '',
                  })
                }}
              >

                <X
                  size={18}
                />

              </button>

            )}

          </div>


          {editing ? (

            <form
              className="rh-detail-form"
              onSubmit={
                handleSave
              }
            >

              {/* NOME */}

              <label>

                <span>
                  Nome completo
                </span>


                <div>

                  <UserRound
                    size={17}
                  />


                  <input
                    type="text"
                    required
                    value={
                      form.fullName
                    }
                    onChange={
                      event =>
                        setForm(
                          current => ({
                            ...current,

                            fullName:
                              event.target.value,
                          })
                        )
                    }
                  />

                </div>

              </label>


              {/* CARGO */}

              <label>

                <span>
                  Cargo
                </span>


                <div>

                  <BriefcaseBusiness
                    size={17}
                  />


                  <input
                    type="text"
                    value={
                      form.jobTitle
                    }
                    placeholder="Cargo do funcionário"
                    onChange={
                      event =>
                        setForm(
                          current => ({
                            ...current,

                            jobTitle:
                              event.target.value,
                          })
                        )
                    }
                  />

                </div>

              </label>


              <button
                type="submit"
                className="rh-detail-primary-button"
                disabled={
                  saving
                }
              >

                <Save
                  size={17}
                />

                {saving
                  ? 'Salvando...'
                  : 'Salvar alterações'}

              </button>

            </form>

          ) : (

            <div className="rh-detail-info-grid">

              <div>

                <span>
                  Nome
                </span>

                <strong>
                  {employee.full_name}
                </strong>

              </div>


              <div>

                <span>
                  Cargo
                </span>

                <strong>
                  {employee.job_title ||
                    'Não informado'}
                </strong>

              </div>


              <div>

                <span>
                  Perfil
                </span>

                <strong>
                  {roleLabel(
                    employee.profile?.role
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Status
                </span>

                <strong>
                  {active
                    ? 'Ativo'
                    : 'Inativo'}
                </strong>

              </div>

            </div>

          )}

        </section>


        {/* ====================================================
            ATIVIDADE DO DIA
        ==================================================== */}

        <section className="rh-detail-section">

          <div className="rh-detail-section__header">

            <div>

              <h2>
                Atividade de hoje
              </h2>


              <span>
                Programação atual do
                funcionário.
              </span>

            </div>


            <CalendarDays
              size={20}
            />

          </div>


          {!assignment ? (

            <div className="rh-detail-no-assignment">

              <CalendarDays
                size={25}
              />


              <strong>
                Sem alocação para hoje
              </strong>


              <span>
                Defina uma obra ou manutenção
                para este funcionário.
              </span>

            </div>

          ) : (

            <div className="rh-detail-assignment">


              {/* TIPO */}

              <div className="rh-detail-assignment__top">

                <div className="rh-detail-assignment-icon">

                  <AssignmentIcon
                    size={22}
                  />

                </div>


                <div>

                  <span>
                    Atividade
                  </span>


                  <strong>
                    {isObra
                      ? 'Obra'
                      : 'Manutenção'}
                  </strong>

                </div>

              </div>


              {/* LOCAL */}

              <div className="rh-detail-assignment-location">

                <MapPin
                  size={17}
                />


                <div>

                  <strong>
                    {assignment.location?.name ||
                      'Local não informado'}
                  </strong>


                  {assignment.location?.address && (

                    <span>
                      {assignment.location.address}
                    </span>

                  )}

                </div>

              </div>


              {/* HORÁRIOS */}

              <div className="rh-detail-schedule">

                <div>

                  <span>
                    Entrada
                  </span>

                  <strong>
                    {shortTime(
                      assignment.expected_clock_in
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Almoço
                  </span>

                  <strong>
                    {shortTime(
                      assignment.expected_break_start
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Retorno
                  </span>

                  <strong>
                    {shortTime(
                      assignment.expected_break_end
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Saída
                  </span>

                  <strong>
                    {shortTime(
                      assignment.expected_clock_out
                    )}
                  </strong>

                </div>

              </div>

            </div>

          )}


          {/* ==================================================
              ESPELHO DE PONTO
          ================================================== */}

          <Link
            to={
              `/rh/funcionarios/${employee.id}/historico`
            }
            className="rh-detail-primary-button"
          >

            <Clock3
              size={17}
            />

            Ver espelho de ponto

          </Link>


          {/* ==================================================
              ALOCAÇÕES
          ================================================== */}

          <Link
            to="/rh/alocacoes"
            className="rh-detail-primary-button"
          >

            <CalendarDays
              size={17}
            />

            Gerenciar alocações

          </Link>

        </section>


        {/* ====================================================
            ATIVAR / DESATIVAR
        ==================================================== */}

        <section className="rh-detail-danger-section">

          <div>

            <strong>
              {active
                ? 'Desativar funcionário'
                : 'Reativar funcionário'}
            </strong>


            <span>

              {active
                ? 'Ao desativar, o funcionário deixa de ser considerado ativo no sistema de ponto.'
                : 'Reative o funcionário para permitir novamente o uso normal do sistema.'}

            </span>

          </div>


          <button
            type="button"
            className={
              active
                ? 'rh-detail-danger-button'
                : 'rh-detail-reactivate-button'
            }
            disabled={
              saving
            }
            onClick={
              handleStatus
            }
          >

            <Power
              size={17}
            />

            {active
              ? 'Desativar'
              : 'Reativar'}

          </button>

        </section>


      </div>

    </main>
  )
}