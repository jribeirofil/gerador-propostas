'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import {
  FileText, FilePlus, Package,
  BookOpen, Users, Settings, Sun, Moon,
  LogOut, ChevronRight, ChevronLeft,
} from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  admin:   'Admin',
  manager: 'Gerente',
  seller:  'Vendedor',
  viewer:  'Visualização',
}

interface NavGroup {
  label: string
  items: { label: string; href: string; icon: React.ElementType }[]
  adminOnly?: boolean
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Propostas',
    items: [
      { label: 'Propostas', href: '/dashboard', icon: FileText },
    ],
  },
  {
    label: 'Catálogo',
    adminOnly: true,
    items: [
      { label: 'Produtos', href: '/dashboard/admin/produtos', icon: Package },
    ],
  },
  {
    label: 'Templates',
    adminOnly: true,
    items: [
      { label: 'Templates', href: '/dashboard/admin/conteudo', icon: BookOpen },
    ],
  },
  {
    label: 'Equipe',
    adminOnly: true,
    items: [
      { label: 'Usuários', href: '/dashboard/admin/usuarios', icon: Users },
    ],
  },
  {
    label: 'Configurações',
    adminOnly: true,
    items: [
      { label: 'Configurações', href: '/dashboard/admin/configuracoes', icon: Settings },
    ],
  },
]

interface Props {
  userName?: string | null
  userRole?: string | null
  userId?: string | null
  logoUrl?: string | null
  logoDarkUrl?: string | null
  companyName?: string | null
}

