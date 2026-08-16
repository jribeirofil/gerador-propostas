import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgIdForUser } from '@/lib/org'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const orgId = await getOrgIdForUser(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

  const { token } = await req.json()
  if (!token?.trim()) return NextResponse.json({ error: 'Token é obrigatório.' }, { status: 400 })

  const db = createAdminClient()

  // Upsert: criar ou atualizar
  const { error } = await db
    .from('integrations')
    .upsert(
      {
        provider: 'rd',
        organization_id: orgId,
        refresh_token: token.trim(),
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'provider,organization_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const orgId = await getOrgIdForUser(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

  const db = createAdminClient()
  const { error } = await db
    .from('integrations')
    .delete()
    .eq('provider', 'rd')
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
