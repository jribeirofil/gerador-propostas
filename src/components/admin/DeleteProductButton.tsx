'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Props {
  productId: string
  productName: string
}

export default function DeleteProductButton({ productId, productName }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('product').delete().eq('id', productId)

    if (error) {
      showToast('Não foi possível excluir. O produto pode estar em uso em alguma proposta.', 'error')
      setDeleting(false)
      setDialogOpen(false)
      return
    }

    showToast('Produto excluído.')
    router.push('/dashboard/admin/produtos')
    router.refresh()
  }

  return (
    <>
      <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-app-text font-medium mb-1">Zona de risco</p>
        <p className="text-xs text-app-muted mb-4">Excluir este produto permanentemente do catálogo.</p>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="px-4 py-2 border border-red-500/40 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors"
        >
          Excluir produto
        </button>
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title={`Excluir "${productName}"?`}
        description="Essa ação não pode ser desfeita. Benefícios, escopo, FAQ e diferenciais desse produto também serão apagados permanentemente."
        variant="danger"
        confirmText="Excluir produto"
        requireTyping="EXCLUIR"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDialogOpen(false)}
      />
    </>
  )
}
