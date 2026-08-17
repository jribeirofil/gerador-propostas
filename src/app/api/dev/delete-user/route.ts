// 🔧 Endpoint de DEBUG - Apenas para development!
// Remover em produção!

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Apenas em desenvolvimento' }, { status: 403 })
  }

  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
  }

  try {
    const db = createAdminClient()

    // Get user by email from auth.users
    const { data: users, error: getUserError } = await db
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (getUserError || !users) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const userId = users.id

    // Delete from profiles
    await db.from('profiles').delete().eq('id', userId)

    // Delete auth user via RPC or direct delete
    const { error: deleteError } = await db
      .from('auth.users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Usuário ${email} deletado com sucesso`
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
