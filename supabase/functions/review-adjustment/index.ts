import {
  createClient,
} from 'npm:@supabase/supabase-js@2'


const corsHeaders = {
  'Access-Control-Allow-Origin':
    '*',

  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',

  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
}


// ============================================================
// RESPOSTA JSON
// ============================================================

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(
      body
    ),
    {
      status,

      headers: {
        ...corsHeaders,

        'Content-Type':
          'application/json',
      },
    }
  )
}


// ============================================================
// EDGE FUNCTION
// ============================================================

Deno.serve(
  async request => {

    // ========================================================
    // CORS
    // ========================================================

    if (
      request.method ===
      'OPTIONS'
    ) {
      return new Response(
        'ok',
        {
          headers:
            corsHeaders,
        }
      )
    }


    if (
      request.method !==
      'POST'
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            'Método não permitido.',
        },
        405
      )
    }


    try {

      // ======================================================
      // VARIÁVEIS
      // ======================================================

      const supabaseUrl =
        Deno.env.get(
          'SUPABASE_URL'
        )


      const anonKey =
        Deno.env.get(
          'SUPABASE_ANON_KEY'
        )


      if (
        !supabaseUrl ||
        !anonKey
      ) {
        throw new Error(
          'Configuração do Supabase incompleta.'
        )
      }


      // ======================================================
      // TOKEN DO USUÁRIO
      // ======================================================

      const authorization =
        request.headers.get(
          'Authorization'
        )


      if (!authorization) {
        throw new Error(
          'Usuário não autenticado.'
        )
      }


      // ======================================================
      // CLIENTE COM A SESSÃO DO RH/ADMIN
      // ======================================================

      const supabase =
        createClient(
          supabaseUrl,
          anonKey,
          {
            global: {
              headers: {
                Authorization:
                  authorization,
              },
            },
          }
        )


      // ======================================================
      // VALIDAR USUÁRIO
      // ======================================================

      const {
        data: {
          user,
        },

        error:
          userError,
      } =
        await supabase
          .auth
          .getUser()


      if (
        userError ||
        !user
      ) {
        throw new Error(
          'Sessão inválida.'
        )
      }


      // ======================================================
      // BODY
      // ======================================================

      const body =
        await request.json()


      const requestId =
        body.requestId


      const status =
        body.status


      const reviewNotes =
        body.reviewNotes ||
        null


      if (!requestId) {
        throw new Error(
          'Informe a solicitação.'
        )
      }


      if (
        ![
          'approved',
          'rejected',
        ].includes(
          status
        )
      ) {
        throw new Error(
          'Status inválido.'
        )
      }


      // ======================================================
      // RPC
      //
      // TODA A ALTERAÇÃO DO PONTO ACONTECE
      // DENTRO DE UMA TRANSAÇÃO NO POSTGRES.
      // ======================================================

      const {
        data,
        error,
      } =
        await supabase.rpc(
          'review_adjustment_request',
          {
            p_request_id:
              requestId,

            p_status:
              status,

            p_review_notes:
              reviewNotes,
          }
        )


      if (error) {
        throw error
      }


      return jsonResponse(
        {
          success:
            true,

          result:
            data,
        }
      )

    } catch (error) {

      console.error(
        'review-adjustment:',
        error
      )


      return jsonResponse(
        {
          success:
            false,

          error:
            error instanceof Error
              ? error.message
              : 'Erro interno ao revisar ajuste.',
        },
        400
      )
    }
  }
)