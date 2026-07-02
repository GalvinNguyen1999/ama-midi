import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { NoteService } from './note.service'

import { asyncHandler } from '~/core/asyncHandler'
import { stringParam } from '~/core/http/queryParsers'


export const NoteController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const note = await NoteService.create(stringParam(req, 'songId'), req.body)
    res.status(StatusCodes.CREATED).json(note)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const note = await NoteService.update(stringParam(req, 'id'), req.body)
    res.json(note)
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await NoteService.remove(stringParam(req, 'id'))
    res.status(StatusCodes.NO_CONTENT).send()
  }),
}
