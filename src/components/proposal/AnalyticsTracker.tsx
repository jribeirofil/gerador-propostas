'use client'
import { useEffect } from 'react'

export default function AnalyticsTracker({ token }: { token: string }) {
  useEffect(() => {
    const storageKey = `fay_sid_${token}`
    let sessionId = sessionStorage.getItem(storageKey)
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
      sessionStorage.setItem(storageKey, sessionId)
    }

    const fire = (event: string) => {
      fetch(`/api/p/${token}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, sessionId }),
      }).catch(() => {})
    }

    fire('opened')

    const interval = setInterval(() => fire('heartbeat'), 30_000)
    return () => clearInterval(interval)
  }, [token])

  return null
}
