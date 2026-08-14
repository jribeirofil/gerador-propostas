import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await request.json()
  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) patch.name = body.name.trim()
  if (body.color !== undefined) patch.color = body.color
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order

  const { data, error } = await supabase
    .from('category')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('category')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
