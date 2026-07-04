import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { SongService } from './song.service'

import { asyncHandler } from '~/core/asyncHandler'
import { stringParam } from '~/core/http/queryParsers'


export const SongController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const song = await SongService.create(req.body, req.user?.id)
    res.status(StatusCodes.CREATED).json(song)
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await SongService.list())
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await SongService.getById(stringParam(req, 'id'), req.user?.id))
  }),

  getNotes: asyncHandler(async (req: Request, res: Response) => {
    const from = Number(req.query.from)
    const to = Number(req.query.to)
    res.json(
      await SongService.getNotes(
        stringParam(req, 'songId'),
        Number.isFinite(from) ? from : undefined,
        Number.isFinite(to) ? to : undefined,
      ),
    )
  }),

  getEvents: asyncHandler(async (req: Request, res: Response) => {
    res.json(await SongService.getEvents(stringParam(req, 'id')))
  }),

  setShare: asyncHandler(async (req: Request, res: Response) => {
    const { shareMode } = req.body as { shareMode: 'edit' | 'view' }
    res.json(await SongService.setShareMode(stringParam(req, 'id'), req.user?.id, shareMode))
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await SongService.remove(stringParam(req, 'id'), req.user?.id)
    res.status(StatusCodes.NO_CONTENT).send()
  }),
}
