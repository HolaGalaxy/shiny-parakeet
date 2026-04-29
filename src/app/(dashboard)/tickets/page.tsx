import { getTicketsAction } from '@/server/actions/ticket'
import TicketList from '@/components/forms/tickets/TicketList'

export default async function TicketsPage() {
  const result = await getTicketsAction()
  const data = result.success ? result.data : []
  return <TicketList data={data} />
}
