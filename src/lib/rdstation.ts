// Server-only — never import this in client components

export interface RDClientResult {
  rd_id: string
  empresa: string
  contato: string
  email?: string
  whatsapp?: string
  cargo?: string
}

export async function isRDConnected(): Promise<boolean> {
  return !!process.env.RD_CRM_TOKEN
}

export async function searchRDContacts(query: string): Promise<RDClientResult[]> {
  const token = process.env.RD_CRM_TOKEN
  if (!token || !query.trim()) return []

  try {
    const params = new URLSearchParams({
      token,
      q: query.trim(),
      page: '1',
      limit: '5',
    })

    const res = await fetch(`https://crm.rdstation.com/api/v1/contacts?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) return []

    const data = await res.json()
    const contacts: Array<{
      _id?: string
      name?: string
      title?: string
      organization_id?: string
      emails?: Array<{ email: string }>
      phones?: Array<{ phone: string }>
    }> = Array.isArray(data) ? data : (data.contacts ?? [])

    // Fetch organization names in parallel (CRM doesn't embed them in contact response)
    const orgIds = [...new Set(contacts.map(c => c.organization_id).filter(Boolean))] as string[]
    const orgMap: Record<string, string> = {}
    if (orgIds.length > 0) {
      await Promise.all(
        orgIds.map(async orgId => {
          try {
            const orgRes = await fetch(
              `https://crm.rdstation.com/api/v1/organizations/${orgId}?token=${token}`,
              { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3000) },
            )
            if (orgRes.ok) {
              const orgData = await orgRes.json()
              const name = orgData.name ?? orgData.organization?.name ?? ''
              if (name) orgMap[orgId] = name
            }
          } catch { /* ignore individual failures */ }
        }),
      )
    }

    return contacts
      .map(c => ({
        rd_id: c._id ?? '',
        empresa: orgMap[c.organization_id ?? ''] ?? '',
        contato: c.name ?? '',
        email: c.emails?.[0]?.email ?? undefined,
        whatsapp: c.phones?.[0]?.phone ?? undefined,
        cargo: c.title ?? undefined,
      }))
      .filter(r => r.rd_id && (r.empresa || r.contato))
  } catch {
    // RD unavailable — degrade gracefully
    return []
  }
}
