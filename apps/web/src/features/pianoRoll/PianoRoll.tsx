import { Box, Typography } from '@mui/material'
import { useState } from 'react'
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

interface HoverPos {
  track: number
  time: number
}

const GRID_WIDTH = TRACK_COUNT * TRACK_WIDTH
const TIME_LABEL_STEP = 30
const ROW_PX = TIME_LABEL_STEP * PX_PER_SECOND

export function PianoRoll({ notes, onCreateAt, onSelectNote }: Props) {
  const [hover, setHover] = useState<HoverPos | null>(null)

  const posFromEvent = (e: MouseEvent<HTMLDivElement>): HoverPos => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { track: xToTrack(e.clientX - rect.left), time: yToTime(e.clientY - rect.top) }
  }

  const handleMove = (e: MouseEvent<HTMLDivElement>) => setHover(posFromEvent(e))
  const handleLeave = () => setHover(null)
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const p = posFromEvent(e)
    onCreateAt(p.track, p.time)
  }

  const timeLabels: number[] = []
  for (let t = 0; t <= TIME_MAX; t += TIME_LABEL_STEP) timeLabels.push(t)

  return (
    <Box sx={{ display: 'inline-block', bgcolor: 'background.paper', borderRadius: 2, p: 1 }}>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ width: RULER_WIDTH }} />
        {Array.from({ length: TRACK_COUNT }, (_, i) => (
          <Box
            key={i}
            sx={{
              width: TRACK_WIDTH,
              textAlign: 'center',
              py: 0.5,
              borderRadius: 1,
              bgcolor: hover?.track === i + 1 ? 'rgba(124,58,237,0.18)' : 'transparent',
              transition: 'background-color 0.1s',
            }}
          >
            <Typography
              variant="caption"
              color={hover?.track === i + 1 ? 'primary' : 'text.secondary'}
            >
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
          role="grid"
          aria-label="Piano roll: click to add a note, click a note to edit"
          onClick={handleClick}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          sx={{
            position: 'relative',
            width: GRID_WIDTH,
            height: GRID_HEIGHT,
            cursor: 'crosshair',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${TRACK_WIDTH - 1}px, rgba(255,255,255,0.08) ${TRACK_WIDTH}px), repeating-linear-gradient(to bottom, transparent, transparent ${ROW_PX - 1}px, rgba(255,255,255,0.06) ${ROW_PX}px)`,
          }}
        >
          {hover ? (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  left: (hover.track - 1) * TRACK_WIDTH,
                  top: 0,
                  width: TRACK_WIDTH,
                  height: '100%',
                  bgcolor: 'rgba(124,58,237,0.06)',
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: trackCenterX(hover.track) - NOTE_RADIUS,
                  top: timeToY(hover.time) - NOTE_RADIUS,
                  width: NOTE_RADIUS * 2,
                  height: NOTE_RADIUS * 2,
                  borderRadius: '50%',
                  border: '2px dashed rgba(255,255,255,0.6)',
                  pointerEvents: 'none',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: trackCenterX(hover.track) + NOTE_RADIUS + 4,
                  top: timeToY(hover.time) - 8,
                  color: 'rgba(255,255,255,0.75)',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                T{hover.track} · {hover.time}s
              </Typography>
            </>
          ) : null}

          {notes.map((note) => (
            <Box
              key={note.id}
              role="button"
              aria-label={`Note ${note.title} on track ${note.track} at ${note.time} seconds`}
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
                '&:hover': { transform: 'scale(1.3)', zIndex: 2 },
              }}
            />
          ))}

          {notes.length === 0 ? (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                pointerEvents: 'none',
                color: 'text.secondary',
              }}
            >
              <Typography variant="h6">This song is empty</Typography>
              <Typography variant="body2">
                Click anywhere on the grid to add your first note
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}
