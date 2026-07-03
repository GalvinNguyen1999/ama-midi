import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { SongService } from './song.service'

import { asyncHandler } from '~/core/asyncHandler'
import { stringParam } from '~/core/http/queryParsers'


export const SongController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const song = await SongService.create(req.body)
    res.status(StatusCodes.CREATED).json(song)
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await SongService.list())
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await SongService.getById(stringParam(req, 'id')))
  }),

  getEvents: asyncHandler(async (req: Request, res: Response) => {
    res.json(await SongService.getEvents(stringParam(req, 'id')))
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await SongService.remove(stringParam(req, 'id'))
    res.status(StatusCodes.NO_CONTENT).send()
  }),
}
