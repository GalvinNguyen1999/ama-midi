import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import {
  Box,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useRef } from 'react'

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
  yToTime,
} from './config'
import { useNoteCanvas } from './useNoteCanvas'
import { usePianoRollInteraction } from './usePianoRollInteraction'

interface Props {
  notes: Note[]
  onCreateAt: (track: number, time: number) => void
  onSelectNote: (note: Note) => void
  onMoveNote: (note: Note, track: number, time: number) => void
  onMoveMany?: (moves: { note: Note; track: number; time: number }[]) => void
  onDuplicate?: (notes: Note[]) => void
  onDeleteMany: (ids: string[]) => void
  playhead: number | null
  onSeek?: (time: number) => void
  loading?: boolean
  readOnly?: boolean
  suggestions?: { track: number; time: number; color: string }[]
  onAcceptSuggestion?: (s: { track: number; time: number; color: string }) => void
}

const GRID_WIDTH = TRACK_COUNT * TRACK_WIDTH
const TIME_LABEL_STEP = 30
const ROW_PX = TIME_LABEL_STEP * PX_PER_SECOND

export function PianoRoll({
  notes,
  onCreateAt,
  onSelectNote,
  onMoveNote,
  onMoveMany,
  onDuplicate,
  onDeleteMany,
  playhead,
  onSeek,
  loading,
  readOnly,
  suggestions,
  onAcceptSuggestion,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const playheadRef = useRef<HTMLDivElement | null>(null)

  const {
    hover,
    overNote,
    drag,
    selection,
    marquee,
    cursor,
    menu,
    closeMenu,
    deleteSelected,
    clearSelection,
    handlers,
  } = usePianoRollInteraction({
    notes,
    onCreateAt,
    onSelectNote,
    onMoveNote,
    onMoveMany,
    onDuplicate,
    onDeleteMany,
    readOnly,
  })

  const menuTargets =
    menu && selection.has(menu.note.id) && selection.size > 0
      ? notes.filter((n) => selection.has(n.id))
      : menu
        ? [menu.note]
        : []

  useNoteCanvas(canvasRef, notes, drag?.note.id, selection)

  useEffect(() => {
    if (playhead != null) playheadRef.current?.scrollIntoView({ block: 'nearest' })
  }, [playhead])

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
            <Typography variant="caption" color={hover?.track === i + 1 ? 'primary' : 'text.secondary'}>
              Track {i + 1}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex' }}>
        <Tooltip title={onSeek ? 'Click to move the playhead' : ''} followCursor>
          <Box
            onClick={
              onSeek
                ? (e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    onSeek(yToTime(e.clientY - rect.top))
                  }
                : undefined
            }
            sx={{
              position: 'relative',
              width: RULER_WIDTH,
              height: GRID_HEIGHT,
              cursor: onSeek ? 'pointer' : 'default',
            }}
          >
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
        </Tooltip>

        <Box
          role="grid"
          aria-label="Piano roll: click to add a note, drag a note to move it, click a note to edit"
          {...handlers}
          sx={{
            position: 'relative',
            width: GRID_WIDTH,
            height: GRID_HEIGHT,
            cursor,
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${TRACK_WIDTH - 1}px, rgba(255,255,255,0.08) ${TRACK_WIDTH}px), repeating-linear-gradient(to bottom, transparent, transparent ${ROW_PX - 1}px, rgba(255,255,255,0.06) ${ROW_PX}px)`,
          }}
        >
          <Box
            component="canvas"
            ref={canvasRef}
            sx={{ position: 'absolute', inset: 0, width: GRID_WIDTH, height: GRID_HEIGHT, pointerEvents: 'none' }}
          />

          {marquee ? (
            <Box
              sx={{
                position: 'absolute',
                left: Math.min(marquee.x0, marquee.x1),
                top: Math.min(marquee.y0, marquee.y1),
                width: Math.abs(marquee.x1 - marquee.x0),
                height: Math.abs(marquee.y1 - marquee.y0),
                border: '1px solid #22d3ee',
                bgcolor: 'rgba(34,211,238,0.12)',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />
          ) : null}

          {selection.size > 0 ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ position: 'absolute', top: 8, left: 8, zIndex: 6 }}
            >
              <Chip size="small" color="info" label={`${selection.size} selected`} />
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={deleteSelected}
              >
                Delete
              </Button>
              <Button size="small" color="inherit" onClick={clearSelection}>
                Clear
              </Button>
            </Stack>
          ) : null}

          {hover && !drag && !overNote ? (
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

          {drag ? (
            <Box
              sx={{
                position: 'absolute',
                left: trackCenterX(drag.track) - NOTE_RADIUS,
                top: timeToY(drag.time) - NOTE_RADIUS,
                width: NOTE_RADIUS * 2,
                height: NOTE_RADIUS * 2,
                borderRadius: '50%',
                bgcolor: drag.note.color,
                border: '2px solid rgba(0,0,0,0.45)',
                boxShadow: '0 0 10px rgba(34,211,238,0.9)',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />
          ) : null}

          {suggestions?.map((s, i) => (
            <Tooltip key={`sg-${i}`} title="Suggested — click to add">
              <Box
                onClick={() => onAcceptSuggestion?.(s)}
                sx={{
                  position: 'absolute',
                  left: trackCenterX(s.track) - NOTE_RADIUS,
                  top: timeToY(s.time) - NOTE_RADIUS,
                  width: NOTE_RADIUS * 2,
                  height: NOTE_RADIUS * 2,
                  borderRadius: '50%',
                  border: '2px dashed #22d3ee',
                  bgcolor: 'rgba(34,211,238,0.15)',
                  cursor: 'pointer',
                  zIndex: 5,
                  '&:hover': { bgcolor: 'rgba(34,211,238,0.35)' },
                }}
              />
            </Tooltip>
          ))}

          {playhead != null ? (
            <Box
              ref={playheadRef}
              sx={{
                position: 'absolute',
                left: 0,
                top: timeToY(playhead),
                width: '100%',
                height: 2,
                bgcolor: '#22d3ee',
                boxShadow: '0 0 8px #22d3ee',
                pointerEvents: 'none',
                zIndex: 3,
              }}
            />
          ) : null}

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
              {loading ? (
                <Typography variant="body2">Loading notes…</Typography>
              ) : (
                <>
                  <Typography variant="h6">This song is empty</Typography>
                  <Typography variant="body2">Click anywhere on the grid to add your first note</Typography>
                </>
              )}
            </Box>
          ) : null}
        </Box>
      </Box>

      <Menu
        open={Boolean(menu)}
        onClose={closeMenu}
        anchorReference="anchorPosition"
        anchorPosition={menu ? { top: menu.y, left: menu.x } : undefined}
      >
        <MenuItem
          onClick={() => {
            if (menu) onSelectNote(menu.note)
            closeMenu()
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDuplicate?.(menuTargets)
            closeMenu()
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Duplicate{menuTargets.length > 1 ? ` (${menuTargets.length})` : ''}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDeleteMany(menuTargets.map((n) => n.id))
            clearSelection()
            closeMenu()
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>
            Delete{menuTargets.length > 1 ? ` (${menuTargets.length})` : ''}
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}
