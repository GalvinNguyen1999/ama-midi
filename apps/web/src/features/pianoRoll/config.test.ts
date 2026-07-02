import { TIME_MAX, TRACK_MAX, timeToY, trackCenterX, xToTrack, yToTime } from './config'

describe('piano-roll positioning', () => {
  it('round-trips time on the snap grid', () => {
    expect(yToTime(timeToY(0))).toBe(0)
    expect(yToTime(timeToY(10))).toBe(10)
  })

  it('clamps time to 0..300', () => {
    expect(yToTime(-100)).toBe(0)
    expect(yToTime(timeToY(TIME_MAX) + 1000)).toBe(TIME_MAX)
  })

  it('snaps time to the nearest 0.5s', () => {
    expect(yToTime(timeToY(5.3))).toBe(5.5)
    expect(yToTime(timeToY(5.1))).toBe(5)
  })

  it('clamps track to 1..8', () => {
    expect(xToTrack(-50)).toBe(1)
    expect(xToTrack(0)).toBe(1)
    expect(xToTrack(100000)).toBe(TRACK_MAX)
  })

  it('keeps trackCenterX and xToTrack consistent', () => {
    for (let t = 1; t <= TRACK_MAX; t += 1) {
      expect(xToTrack(trackCenterX(t))).toBe(t)
    }
  })
})
