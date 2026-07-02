import { Box, Typography } from '@mui/material'
import type { MouseEvent } from 'react'

import type { Note } from '~/types/midi'

import {
  GRID_HEIGHT,
  NOTE_RADIUS,
  PX_PER_SECOND,
  RULER_WIDTH,
  TIME_MAX,
  TRACK_COUNT,
  TRACK_WIDTH,
  timeToY,
  trackCenterX,
  xToTrack,
  yToTime,
} from './config'

interface Props {
  notes: Note[]
  onCreateAt: (track: number, time: number) => void
  onSelectNote: (note: Note) => void
}

const GRID_WIDTH = TRACK_COUNT * TRACK_WIDTH
const TIME_LABEL_STEP = 30
const ROW_PX = TIME_LABEL_STEP * PX_PER_SECOND

export function PianoRoll({ notes, onCreateAt, onSelectNote }: Props) {
  const handleGridClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onCreateAt(xToTrack(e.clientX - rect.left), yToTime(e.clientY - rect.top))
  }

  const timeLabels: number[] = []
  for (let t = 0; t <= TIME_MAX; t += TIME_LABEL_STEP) timeLabels.push(t)

  return (
    <Box sx={{ display: 'inline-block', bgcolor: 'background.paper', borderRadius: 2, p: 1 }}>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ width: RULER_WIDTH }} />
        {Array.from({ length: TRACK_COUNT }, (_, i) => (
          <Box key={i} sx={{ width: TRACK_WIDTH, textAlign: 'center', py: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Track {i + 1}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex' }}>
        <Box sx={{ position: 'relative', width: RULER_WIDTH, height: GRID_HEIGHT }}>
          {timeLabels.map((t) => (
            <Typography
              key={t}
              variant="caption"
              sx={{ position: 'absolute', right: 6, top: timeToY(t) - 8, color: 'text.disabled' }}
            >
              {t}s
            </Typography>
          ))}
        </Box>

        <Box
          onClick={handleGridClick}
          sx={{
            position: 'relative',
            width: GRID_WIDTH,
            height: GRID_HEIGHT,
            cursor: 'crosshair',
            border: '1px solid rgba(255,255,255,0.12)',
            backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${TRACK_WIDTH - 1}px, rgba(255,255,255,0.08) ${TRACK_WIDTH}px), repeating-linear-gradient(to bottom, transparent, transparent ${ROW_PX - 1}px, rgba(255,255,255,0.06) ${ROW_PX}px)`,
          }}
        >
          {notes.map((note) => (
            <Box
              key={note.id}
              onClick={(e) => {
                e.stopPropagation()
                onSelectNote(note)
              }}
              title={`${note.title} — Track ${note.track}, ${note.time}s`}
              sx={{
                position: 'absolute',
                left: trackCenterX(note.track) - NOTE_RADIUS,
                top: timeToY(note.time) - NOTE_RADIUS,
                width: NOTE_RADIUS * 2,
                height: NOTE_RADIUS * 2,
                borderRadius: '50%',
                bgcolor: note.color,
                border: '2px solid rgba(0,0,0,0.45)',
                boxShadow: '0 0 6px rgba(0,0,0,0.5)',
                cursor: 'pointer',
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.25)' },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  )
}
