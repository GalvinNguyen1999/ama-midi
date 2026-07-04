import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Collaborator } from '~/types/midi'

import { SharePopover } from './SharePopover'

const base = {
  open: true,
  anchorEl: null,
  onClose: jest.fn(),
  shareUrl: 'http://localhost/songs/s1',
  shareMode: 'edit' as const,
  onSetShare: jest.fn(),
  onCopy: jest.fn(),
  inviteEmail: '',
  onInviteEmailChange: jest.fn(),
  inviting: false,
  onInvite: jest.fn(),
  collaborators: [] as Collaborator[],
  onRemoveCollaborator: jest.fn(),
}

describe('SharePopover', () => {
  it('shows the share url and copies it', async () => {
    const onCopy = jest.fn()
    render(<SharePopover {...base} isOwner onCopy={onCopy} />)
    expect(screen.getByDisplayValue('http://localhost/songs/s1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(onCopy).toHaveBeenCalled()
  })

  it('lets the owner invite by email', async () => {
    const onInvite = jest.fn()
    render(<SharePopover {...base} isOwner inviteEmail="a@b.com" onInvite={onInvite} />)
    await userEvent.click(screen.getByRole('button', { name: /invite/i }))
    expect(onInvite).toHaveBeenCalled()
  })

  it('hides owner-only controls for non-owners', () => {
    render(<SharePopover {...base} isOwner={false} />)
    expect(screen.queryByRole('button', { name: /invite/i })).not.toBeInTheDocument()
  })
})
