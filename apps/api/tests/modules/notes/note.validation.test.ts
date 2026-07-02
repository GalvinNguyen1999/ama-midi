import { createNoteSchema, updateNoteSchema } from '~/modules/notes/note.validation'

const validUuid = '123e4567-e89b-12d3-a456-426614174000'

function parseCreate(track: number, time: number) {
  return createNoteSchema.safeParse({
    params: { songId: validUuid },
    body: { title: 'A', track, time },
  })
}

describe('note validation', () => {
  it('accepts a valid note', () => {
    expect(parseCreate(1, 5).success).toBe(true)
    expect(parseCreate(8, 300).success).toBe(true)
  })

  it('rejects track out of 1..8', () => {
    expect(parseCreate(0, 5).success).toBe(false)
    expect(parseCreate(9, 5).success).toBe(false)
  })

  it('rejects time out of 0..300 (boundary 301)', () => {
    expect(parseCreate(1, 301).success).toBe(false)
    expect(parseCreate(1, -1).success).toBe(false)
  })

  it('rejects an empty update body', () => {
    expect(updateNoteSchema.safeParse({ params: { id: validUuid }, body: {} }).success).toBe(false)
  })
})
