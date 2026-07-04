import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { NoteService } from './note.service'

import { asyncHandler } from '~/core/asyncHandler'
import { stringParam } from '~/core/http/queryParsers'


export const NoteController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const note = await NoteService.create(
      stringParam(req, 'songId'),
      req.body,
      req.user?.email,
      req.user?.id,
    )
    res.status(StatusCodes.CREATED).json(note)
  }),

  seed: asyncHandler(async (req: Request, res: Response) => {
    const raw = Number((req.body as { count?: unknown })?.count) || 0
    const count = Math.min(Math.max(Math.trunc(raw), 1), 100000)
    const result = await NoteService.seed(stringParam(req, 'songId'), count, req.user?.id)
    res.status(StatusCodes.CREATED).json(result)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const note = await NoteService.update(
      stringParam(req, 'id'),
      req.body,
      req.user?.email,
      req.user?.id,
    )
    res.json(note)
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await NoteService.remove(stringParam(req, 'id'), req.user?.email, req.user?.id)
    res.status(StatusCodes.NO_CONTENT).send()
  }),
}
