import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Hourglass,
  RefreshCw,
  UserRound,
  X,
  XCircle,
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
  getAdjustmentRequestsForRH,
  reviewAdjustmentRequest,
} from '../services/adjustmentService'

import './Adjustments.css'


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


function formatEntryType(type) {
  const labels = {
    clock_in:
      'Entrada',

    break_start:
      'Saída para intervalo',

    break_end:
      'Retorno',

    clock_out:
      'Saída',
  }


  return (
    labels[type] ||
    type
  )
}


function statusLabel(status) {
  if (
    status ===
    'approved'
  ) {
    return 'Aprovado'
  }


  if (
    status ===
    'rejected'
  ) {
    return 'Recusado'
  }


  return 'Pendente'
}


export default function RHAdjustmentsPage() {
  const [
    requests,
    setRequests,
  ] =
    useState([])


  const [
    loading,
    setLoading,
  ] =
    useState(true)


  const [
    savingId,
    setSavingId,
  ] =
    useState(null)


  const [
    filter,
    setFilter,
  ] =
    useState(
      'pending'
    )


  const [
    error,
    setError,
  ] =
    useState('')


  const [
    success,
    setSuccess,
  ] =
    useState('')


  async function loadRequests() {
    try {
      setLoading(true)

      setError('')


      const data =
        await getAdjustmentRequestsForRH()


      setRequests(
        data
      )
    } catch (err) {
      console.error(
        err
      )


      setError(
        err.message ||
        'Não foi possível carregar os ajustes.'
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadRequests()
  }, [])


  const filteredRequests =
    useMemo(
      () => {
        if (
          filter ===
          'all'
        ) {
          return requests
        }


        return requests.filter(
          request =>
            request.status ===
            filter
        )
      },
      [
        requests,
        filter,
      ]
    )


  async function handleReview(
    request,
    status
  ) {
    const action =
      status ===
      'approved'
        ? 'aprovar'
        : 'recusar'


    let reviewNotes =
      ''


    if (
      status ===
      'rejected'
    ) {
      reviewNotes =
        window.prompt(
          'Informe o motivo da recusa:'
        ) || ''


      if (
        !reviewNotes.trim()
      ) {
        return
      }
    } else {
      reviewNotes =
        window.prompt(
          'Observação do RH (opcional):'
        ) || ''
    }


    const confirmed =
      window.confirm(
        `Deseja ${action} esta solicitação?`
      )


    if (!confirmed) {
      return
    }


    try {
      setSavingId(
        request.id
      )

      setError('')
      setSuccess('')


      await reviewAdjustmentRequest({
        requestId:
          request.id,

        status,

        reviewNotes,
      })


      setSuccess(
        status ===
        'approved'
          ? 'Solicitação aprovada.'
          : 'Solicitação recusada.'
      )


      await loadRequests()
    } catch (err) {
      console.error(
        err
      )


      setError(
        err.message ||
        'Não foi possível revisar a solicitação.'
      )
    } finally {
      setSavingId(null)
    }
  }


  const pendingCount =
    requests.filter(
      request =>
        request.status ===
        'pending'
    ).length


  return (
    <main className="adjustment-page">

      <div className="adjustment-container">


        <header className="adjustment-header adjustment-header--between">

          <div className="adjustment-header__left">

            <Link
              to="/rh"
              className="adjustment-back"
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
                Ajustes de ponto
              </h1>

              <p>
                Analise solicitações
                enviadas pelos funcionários.
              </p>

            </div>

          </div>


          <button
            type="button"
            className="adjustment-refresh"
            onClick={
              loadRequests
            }
          >
            <RefreshCw
              size={19}
            />
          </button>

        </header>


        <section className="adjustment-summary">

          <Hourglass
            size={22}
          />

          <div>

            <span>
              Pendentes
            </span>

            <strong>
              {pendingCount}
            </strong>

          </div>

        </section>


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


        <div className="adjustment-filters">

          <button
            type="button"
            className={
              filter ===
              'pending'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFilter(
                'pending'
              )
            }
          >
            Pendentes
          </button>


          <button
            type="button"
            className={
              filter ===
              'approved'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFilter(
                'approved'
              )
            }
          >
            Aprovados
          </button>


          <button
            type="button"
            className={
              filter ===
              'rejected'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFilter(
                'rejected'
              )
            }
          >
            Recusados
          </button>


          <button
            type="button"
            className={
              filter ===
              'all'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFilter(
                'all'
              )
            }
          >
            Todos
          </button>

        </div>


        <section className="adjustment-card">

          <div className="adjustment-list-title">

            <h2>
              Solicitações
            </h2>

            <span>
              {filteredRequests.length}
            </span>

          </div>


          {loading ? (

            <div className="adjustment-empty">
              Carregando...
            </div>

          ) : filteredRequests.length ===
            0 ? (

            <div className="adjustment-empty">

              <CheckCircle2
                size={30}
              />

              <strong>
                Nenhuma solicitação
              </strong>

            </div>

          ) : (

            <div className="adjustment-list">

              {filteredRequests.map(
                request => (

                  <article
                    key={
                      request.id
                    }
                    className="adjustment-item"
                  >

                    <div className="adjustment-item__top">

                      <div className="adjustment-employee">

                        <div className="adjustment-avatar">

                          {request.employee
                            ?.full_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            '?'}

                        </div>


                        <div>

                          <strong>
                            {request.employee
                              ?.full_name ||
                              'Funcionário'}
                          </strong>

                          <span>
                            {request.employee
                              ?.job_title ||
                              'Cargo não informado'}
                          </span>

                        </div>

                      </div>


                      <span
                        className={
                          `adjustment-status adjustment-status--${request.status}`
                        }
                      >
                        {statusLabel(
                          request.status
                        )}
                      </span>

                    </div>


                    <div className="adjustment-request-grid">

                      <div>

                        <span>
                          Data
                        </span>

                        <strong>
                          {formatDate(
                            request.work_date
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Registro
                        </span>

                        <strong>
                          {formatEntryType(
                            request.entry_type
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Horário solicitado
                        </span>

                        <strong>

                          <Clock3
                            size={13}
                          />

                          {String(
                            request.requested_time
                          ).slice(
                            0,
                            5
                          )}

                        </strong>

                      </div>

                    </div>


                    <div className="adjustment-reason">

                      <span>
                        Motivo
                      </span>

                      <p>
                        {request.reason}
                      </p>

                    </div>


                    {request.review_notes && (

                      <div className="adjustment-review-note">

                        <strong>
                          Observação do RH
                        </strong>

                        <span>
                          {request.review_notes}
                        </span>

                      </div>

                    )}


                    {request.status ===
                      'pending' && (

                      <div className="adjustment-actions">

                        <button
                          type="button"
                          className="adjustment-reject-button"
                          disabled={
                            savingId ===
                            request.id
                          }
                          onClick={() =>
                            handleReview(
                              request,
                              'rejected'
                            )
                          }
                        >

                          <X
                            size={16}
                          />

                          Recusar

                        </button>


                        <button
                          type="button"
                          className="adjustment-approve-button"
                          disabled={
                            savingId ===
                            request.id
                          }
                          onClick={() =>
                            handleReview(
                              request,
                              'approved'
                            )
                          }
                        >

                          <Check
                            size={16}
                          />

                          Aprovar

                        </button>

                      </div>

                    )}

                  </article>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  )
}