import { z } from 'zod'

import { TIME_MAX, TIME_MIN, TRACK_MAX, TRACK_MIN } from '~/features/pianoRoll/config'

export const noteSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'At most 120 characters'),
  description: z.string().trim().max(1000, 'At most 1000 characters'),
  track: z.number().int().min(TRACK_MIN).max(TRACK_MAX),
  time: z
    .number({ invalid_type_error: 'Time is required' })
    .min(TIME_MIN, `Min ${TIME_MIN}s`)
    .max(TIME_MAX, `Max ${TIME_MAX}s`),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a valid color'),
})

export type NoteFormValues = z.infer<typeof noteSchema>
