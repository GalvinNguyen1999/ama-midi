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

  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await SongService.list(req.user?.id))
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

  suggest: asyncHandler(async (req: Request, res: Response) => {
    const count = Number(req.query.count)
    res.json(await SongService.suggest(stringParam(req, 'id'), Number.isFinite(count) ? count : undefined))
  }),

  rename: asyncHandler(async (req: Request, res: Response) => {
    const { title } = req.body as { title: string }
    res.json(await SongService.rename(stringParam(req, 'id'), req.user?.id, title, req.user?.email))
  }),

  updateBpm: asyncHandler(async (req: Request, res: Response) => {
    const { bpm } = req.body as { bpm: number }
    res.json(await SongService.updateBpm(stringParam(req, 'id'), req.user?.id, bpm, req.user?.email))
  }),

  setShare: asyncHandler(async (req: Request, res: Response) => {
    const { shareMode } = req.body as { shareMode: 'edit' | 'view' }
    res.json(
      await SongService.setShareMode(stringParam(req, 'id'), req.user?.id, shareMode, req.user?.email),
    )
  }),

  invite: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string }
    res.json(await SongService.invite(stringParam(req, 'id'), req.user?.id, email, req.user?.email))
  }),

  myInvites: asyncHandler(async (req: Request, res: Response) => {
    res.json(await SongService.listMyInvites(req.user?.id ?? ''))
  }),

  respondInvite: asyncHandler(async (req: Request, res: Response) => {
    const { accept } = req.body as { accept: boolean }
    await SongService.respondToInvite(
      stringParam(req, 'id'),
      req.user?.id ?? '',
      accept,
      req.user?.email,
    )
    res.status(StatusCodes.NO_CONTENT).send()
  }),

  removeCollaborator: asyncHandler(async (req: Request, res: Response) => {
    await SongService.removeCollaborator(
      stringParam(req, 'id'),
      req.user?.id,
      stringParam(req, 'userId'),
    )
    res.status(StatusCodes.NO_CONTENT).send()
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await SongService.remove(stringParam(req, 'id'), req.user?.id, req.user?.email)
    res.status(StatusCodes.NO_CONTENT).send()
  }),
}
