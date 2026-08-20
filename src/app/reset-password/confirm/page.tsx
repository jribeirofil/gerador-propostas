'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordConfirmContent />
    </Suspense>
  )
}

function ResetPasswordConfirmContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme('light')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Verificar se token de recuperação é válido
  useEffect(() => {
    const checkToken = async () => {
      const type = searchParams.get('type')
      const token = searchParams.get('#_token') || searchParams.get('token')

      if (type !== 'recovery' || !token) {
        setError('Link de recuperação inválido ou expirado.')
      }
    }

    checkToken()
  }, [searchParams])

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!password.trim()) {
      setError('Nova senha é obrigatória.')
      return
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        console.error('Update password error:', error)
        setError('Erro ao atualizar senha. Tente novamente.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-8 py-12">
      <div className="w-full max-w-[360px]">
        <h2 className="font-sora font-bold text-[26px] text-[#0F1318] mb-1">
          Definir nova senha
        </h2>
        <p className="text-sm text-[#6B7280] mb-8">
          Escolha uma senha forte para sua conta.
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-slate-500 text-xl">✓</span>
            </div>
            <p className="text-sm text-[#6B7280] text-center leading-relaxed">
              Sua senha foi redefinida com sucesso!
            </p>
            <p className="text-xs text-[#9CA3AF] text-center">
              Redirecionando para o login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#0F1318] mb-2">Nova senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white border border-[#E4E8EE] rounded-lg pl-10 pr-11 py-3 text-sm text-[#0F1318] placeholder-[#9CA3AF] focus:outline-none focus:border-brand-green-deep transition-colors"
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

            <div>
              <label className="block text-sm font-medium text-[#0F1318] mb-2">Confirmar senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  className="w-full bg-white border border-[#E4E8EE] rounded-lg pl-10 pr-11 py-3 text-sm text-[#0F1318] placeholder-[#9CA3AF] focus:outline-none focus:border-brand-green-deep transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0F1318] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1C2229] transition-colors disabled:opacity-50"
            >
              <LogIn size={15} />
              {loading ? 'Atualizando...' : 'Atualizar senha'}
            </button>

            <Link
              href="/login"
              className="text-xs text-brand-green-deep hover:underline text-center block"
            >
              Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
