import { z } from 'zod'

export const createSongSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(120),
    bpm: z.number().int().min(20).max(300).optional(),
  }),
})

export const songIdParamSchema = z.object({
  params: z.object({ id: z.uuid() }),
})

export const setShareSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({ shareMode: z.enum(['edit', 'view']) }),
})

export const renameSongSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({ title: z.string().trim().min(1).max(120) }),
})

export const inviteSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({ email: z.email() }),
})

export const removeCollaboratorSchema = z.object({
  params: z.object({ id: z.uuid(), userId: z.uuid() }),
})

export const respondInviteSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({ accept: z.boolean() }),
})
