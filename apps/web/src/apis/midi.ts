import type { Note, NoteInput, NoteUpdate, Song, SongWithNotes } from '~/types/midi'
import authorizedAxiosInstance from '~/utils/authorizedAxios'

export const listSongs = async (): Promise<Song[]> => {
  const { data } = await authorizedAxiosInstance.get<Song[]>('/songs')
  return data
}

export const createSongApi = async (input: { title: string; bpm?: number }): Promise<Song> => {
  const { data } = await authorizedAxiosInstance.post<Song>('/songs', input)
  return data
}

export const getSong = async (id: string): Promise<SongWithNotes> => {
  const { data } = await authorizedAxiosInstance.get<SongWithNotes>(`/songs/${id}`)
  return data
}

export const createNoteApi = async (songId: string, input: NoteInput): Promise<Note> => {
  const { data } = await authorizedAxiosInstance.post<Note>(`/songs/${songId}/notes`, input)
  return data
}

export const updateNoteApi = async (id: string, input: NoteUpdate): Promise<Note> => {
  const { data } = await authorizedAxiosInstance.patch<Note>(`/notes/${id}`, input)
  return data
}

export const deleteNoteApi = async (id: string): Promise<void> => {
  await authorizedAxiosInstance.delete(`/notes/${id}`)
}
