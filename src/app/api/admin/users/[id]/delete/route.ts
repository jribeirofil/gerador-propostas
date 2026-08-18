import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const orgId = profile.organization_id
  if (!orgId) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const db = createAdminClient()

    // O alvo DEVE pertencer à mesma organização do admin que está deletando
    const { data: targetProfile } = await db
      .from('profiles')
      .select('id')
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Usuário não encontrado nesta empresa.' },
        { status: 404 }
      )
    }

    // Delete from profiles first (escopado por org)
    await db.from('profiles').delete().eq('id', params.id).eq('organization_id', orgId)

    // Delete auth user
    const { error } = await db.auth.admin.deleteUser(params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Usuário deletado' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
