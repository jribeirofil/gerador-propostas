import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })
  }

  const body = await request.json()
  const { full_name, email, job_title, phone, role } = body

  if (!email?.trim()) {
    return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro de configuração.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    email_confirm: true,
  })

  if (createError) {
    const msg = createError.message.toLowerCase()
    const isConflict = msg.includes('already registered') || msg.includes('already been registered')
    return NextResponse.json(
      { error: isConflict ? 'Esse e-mail já está cadastrado.' : createError.message },
      { status: isConflict ? 409 : 400 }
    )
  }

  await admin.from('profiles').upsert({
    id: created.user.id,
    full_name: full_name?.trim() || null,
    job_title: job_title?.trim() || null,
    phone: phone?.trim() || null,
    role: role || 'seller',
    active: true,
    organization_id: profile.organization_id,
  })

  await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard`,
  })

  return NextResponse.json({ id: created.user.id })
}
