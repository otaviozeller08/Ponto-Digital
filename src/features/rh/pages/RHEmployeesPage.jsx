import {
  ArrowLeft,
  Briefcase,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
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
  createEmployee,
  getEmployees,
} from '../services/employeeService'

import './RHEmployeesPage.css'


// ============================================================
// LABEL DO PERFIL
// ============================================================

function getRoleLabel(role) {
  switch (role) {
    case 'admin':
      return 'Administrador'

    case 'rh':
      return 'RH'

    default:
      return 'Funcionário'
  }
}


// ============================================================
// COMPONENTE
// ============================================================

export default function RHEmployeesPage() {
  const [
    employees,
    setEmployees,
  ] = useState([])


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    saving,
    setSaving,
  ] = useState(false)


  const [
    modalOpen,
    setModalOpen,
  ] = useState(false)


  const [
    search,
    setSearch,
  ] = useState('')


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
    email: '',
    password: '',
    jobTitle: '',
    role: 'employee',
  })


  // ==========================================================
  // CARREGAR FUNCIONÁRIOS
  // ==========================================================

  async function loadEmployees() {
    try {
      setLoading(true)
      setError('')


      const data =
        await getEmployees()


      setEmployees(
        data
      )
    } catch (err) {
      console.error(
        'Erro ao carregar funcionários:',
        err
      )


      setError(
        err.message ||
        'Não foi possível carregar os funcionários.'
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadEmployees()
  }, [])


  // ==========================================================
  // BUSCA
  // ==========================================================

  const filteredEmployees =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase()


        if (!term) {
          return employees
        }


        return employees.filter(
          employee => {

            const name =
              employee.full_name
                ?.toLowerCase() ||
              ''


            const job =
              employee.job_title
                ?.toLowerCase() ||
              ''


            const role =
              employee.profile?.role
                ?.toLowerCase() ||
              ''


            return (
              name.includes(term) ||
              job.includes(term) ||
              role.includes(term)
            )
          }
        )
      },
      [
        employees,
        search,
      ]
    )


  // ==========================================================
  // FUNCIONÁRIOS ATIVOS
  // ==========================================================

  const activeEmployees =
    useMemo(
      () =>
        employees.filter(
          employee =>
            employee.status ===
            'active'
        ).length,
      [
        employees,
      ]
    )


  // ==========================================================
  // FORM
  // ==========================================================

  function updateForm(
    field,
    value
  ) {
    setForm(
      current => ({
        ...current,

        [field]:
          value,
      })
    )
  }


  function resetForm() {
    setForm({
      fullName: '',
      email: '',
      password: '',
      jobTitle: '',
      role: 'employee',
    })
  }


  function openModal() {
    setError('')
    setSuccess('')

    resetForm()

    setModalOpen(true)
  }


  function closeModal() {
    if (saving) {
      return
    }


    setModalOpen(false)

    setError('')

    resetForm()
  }


  // ==========================================================
  // CADASTRAR FUNCIONÁRIO
  // ==========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')


    if (!form.fullName.trim()) {
      setError(
        'Informe o nome do funcionário.'
      )

      return
    }


    if (!form.email.trim()) {
      setError(
        'Informe o e-mail do funcionário.'
      )

      return
    }


    if (
      !form.password ||
      form.password.length < 6
    ) {
      setError(
        'A senha precisa ter pelo menos 6 caracteres.'
      )

      return
    }


    try {
      setSaving(true)


      await createEmployee({
        fullName:
          form.fullName.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        password:
          form.password,

        jobTitle:
          form.jobTitle.trim(),

        role:
          form.role,
      })


      setModalOpen(false)

      resetForm()


      await loadEmployees()


      setSuccess(
        'Funcionário cadastrado com sucesso.'
      )
    } catch (err) {
      console.error(
        'Erro ao cadastrar funcionário:',
        err
      )


      setError(
        err.message ||
        'Não foi possível cadastrar o funcionário.'
      )
    } finally {
      setSaving(false)
    }
  }


  return (
    <main className="rh-employees-page">

      <div className="rh-employees-page__container">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="rh-employees-header">

          <div className="rh-employees-header__main">

            <Link
              to="/rh"
              className="rh-employees-icon-button"
              title="Voltar para o RH"
            >
              <ArrowLeft
                size={20}
              />
            </Link>


            <div>

              <span className="rh-employees-eyebrow">
                Ponto Digital • RH
              </span>


              <h1>
                Funcionários
              </h1>


              <p>
                Gerencie os acessos e
                funcionários da empresa.
              </p>

            </div>

          </div>


          <button
            type="button"
            className="rh-employees-icon-button"
            title="Atualizar funcionários"
            onClick={
              loadEmployees
            }
          >
            <RefreshCw
              size={20}
            />
          </button>

        </header>


        {/* ====================================================
            RESUMO
        ==================================================== */}

        <section className="rh-employees-summary">

          <div className="rh-employees-summary__icon">

            <Users
              size={24}
            />

          </div>


          <div>

            <span>
              Funcionários ativos
            </span>


            <strong>
              {activeEmployees}
            </strong>

          </div>

        </section>


        {/* ====================================================
            BUSCA + NOVO FUNCIONÁRIO
        ==================================================== */}

        <section className="rh-employees-toolbar">

          <div className="rh-employees-search">

            <Search
              size={18}
            />


            <input
              type="search"
              value={
                search
              }
              placeholder="Buscar funcionário..."
              onChange={
                event =>
                  setSearch(
                    event.target.value
                  )
              }
            />

          </div>


          <button
            type="button"
            className="rh-employees-add"
            onClick={
              openModal
            }
          >

            <Plus
              size={19}
            />

            Novo funcionário

          </button>

        </section>


        {/* ====================================================
            MENSAGENS
        ==================================================== */}

        {success && (

          <div className="point-message point-message--success">
            {success}
          </div>

        )}


        {!modalOpen &&
          error && (

            <div className="point-message point-message--error">
              {error}
            </div>

          )}


        {/* ====================================================
            LISTA
        ==================================================== */}

        <section className="rh-employees-list">

          {loading ? (

            <div className="rh-employees-empty">

              <Users
                size={28}
              />

              <strong>
                Carregando funcionários...
              </strong>

            </div>

          ) : filteredEmployees.length ===
            0 ? (

            <div className="rh-employees-empty">

              <Users
                size={30}
              />


              <strong>
                Nenhum funcionário encontrado
              </strong>


              <span>
                Cadastre um funcionário
                ou altere sua busca.
              </span>

            </div>

          ) : (

            filteredEmployees.map(
              employee => {

                const role =
                  employee.profile?.role ||
                  'employee'


                const active =
                  employee.status ===
                  'active'


                const initial =
                  employee.full_name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                  '?'


                return (

                  <Link
                    key={
                      employee.id
                    }
                    to={
                      `/rh/funcionarios/${employee.id}`
                    }
                    className="
                      rh-employee-management-card
                      rh-employee-management-card--link
                    "
                  >

                    {/* ========================================
                        TOPO DO CARD
                    ======================================== */}

                    <div className="rh-employee-management-card__top">


                      <div className="rh-employee-management-avatar">

                        {initial}

                      </div>


                      <div className="rh-employee-management-info">

                        <strong>
                          {employee.full_name}
                        </strong>


                        <span>

                          <Briefcase
                            size={13}
                          />

                          {employee.job_title ||
                            'Cargo não informado'}

                        </span>

                      </div>


                      <span
                        className={
                          `rh-employee-role rh-employee-role--${role}`
                        }
                      >

                        {getRoleLabel(
                          role
                        )}

                      </span>

                    </div>


                    {/* ========================================
                        FOOTER DO CARD
                    ======================================== */}

                    <div className="rh-employee-management-footer">

                      <span>

                        <ShieldCheck
                          size={14}
                        />

                        {active
                          ? 'Ativo'
                          : 'Inativo'}

                      </span>

                    </div>

                  </Link>

                )
              }
            )

          )}

        </section>


        {/* ====================================================
            MODAL NOVO FUNCIONÁRIO
        ==================================================== */}

        {modalOpen && (

          <div className="rh-employee-modal-backdrop">


            <div className="rh-employee-modal">


              {/* ==============================================
                  HEADER DO MODAL
              ============================================== */}

              <div className="rh-employee-modal__header">

                <div>

                  <span>
                    Ponto Digital
                  </span>


                  <h2>
                    Novo funcionário
                  </h2>

                </div>


                <button
                  type="button"
                  title="Fechar"
                  onClick={
                    closeModal
                  }
                >
                  <X
                    size={20}
                  />
                </button>

              </div>


              {/* ==============================================
                  FORM
              ============================================== */}

              <form
                onSubmit={
                  handleSubmit
                }
              >


                {/* NOME */}

                <label className="rh-employee-field">

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
                      autoComplete="name"
                      value={
                        form.fullName
                      }
                      placeholder="Nome do funcionário"
                      onChange={
                        event =>
                          updateForm(
                            'fullName',
                            event.target.value
                          )
                      }
                    />

                  </div>

                </label>


                {/* EMAIL */}

                <label className="rh-employee-field">

                  <span>
                    E-mail
                  </span>


                  <div>

                    <Mail
                      size={17}
                    />


                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={
                        form.email
                      }
                      placeholder="funcionario@sinalert.com.br"
                      onChange={
                        event =>
                          updateForm(
                            'email',
                            event.target.value
                          )
                      }
                    />

                  </div>

                </label>


                {/* SENHA */}

                <label className="rh-employee-field">

                  <span>
                    Senha inicial
                  </span>


                  <input
                    className="rh-employee-simple-input"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={
                      form.password
                    }
                    placeholder="Mínimo 6 caracteres"
                    onChange={
                      event =>
                        updateForm(
                          'password',
                          event.target.value
                        )
                    }
                  />

                </label>


                {/* CARGO */}

                <label className="rh-employee-field">

                  <span>
                    Cargo
                  </span>


                  <input
                    className="rh-employee-simple-input"
                    type="text"
                    value={
                      form.jobTitle
                    }
                    placeholder="Ex.: Aux. de instalação"
                    onChange={
                      event =>
                        updateForm(
                          'jobTitle',
                          event.target.value
                        )
                    }
                  />

                </label>


                {/* PERFIL */}

                <label className="rh-employee-field">

                  <span>
                    Perfil de acesso
                  </span>


                  <select
                    className="rh-employee-simple-input"
                    value={
                      form.role
                    }
                    onChange={
                      event =>
                        updateForm(
                          'role',
                          event.target.value
                        )
                    }
                  >

                    <option value="employee">
                      Funcionário
                    </option>


                    <option value="rh">
                      RH
                    </option>


                    <option value="admin">
                      Administrador
                    </option>

                  </select>

                </label>


                {/* ERRO DO MODAL */}

                {error && (

                  <div className="point-message point-message--error">
                    {error}
                  </div>

                )}


                {/* SALVAR */}

                <button
                  type="submit"
                  className="rh-employee-submit"
                  disabled={
                    saving
                  }
                >

                  <Plus
                    size={18}
                  />


                  {saving
                    ? 'Cadastrando...'
                    : 'Cadastrar funcionário'}

                </button>

              </form>

            </div>

          </div>

        )}


      </div>

    </main>
  )
}