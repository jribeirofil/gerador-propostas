import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ui/ThemeProvider'

export const metadata: Metadata = {
  title: 'Gerador de Propostas',
  description: 'Monte, envie e acompanhe propostas comerciais com a marca da sua empresa',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <div className="fixed inset-x-0 top-0 z-[999] h-[5px] bg-brand-green" />
          <div className="pt-[5px] flex flex-col" style={{ height: '100dvh' }}>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
