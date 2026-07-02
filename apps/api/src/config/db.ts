import { PrismaClient } from '@prisma/client'

import { logger } from './logger'

export const prisma = new PrismaClient()

export async function connectDb(): Promise<void> {
  await prisma.$connect()
  logger.info('Connected to PostgreSQL (Prisma)')
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect()
}

process.on('SIGINT', async () => {
  await disconnectDb()
  process.exit(0)
})
