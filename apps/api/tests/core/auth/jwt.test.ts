import { JwtProvider } from '~/core/auth/jwt'

const SECRET = 'test-secret'

describe('JwtProvider', () => {
  it('generates a token that verifies back to the payload', () => {
    const token = JwtProvider.generate({ id: 'u1', email: 'a@b.com' }, SECRET, '1h')
    const decoded = JwtProvider.verify(token, SECRET)
    expect(decoded).toMatchObject({ id: 'u1', email: 'a@b.com' })
    expect(typeof decoded.exp).toBe('number')
  })

  it('rejects a token signed with a different secret', () => {
    const token = JwtProvider.generate({ id: 'u1', email: 'a@b.com' }, SECRET, '1h')
    expect(() => JwtProvider.verify(token, 'wrong-secret')).toThrow()
  })

  it('rejects an expired token', () => {
    const token = JwtProvider.generate({ id: 'u1', email: 'a@b.com' }, SECRET, -10)
    expect(() => JwtProvider.verify(token, SECRET)).toThrow(/expired/i)
  })
})
