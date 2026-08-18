'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import AuthPanel from '@/components/auth/AuthPanel'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme('light')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('E-mail é obrigatório.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      })

      if (error) {
        console.error('Reset password error:', error)
        // Não mostrar se email existe ou não (questão de segurança)
        setSuccess(true)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Painel esquerdo ── */}
      <AuthPanel
        headline="Recuperar"
        highlight="sua senha"
        sub="Enviaremos um link para o seu e-mail para que você possa criar uma nova senha."
      />

      {/* ── Painel direito ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[360px]">
          <Link href="/login" className="flex items-center gap-1 text-xs text-brand-green-deep hover:underline mb-8 lg:hidden">
            <ArrowLeft size={14} />
            Voltar ao login
          </Link>

          <h2 className="font-sora font-bold text-[26px] text-[#0F1318] mb-1">
            Recuperar senha
          </h2>
          <p className="text-sm text-[#6B7280] mb-8">
            Insira o e-mail da sua conta para receber um link de recuperação.
          </p>

          {success ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-500 text-xl">✓</span>
              </div>
              <p className="text-sm text-[#6B7280] text-center leading-relaxed">
                Se esse e-mail estiver cadastrado, você receberá um link para resetar sua senha.
              </p>
              <p className="text-xs text-[#9CA3AF] text-center">
                Verifique sua caixa de entrada (e spam se não encontrar).
              </p>
              <Link
                href="/login"
                className="block w-full py-2 text-center text-brand-green-deep hover:underline font-medium text-sm mt-6"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#0F1318] mb-2">E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-white border border-[#E4E8EE] rounded-lg pl-10 pr-4 py-3 text-sm text-[#0F1318] placeholder-[#9CA3AF] focus:outline-none focus:border-brand-green-deep transition-colors"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0F1318] text-white rounded-lg text-sm font-semibold hover:bg-[#1C2229] transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1 text-xs text-brand-green-deep hover:underline"
              >
                <ArrowLeft size={14} />
                Voltar ao login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
