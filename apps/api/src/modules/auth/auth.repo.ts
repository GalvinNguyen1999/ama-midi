import { prisma } from '~/config/db'

export const AuthRepo = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  create(data: { email: string; passwordHash: string }) {
    return prisma.user.create({ data })
  },

  setTwoFactorSecret(id: string, secret: string) {
    return prisma.user.update({ where: { id }, data: { twoFactorSecret: secret } })
  },

  enableTwoFactor(id: string) {
    return prisma.user.update({ where: { id }, data: { twoFactorEnabled: true } })
  },
}
