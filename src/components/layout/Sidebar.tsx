'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import SimpleBar from 'simplebar-react'
import FullLogo from './FullLogo'
import { Button } from '@/components/ui/button'
import { ROUTES, API_ROUTES } from '@/constants/routes'
import { isAdmin } from '@/constants/roles'
import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'
import useSWR from 'swr'
import type { SchemaRow } from '@/types/schema'

type SidebarProps = {
  userRole?: string
  onClose?: () => void
}

type SchemaSWRData = { schemas: SchemaRow[] }

const COLUMN_HEIGHT = 'h-[28vh]'

const schemaFetcher = async (url: string): Promise<SchemaSWRData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch schemas')
  return res.json() as Promise<SchemaSWRData>
}

function SectionColumn({
  label,
  href,
  icon,
  emptyText,
  children,
  onClose,
}: {
  label: string
  href: string
  icon: string
  emptyText: string
  children: React.ReactNode
  onClose?: () => void
}) {
  const hasChildren = Array.isArray(children)
    ? children.filter(Boolean).length > 0
    : !!children

  return (
    <div className={cn('flex flex-col', COLUMN_HEIGHT)}>
      <Link
        href={href}
        onClick={onClose}
        className='group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-lightprimary transition-colors'
      >
        <span className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors'>
          {label}
        </span>
        <Icon
          icon={icon}
          width={16}
          height={16}
          className='text-muted-foreground group-hover:text-primary transition-colors'
        />
      </Link>

      <SimpleBar className='flex-1 min-h-0 overflow-y-auto'>
        <div className='flex flex-col gap-0.5 px-1'>
          {hasChildren ? (
            children
          ) : (
            <div className='px-3 py-2 text-xs text-muted-foreground italic'>
              {emptyText}
            </div>
          )}
        </div>
      </SimpleBar>
    </div>
  )
}

function ItemLink({
  name,
  href,
  icon,
  isActive,
  onClose,
}: {
  name: string
  href: string
  icon: string
  isActive: boolean
  onClose?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-lightprimary text-primary font-medium'
          : 'text-link dark:text-darklink hover:bg-lightprimary hover:text-primary',
      )}
    >
      <Icon icon={icon} width={18} height={18} className='shrink-0 opacity-60' />
      <span className='truncate'>{name}</span>
    </Link>
  )
}

function NavItem({
  href,
  icon,
  label,
  isActive,
  onClose,
}: {
  href: string
  icon: string
  label: string
  isActive: boolean
  onClose?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-lightprimary text-primary font-medium'
          : 'text-link dark:text-darklink hover:bg-lightprimary hover:text-primary',
      )}
    >
      <Icon icon={icon} width={20} height={20} className='shrink-0' />
      <span className='truncate'>{label}</span>
    </Link>
  )
}

export default function SidebarLayout({ userRole, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const { data } = useSWR<SchemaSWRData>(API_ROUTES.SCHEMAS, schemaFetcher, {
    revalidateOnFocus: false,
  })
  const schemas = data?.schemas ?? []

  const handleLogout = async () => {
    await fetch(API_ROUTES.AUTH_LOGOUT, { method: 'POST' })
    router.push(ROUTES.LOGIN)
    router.refresh()
  }

  const isAdminUser = userRole ? isAdmin(userRole as UserRole) : false

  return (
    <aside className={cn(
      'flex h-screen w-[270px] flex-col border-r border-border/40 bg-background',
      onClose ? '' : 'fixed left-0 top-0 z-10 shadow-boxShadow',
    )}>
      {/* Logo */}
      <div className='flex h-16 shrink-0 items-center px-6'>
        <FullLogo />
      </div>


      {/* Features column */}
      <div className='px-3 pt-3'>
        <SectionColumn
          label='Features'
          href={ROUTES.SCHEMAS}
          icon='solar:widget-5-bold-duotone'
          emptyText='No features yet'
          onClose={onClose}
        >
          {schemas.map((s) => (
            <ItemLink
              key={s.id}
              name={s.name}
              href={ROUTES.FEATURE_DETAIL(s.name)}
              icon='solar:flag-bold-duotone'
              isActive={pathname === ROUTES.FEATURE_DETAIL(s.name)}
              onClose={onClose}
            />
          ))}
        </SectionColumn>
      </div>


      {/* Schemas column */}
      <div className='px-3 pt-1'>
        <SectionColumn
          label='Schemas'
          href={ROUTES.SCHEMAS}
          icon='solar:server-square-bold-duotone'
          emptyText='No schemas yet'
          onClose={onClose}
        >
          {schemas.map((s) => (
            <ItemLink
              key={s.id}
              name={s.name}
              href={ROUTES.SCHEMA_DETAIL(s.name)}
              icon='solar:database-bold-duotone'
              isActive={pathname === ROUTES.SCHEMA_DETAIL(s.name)}
              onClose={onClose}
            />
          ))}
        </SectionColumn>
      </div>


      {/* Bottom nav links */}
      <div className='flex flex-col gap-0.5 px-3 py-3'>
        <NavItem
          href={ROUTES.TICKETS}
          icon='solar:ticket-bold-duotone'
          label='Global Tickets'
          isActive={pathname === ROUTES.TICKETS}
          onClose={onClose}
        />
        {isAdminUser && (
          <NavItem
            href={ROUTES.USERS}
            icon='solar:users-group-rounded-bold-duotone'
            label='Users'
            isActive={pathname === ROUTES.USERS || pathname === ROUTES.USER_CREATE}
            onClose={onClose}
          />
        )}
      </div>

      {/* Logout pinned to bottom */}
      <div className='mt-auto p-4 border-t border-border/40'>
        <Button variant='outline' className='w-full rounded-lg gap-2' onClick={handleLogout}>
          <Icon icon='solar:logout-2-bold-duotone' width={18} height={18} />
          Logout
        </Button>
      </div>
    </aside>
  )
}
