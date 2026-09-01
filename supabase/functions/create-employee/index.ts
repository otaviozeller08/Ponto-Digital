import {
  createClient,
} from '@supabase/supabase-js'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',

  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',

  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
}


function jsonResponse(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
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


Deno.serve(
  async (
    request: Request
  ) => {

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
          success: false,

          error:
            'Método não permitido.',
        },
        405
      )
    }


    try {

      // ======================================================
      // VARIÁVEIS DO SUPABASE
      // ======================================================

      const supabaseUrl =
        Deno.env.get(
          'SUPABASE_URL'
        )


      const anonKey =
        Deno.env.get(
          'SUPABASE_ANON_KEY'
        )


      const serviceRoleKey =
        Deno.env.get(
          'SUPABASE_SERVICE_ROLE_KEY'
        )


      if (
        !supabaseUrl ||
        !anonKey ||
        !serviceRoleKey
      ) {
        throw new Error(
          'Configuração interna do Supabase incompleta.'
        )
      }


      // ======================================================
      // TOKEN DO USUÁRIO LOGADO
      // ======================================================

      const authorization =
        request.headers.get(
          'Authorization'
        )


      if (!authorization) {
        return jsonResponse(
          {
            success: false,

            error:
              'Usuário não autenticado.',
          },
          401
        )
      }


      // ======================================================
      // CLIENTE COM A SESSÃO DO ADMIN/RH
      // ======================================================

      const userClient =
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

            auth: {
              persistSession:
                false,

              autoRefreshToken:
                false,
            },
          }
        )


      // ======================================================
      // DESCOBRIR USUÁRIO ATUAL
      // ======================================================

      const {
        data: userData,
        error: userError,
      } =
        await userClient.auth.getUser()


      const currentUser =
        userData.user


      if (
        userError ||
        !currentUser
      ) {
        return jsonResponse(
          {
            success: false,

            error:
              'Sessão inválida ou expirada.',
          },
          401
        )
      }


      // ======================================================
      // PERFIL DO USUÁRIO ATUAL
      // ======================================================

      const {
        data: currentProfile,
        error: profileError,
      } =
        await userClient
          .from('profiles')
          .select(`
            id,
            company_id,
            role
          `)
          .eq(
            'id',
            currentUser.id
          )
          .single()


      if (
        profileError ||
        !currentProfile
      ) {
        throw new Error(
          'Perfil do usuário não encontrado.'
        )
      }


      // ======================================================
      // SOMENTE RH OU ADMIN
      // ======================================================

      if (
        ![
          'admin',
          'rh',
        ].includes(
          currentProfile.role
        )
      ) {
        return jsonResponse(
          {
            success: false,

            error:
              'Você não possui permissão para cadastrar funcionários.',
          },
          403
        )
      }


      // ======================================================
      // BODY
      // ======================================================

      const body =
        await request.json()


      const fullName =
        String(
          body?.fullName ??
          ''
        ).trim()


      const email =
        String(
          body?.email ??
          ''
        )
          .trim()
          .toLowerCase()


      const password =
        String(
          body?.password ??
          ''
        )


      const jobTitle =
        String(
          body?.jobTitle ??
          ''
        ).trim() ||
        null


      const role =
        String(
          body?.role ??
          'employee'
        )


      // ======================================================
      // VALIDAÇÕES
      // ======================================================

      if (!fullName) {
        throw new Error(
          'Informe o nome do funcionário.'
        )
      }


      if (!email) {
        throw new Error(
          'Informe o e-mail do funcionário.'
        )
      }


      if (
        !email.includes('@')
      ) {
        throw new Error(
          'Informe um e-mail válido.'
        )
      }


      if (
        password.length < 6
      ) {
        throw new Error(
          'A senha precisa ter pelo menos 6 caracteres.'
        )
      }


      if (
        ![
          'employee',
          'rh',
          'admin',
        ].includes(role)
      ) {
        throw new Error(
          'Perfil de acesso inválido.'
        )
      }


      // ======================================================
      // RH NÃO CRIA ADMIN
      // ======================================================

      if (
        role === 'admin' &&
        currentProfile.role !==
          'admin'
      ) {
        return jsonResponse(
          {
            success: false,

            error:
              'Somente um administrador pode criar outro administrador.',
          },
          403
        )
      }


      // ======================================================
      // CLIENTE ADMIN
      //
      // SERVICE ROLE FICA SOMENTE NA EDGE FUNCTION.
      // NUNCA VAI PARA O FRONTEND.
      // ======================================================

      const adminClient =
        createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              persistSession:
                false,

              autoRefreshToken:
                false,
            },
          }
        )


      // ======================================================
      // CRIAR USUÁRIO NO AUTH
      // ======================================================

      const {
        data: authData,
        error: createUserError,
      } =
        await adminClient
          .auth
          .admin
          .createUser({
            email,

            password,

            email_confirm:
              true,

            user_metadata: {
              full_name:
                fullName,

              role,
            },
          })


      if (
        createUserError ||
        !authData.user
      ) {
        throw new Error(
          createUserError?.message ||
          'Não foi possível criar o login.'
        )
      }


      const newUser =
        authData.user


      // ======================================================
      // AGORA CRIA PROFILE + EMPLOYEE
      // ======================================================

      try {

        // ====================================================
        // PROFILE
        // ====================================================

        const {
          error:
            insertProfileError,
        } =
          await adminClient
            .from('profiles')
            .upsert(
              {
                id:
                  newUser.id,

                company_id:
                  currentProfile.company_id,

                full_name:
                  fullName,

                role,

                active:
                  true,
              },
              {
                onConflict:
                  'id',
              }
            )


        if (
          insertProfileError
        ) {
          throw insertProfileError
        }


        // ====================================================
        // EMPLOYEE
        // ====================================================

        const {
          data: employee,
          error: employeeError,
        } =
          await adminClient
            .from('employees')
            .insert({
              user_id:
                newUser.id,

              company_id:
                currentProfile.company_id,

              full_name:
                fullName,

              job_title:
                jobTitle,

              status:
                'active',
            })
            .select()
            .single()


        if (
          employeeError
        ) {
          throw employeeError
        }


        // ====================================================
        // SUCESSO
        // ====================================================

        return jsonResponse(
          {
            success:
              true,

            employee,

            user: {
              id:
                newUser.id,

              email:
                newUser.email,
            },
          }
        )

      } catch (
        databaseError
      ) {

        console.error(
          'Erro após criação do Auth:',
          databaseError
        )


        // ====================================================
        // ROLLBACK DO AUTH
        //
        // Evita deixar um login órfão.
        // ====================================================

        await adminClient
          .auth
          .admin
          .deleteUser(
            newUser.id
          )


        throw databaseError
      }

    } catch (error) {

      console.error(
        'create-employee:',
        error
      )


      const message =
        error instanceof Error
          ? error.message
          : 'Erro interno ao cadastrar funcionário.'


      return jsonResponse(
        {
          success:
            false,

          error:
            message,
        },
        400
      )
    }
  }
)