import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Hourglass,
  Send,
  XCircle,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  createAdjustmentRequest,
  getMyAdjustmentRequests,
} from '../services/adjustmentService'

import './Adjustments.css'


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
      'Retorno do intervalo',

    clock_out:
      'Saída',
  }


  return (
    labels[type] ||
    type
  )
}


function statusData(status) {
  if (
    status ===
    'approved'
  ) {
    return {
      label:
        'Aprovado',

      className:
        'adjustment-status--approved',

      Icon:
        CheckCircle2,
    }
  }


  if (
    status ===
    'rejected'
  ) {
    return {
      label:
        'Recusado',

      className:
        'adjustment-status--rejected',

      Icon:
        XCircle,
    }
  }


  return {
    label:
      'Pendente',

    className:
      'adjustment-status--pending',

    Icon:
      Hourglass,
  }
}


export default function EmployeeAdjustmentsPage() {
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
    saving,
    setSaving,
  ] =
    useState(false)


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


  const [
    form,
    setForm,
  ] =
    useState({
      workDate:
        getToday(),

      entryType:
        'clock_in',

      requestedTime:
        '',

      reason:
        '',
    })


  async function loadRequests() {
    try {
      setLoading(true)

      setError('')


      const data =
        await getMyAdjustmentRequests()


      setRequests(
        data
      )
    } catch (err) {
      console.error(
        err
      )


      setError(
        err.message ||
        'Não foi possível carregar suas solicitações.'
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadRequests()
  }, [])


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


  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')


    if (
      !form.workDate
    ) {
      setError(
        'Informe a data.'
      )

      return
    }


    if (
      !form.requestedTime
    ) {
      setError(
        'Informe o horário desejado.'
      )

      return
    }


    if (
      form.reason
        .trim()
        .length <
      5
    ) {
      setError(
        'Explique o motivo do ajuste.'
      )

      return
    }


    try {
      setSaving(true)


      await createAdjustmentRequest({
        workDate:
          form.workDate,

        entryType:
          form.entryType,

        requestedTime:
          form.requestedTime,

        reason:
          form.reason,
      })


      setForm({
        workDate:
          getToday(),

        entryType:
          'clock_in',

        requestedTime:
          '',

        reason:
          '',
      })


      setSuccess(
        'Solicitação enviada para o RH.'
      )


      await loadRequests()
    } catch (err) {
      console.error(
        err
      )


      setError(
        err.message ||
        'Não foi possível enviar a solicitação.'
      )
    } finally {
      setSaving(false)
    }
  }


  return (
    <main className="adjustment-page">

      <div className="adjustment-container">


        <header className="adjustment-header">

          <Link
            to="/app"
            className="adjustment-back"
          >
            <ArrowLeft
              size={20}
            />
          </Link>


          <div>

            <span>
              Ponto Digital
            </span>

            <h1>
              Ajuste de ponto
            </h1>

            <p>
              Solicite a correção de
              um registro esquecido
              ou incorreto.
            </p>

          </div>

        </header>


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


        <section className="adjustment-card">

          <div className="adjustment-section-title">

            <FilePenLine
              size={20}
            />


            <div>

              <h2>
                Nova solicitação
              </h2>

              <span>
                Informe o registro
                que precisa ser corrigido.
              </span>

            </div>

          </div>


          <form
            className="adjustment-form"
            onSubmit={
              handleSubmit
            }
          >

            <label>

              <span>
                Data
              </span>

              <div>

                <CalendarDays
                  size={17}
                />

                <input
                  type="date"
                  value={
                    form.workDate
                  }
                  onChange={
                    event =>
                      updateForm(
                        'workDate',
                        event.target.value
                      )
                  }
                />

              </div>

            </label>


            <label>

              <span>
                Registro
              </span>

              <select
                value={
                  form.entryType
                }
                onChange={
                  event =>
                    updateForm(
                      'entryType',
                      event.target.value
                    )
                }
              >

                <option value="clock_in">
                  Entrada
                </option>

                <option value="break_start">
                  Saída para intervalo
                </option>

                <option value="break_end">
                  Retorno do intervalo
                </option>

                <option value="clock_out">
                  Saída
                </option>

              </select>

            </label>


            <label>

              <span>
                Horário correto
              </span>

              <div>

                <Clock3
                  size={17}
                />

                <input
                  type="time"
                  value={
                    form.requestedTime
                  }
                  onChange={
                    event =>
                      updateForm(
                        'requestedTime',
                        event.target.value
                      )
                  }
                />

              </div>

            </label>


            <label>

              <span>
                Motivo
              </span>

              <textarea
                rows={4}
                value={
                  form.reason
                }
                placeholder="Ex.: esqueci de registrar minha saída."
                onChange={
                  event =>
                    updateForm(
                      'reason',
                      event.target.value
                    )
                }
              />

            </label>


            <button
              type="submit"
              className="adjustment-primary-button"
              disabled={
                saving
              }
            >

              <Send
                size={17}
              />

              {saving
                ? 'Enviando...'
                : 'Enviar solicitação'}

            </button>

          </form>

        </section>


        <section className="adjustment-card">

          <div className="adjustment-list-title">

            <h2>
              Minhas solicitações
            </h2>

            <span>
              {requests.length}
            </span>

          </div>


          {loading ? (

            <div className="adjustment-empty">
              Carregando...
            </div>

          ) : requests.length ===
            0 ? (

            <div className="adjustment-empty">

              <FilePenLine
                size={28}
              />

              <strong>
                Nenhuma solicitação
              </strong>

              <span>
                Seus pedidos de ajuste
                aparecerão aqui.
              </span>

            </div>

          ) : (

            <div className="adjustment-list">

              {requests.map(
                request => {

                  const {
                    label,
                    className,
                    Icon,
                  } =
                    statusData(
                      request.status
                    )


                  return (

                    <article
                      key={
                        request.id
                      }
                      className="adjustment-item"
                    >

                      <div className="adjustment-item__top">

                        <div>

                          <strong>
                            {formatDate(
                              request.work_date
                            )}
                          </strong>

                          <span>
                            {formatEntryType(
                              request.entry_type
                            )}
                            {' • '}
                            {String(
                              request.requested_time
                            ).slice(
                              0,
                              5
                            )}
                          </span>

                        </div>


                        <span
                          className={
                            `adjustment-status ${className}`
                          }
                        >

                          <Icon
                            size={13}
                          />

                          {label}

                        </span>

                      </div>


                      <p>
                        {request.reason}
                      </p>


                      {request.review_notes && (

                        <div className="adjustment-review-note">

                          <strong>
                            Resposta do RH
                          </strong>

                          <span>
                            {request.review_notes}
                          </span>

                        </div>

                      )}

                    </article>

                  )
                }
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  )
}