function NavItem({
  href, label, Icon, active, collapsed,
}: { href: string; label: string; Icon: React.ElementType; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150 ${
        collapsed
          ? 'justify-center w-10 h-10 mx-auto'
          : 'gap-3 px-3 py-2'
      } ${
        active
          ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)]'
          : 'text-[var(--sidebar-text)] hover:bg-[var(--row-hover)] hover:text-[var(--sidebar-active-text)]'
      }`}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ background: 'var(--sidebar-active-text)' }}
        />
      )}
      <Icon
        size={16}
        className={`flex-shrink-0 transition-colors ${
          active
            ? 'text-[var(--sidebar-active-text)]'
            : 'text-[var(--sidebar-muted)] group-hover:text-[var(--sidebar-active-text)]'
        }`}
      />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && <ChevronRight size={12} className="ml-auto opacity-40" />}
    </Link>
  )
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className={collapsed ? 'w-10 h-10' : 'w-7 h-7'} />

  const isDark = theme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className={`flex items-center justify-center rounded-lg transition-all duration-150 text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active)] ${
        collapsed ? 'w-10 h-10 mx-auto' : 'w-7 h-7'
      }`}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}

export default function Sidebar({ userName, userRole, userId, logoUrl, logoDarkUrl, companyName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  function toggleCollapse() {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const initials = (userName || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isCollapsed = mounted && collapsed
  const isAdmin = userRole === 'admin'

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/dashboard/admin/conteudo')
      return pathname.startsWith('/dashboard/admin/conteudo') || pathname.startsWith('/dashboard/admin/templates')
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="h-full flex flex-col border-r overflow-hidden transition-[width] duration-200 ease-in-out"
      style={{
        width: isCollapsed ? '56px' : '200px',
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center flex-shrink-0 px-4"
        style={{
          borderBottom: '1px solid var(--sidebar-border)',
          paddingTop: '16px',
          paddingBottom: '16px',
        }}
      >
        {isCollapsed ? (
          <div className="flex justify-center w-full">
            <Link href="/dashboard" title="Início">
              {logoUrl ? (
                <Logo src={logoUrl} srcDark={logoDarkUrl || logoUrl} height={40} maxWidth={40} />
              ) : (
                <span
                  className="font-sora font-black text-base leading-none flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ color: 'var(--sidebar-active-text)', background: 'var(--sidebar-active)' }}
                >
                  {(companyName || 'P').charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Link href="/dashboard" title="Início">
              {logoUrl ? (
                <Logo src={logoUrl} srcDark={logoDarkUrl || logoUrl} height={52} maxWidth={104} />
              ) : (
                <span
                  className="font-sora font-black text-lg leading-none truncate max-w-[104px]"
                  style={{ color: 'var(--sidebar-active-text)' }}
                >
                  {companyName || 'Propostas'}
                </span>
              )}
            </Link>

            <div className="flex items-center flex-shrink-0">
              <ThemeToggle collapsed={false} />

              {/* Divisor vertical */}
              <div
                className="mx-1.5"
                style={{
                  width: '1px',
                  height: '16px',
                  background: 'var(--sidebar-border)',
                }}
              />

              <button
                onClick={toggleCollapse}
                title="Recolher menu"
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150 text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active)]"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Expand button when collapsed ── */}
      {isCollapsed && (
        <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
          <button
            onClick={toggleCollapse}
            title="Expandir menu"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active)]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className={`flex-1 overflow-y-auto py-3 ${isCollapsed ? 'px-1' : 'px-2'}`}>

        {/* ── Nova proposta — ação principal ── */}
        <div className={isCollapsed ? 'flex justify-center mb-3' : 'mb-3'}>
          <Link
            href="/dashboard/nova"
            title={isCollapsed ? 'Nova proposta' : undefined}
            className={`flex items-center gap-2 rounded-lg font-semibold text-sm transition-all duration-150 bg-brand-green text-brand-dark hover:bg-brand-green-deep hover:text-white ${
              isCollapsed
                ? 'justify-center w-10 h-10 mx-auto'
                : 'px-3 py-2 w-full'
            }`}
          >
            <FilePlus size={15} className="flex-shrink-0" />
            {!isCollapsed && <span>Nova proposta</span>}
          </Link>
        </div>

        {/* ── Separator ── */}
        <div className="mx-2 mb-3" style={{ borderTop: '1px solid var(--sidebar-border)' }} />

        {/* ── Nav groups ── */}
        <div className="space-y-4">
          {NAV_GROUPS.map(group => {
            if (group.adminOnly && !isAdmin) return null
            return (
              <div key={group.label}>
                {!isCollapsed && (
                  <p
                    className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--sidebar-muted)' }}
                  >
                    {group.label}
                  </p>
                )}
                {isCollapsed && (
                  <div className="border-t mx-2 mb-2" style={{ borderColor: 'var(--sidebar-border)' }} />
                )}
                <div className="space-y-0.5">
                  {group.items.map(({ label, href, icon: Icon }) => (
                    <NavItem
                      key={href}
                      href={href}
                      label={label}
                      Icon={Icon}
                      active={isActive(href)}
                      collapsed={isCollapsed}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── User footer ── */}
      <div
        className={`py-3 border-t flex items-center flex-shrink-0 ${isCollapsed ? 'flex-col gap-2 px-1' : 'gap-3 px-3'}`}
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <Link
          href={userId ? `/dashboard/admin/usuarios/${userId}` : '#'}
          title={isCollapsed ? (userName || 'Usuário') : 'Editar perfil'}
          className={`group flex items-center gap-3 min-w-0 flex-1 rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : 'hover:bg-[var(--row-hover)] -mx-1 px-1 py-1'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-brand-green/15 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-green/25 transition-colors">
            <span className="text-[10px] font-semibold text-brand-green-deep">{initials}</span>
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate leading-none" style={{ color: 'var(--text)' }}>
                {userName || 'Usuário'}
              </p>
              {userRole && (
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  {ROLE_LABELS[userRole] || userRole}
                </p>
              )}
            </div>
          )}
        </Link>

        {isCollapsed ? (
          <>
            <ThemeToggle collapsed />
            <button
              onClick={handleLogout}
              title="Sair"
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 mx-auto"
              style={{ color: 'var(--sidebar-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--sidebar-muted)')}
            >
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150 flex-shrink-0"
            style={{ color: 'var(--sidebar-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--sidebar-muted)')}
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  )
}
