import { z } from 'zod'

export const SWITCH_IDENTIFIER_REGEX = /^[a-z_-]+$/

export const switchIdentifierSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(SWITCH_IDENTIFIER_REGEX, 'Only lowercase letters, underscore, and hyphen are allowed')

export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((s) => s.toLowerCase())

export const usernameSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9._-]+$/, 'Only lowercase letters, digits, dot, underscore, and hyphen are allowed')

export const passwordSchema = z.string().min(6).max(256)
