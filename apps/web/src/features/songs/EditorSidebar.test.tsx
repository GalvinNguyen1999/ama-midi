import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Note } from '~/types/midi'

import { EditorSidebar } from './EditorSidebar'

const note: Note = {
  id: 'n1',
  songId: 's1',
  title: 'Kick',
  description: null,
  track: 3,
  time: 10,
  color: '#ffffff',
  createdAt: '',
  updatedAt: '',
}

const base = {
  canEdit: true,
  onUpdateField: jest.fn(),
  onDuplicate: jest.fn(),
  onDeleteMany: jest.fn(),
  onEditDetails: jest.fn(),
  presence: [],
  userId: 'u1',
}

describe('EditorSidebar', () => {
  it('shows a hint when nothing is selected', () => {
    render(<EditorSidebar {...base} selected={[]} />)
    expect(screen.getByText(/select a note/i)).toBeInTheDocument()
  })

  it('edits the title of a single selected note on blur', async () => {
    const onUpdateField = jest.fn()
    render(<EditorSidebar {...base} onUpdateField={onUpdateField} selected={[note]} />)
    const input = screen.getByDisplayValue('Kick')
    await userEvent.clear(input)
    await userEvent.type(input, 'Snare')
    await userEvent.tab()
    expect(onUpdateField).toHaveBeenCalledWith(note, { title: 'Snare' })
  })

  it('shows a bulk summary for multiple selected notes', () => {
    render(<EditorSidebar {...base} selected={[note, { ...note, id: 'n2' }]} />)
    expect(screen.getByText(/2 notes selected/i)).toBeInTheDocument()
  })
})
