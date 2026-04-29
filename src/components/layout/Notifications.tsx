'use client'

import { Icon } from '@iconify/react'
import Link from 'next/link'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'
import { getNotificationsAction, markAllNotificationsReadAction } from '@/server/actions/notification'
import type { NotificationItem } from '@/types/notification'
import { ROUTES } from '@/constants/routes'
import { isRecordStringUnknown } from '@/utils/type-guards'
import { useTransition } from 'react'

const NOTIF_ICON_MAP: Record<string, string> = {
  TICKET_CREATED: 'solar:ticker-star-linear',
  TICKET_APPROVED: 'solar:check-circle-linear',
  TICKET_REJECTED: 'solar:close-circle-linear',
  USER_INVITED: 'solar:user-plus-linear',
  USER_ACTIVATED: 'solar:user-check-linear',
}

const fetcher = async (): Promise<{ notifications: NotificationItem[]; unreadCount: number }> => {
  const result = await getNotificationsAction()
  if (!result.success) throw new Error(result.error)
  return result.data
}

function getTicketLink(metadata: unknown): string {
  if (isRecordStringUnknown(metadata) && typeof metadata.ticketId === 'string') {
    return ROUTES.TICKET_DETAIL(metadata.ticketId)
  }
  return '#'
}

const Notifications = () => {
  const { data, mutate } = useSWR('notifications', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })
  const [isPending, startTransition] = useTransition()

  const unreadCount = data?.unreadCount ?? 0
  const notifications = data?.notifications ?? []

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction()
      mutate()
    })
  }

  return (
    <div className='relative group/menu px-15'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className='relative'>
            <span className='relative after:absolute after:w-10 after:h-10 after:rounded-full hover:text-primary after:-top-1/2 hover:after:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:after:bg-lightprimary group-hover/menu:text-primary'>
              <Icon icon='tabler:bell-ringing' height={20} />
            </span>
            {unreadCount > 0 && (
              <span className='rounded-full absolute -end-[6px] -top-[5px] text-[10px] h-4 w-4 bg-primary text-white flex justify-center items-center font-medium'>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-screen sm:w-[360px] py-4 rounded-sm'>
          <div className='flex items-center px-6 justify-between'>
            <h3 className='mb-0 text-lg font-semibold text-foreground'>Notifications</h3>
            {unreadCount > 0 && (
              <Button variant='ghost' size='sm' className='text-xs text-primary' onClick={handleMarkAllRead} disabled={isPending}>
                Mark all read
              </Button>
            )}
          </div>

          <SimpleBar className='max-h-80 mt-3'>
            {notifications.length === 0 ? (
              <div className='px-6 py-8 text-center text-sm text-muted-foreground'>No notifications yet</div>
            ) : (
              notifications.map((item) => (
                <DropdownMenuItem key={item.id} asChild>
                  <Link
                    href={getTicketLink(item.metadata)}
                    className={`px-6 py-3 flex items-start gap-3 group/link w-full hover:bg-lightprimary ${!item.isRead ? 'bg-lightprimary/50' : ''}`}
                  >
                    <Icon icon={NOTIF_ICON_MAP[item.type] ?? 'solar:bell-linear'} height={18} className='mt-0.5 shrink-0 text-primary' />
                    <div className='min-w-0'>
                      <h5 className='mb-0.5 text-sm font-medium group-hover/link:text-primary truncate'>{item.title}</h5>
                      <p className='text-xs text-darklink line-clamp-2'>{item.message}</p>
                      <span className='text-[10px] text-muted-foreground mt-1 block'>
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </SimpleBar>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Notifications
