'use client'

import CardBox from '@/components/shared/CardBox'
import { Button } from '@/components/ui/button'
import type { TicketDetail } from '@/types/ticket'
import { reviewTicketAction } from '@/server/actions/ticket'
import { formatDate } from '@/utils/format'
import { successToast, errorToast } from '@/utils/toast'
import { ROUTES } from '@/constants/routes'
import { Icon } from '@iconify/react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type Props = { ticket: TicketDetail; isAdmin: boolean }

export default function TicketDetailView({ ticket, isAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const handleReview = (action: 'APPROVED' | 'REJECTED') => {
    if (action === 'REJECTED' && !showRejectInput) {
      setShowRejectInput(true)
      return
    }

    startTransition(async () => {
      const result = await reviewTicketAction({
        ticketId: ticket.id,
        action,
        comment: action === 'REJECTED' ? rejectComment : undefined,
      })
      if (result.success) {
        successToast(`Ticket ${action.toLowerCase()} successfully`)
        router.refresh()
      } else {
        errorToast(result.error)
      }
    })
  }

  const oldJson = ticket.oldValue != null ? JSON.stringify(ticket.oldValue, null, 2) : null
  const newJson = JSON.stringify(ticket.newValue, null, 2)

  const statusColorMap: Record<string, string> = {
    PENDING: 'text-warning bg-warning/10',
    APPROVED: 'text-success bg-success/10',
    REJECTED: 'text-error bg-error/10',
  }

  return (
    <div>
      <div className='flex items-center gap-2 mb-6'>
        <Icon icon='tabler:arrow-back-up' height='24' className='cursor-pointer' onClick={() => router.push(ROUTES.TICKETS)} />
        <h2 className='text-lg font-semibold'>Ticket Detail</h2>
      </div>

      <CardBox>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-muted-foreground'>Schema:</span>
            <span className='ml-2 font-medium'>{ticket.schemaName}</span>
          </div>
          {ticket.schemaFieldName && (
            <div>
              <span className='text-muted-foreground'>Field:</span>
              <span className='ml-2 font-medium'>{ticket.schemaFieldName}</span>
            </div>
          )}
          <div>
            <span className='text-muted-foreground'>Type:</span>
            <span className='ml-2 font-medium'>{ticket.type.replace(/_/g, ' ')}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>Status:</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[ticket.status] ?? ''}`}>
              {ticket.status}
            </span>
          </div>
          <div>
            <span className='text-muted-foreground'>Created By:</span>
            <span className='ml-2'>{ticket.createdByName ?? ticket.createdByEmail}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>Created:</span>
            <span className='ml-2'>{formatDate(ticket.createdAt)}</span>
          </div>
          {ticket.reviewedByEmail && (
            <>
              <div>
                <span className='text-muted-foreground'>Reviewed By:</span>
                <span className='ml-2'>{ticket.reviewedByEmail}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>Reviewed:</span>
                <span className='ml-2'>{ticket.reviewedAt ? formatDate(ticket.reviewedAt) : '—'}</span>
              </div>
            </>
          )}
          {ticket.reviewComment && (
            <div className='col-span-2'>
              <span className='text-muted-foreground'>Review Comment:</span>
              <span className='ml-2'>{ticket.reviewComment}</span>
            </div>
          )}
        </div>
      </CardBox>

      <div className='mt-6'>
        <h3 className='text-md font-semibold mb-3'>Changes</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <div className='text-sm font-medium text-muted-foreground mb-2'>Old Value</div>
            <pre className='bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-4 text-xs overflow-auto max-h-96'>
              {oldJson ?? <span className='text-muted-foreground italic'>No previous value (new addition)</span>}
            </pre>
          </div>
          <div>
            <div className='text-sm font-medium text-muted-foreground mb-2'>New Value</div>
            <pre className='bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-md p-4 text-xs overflow-auto max-h-96'>
              {newJson}
            </pre>
          </div>
        </div>
      </div>

      {isAdmin && ticket.status === 'PENDING' && (
        <div className='mt-6'>
          {showRejectInput && (
            <div className='mb-4'>
              <label className='text-sm font-medium text-muted-foreground mb-1 block'>Rejection Reason (optional)</label>
              <textarea
                className='w-full border border-ld rounded-md p-2 text-sm bg-transparent'
                rows={3}
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder='Explain why this change was rejected...'
              />
            </div>
          )}
          <div className='flex gap-3'>
            <Button onClick={() => handleReview('APPROVED')} className='rounded-full' disabled={isPending}>
              {isPending ? <Loader2 className='w-4 h-4 animate-spin mr-1' /> : null}
              Approve
            </Button>
            <Button onClick={() => handleReview('REJECTED')} variant='destructive' className='rounded-full' disabled={isPending}>
              {isPending ? <Loader2 className='w-4 h-4 animate-spin mr-1' /> : null}
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
