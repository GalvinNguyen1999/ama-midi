import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DeleteSongDialog } from './DeleteSongDialog'

describe('DeleteSongDialog', () => {
  it('renders the song title inside the confirmation copy', () => {
    render(
      <DeleteSongDialog open title="My Song" deleting={false} onClose={jest.fn()} onConfirm={jest.fn()} />,
    )
    expect(screen.getByText(/My Song/)).toBeInTheDocument()
  })

  it('confirm and cancel call their handlers', async () => {
    const onConfirm = jest.fn()
    const onClose = jest.fn()
    render(
      <DeleteSongDialog open title="X" deleting={false} onClose={onClose} onConfirm={onConfirm} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when closed', () => {
    render(
      <DeleteSongDialog open={false} title="X" deleting={false} onClose={jest.fn()} onConfirm={jest.fn()} />,
    )
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})
