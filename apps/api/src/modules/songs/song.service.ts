
import { SongRepo } from './song.repo'
import { toNoteEventDTO, toSongDTO, toSongWithNotesDTO } from './song.types'

import { ApiError } from '~/core/http/ApiError'

export const SongService = {
  async create(input: { title: string; bpm?: number }) {
    const song = await SongRepo.create(input)
    return toSongDTO(song)
  },

  async list() {
    const songs = await SongRepo.list()
    return songs.map(toSongDTO)
  },

  async getById(id: string) {
    const song = await SongRepo.findById(id)
    if (!song) throw ApiError.NotFound('Song not found')
    return toSongWithNotesDTO(song)
  },

  async getEvents(id: string) {
    const song = await SongRepo.findById(id)
    if (!song) throw ApiError.NotFound('Song not found')
    const events = await SongRepo.listEvents(id)
    return events.map(toNoteEventDTO)
  },
}
