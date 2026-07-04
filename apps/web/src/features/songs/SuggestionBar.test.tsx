import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SuggestionBar } from './SuggestionBar'

const props = {
  count: 3,
  acceptingAll: false,
  suggesting: false,
  onAcceptAll: jest.fn(),
  onAnother: jest.fn(),
  onDismiss: jest.fn(),
}

describe('SuggestionBar', () => {
  it('shows the suggestion count', () => {
    render(<SuggestionBar {...props} />)
    expect(screen.getByText(/3 suggested/i)).toBeInTheDocument()
  })

  it('wires the action buttons', async () => {
    const onAcceptAll = jest.fn()
    const onDismiss = jest.fn()
    render(<SuggestionBar {...props} onAcceptAll={onAcceptAll} onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: /accept all/i }))
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onAcceptAll).toHaveBeenCalled()
    expect(onDismiss).toHaveBeenCalled()
  })

  it('disables Dismiss while accepting all', () => {
    render(<SuggestionBar {...props} acceptingAll />)
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeDisabled()
  })
})
