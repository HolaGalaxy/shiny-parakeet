import bcrypt from 'bcryptjs'
import { PASSWORD_SALT_ROUNDS } from '@/constants/auth'

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PASSWORD_SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
