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

  const {
    data: { claims }
  } = await supabase.auth.getClaims()

  const ruta = request.nextUrl.pathname
  const esRutaAdmin = ruta === '/admin' || ruta.startsWith('/admin/')
  const esLogin = ruta === '/admin/login'

  async function redirigir (destino: string) {
    const url = request.nextUrl.clone()
    url.pathname = destino
    url.search = ''

    const respuesta = NextResponse.redirect(url)

    response.cookies.getAll().forEach(cookie => {
      respuesta.cookies.set(cookie)
    })

    return respuesta
  }

  if (!esRutaAdmin) {
    return response
  }

  if (!claims?.sub) {
    if (esLogin) {
      return response
    }

    return redirigir('/admin/login')
  }

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

  if (esLogin) {
    return redirigir('/admin')
  }

  return response
}
