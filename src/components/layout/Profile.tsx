'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'
import SimpleBar from 'simplebar-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useSession } from '@/lib/auth/use-session'
import { useRouter } from 'next/navigation'
import { ROUTES, API_ROUTES } from '@/constants/routes'
import { formatRole } from '@/utils/format'

const profileMenuItems = [
  { title: 'My Profile', icon: 'solar:user-circle-linear', url: ROUTES.PROFILE },
]

const Profile = () => {
  const { user } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch(API_ROUTES.AUTH_LOGOUT, { method: 'POST' })
    router.push(ROUTES.LOGIN)
    router.refresh()
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className='relative group/menu ps-15 shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className='hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary h-9 w-9 bg-primary/10 text-primary font-semibold text-sm'>
            {initials}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-screen sm:w-[220px] pb-4 pt-2 rounded-sm'>
          {user && (
            <div className='px-4 py-2 border-b border-ld mb-2'>
              <p className='text-sm font-medium text-foreground truncate'>{user.name ?? user.username}</p>
              <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
              <span className='inline-flex items-center rounded-full bg-lightprimary px-2 py-0.5 text-[10px] font-medium text-primary mt-1'>
                {formatRole(user.role)}
              </span>
            </div>
          )}

          <SimpleBar>
            {profileMenuItems.map((item, index) => (
              <DropdownMenuItem key={index} asChild>
                <Link href={item.url} className='px-4 py-2 flex justify-between items-center group/link w-full hover:bg-lightprimary'>
                  <div className='flex items-center gap-3 w-full'>
                    <Icon icon={item.icon} className='text-lg text-foreground group-hover/link:text-primary' />
                    <h5 className='mb-0 text-sm text-foreground group-hover/link:text-primary'>{item.title}</h5>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </SimpleBar>

          {/* <DropdownMenuSeparator className='my-2' /> */}

          {/* <div className='px-4'>
            <Button variant='outline' className='w-full rounded-full' onClick={handleLogout}>
              Logout
            </Button>
          </div> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Profile
