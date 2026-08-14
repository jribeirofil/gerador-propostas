import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgIdForUser } from '@/lib/org'
import { searchRDContacts } from '@/lib/rdstation'

export interface ClientSearchResult {
  source: 'local' | 'rd_station'
  rd_id?: string
  empresa: string
  contato: string
  email?: string
  whatsapp?: string
  cargo?: string
  cnpj?: string
  colaboradores?: number
  segmento?: string
}

export async function GET(req: NextRequest) {
  // Auth required — never expose client data or proxy RD to unauthenticated users
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const orgId = await getOrgIdForUser(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 403 })

  const q = req.nextUrl.searchParams.get('q')?.trim() || ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  const db = createAdminClient()

  // 1. Search local clients
  const { data: localClients } = await db
    .from('clients')
    .select('id, empresa, contato, email, whatsapp, cargo, cnpj, colaboradores, segmento')
    .eq('organization_id', orgId)
    .or(`empresa.ilike.%${q}%,contato.ilike.%${q}%,email.ilike.%${q}%`)
    .order('empresa')
    .limit(5)

  const local: ClientSearchResult[] = (localClients || []).map(c => ({
    source: 'local' as const,
    empresa: c.empresa || '',
    contato: c.contato || '',
    email: c.email || undefined,
    whatsapp: c.whatsapp || undefined,
    cargo: c.cargo || undefined,
    cnpj: c.cnpj || undefined,
    colaboradores: c.colaboradores || undefined,
    segmento: c.segmento || undefined,
  }))

  // 2. Search RD Station (fire in parallel, degrade gracefully if unavailable)
  const rdContacts = await searchRDContacts(q)

  // Deduplicate: skip RD results whose email already exists locally
  const localEmails = new Set(local.map(c => c.email?.toLowerCase()).filter(Boolean))
  const rd: ClientSearchResult[] = rdContacts
    .filter(c => !c.email || !localEmails.has(c.email.toLowerCase()))
    .map(c => ({
      source: 'rd_station' as const,
      rd_id: c.rd_id,
      empresa: c.empresa,
      contato: c.contato,
      email: c.email,
      whatsapp: c.whatsapp,
      cargo: c.cargo,
    }))

  return NextResponse.json({ results: [...local, ...rd] })
}
