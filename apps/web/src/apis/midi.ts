import type {
  Collaborator,
  Note,
  NoteEvent,
  NoteInput,
  NoteUpdate,
  Song,
  SongDetail,
} from '~/types/midi'
import authorizedAxiosInstance from '~/utils/authorizedAxios'

export const listSongs = async (): Promise<SongDetail[]> => {
  const { data } = await authorizedAxiosInstance.get<SongDetail[]>('/songs')
  return data
}

export const createSongApi = async (input: { title: string; bpm?: number }): Promise<Song> => {
  const { data } = await authorizedAxiosInstance.post<Song>('/songs', input)
  return data
}

export const getSong = async (id: string): Promise<SongDetail> => {
  const { data } = await authorizedAxiosInstance.get<SongDetail>(`/songs/${id}`)
  return data
}

export const getNotesWindow = async (songId: string, from: number, to: number): Promise<Note[]> => {
  const { data } = await authorizedAxiosInstance.get<Note[]>(`/songs/${songId}/notes`, {
    params: { from, to },
  })
  return data
}

export const deleteSongApi = async (id: string): Promise<void> => {
  await authorizedAxiosInstance.delete(`/songs/${id}`)
}

export const setShareModeApi = async (id: string, shareMode: 'edit' | 'view'): Promise<Song> => {
  const { data } = await authorizedAxiosInstance.patch<Song>(`/songs/${id}/share`, { shareMode })
  return data
}

export const renameSongApi = async (id: string, title: string): Promise<Song> => {
  const { data } = await authorizedAxiosInstance.patch<Song>(`/songs/${id}`, { title })
  return data
}

export const inviteCollaboratorApi = async (id: string, email: string): Promise<Collaborator> => {
  const { data } = await authorizedAxiosInstance.post<Collaborator>(`/songs/${id}/collaborators`, {
    email,
  })
  return data
}

export const getSongEvents = async (id: string): Promise<NoteEvent[]> => {
  const { data } = await authorizedAxiosInstance.get<NoteEvent[]>(`/songs/${id}/events`)
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

export const seedNotesApi = async (songId: string, count: number): Promise<{ inserted: number }> => {
  const { data } = await authorizedAxiosInstance.post<{ inserted: number }>(
    `/songs/${songId}/notes/seed`,
    { count },
  )
  return data
}
