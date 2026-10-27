import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession (request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll () {
          return request.cookies.getAll()
        },

        setAll (cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  // Obtener los datos del token de forma segura para TypeScript.
  const { data, error: claimsError } = await supabase.auth.getClaims()

  const claims = claimsError ? null : data?.claims ?? null

  const ruta = request.nextUrl.pathname

  const esRutaAdmin = ruta === '/admin' || ruta.startsWith('/admin/')

  const esLogin = ruta === '/admin/login'

  async function redirigir (destino: string) {
    const url = request.nextUrl.clone()

    url.pathname = destino
    url.search = ''

    const respuesta = NextResponse.redirect(url)

    // Conservar las cookies de autenticación.
    response.cookies.getAll().forEach(cookie => {
      respuesta.cookies.set(cookie)
    })

    return respuesta
  }

  // Las demás rutas del sitio siguen funcionando normalmente.
  if (!esRutaAdmin) {
    return response
  }

  // Si no hay una identidad autenticada, solicitar el inicio de sesión.
  if (!claims?.sub) {
    if (esLogin) {
      return response
    }

    return redirigir('/admin/login')
  }

  // Comprobar que el usuario autenticado esté autorizado
  // para acceder al panel administrativo.
  const { data: administrador, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', claims.sub)
    .maybeSingle()

  if (error) {
    console.error('No se pudo verificar el acceso administrativo.')

    return redirigir('/')
  }

  if (!administrador) {
    return esLogin ? response : redirigir('/')
  }

  // Si ya inició sesión como administrador, evitar mostrar el login.
  if (esLogin) {
    return redirigir('/admin')
  }

  return response
}
