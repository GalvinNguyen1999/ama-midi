import { hashPassword, verifyPassword } from '~/utils/password'

describe('password utils', () => {
  it ('hashPassword() should return a hash string password', async () => {
    const plainPassword = '12345678a@'
    const hash = await hashPassword(plainPassword)

    expect(hash).not.toBe(plainPassword)

    expect(hash).toMatch(/^\$2[aby]\$/)
  })

  it ('verifyPassword() should return true if password is correct', async () => {
    const plainPassword = '12345678a@'

    const hash = await hashPassword(plainPassword)
    const isValid = await verifyPassword(plainPassword, hash)

    expect(isValid).toBe(true)
  })

  it ('verifyPassword() should return false if password is incorrect', async () => {
    const plainPassword = '12345678a@'
    const wrongPassword = '12345678a'

    const hash = await hashPassword(plainPassword)
    const isValid = await verifyPassword(wrongPassword, hash)

    expect(isValid).toBe(false)
  })
})
