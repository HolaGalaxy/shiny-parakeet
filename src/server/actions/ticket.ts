'use server'

import { requireSession, requireRole } from '@/lib/auth/require-session'
import { handleActionError } from '@/lib/http/http-error'
import { HttpStatus } from '@/constants/http'
import { ROUTES } from '@/constants/routes'
import { TicketService, createTicketInput, reviewTicketInput } from '@/services/ticket.service'
import type { ActionResponse } from '@/types/action'
import type { TicketListItem, TicketDetail } from '@/types/ticket'
import type { TicketStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getTicketsAction(filters?: {
  status?: TicketStatus
  schemaId?: string
}): Promise<ActionResponse<TicketListItem[]>> {
  try {
    await requireSession()
    const data = await TicketService.list(filters)
    return { success: true, data, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function getTicketDetailAction(
  ticketId: string,
): Promise<ActionResponse<TicketDetail>> {
  try {
    await requireSession()
    const data = await TicketService.getDetail(ticketId)
    return { success: true, data, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function createTicketAction(
  payload: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requireSession()

    const parsed = createTicketInput.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const result = await TicketService.create(session, parsed.data)

    revalidatePath(ROUTES.TICKETS)
    return { success: true, data: result, code: HttpStatus.CREATED }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function reviewTicketAction(
  payload: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requireRole('SUPER_ADMIN', 'ADMIN')

    const parsed = reviewTicketInput.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const result = await TicketService.review(session, parsed.data)

    revalidatePath(ROUTES.TICKETS)
    return { success: true, data: result, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
