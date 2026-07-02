import { validateEmail } from '~/utils/validateEmail'

describe('Unit test: validateEmail()', () => {

  const cases: [string, boolean][] = [
    ['test@example.com', true],
    ['test@', false],
    ['@test.com', false],
  ]

  it.each(cases)('%p => %p', (email, expected) => {
    expect(validateEmail(email)).toBe(expected)
  })
})
