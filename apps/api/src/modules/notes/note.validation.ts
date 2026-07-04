import { z } from 'zod'

import { TIME_MAX, TIME_MIN, TRACK_MAX, TRACK_MIN } from '~/config/constants'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a 6-digit hex like #7c3aed')

export const createNoteSchema = z.object({
  params: z.object({ songId: z.uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).optional(),
    track: z.number().int().min(TRACK_MIN).max(TRACK_MAX),
    time: z.number().min(TIME_MIN).max(TIME_MAX),
    color: hexColor.optional(),
  }),
})

export const updateNoteSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z
    .object({
      title: z.string().trim().min(1).max(120).optional(),
      description: z.string().trim().max(1000).optional(),
      track: z.number().int().min(TRACK_MIN).max(TRACK_MAX).optional(),
      time: z.number().min(TIME_MIN).max(TIME_MAX).optional(),
      color: hexColor.optional(),
    })
    .refine((v) => Object.keys(v).length > 0, 'at least one field is required'),
})

export const noteIdParamSchema = z.object({
  params: z.object({ id: z.uuid() }),
})

export const importNotesSchema = z.object({
  params: z.object({ songId: z.uuid() }),
})
