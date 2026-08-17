import CreateOrganizationForm from '@/components/onboarding/CreateOrganizationForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CriarEmpresaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Se usuário já tem organização, redirecionar para dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (profile?.organization_id) {
    redirect('/dashboard')
  }

  return <CreateOrganizationForm />
}
