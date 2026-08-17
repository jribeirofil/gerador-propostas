import { ToastProvider } from '@/components/ui/Toast'

export default function CriarEmpresaLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
