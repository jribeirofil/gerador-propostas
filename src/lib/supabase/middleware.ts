import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                       request.nextUrl.pathname.startsWith('/cadastro')
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isSetupRoute = request.nextUrl.pathname === '/dashboard/criar-empresa'

  // Não logado tentando acessar o dashboard → manda para o login
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Já logado tentando acessar login/cadastro → manda para o dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Logado, no dashboard, mas sem organização
  if (user && isDashboardRoute && !isSetupRoute) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (error || !profile?.organization_id) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/criar-empresa'
      return NextResponse.redirect(url)
    }
  }

  // Logado com organização tentando acessar setup → manda para dashboard
  if (user && isSetupRoute) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!error && profile?.organization_id) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
