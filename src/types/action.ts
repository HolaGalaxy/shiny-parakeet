export type ActionResponse<T = void> =
  | { success: true; data: T; code: number }
  | { success: false; error: string; code: number; details?: Record<string, unknown> }

export type ActionErrorResponse = Extract<ActionResponse, { success: false }>
