// Dump do schema vivo do Supabase via OpenAPI do PostgREST
// Uso: node scripts/dump-schema.mjs  (lê .env.local)
import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) { console.error('sem .env.local'); process.exit(1) }

const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) { console.error('sem URL/key'); process.exit(1) }

const res = await fetch(`${url}/rest/v1/?apikey=${key}`, { headers: { apikey: key } })
if (!res.ok) { console.error('HTTP', res.status, await res.text()); process.exit(1) }
const spec = await res.json()

const tables = Object.entries(spec.definitions || spec.components?.schemas || {})
  .filter(([name]) => !name.startsWith('_'))
  .sort(([a], [b]) => a.localeCompare(b))

for (const [name, schema] of tables) {
  const props = schema.properties || {}
  const required = schema.required || []
  const cols = Object.entries(props)
    .filter(([k]) => !k.startsWith('_'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      const t = (v.anyOf || []).find(x => x.type === 'string' && x.format)?.format ||
                v.format || v.type || 'unknown'
      const arr = v.type === 'array' ? '[]' : ''
      const nul = required.includes(k) ? '' : ' | null'
      return `${k}: ${t}${arr}${nul}`
    })
  console.log(`===== ${name} =====`)
  console.log(cols.join('\n'))
  console.log()
}
