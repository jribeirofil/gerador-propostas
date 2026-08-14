import { requireAdmin } from '@/lib/admin-guard'
import PriceTablesClient from './PriceTablesClient'

export default async function TabelasDePrecoPage() {
  await requireAdmin()
  return <PriceTablesClient />
}
