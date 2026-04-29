import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

const seedUsers = [
  {
    name: 'Deepak Yadav',
    email: 'deepak.yadav11@myntra.com',
    username: 'deepak.yadav11',
    role: UserRole.SUPER_ADMIN,
    envPassword: 'SEED_DEEPAK_PASSWORD',
    devPassword: 'Deepak@123',
  },
  {
    name: 'Vikky Singh',
    email: 'vikky.singh@myntra.com',
    username: 'vikky.singh',
    role: UserRole.SUPER_ADMIN,
    envPassword: 'SEED_VIKKY_PASSWORD',
    devPassword: 'Vikky@123',
  },
] as const

function resolvePassword(envKey: string, devFallback: string): string {
  const fromEnv = process.env[envKey]
  if (fromEnv && fromEnv.length > 0) return fromEnv
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `[seed] Set ${envKey} in the environment before seeding in production, or skip seed.`,
    )
  }
  return devFallback
}

async function main() {
  for (const u of seedUsers) {
    const plain = resolvePassword(u.envPassword, u.devPassword)
    const password = await bcrypt.hash(plain, SALT_ROUNDS)
    const row = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        name: u.name,
        email: u.email,
        username: u.username,
        password,
        role: u.role,
        isActive: true,
      },
      update: {
        name: u.name,
        username: u.username,
        password,
        role: u.role,
        isActive: true,
      },
      select: { id: true, email: true, username: true, role: true },
    })
    console.log(`[seed] user upserted: ${row.email} (${row.id}) role=${row.role}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })