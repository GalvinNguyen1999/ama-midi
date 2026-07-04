import { InputAdornment, TextField, Tooltip } from '@mui/material'
import { useEffect, useState } from 'react'

interface Props {
  bpm: number
  onCommit: (bpm: number) => void
}

export function BpmField({ bpm, onCommit }: Props) {
  const [draft, setDraft] = useState(String(bpm))

  useEffect(() => {
    setDraft(String(bpm))
  }, [bpm])

  const commit = () => {
    const value = Math.round(Number(draft))
    if (!Number.isFinite(value) || value < 20 || value > 300) {
      setDraft(String(bpm))
      return
    }
    if (value !== bpm) onCommit(value)
  }

  return (
    <Tooltip title="Tempo (BPM)">
      <TextField
        size="small"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        slotProps={{ input: { endAdornment: <InputAdornment position="end">BPM</InputAdornment> } }}
        sx={{ width: 96, '& .MuiInputBase-input': { py: 0.5 } }}
      />
    </Tooltip>
  )
}
