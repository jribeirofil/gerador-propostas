import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

function slugify(name: string): string {
  return name.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('category')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { name, color } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })

  const slug = slugify(name)

  const { data, error } = await supabase
    .from('category')
    .insert({ name: name.trim(), slug, color: color || 'blue', sort_order: 999 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
