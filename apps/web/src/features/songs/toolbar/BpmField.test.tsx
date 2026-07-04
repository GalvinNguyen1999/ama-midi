import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BpmField } from './BpmField'

describe('BpmField', () => {
  it('commits a valid new tempo on blur', async () => {
    const onCommit = jest.fn()
    render(<BpmField bpm={120} onCommit={onCommit} />)
    const input = screen.getByDisplayValue('120')
    await userEvent.clear(input)
    await userEvent.type(input, '90')
    await userEvent.tab()
    expect(onCommit).toHaveBeenCalledWith(90)
  })

  it('reverts and does not commit an out-of-range value', async () => {
    const onCommit = jest.fn()
    render(<BpmField bpm={120} onCommit={onCommit} />)
    const input = screen.getByDisplayValue('120')
    await userEvent.clear(input)
    await userEvent.type(input, '5')
    await userEvent.tab()
    expect(onCommit).not.toHaveBeenCalled()
    expect(screen.getByDisplayValue('120')).toBeInTheDocument()
  })
})
