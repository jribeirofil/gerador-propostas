'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { maskPhone } from '@/lib/masks'
import { useToast } from '@/components/ui/Toast'
import type { CompanySettings } from '@/types/admin'

interface Props {
  settings: CompanySettings | null
  organizationId?: string | null
}

const inputClass = 'w-full bg-app-surface border border-app-border rounded px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-brand-green-deep transition-colors'
const labelClass = 'block text-xs font-medium text-app-muted mb-1.5'
const sectionClass = 'bg-app-surface border border-app-border rounded-2xl p-6 space-y-4 shadow-sm'

export default function CompanySettingsForm({ settings, organizationId }: Props) {
  const [companyName, setCompanyName] = useState(settings?.company_name || '')
  const [companySite, setCompanySite] = useState(settings?.company_site || '')
  const [companyEmail, setCompanyEmail] = useState(settings?.company_email || '')
  const [companyPhone, setCompanyPhone] = useState(maskPhone(settings?.company_phone || ''))
  const [companyWhatsapp, setCompanyWhatsapp] = useState(maskPhone(settings?.company_whatsapp || ''))
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url || '')
  const [logoDarkUrl, setLogoDarkUrl] = useState(settings?.logo_url_dark || '')
  const [primaryColor, setPrimaryColor] = useState(settings?.primary_color || '#4F46E5')
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondary_color || '')
  const [aiTone, setAiTone] = useState(settings?.ai_tone || '')
  const [companyAbout, setCompanyAbout] = useState(settings?.company_about || '')

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  async function handleLogoUpload(file: File) {
    setUploading(true)
    setUploadError(null)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const orgId = organizationId ?? settings?.organization_id ?? null
    const path = orgId ? `${orgId}/company/logo.${ext}` : `company/logo.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('assets')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadErr) {
      setUploadError('Erro ao enviar. Verifique as permissões do bucket.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
    setLogoUrl(publicUrl + '?v=' + Date.now())
    setUploading(false)
  }

  async function handleLogoDarkUpload(file: File) {
    setUploading(true)
    setUploadError(null)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const orgId = organizationId ?? settings?.organization_id ?? null
    const path = orgId ? `${orgId}/company/logo-dark.${ext}` : `company/logo-dark.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('assets')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadErr) {
      setUploadError('Erro ao enviar. Verifique as permissões do bucket.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
    setLogoDarkUrl(publicUrl + '?v=' + Date.now())
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!companyName.trim()) {
      setError('O nome da empresa é obrigatório.')
      return
    }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      company_name: companyName.trim(),
      company_site: companySite.trim() || null,
      company_email: companyEmail.trim() || null,
      company_phone: companyPhone.trim() || null,
      company_whatsapp: companyWhatsapp.trim() || null,
      logo_url: logoUrl.trim() || null,
      logo_url_dark: logoDarkUrl.trim() || null,
      primary_color: primaryColor.trim() || '#4F46E5',
      secondary_color: secondaryColor.trim() || null,
      ai_tone: aiTone.trim() || null,
      company_about: companyAbout.trim() || null,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }

    let saveError
    if (settings?.id) {
      const { error } = await supabase
        .from('company_settings')
        .update(payload)
        .eq('id', settings.id)
      saveError = error
    } else {
      const { error } = await supabase
        .from('company_settings')
        .insert({
          ...payload,
          organization_id: organizationId ?? null,
        })
      saveError = error
    }

    setSaving(false)

    if (saveError) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }

    showToast('Configurações salvas.')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">

      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-app-text">Empresa</h2>

        <div>
          <label className={labelClass}>Nome da empresa *</label>
          <input
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            className={inputClass}
            placeholder="Nome da empresa"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Site</label>
            <input
              value={companySite}
              onChange={e => setCompanySite(e.target.value)}
              className={inputClass}
              placeholder="www.empresa.com.br"
            />
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input
              type="email"
              value={companyEmail}
              onChange={e => setCompanyEmail(e.target.value)}
              className={inputClass}
              placeholder="contato@empresa.com.br"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Telefone</label>
            <input
              value={companyPhone}
              onChange={e => setCompanyPhone(maskPhone(e.target.value))}
              className={inputClass}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input
              value={companyWhatsapp}
              onChange={e => setCompanyWhatsapp(maskPhone(e.target.value))}
              className={inputClass}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-app-text">Branding</h2>
        <p className="text-xs text-app-muted -mt-2">Logos aparecem no sidebar do sistema.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Light Mode */}
          <div className="border border-app-border rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-app-text mb-1">Tema Claro</p>
              <p className="text-xs text-app-muted">Logo para fundo claro</p>
            </div>

            <div className="w-full h-24 rounded-lg border border-app-border bg-white flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Light" className="max-w-[80%] max-h-[80%] object-contain" />
              ) : (
                <span className="text-xs text-app-muted">Preview</span>
              )}
            </div>

            <label className={`flex items-center justify-center gap-2 h-10 px-3 border border-dashed rounded-lg transition-colors cursor-pointer text-sm ${
              uploading
                ? 'border-app-border opacity-60 pointer-events-none'
                : 'border-app-border hover:border-brand-green-deep/60 hover:bg-brand-green/5'
            }`}>
              <Upload size={13} className="text-app-muted" />
              <span className="text-app-muted">
                {uploading ? 'Enviando...' : 'Fazer upload'}
              </span>
              <input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]) }}
              />
            </label>

            {logoUrl && !uploading && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="w-full flex items-center justify-center gap-1 text-xs text-app-muted hover:text-red-400 transition-colors py-1"
              >
                <X size={11} />
                Remover
              </button>
            )}
            {uploadError && <p className="text-xs text-red-400 text-center">{uploadError}</p>}
          </div>

          {/* Logo Dark Mode */}
          <div className="border border-app-border rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-app-text mb-1">Tema Escuro</p>
              <p className="text-xs text-app-muted">Logo para fundo escuro (opcional)</p>
            </div>

            <div className="w-full h-24 rounded-lg border border-app-border bg-gray-900 flex items-center justify-center overflow-hidden">
              {logoDarkUrl ? (
                <img src={logoDarkUrl} alt="Logo Dark" className="max-w-[80%] max-h-[80%] object-contain" />
              ) : (
                <span className="text-xs text-gray-500">Preview</span>
              )}
            </div>

            <label className={`flex items-center justify-center gap-2 h-10 px-3 border border-dashed rounded-lg transition-colors cursor-pointer text-sm ${
              uploading
                ? 'border-app-border opacity-60 pointer-events-none'
                : 'border-app-border hover:border-brand-green-deep/60 hover:bg-brand-green/5'
            }`}>
              <Upload size={13} className="text-app-muted" />
              <span className="text-app-muted">
                {uploading ? 'Enviando...' : 'Fazer upload'}
              </span>
              <input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={e => { if (e.target.files?.[0]) handleLogoDarkUpload(e.target.files[0]) }}
              />
            </label>

            {logoDarkUrl && !uploading && (
              <button
                type="button"
                onClick={() => setLogoDarkUrl('')}
                className="w-full flex items-center justify-center gap-1 text-xs text-app-muted hover:text-red-400 transition-colors py-1"
              >
                <X size={11} />
                Remover
              </button>
            )}
            {uploadError && <p className="text-xs text-red-400 text-center">{uploadError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Cor principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor || '#4F46E5'}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded border border-app-border cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="#4F46E5"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Cor secundária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor || '#4338CA'}
                onChange={e => setSecondaryColor(e.target.value)}
                className="w-12 h-10 rounded border border-app-border cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={e => setSecondaryColor(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="#4338CA"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-app-text">Documento da proposta</h2>
        <p className="text-xs text-app-muted -mt-2">Conteúdo que aparece em todas as propostas da organização.</p>

        <div>
          <label className={labelClass}>Sobre a empresa</label>
          <textarea
            value={companyAbout}
            onChange={e => setCompanyAbout(e.target.value)}
            rows={4}
            className={`${inputClass} resize-y leading-relaxed`}
            placeholder="Texto apresentado na seção 'Sobre a empresa' do documento. Ex: há mais de 10 anos ajudando empresas a cuidar da saúde dos seus colaboradores..."
          />
          <p className="text-xs text-app-muted mt-1">
            Aparece em toda proposta. Deixe vazio para não exibir a seção.
          </p>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-app-text">Inteligência Artificial</h2>
        <p className="text-xs text-app-muted -mt-2">Instrução de tom injetada em todas as operações de IA nos blocos de proposta.</p>

        <div>
          <label className={labelClass}>Tom e estilo de escrita</label>
          <textarea
            value={aiTone}
            onChange={e => setAiTone(e.target.value)}
            rows={3}
            className={`${inputClass} resize-y`}
            placeholder="Ex: Use uma linguagem empática, próxima e moderna. Evite jargões técnicos. O tom deve transmitir cuidado com pessoas e profissionalismo."
          />
          <p className="text-xs text-app-muted mt-1">
            Deixe vazio para usar o comportamento padrão da IA.
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-brand-green text-brand-dark rounded-lg text-sm font-semibold hover:bg-brand-green-deep hover:text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </form>
  )
}
