'use client'
import { SEGMENTOS } from '@/types'
import Select from '@/components/ui/Select'
import type { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form'
import type { ProposalFormData } from './ProposalForm'
import ClientSearch from './ClientSearch'
import type { ClientSearchResult } from '@/app/api/clients/search/route'
import { maskPhone, maskCNPJ } from '@/lib/masks'

interface Props {
  register: UseFormRegister<ProposalFormData>
  errors: FieldErrors<ProposalFormData>
  setValue: UseFormSetValue<ProposalFormData>
}

const inputClass = 'w-full bg-app-surface border border-app-border rounded px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-brand-green-deep transition-colors'
const labelClass = 'block text-xs font-medium text-app-muted mb-1.5'

export default function Step1Client({ register, errors, setValue }: Props) {
  function handleClientSelect(client: ClientSearchResult) {
    setValue('empresa', client.empresa || '')
    setValue('contato', client.contato || '')
    setValue('email', client.email || '')
    setValue('whatsapp', maskPhone(client.whatsapp || ''))
    setValue('cargo', client.cargo || '')
    setValue('cnpj', maskCNPJ(client.cnpj || ''))
    if (client.colaboradores) setValue('colaboradores', client.colaboradores)
    if (client.segmento) setValue('segmento', client.segmento)
    // Track RD origin
    if (client.source === 'rd_station') {
      setValue('rd_lead_id', client.rd_id || '')
      setValue('client_origem', 'rd_station')
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="font-sora font-semibold text-base text-app-text">Dados do cliente</h2>

      <div>
        <label className={labelClass}>Buscar cliente</label>
        <ClientSearch onSelect={handleClientSelect} />
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-app-border" />
        <span className="text-[11px] font-medium text-app-muted uppercase tracking-widest whitespace-nowrap">ou preencha manualmente</span>
        <div className="flex-1 h-px bg-app-border" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Nome da empresa *</label>
          <input {...register('empresa', { required: 'Campo obrigatório' })} className={inputClass} placeholder="Ex: Logística Tupi Ltda" />
          {errors.empresa && <p className="text-xs text-red-400 mt-1">{errors.empresa.message}</p>}
        </div>

        <div>
          <label className={labelClass}>CNPJ</label>
          <input {...register('cnpj')} onChange={e => setValue('cnpj', maskCNPJ(e.target.value))} className={inputClass} placeholder="00.000.000/0001-00" />
        </div>

        <div>
          <label className={labelClass}>Segmento</label>
          <Select {...register('segmento')}>
            <option value="">Selecione</option>
            {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <div>
          <label className={labelClass}>Vidas</label>
          <input {...register('colaboradores', { valueAsNumber: true })} type="number" className={inputClass} placeholder="Ex: 350" />
        </div>

        <div>
          <label className={labelClass}>Nome do contato *</label>
          <input {...register('contato', { required: 'Campo obrigatório' })} className={inputClass} placeholder="Ex: Maria Fernanda" />
          {errors.contato && <p className="text-xs text-red-400 mt-1">{errors.contato.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Cargo</label>
          <input {...register('cargo')} className={inputClass} placeholder="Ex: Gerente de RH" />
        </div>

        <div>
          <label className={labelClass}>E-mail</label>
          <input {...register('email')} type="email" className={inputClass} placeholder="contato@empresa.com.br" />
        </div>

        <div>
          <label className={labelClass}>WhatsApp</label>
          <input {...register('whatsapp')} onChange={e => setValue('whatsapp', maskPhone(e.target.value))} className={inputClass} placeholder="(19) 99999-9999" />
        </div>
      </div>
    </div>
  )
}
