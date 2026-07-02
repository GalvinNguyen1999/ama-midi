import { z } from 'zod'

export const createSongSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(120),
    bpm: z.number().int().min(20).max(300).optional(),
  }),
})

export const songIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
})
