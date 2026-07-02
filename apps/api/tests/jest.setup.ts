process.env.NODE_ENV = 'test'

process.env.TIMEZONE = process.env.TIMEZONE ?? 'UTC'

const shouldMuteConsole = process.env.CI === 'true' || process.env.JEST_MUTE_CONSOLE === 'true'
if (shouldMuteConsole) {

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})

  })
}

afterEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
})

afterEach(() => {
  jest.useRealTimers()
})
