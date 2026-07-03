import { readUser, relativeTime } from '~/utils/session'

describe('readUser', () => {
  afterEach(() => localStorage.clear())

  it('returns the parsed user when id and email exist', () => {
    localStorage.setItem('userInfo', JSON.stringify({ id: 'u1', email: 'a@b.com' }))
    expect(readUser()).toEqual({ id: 'u1', email: 'a@b.com' })
  })

  it('returns null when a required field is missing', () => {
    localStorage.setItem('userInfo', JSON.stringify({ email: 'a@b.com' }))
    expect(readUser()).toBeNull()
  })

  it('returns null when there is no stored user', () => {
    expect(readUser()).toBeNull()
  })

  it('returns null on malformed JSON', () => {
    localStorage.setItem('userInfo', 'not-json')
    expect(readUser()).toBeNull()
  })
})

describe('relativeTime', () => {
  const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString()

  it('formats sub-minute as "just now"', () => {
    expect(relativeTime(iso(5_000))).toBe('just now')
  })

  it('formats minutes', () => {
    expect(relativeTime(iso(5 * 60_000))).toBe('5m ago')
  })

  it('formats hours', () => {
    expect(relativeTime(iso(2 * 60 * 60_000))).toBe('2h ago')
  })

  it('formats days', () => {
    expect(relativeTime(iso(3 * 24 * 60 * 60_000))).toBe('3d ago')
  })

  it('falls back to a locale date beyond 30 days', () => {
    const old = iso(40 * 24 * 60 * 60_000)
    expect(relativeTime(old)).toBe(new Date(old).toLocaleDateString())
  })
})
