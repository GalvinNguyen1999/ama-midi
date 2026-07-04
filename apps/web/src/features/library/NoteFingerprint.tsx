import { Box } from '@mui/material'

interface Props {
  id: string
  noteCount: number
  accent: string
}

const BARS = 28
const HEIGHT = 46

function bars(id: string): number[] {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const out: number[] = []
  for (let i = 0; i < BARS; i++) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    out.push(((h >>> 0) % 1000) / 1000)
  }
  return out
}

export function NoteFingerprint({ id, noteCount, accent }: Props) {
  const density = Math.min(noteCount / 400, 1)

  return (
    <Box
      aria-hidden
      sx={{
        height: HEIGHT,
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2px',
        px: 1,
        py: 0.75,
        bgcolor: 'action.hover',
        overflow: 'hidden',
      }}
    >
      {bars(id).map((b, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: 4 + b * (HEIGHT - 14) * (0.35 + 0.65 * density),
            bgcolor: accent,
            opacity: 0.3 + 0.55 * density,
            borderRadius: 0.5,
          }}
        />
      ))}
    </Box>
  )
}
