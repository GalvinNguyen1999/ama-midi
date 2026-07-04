import type {
  Collaborator,
  Note,
  NoteEvent,
  NoteInput,
  NoteUpdate,
  PendingInvite,
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

export const updateBpmApi = async (id: string, bpm: number): Promise<Song> => {
  const { data } = await authorizedAxiosInstance.patch<Song>(`/songs/${id}/bpm`, { bpm })
  return data
}

export const getMyInvitesApi = async (): Promise<PendingInvite[]> => {
  const { data } = await authorizedAxiosInstance.get<PendingInvite[]>('/songs/invitations')
  return data
}

export const respondInviteApi = async (songId: string, accept: boolean): Promise<void> => {
  await authorizedAxiosInstance.post(`/songs/${songId}/invitations/respond`, { accept })
}

export const inviteCollaboratorApi = async (id: string, email: string): Promise<Collaborator> => {
  const { data } = await authorizedAxiosInstance.post<Collaborator>(`/songs/${id}/collaborators`, {
    email,
  })
  return data
}

export const removeCollaboratorApi = async (id: string, userId: string): Promise<void> => {
  await authorizedAxiosInstance.delete(`/songs/${id}/collaborators/${userId}`)
}

export const getSongEvents = async (id: string): Promise<NoteEvent[]> => {
  const { data } = await authorizedAxiosInstance.get<NoteEvent[]>(`/songs/${id}/events`)
  return data
}

export interface SuggestedNote {
  track: number
  time: number
  color: string
}

export const getSuggestionsApi = async (id: string): Promise<SuggestedNote[]> => {
  const { data } = await authorizedAxiosInstance.get<SuggestedNote[]>(`/songs/${id}/suggest`)
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

export const getAllNotes = async (songId: string): Promise<Note[]> => {
  const { data } = await authorizedAxiosInstance.get<Note[]>(`/songs/${songId}/notes`)
  return data
}

export const importMidiApi = async (
  songId: string,
  file: ArrayBuffer,
): Promise<{ inserted: number }> => {
  const { data } = await authorizedAxiosInstance.post<{ inserted: number }>(
    `/songs/${songId}/notes/import`,
    file,
    { headers: { 'Content-Type': 'application/octet-stream' } },
  )

  return data
}

export const seedNotesApi = async (songId: string, count: number): Promise<{ inserted: number }> => {
  const { data } = await authorizedAxiosInstance.post<{ inserted: number }>(
    `/songs/${songId}/notes/seed`,
    { count },
  )

  return data
}
