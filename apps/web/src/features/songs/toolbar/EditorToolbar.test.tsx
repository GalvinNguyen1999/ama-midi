import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import type { SongWithNotes } from '~/types/midi'

import { EditorToolbar } from './EditorToolbar'

jest.mock('~/features/songs/history/HistoryDrawer', () => ({ HistoryDrawer: () => null }))

const current = {
  id: 's1',
  title: 'My Song',
  noteCount: 3,
  notes: [],
  ownerEmail: 'me@x.com',
  shareMode: 'edit',
  version: 1,
} as unknown as SongWithNotes

const title = {
  editing: false,
  draft: '',
  setDraft: jest.fn(),
  start: jest.fn(),
  cancel: jest.fn(),
  commit: jest.fn(),
}
const sharing = {
  anchor: null,
  open: jest.fn(),
  close: jest.fn(),
  inviteEmail: '',
  setInviteEmail: jest.fn(),
  inviting: false,
  copyLink: jest.fn(),
  invite: jest.fn(),
  removeCollaborator: jest.fn(),
  setShare: jest.fn(),
}
const songActions = {
  deleteOpen: false,
  openDelete: jest.fn(),
  closeDelete: jest.fn(),
  deleting: false,
  deleteSong: jest.fn(),
  seeding: false,
  seed: jest.fn(),
}

function renderToolbar(overrides: Record<string, unknown> = {}) {
  const props = {
    songId: 's1',
    current,
    user: { id: 'u1' },
    isOwner: true,
    canEdit: true,
    readOnly: false,
    connected: true,
    presence: [],
    collaborators: [],
    onBack: jest.fn(),
    title,
    sharing,
    songActions,
    transport: {
      playing: false,
      playhead: 0,
      play: jest.fn(),
      stop: jest.fn(),
      loop: false,
      toggleLoop: jest.fn(),
      timbre: 'sine' as const,
      setTimbre: jest.fn(),
      bpm: 120,
      onCommitBpm: jest.fn(),
    },
    history: { undo: jest.fn(), redo: jest.fn(), canUndo: false, canRedo: false },
    midi: {
      fileInputRef: createRef<HTMLInputElement>(),
      onFile: jest.fn(),
      exportMidi: jest.fn(),
      exporting: false,
      importMidi: jest.fn(),
      importing: false,
    },
    suggestions: { suggest: jest.fn(), suggesting: false },
    showDevTools: false,
    ...overrides,
  }
  return { props, ...render(<EditorToolbar {...props} />) }
}

describe('EditorToolbar', () => {
  it('shows the song title and note count', () => {
    renderToolbar()
    expect(screen.getByText('My Song')).toBeInTheDocument()
    expect(screen.getByText('3 notes')).toBeInTheDocument()
  })

  it('Back triggers onBack', async () => {
    const onBack = jest.fn()
    renderToolbar({ onBack })
    await userEvent.click(screen.getByRole('button', { name: /back to library/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it('opens the share popover', async () => {
    const open = jest.fn()
    renderToolbar({ sharing: { ...sharing, open } })
    await userEvent.click(screen.getByRole('button', { name: /share/i }))
    expect(open).toHaveBeenCalled()
  })

  it('shows the View only chip in read-only mode', () => {
    renderToolbar({ readOnly: true, canEdit: false })
    expect(screen.getByText(/view only/i)).toBeInTheDocument()
  })
})
