'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User, Building2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCNPJ } from '@/lib/cnpj'

function DotGrid() {
  return (
    <div
      className="grid gap-[10px] opacity-40"
      style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
    >
      {Array.from({ length: 70 }).map((_, i) => (
        <div key={i} className="w-[5px] h-[5px] rounded-full bg-brand-green-deep" />
      ))}
    </div>
  )
}

export default function CadastroPage() {
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  function handleCNPJChange(value: string) {
    const clean = value.replace(/\D/g, '')
    const limited = clean.slice(0, 14)
    setCnpj(formatCNPJ(limited))
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Nome completo é obrigatório')
      return
    }
    if (!companyName.trim()) {
      setError('Nome da empresa é obrigatório')
      return
    }
    if (!cnpj.trim()) {
      setError('CNPJ é obrigatório')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Esse e-mail já tem cadastro. Tente entrar.')
      } else if (error.message.includes('Password')) {
        setError('A senha precisa ter pelo menos 6 caracteres.')
      } else {
        setError('Não foi possível criar a conta. Tente novamente.')
      }
      setLoading(false)
      return
    }
    if (data.session) {
      // Criar empresa automaticamente após signup
      try {
        const createOrgRes = await fetch('/api/organizations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: companyName,
            cnpj,
          }),
        })
        if (!createOrgRes.ok) {
          const err = await createOrgRes.json()
          setError(err.error || 'Erro ao criar empresa')
          setLoading(false)
          return
        }
      } catch (err) {
        setError('Erro ao criar empresa. Tente novamente.')
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  const leftPanel = (
    <div
      className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12"
      style={{ background: 'linear-gradient(140deg, #B8F0D0 0%, #D4F7E6 40%, #EBF9F3 100%)' }}
    >
      <div className="flex items-end gap-1.5">
        <div className="leading-none">
          <p className="font-sora font-black text-[15px] leading-[1.15] text-[#0F1318]">fine</p>
          <p className="font-sora font-black text-[15px] leading-[1.15] text-[#0F1318]">and</p>
          <p className="font-sora font-black text-[15px] leading-[1.15] text-[#0F1318]">you</p>
        </div>
      </div>
      <div className="absolute top-12 right-12">
        <DotGrid />
      </div>
      <div className="mb-8">
        <h1 className="font-sora font-black text-[52px] leading-[1.1] text-[#0F1318]">
          Propostas que<br />
          <span className="text-brand-green-deep">fecham negócios</span><br />
          de verdade.
        </h1>
        <div className="w-10 h-[3px] bg-brand-green-deep rounded-full mt-6 mb-6" />
        <p className="text-[#374151] text-[15px] leading-relaxed max-w-[380px]">
          Crie, personalize e envie propostas comerciais
          para seus clientes de forma rápida e profissional.
        </p>
      </div>
      <div className="flex items-center justify-between text-xs text-[#6B7280]">
        <span>© 2026 Gerador de Propostas</span>
        <span>Propostas Comerciais</span>
      </div>
    </div>
  )

  if (success) {
    return (
      <div className="min-h-screen flex">
        {leftPanel}
        <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
          <div className="w-full max-w-[360px] text-center">
            <div className="w-12 h-12 rounded-full bg-[#D4F7E6] flex items-center justify-center mx-auto mb-6">
              <span className="text-brand-green-deep text-xl">✓</span>
            </div>
            <h2 className="font-sora font-bold text-[22px] text-[#0F1318] mb-2">Confirme seu e-mail</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Enviamos um link de confirmação para{' '}
              <strong className="text-[#0F1318]">{email}</strong>.
              Abra o e-mail e clique no link para ativar sua conta.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 text-sm text-brand-green-deep hover:underline font-medium"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {leftPanel}

      {/* ── Painel direito ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[360px]">

          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-2 h-2 rounded-full bg-brand-green-deep" />
            <span className="font-sora font-semibold text-lg text-[#0F1318]">Propostas</span>
          </div>

          <h2 className="font-sora font-bold text-[26px] text-[#0F1318] mb-1">Criar conta</h2>
          <p className="text-sm text-[#6B7280] mb-8">
            Cadastre-se para usar o gerador de propostas.
          </p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#0F1318] mb-2">Nome completo</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-white dark:bg-slate-800 border border-[#E4E8EE] dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-[#0F1318] dark:text-white placeholder-[#9CA3AF] dark:placeholder-slate-400 focus:outline-none focus:border-brand-green-deep dark:focus:border-brand-green transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F1318] mb-2">Empresa</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Nome da sua empresa"
                  className="w-full bg-white dark:bg-slate-800 border border-[#E4E8EE] dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-[#0F1318] dark:text-white placeholder-[#9CA3AF] dark:placeholder-slate-400 focus:outline-none focus:border-brand-green-deep dark:focus:border-brand-green transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F1318] mb-2">CNPJ</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={cnpj}
                  onChange={e => handleCNPJChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="w-full bg-white dark:bg-slate-800 border border-[#E4E8EE] dark:border-slate-700 rounded-lg pl-4 pr-4 py-3 text-sm text-[#0F1318] dark:text-white placeholder-[#9CA3AF] dark:placeholder-slate-400 focus:outline-none focus:border-brand-green-deep dark:focus:border-brand-green transition-colors font-mono"
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-[#0F1318] mb-2">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0F1318] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1C2229] transition-colors disabled:opacity-50"
            >
              <UserPlus size={15} />
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-xs text-[#9CA3AF] text-center mt-8">
            Já tem conta?{' '}
            <Link href="/login" className="text-brand-green-deep hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
