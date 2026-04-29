import { getTicketDetailAction } from '@/server/actions/ticket'
import { requireSession, isAdmin } from '@/lib/auth/require-session'
import { redirect } from 'next/navigation'
import TicketDetailView from '@/components/forms/tickets/TicketDetailView'
import { ROUTES } from '@/constants/routes'

type Props = { params: Promise<{ ticketId: string }> }

export default async function TicketDetailPage({ params }: Props) {
  const { ticketId } = await params
  const [session, result] = await Promise.all([
    requireSession(),
    getTicketDetailAction(ticketId),
  ])

  if (!result.success) {
    redirect(ROUTES.TICKETS)
  }

  return <TicketDetailView ticket={result.data} isAdmin={isAdmin(session.role)} />
}
