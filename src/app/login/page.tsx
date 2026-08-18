'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import AuthPanel from '@/components/auth/AuthPanel'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme('light')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('E-mail é obrigatório.')
      return
    }
    if (!password.trim()) {
      setError('Senha é obrigatória.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.error('Login error:', error)
        setError('E-mail ou senha incorretos.')
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
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
        headline="Propostas que"
        highlight="fecham negócios"
        sub="Crie, personalize e envie propostas comerciais para seus clientes de forma rápida e profissional."
      />

      {/* ── Painel direito ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[360px]">

          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-2 h-2 rounded-full bg-brand-green-deep" />
            <span className="font-sora font-semibold text-lg text-[#0F1318]">Propostas</span>
          </div>

          <h2 className="font-sora font-bold text-[26px] text-[#0F1318] mb-1">
            Bem-vindo de volta
          </h2>
          <p className="text-sm text-[#6B7280] mb-8">
            Insira suas credenciais para acessar a plataforma.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* E-mail */}
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
                  className="w-full bg-white dark:bg-slate-800 border border-[#E4E8EE] dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-[#0F1318] dark:text-white placeholder-[#9CA3AF] dark:placeholder-slate-400 focus:outline-none focus:border-brand-green-deep dark:focus:border-brand-green transition-colors"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-[#0F1318] mb-2">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-white dark:bg-slate-800 border border-[#E4E8EE] dark:border-slate-700 rounded-lg pl-10 pr-11 py-3 text-sm text-[#0F1318] dark:text-white placeholder-[#9CA3AF] dark:placeholder-slate-400 focus:outline-none focus:border-brand-green-deep dark:focus:border-brand-green transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <Link
              href="/reset-password"
              className="text-xs text-brand-green-deep hover:underline text-right block"
            >
              Esqueci minha senha
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0F1318] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1C2229] transition-colors disabled:opacity-50"
            >
              <LogIn size={15} />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-xs text-[#9CA3AF] text-center mt-8">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="text-brand-green-deep hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
