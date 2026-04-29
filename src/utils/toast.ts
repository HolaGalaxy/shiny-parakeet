import { toast, type ExternalToast } from 'sonner'

const DEFAULT_DURATION = 4000

export function successToast(message: string, options?: ExternalToast) {
  toast.success(message, { duration: DEFAULT_DURATION, ...options })
}

export function errorToast(message: string, options?: ExternalToast) {
  toast.error(message, { duration: DEFAULT_DURATION + 1000, ...options })
}

export function infoToast(message: string, options?: ExternalToast) {
  toast.info(message, { duration: DEFAULT_DURATION, ...options })
}

export function warningToast(message: string, options?: ExternalToast) {
  toast.warning(message, { duration: DEFAULT_DURATION, ...options })
}
