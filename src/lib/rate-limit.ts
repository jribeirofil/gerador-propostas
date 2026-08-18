import type { NextRequest } from 'next/server'

type Bucket = { count: number; resetsAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function rateLimit(opts: {
  key: string
  limit?: number
  windowMs?: number
}): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const { key, limit = 30, windowMs = 60_000 } = opts
  const now = Date.now()

  // Limpeza lazy — impede crescimento infinito do map
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetsAt <= now) buckets.delete(k)
    }
  }

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetsAt <= now) {
    buckets.set(key, { count: 1, resetsAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetsAt - now) / 1000),
    }
  }

  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 }
}